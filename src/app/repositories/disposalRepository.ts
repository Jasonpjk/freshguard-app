import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
import type { DisposalRecord } from "../context/AppContext";
import { loadFromStorage, STORAGE_KEYS } from "../services/storageService";

// ─── Fetch disposal records ───────────────────────────────────────────────────

export async function fetchDisposalRecords(storeId: string): Promise<DisposalRecord[]> {
  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase
      .from("disposal_records")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[disposalRepository] fetchDisposalRecords error:", error.message);
      return loadFromStorage<DisposalRecord[]>(STORAGE_KEYS.disposalRecords, []);
    }

    // TODO: map snake_case row to DisposalRecord type
    return data as unknown as DisposalRecord[];
  }

  return loadFromStorage<DisposalRecord[]>(STORAGE_KEYS.disposalRecords, []);
}

// ─── Create disposal record ───────────────────────────────────────────────────

export async function createDisposalRecord(record: Omit<DisposalRecord, "id">): Promise<DisposalRecord | null> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: const { data, error } = await supabase.from("disposal_records").insert(mapRecordToRow(record)).select().single();
    return null;
  }
  return null;
}

// ─── Update disposal record (approve/reject) ──────────────────────────────────

export async function updateDisposalRecord(id: string, updates: Partial<DisposalRecord>): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: const { error } = await supabase.from("disposal_records").update(mapUpdatesToRow(updates)).eq("id", id);
    return false;
  }
  return true;
}
