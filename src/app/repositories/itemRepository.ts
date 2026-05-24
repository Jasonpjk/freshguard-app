import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
import type { Item, StockStatus } from "../context/AppContext";
import { loadFromStorage, STORAGE_KEYS } from "../services/storageService";
import {
  mapSupabaseItemToItem,
  mapItemToSupabaseItemInsert,
  mapItemToSupabaseItemUpdate,
  type SupabaseItemRow,
} from "./mappers";

export interface ItemQueryParams {
  organizationId: string;
  storeId: string;
}

// ─── Fetch items ──────────────────────────────────────────────────────────────

export async function fetchItems({ organizationId: _orgId, storeId }: ItemQueryParams): Promise<Item[]> {
  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[itemRepository] fetchItems error:", error.message);
      return loadFromStorage<Item[]>(STORAGE_KEYS.items, []);
    }

    return (data as SupabaseItemRow[]).map(mapSupabaseItemToItem);
  }

  return loadFromStorage<Item[]>(STORAGE_KEYS.items, []);
}

// ─── Create item ──────────────────────────────────────────────────────────────

export async function createItem(
  item: Omit<Item, "id" | "status">,
  { organizationId, storeId }: ItemQueryParams
): Promise<Item | null> {
  if (isSupabaseEnabled() && supabase) {
    const row = mapItemToSupabaseItemInsert(item, organizationId, storeId);
    const { data, error } = await supabase
      .from("items")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[itemRepository] createItem error:", error.message);
      return null;
    }

    return mapSupabaseItemToItem(data as SupabaseItemRow);
  }

  // local mode: AppContext handles state
  return null;
}

// ─── Update item ──────────────────────────────────────────────────────────────

export async function updateItem(id: string, updates: Partial<Omit<Item, "id">>): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    const row = mapItemToSupabaseItemUpdate(updates);
    const { error } = await supabase
      .from("items")
      .update(row)
      .eq("id", id);

    if (error) {
      console.error("[itemRepository] updateItem error:", error.message);
      return false;
    }

    return true;
  }

  return true;
}

// ─── Delete item ──────────────────────────────────────────────────────────────

export async function deleteItem(id: string): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[itemRepository] deleteItem error:", error.message);
      return false;
    }

    return true;
  }

  return true;
}

// ─── Update stock status ──────────────────────────────────────────────────────

export async function updateStockStatus(
  id: string,
  status: StockStatus,
  extraFields?: Partial<Omit<Item, "id">>
): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    const row = {
      stock_status: status,
      ...(extraFields ? mapItemToSupabaseItemUpdate(extraFields) : {}),
    };

    const { error } = await supabase
      .from("items")
      .update(row)
      .eq("id", id);

    if (error) {
      console.error("[itemRepository] updateStockStatus error:", error.message);
      return false;
    }

    return true;
  }

  return true;
}
