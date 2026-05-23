import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
import type { StorageLocation } from "../context/AppContext";
import { loadFromStorage, STORAGE_KEYS } from "../services/storageService";

// ─── Fetch locations ──────────────────────────────────────────────────────────

export async function fetchStorageLocations(storeId: string): Promise<StorageLocation[]> {
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

    // TODO: map snake_case to StorageLocation type
    return data as unknown as StorageLocation[];
  }

  return loadFromStorage<StorageLocation[]>(STORAGE_KEYS.locations, []);
}

// ─── Create location ──────────────────────────────────────────────────────────

export async function createStorageLocation(loc: Omit<StorageLocation, "id">): Promise<StorageLocation | null> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: insert to storage_locations table
    return null;
  }
  return null;
}

// ─── Update location ──────────────────────────────────────────────────────────

export async function updateStorageLocation(id: string, updates: Partial<StorageLocation>): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: update storage_locations row
    return false;
  }
  return true;
}

// ─── Delete location ──────────────────────────────────────────────────────────

export async function deleteStorageLocation(id: string): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: delete from storage_locations
    return false;
  }
  return true;
}
