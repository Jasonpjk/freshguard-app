import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
import { isApiEnabled, apiGet, apiPost, apiPatch, apiDelete, ApiError } from "../lib/apiClient";
import type { StorageLocation } from "../context/AppContext";
import { loadFromStorage, STORAGE_KEYS } from "../services/storageService";
import {
  mapSupabaseStorageLocationToStorageLocation,
  mapStorageLocationToSupabaseInsert,
  mapStorageLocationToSupabaseUpdate,
  type SupabaseStorageLocationRow,
} from "./mappers";

export interface LocationQueryParams {
  organizationId: string;
  storeId: string;
}

// ─── Fetch storage locations ──────────────────────────────────────────────────

export async function fetchStorageLocations({
  organizationId: _orgId,
  storeId,
}: LocationQueryParams): Promise<StorageLocation[]> {
  if (isApiEnabled()) {
    try {
      const data = await apiGet<StorageLocation[]>("/api/v1/storage-locations", { storeId });
      return data;
    } catch (err) {
      console.error("[storageLocationRepository] fetchStorageLocations (api) error:", err instanceof ApiError ? err.message : err);
      return loadFromStorage<StorageLocation[]>(STORAGE_KEYS.locations, []);
    }
  }

  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase
      .from("storage_locations")
      .select("*")
      .eq("store_id", storeId)
      .order("name");

    if (error) {
      console.error("[storageLocationRepository] fetchStorageLocations error:", error.message);
      return loadFromStorage<StorageLocation[]>(STORAGE_KEYS.locations, []);
    }

    return (data as SupabaseStorageLocationRow[]).map(mapSupabaseStorageLocationToStorageLocation);
  }

  return loadFromStorage<StorageLocation[]>(STORAGE_KEYS.locations, []);
}

// ─── Create storage location ──────────────────────────────────────────────────

export async function createStorageLocation(
  loc: Omit<StorageLocation, "id">,
  { organizationId, storeId }: LocationQueryParams
): Promise<StorageLocation | null> {
  if (isApiEnabled()) {
    try {
      const data = await apiPost<StorageLocation>("/api/v1/storage-locations", { ...loc, storeId, organizationId });
      return data;
    } catch (err) {
      console.error("[storageLocationRepository] createStorageLocation (api) error:", err instanceof ApiError ? err.message : err);
      return null;
    }
  }

  if (isSupabaseEnabled() && supabase) {
    const row = mapStorageLocationToSupabaseInsert(loc, organizationId, storeId);
    const { data, error } = await supabase
      .from("storage_locations")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[storageLocationRepository] createStorageLocation error:", error.message);
      return null;
    }

    return mapSupabaseStorageLocationToStorageLocation(data as SupabaseStorageLocationRow);
  }

  return null;
}

// ─── Update storage location ──────────────────────────────────────────────────

export async function updateStorageLocation(
  id: string,
  updates: Partial<StorageLocation>
): Promise<boolean> {
  if (isApiEnabled()) {
    try {
      await apiPatch(`/api/v1/storage-locations/${id}`, updates);
      return true;
    } catch (err) {
      console.error("[storageLocationRepository] updateStorageLocation (api) error:", err instanceof ApiError ? err.message : err);
      return false;
    }
  }

  if (isSupabaseEnabled() && supabase) {
    const row = mapStorageLocationToSupabaseUpdate(updates);
    const { error } = await supabase
      .from("storage_locations")
      .update(row)
      .eq("id", id);

    if (error) {
      console.error("[storageLocationRepository] updateStorageLocation error:", error.message);
      return false;
    }

    return true;
  }

  return true;
}

// ─── Delete storage location ──────────────────────────────────────────────────

export async function deleteStorageLocation(id: string): Promise<boolean> {
  if (isApiEnabled()) {
    try {
      await apiDelete(`/api/v1/storage-locations/${id}`);
      return true;
    } catch (err) {
      console.error("[storageLocationRepository] deleteStorageLocation (api) error:", err instanceof ApiError ? err.message : err);
      return false;
    }
  }

  if (isSupabaseEnabled() && supabase) {
    const { error } = await supabase
      .from("storage_locations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[storageLocationRepository] deleteStorageLocation error:", error.message);
      return false;
    }

    return true;
  }

  return true;
}
