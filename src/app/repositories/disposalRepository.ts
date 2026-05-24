import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
import { isApiEnabled, apiGet, apiPost, apiPatch, ApiError } from "../lib/apiClient";
import type { DisposalRecord } from "../context/AppContext";
import { loadFromStorage, STORAGE_KEYS } from "../services/storageService";
import {
  mapSupabaseDisposalRecordToDisposalRecord,
  mapDisposalRecordToSupabaseInsert,
  mapDisposalRecordToSupabaseUpdate,
  type SupabaseDisposalRow,
} from "./mappers";

export interface DisposalQueryParams {
  organizationId: string;
  storeId: string;
}

// ─── Fetch disposal records ───────────────────────────────────────────────────

export async function fetchDisposalRecords({
  organizationId: _orgId,
  storeId,
}: DisposalQueryParams): Promise<DisposalRecord[]> {
  if (isApiEnabled()) {
    try {
      const data = await apiGet<DisposalRecord[]>("/api/v1/disposal-records", { storeId });
      return data;
    } catch (err) {
      console.error("[disposalRepository] fetchDisposalRecords (api) error:", err instanceof ApiError ? err.message : err);
      return loadFromStorage<DisposalRecord[]>(STORAGE_KEYS.disposalRecords, []);
    }
  }

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

    return (data as SupabaseDisposalRow[]).map(mapSupabaseDisposalRecordToDisposalRecord);
  }

  return loadFromStorage<DisposalRecord[]>(STORAGE_KEYS.disposalRecords, []);
}

// ─── Create disposal record ───────────────────────────────────────────────────

export async function createDisposalRecord(
  record: Omit<DisposalRecord, "id">,
  { organizationId, storeId }: DisposalQueryParams
): Promise<DisposalRecord | null> {
  if (isApiEnabled()) {
    try {
      const data = await apiPost<DisposalRecord>("/api/v1/disposal-records", { ...record, storeId, organizationId });
      return data;
    } catch (err) {
      console.error("[disposalRepository] createDisposalRecord (api) error:", err instanceof ApiError ? err.message : err);
      return null;
    }
  }

  if (isSupabaseEnabled() && supabase) {
    const row = mapDisposalRecordToSupabaseInsert(record, organizationId, storeId);
    const { data, error } = await supabase
      .from("disposal_records")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[disposalRepository] createDisposalRecord error:", error.message);
      return null;
    }

    return mapSupabaseDisposalRecordToDisposalRecord(data as SupabaseDisposalRow);
  }

  return null;
}

// ─── Update disposal record (approve / reject) ────────────────────────────────

export async function updateDisposalRecord(
  id: string,
  updates: Partial<DisposalRecord>
): Promise<boolean> {
  if (isApiEnabled()) {
    try {
      await apiPatch(`/api/v1/disposal-records/${id}`, updates);
      return true;
    } catch (err) {
      console.error("[disposalRepository] updateDisposalRecord (api) error:", err instanceof ApiError ? err.message : err);
      return false;
    }
  }

  if (isSupabaseEnabled() && supabase) {
    const row = mapDisposalRecordToSupabaseUpdate(updates);
    const { error } = await supabase
      .from("disposal_records")
      .update(row)
      .eq("id", id);

    if (error) {
      console.error("[disposalRepository] updateDisposalRecord error:", error.message);
      return false;
    }

    return true;
  }

  return true;
}
