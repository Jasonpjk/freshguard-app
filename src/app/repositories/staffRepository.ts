import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
import type { StaffMember } from "../context/AppContext";
import { loadFromStorage, STORAGE_KEYS } from "../services/storageService";

// ─── Fetch staff ──────────────────────────────────────────────────────────────

export async function fetchStaff(storeId: string): Promise<StaffMember[]> {
  if (isSupabaseEnabled() && supabase) {
    // Join profiles + store_members to get staff list for this store
    const { data, error } = await supabase
      .from("store_members")
      .select("*, profiles(*)")
      .eq("store_id", storeId);

    if (error) {
      console.error("[staffRepository] fetchStaff error:", error.message);
      return loadFromStorage<StaffMember[]>(STORAGE_KEYS.staff, []);
    }

    // TODO: map joined data to StaffMember type
    return data as unknown as StaffMember[];
  }

  return loadFromStorage<StaffMember[]>(STORAGE_KEYS.staff, []);
}

// ─── Invite staff ─────────────────────────────────────────────────────────────

export async function inviteStaff(email: string, storeId: string, role: string): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: use Supabase auth.admin.inviteUserByEmail or Edge Function
    // await supabase.functions.invoke("invite-staff", { body: { email, storeId, role } });
    return false;
  }
  // local mode: handled by AppContext
  return true;
}

// ─── Update staff role/status ─────────────────────────────────────────────────

export async function updateStaffMember(id: string, updates: Partial<StaffMember>): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: update store_members or profiles row
    return false;
  }
  return true;
}

// ─── Remove staff from store ──────────────────────────────────────────────────

export async function removeStaffMember(userId: string, storeId: string): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: delete from store_members where user_id = userId and store_id = storeId
    return false;
  }
  return true;
}
