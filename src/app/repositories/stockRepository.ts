import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
import type { StockLog } from "../context/AppContext";
import { loadFromStorage, STORAGE_KEYS } from "../services/storageService";

// ─── Fetch stock logs ─────────────────────────────────────────────────────────

export async function fetchStockLogs(storeId: string): Promise<StockLog[]> {
  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase
      .from("stock_logs")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[stockRepository] fetchStockLogs error:", error.message);
      return loadFromStorage<StockLog[]>(STORAGE_KEYS.stockLogs, []);
    }

    // TODO: map snake_case to StockLog type
    // return data.map(mapRowToStockLog);
    return data as unknown as StockLog[];
  }

  return loadFromStorage<StockLog[]>(STORAGE_KEYS.stockLogs, []);
}

// ─── Create stock log ─────────────────────────────────────────────────────────

export async function createStockLog(log: Omit<StockLog, "id">): Promise<StockLog | null> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: insert to stock_logs table
    // const { data, error } = await supabase.from("stock_logs").insert(mapLogToRow(log)).select().single();
    // if (error) { console.error(error); return null; }
    // return mapRowToStockLog(data);
    return null;
  }
  return null;
}
