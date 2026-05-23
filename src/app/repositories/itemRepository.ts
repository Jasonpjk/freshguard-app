import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
import type { Item, StockStatus } from "../context/AppContext";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../services/storageService";

// ─── Fetch items ──────────────────────────────────────────────────────────────

export async function fetchItems(storeId: string): Promise<Item[]> {
  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[itemRepository] fetchItems error:", error.message);
      // Fallback to localStorage on error
      return loadFromStorage<Item[]>(STORAGE_KEYS.items, []);
    }

    // TODO: map snake_case Supabase rows to camelCase Item type
    // return data.map(mapRowToItem);
    return data as unknown as Item[];
  }

  // local mode
  return loadFromStorage<Item[]>(STORAGE_KEYS.items, []);
}

// ─── Create item ──────────────────────────────────────────────────────────────

export async function createItem(item: Omit<Item, "id" | "status">): Promise<Item | null> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: map to snake_case and insert
    // const { data, error } = await supabase.from("items").insert(mapItemToRow(item)).select().single();
    // if (error) { console.error(error); return null; }
    // return mapRowToItem(data);
    return null;
  }
  // local mode: handled by AppContext state
  return null;
}

// ─── Update item ──────────────────────────────────────────────────────────────

export async function updateItem(id: string, updates: Partial<Item>): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: const { error } = await supabase.from("items").update(mapUpdatesToRow(updates)).eq("id", id);
    // return !error;
    return false;
  }
  // local mode: handled by AppContext state
  return true;
}

// ─── Delete item ──────────────────────────────────────────────────────────────

export async function deleteItem(id: string): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: const { error } = await supabase.from("items").delete().eq("id", id);
    // return !error;
    return false;
  }
  return true;
}

// ─── Update stock status ──────────────────────────────────────────────────────

export async function updateStockStatus(id: string, status: StockStatus, extraFields?: Partial<Item>): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: const { error } = await supabase.from("items").update({ stock_status: status, ...extraFields }).eq("id", id);
    // return !error;
    return false;
  }
  return true;
}
