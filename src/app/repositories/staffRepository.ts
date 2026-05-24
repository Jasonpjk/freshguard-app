import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
import { isApiEnabled, apiGet, apiPost, apiPatch, apiDelete, ApiError } from "../lib/apiClient";
import type { StaffMember } from "../context/AppContext";
import { loadFromStorage, STORAGE_KEYS } from "../services/storageService";
import {
  mapSupabaseStaffToStaffMember,
  mapStaffMemberToSupabaseUpdate,
  type SupabaseStaffRow,
} from "./mappers";

export interface StaffQueryParams {
  organizationId: string;
  storeId: string;
}

// ─── Fetch staff ──────────────────────────────────────────────────────────────

export async function fetchStaff({ organizationId: _orgId, storeId }: StaffQueryParams): Promise<StaffMember[]> {
  if (isApiEnabled()) {
    try {
      const data = await apiGet<StaffMember[]>("/api/v1/staff", { storeId });
      return data;
    } catch (err) {
      console.error("[staffRepository] fetchStaff (api) error:", err instanceof ApiError ? err.message : err);
      return loadFromStorage<StaffMember[]>(STORAGE_KEYS.staff, []);
    }
  }

  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase
      .from("store_members")
      .select("*, profiles(*), stores(name)")
      .eq("store_id", storeId);

    if (error) {
      console.error("[staffRepository] fetchStaff error:", error.message);
      return loadFromStorage<StaffMember[]>(STORAGE_KEYS.staff, []);
    }

    return (data as SupabaseStaffRow[]).map(mapSupabaseStaffToStaffMember);
  }

  return loadFromStorage<StaffMember[]>(STORAGE_KEYS.staff, []);
}

// ─── Invite staff ─────────────────────────────────────────────────────────────

export async function inviteStaff(
  email: string,
  storeId: string,
  role: string
): Promise<boolean> {
  if (isApiEnabled()) {
    try {
      await apiPost("/api/v1/staff/invite", { email, storeId, role });
      return true;
    } catch (err) {
      console.error("[staffRepository] inviteStaff (api) error:", err instanceof ApiError ? err.message : err);
      return false;
    }
  }

  if (isSupabaseEnabled() && supabase) {
    // TODO: 실제 이메일 초대는 Edge Function을 통해 구현
    console.warn("[staffRepository] inviteStaff: email invite requires Edge Function. storeId:", storeId, "role:", role);
    return false;
  }

  // local mode: handled by AppContext
  return true;
}

// ─── Update staff member ──────────────────────────────────────────────────────

export async function updateStaffMember(
  userId: string,
  storeId: string,
  updates: Partial<StaffMember>
): Promise<boolean> {
  if (isApiEnabled()) {
    try {
      await apiPatch(`/api/v1/staff/${userId}`, { storeId, ...updates });
      return true;
    } catch (err) {
      console.error("[staffRepository] updateStaffMember (api) error:", err instanceof ApiError ? err.message : err);
      return false;
    }
  }

  if (isSupabaseEnabled() && supabase) {
    const profileUpdates = mapStaffMemberToSupabaseUpdate(updates);

    if (updates.role !== undefined) {
      const { error: memberError } = await supabase
        .from("store_members")
        .update({ role: updates.role })
        .eq("user_id", userId)
        .eq("store_id", storeId);

      if (memberError) {
        console.error("[staffRepository] updateStaffMember (store_members) error:", memberError.message);
        return false;
      }
    }

    const { name: _name, role: _role, ...profileOnlyUpdates } = profileUpdates;
    if (Object.keys(profileOnlyUpdates).length > 0 || profileUpdates.name !== undefined) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name: profileUpdates.name, phone: profileUpdates.phone, is_active: profileUpdates.is_active })
        .eq("id", userId);

      if (profileError) {
        console.error("[staffRepository] updateStaffMember (profiles) error:", profileError.message);
        return false;
      }
    }

    return true;
  }

  return true;
}

// ─── Remove staff member from store ──────────────────────────────────────────

export async function removeStaffMember(userId: string, storeId: string): Promise<boolean> {
  if (isApiEnabled()) {
    try {
      await apiDelete(`/api/v1/staff/${userId}?storeId=${encodeURIComponent(storeId)}`);
      return true;
    } catch (err) {
      console.error("[staffRepository] removeStaffMember (api) error:", err instanceof ApiError ? err.message : err);
      return false;
    }
  }

  if (isSupabaseEnabled() && supabase) {
    const { error } = await supabase
      .from("store_members")
      .delete()
      .eq("user_id", userId)
      .eq("store_id", storeId);

    if (error) {
      console.error("[staffRepository] removeStaffMember error:", error.message);
      return false;
    }

    return true;
  }

  return true;
}
