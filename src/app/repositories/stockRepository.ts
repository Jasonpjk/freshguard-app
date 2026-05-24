import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
import { isApiEnabled, apiGet, apiPost, ApiError } from "../lib/apiClient";
import type { StockLog } from "../context/AppContext";
import { loadFromStorage, STORAGE_KEYS } from "../services/storageService";
import {
  mapSupabaseStockLogToStockLog,
  mapStockLogToSupabaseInsert,
  type SupabaseStockLogRow,
} from "./mappers";

export interface StockLogQueryParams {
  organizationId: string;
  storeId: string;
  itemId?: string;
}

// ─── Fetch stock logs ─────────────────────────────────────────────────────────

export async function fetchStockLogs({
  organizationId: _orgId,
  storeId,
  itemId,
}: StockLogQueryParams): Promise<StockLog[]> {
  if (isApiEnabled()) {
    try {
      const params: Record<string, string> = { storeId };
      if (itemId) params.itemId = itemId;
      const data = await apiGet<StockLog[]>("/api/v1/stock-logs", params);
      return data;
    } catch (err) {
      console.error("[stockRepository] fetchStockLogs (api) error:", err instanceof ApiError ? err.message : err);
      return loadFromStorage<StockLog[]>(STORAGE_KEYS.stockLogs, []);
    }
  }

  if (isSupabaseEnabled() && supabase) {
    let query = supabase
      .from("stock_logs")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (itemId) {
      query = query.eq("item_id", itemId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[stockRepository] fetchStockLogs error:", error.message);
      return loadFromStorage<StockLog[]>(STORAGE_KEYS.stockLogs, []);
    }

    return (data as SupabaseStockLogRow[]).map(mapSupabaseStockLogToStockLog);
  }

  return loadFromStorage<StockLog[]>(STORAGE_KEYS.stockLogs, []);
}

// ─── Create stock log ─────────────────────────────────────────────────────────
// stock_logs는 audit trail 성격이므로 update/delete는 제공하지 않음

export async function createStockLog(
  log: Omit<StockLog, "id">,
  { organizationId, storeId }: { organizationId: string; storeId: string }
): Promise<StockLog | null> {
  if (isApiEnabled()) {
    try {
      const data = await apiPost<StockLog>("/api/v1/stock-logs", { ...log, storeId, organizationId });
      return data;
    } catch (err) {
      console.error("[stockRepository] createStockLog (api) error:", err instanceof ApiError ? err.message : err);
      return null;
    }
  }

  if (isSupabaseEnabled() && supabase) {
    const row = mapStockLogToSupabaseInsert(log, organizationId, storeId);
    const { data, error } = await supabase
      .from("stock_logs")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[stockRepository] createStockLog error:", error.message);
      return null;
    }

    return mapSupabaseStockLogToStockLog(data as SupabaseStockLogRow);
  }

  return null;
}
