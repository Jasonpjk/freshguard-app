import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
import {
  mapSupabaseHygieneTemplateToHygieneTemplate,
  mapSupabaseHygieneSessionToHygieneSession,
  mapHygieneSessionToSupabaseInsert,
  mapSupabaseHygieneCheckItemToHygieneCheckItem,
  type SupabaseHygieneTemplateRow,
  type SupabaseHygieneSessionRow,
  type SupabaseHygieneCheckItemRow,
} from "./mappers";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HygieneTemplate {
  id: number;
  category: string;
  label: string;
  required: boolean;
  sortOrder: number;
  storeId?: string;
}

export interface HygieneSession {
  id: number;
  storeId: string;
  checkerId: string;
  checkedDate: string;
  totalCount: number;
  doneCount: number;
  status: "incomplete" | "complete";
  createdAt: string;
}

export interface HygieneCheckItem {
  id: number;
  sessionId: number;
  templateId: number;
  checked: boolean;
  memo?: string;
  photoUrl?: string;
}

export interface HygieneQueryParams {
  organizationId: string;
  storeId?: string;
}

// ─── Fetch hygiene templates ──────────────────────────────────────────────────

export async function fetchTemplates({ storeId }: HygieneQueryParams): Promise<HygieneTemplate[]> {
  if (isSupabaseEnabled() && supabase) {
    let query = supabase
      .from("hygiene_check_templates")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (storeId) {
      // global templates (store_id IS NULL) OR this store's templates
      query = query.or(`store_id.eq.${storeId},store_id.is.null`);
    } else {
      query = query.is("store_id", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[hygieneRepository] fetchTemplates error:", error.message);
      return [];
    }

    return (data as SupabaseHygieneTemplateRow[]).map(mapSupabaseHygieneTemplateToHygieneTemplate);
  }

  // local mode: HygieneCheck.tsx uses internal hardcoded templates
  return [];
}

// ─── Fetch hygiene sessions ───────────────────────────────────────────────────

export async function fetchSessions({ storeId, organizationId: _orgId }: HygieneQueryParams): Promise<HygieneSession[]> {
  if (!storeId) return [];

  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase
      .from("hygiene_check_sessions")
      .select("*")
      .eq("store_id", storeId)
      .order("checked_date", { ascending: false })
      .limit(30);

    if (error) {
      console.error("[hygieneRepository] fetchSessions error:", error.message);
      return [];
    }

    return (data as SupabaseHygieneSessionRow[]).map(mapSupabaseHygieneSessionToHygieneSession);
  }

  return [];
}

// ─── Create hygiene session ───────────────────────────────────────────────────

export async function createSession(
  session: Omit<HygieneSession, "id" | "createdAt">,
  { organizationId }: { organizationId: string }
): Promise<HygieneSession | null> {
  if (isSupabaseEnabled() && supabase) {
    const row = mapHygieneSessionToSupabaseInsert(session, organizationId);
    const { data, error } = await supabase
      .from("hygiene_check_sessions")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[hygieneRepository] createSession error:", error.message);
      return null;
    }

    return mapSupabaseHygieneSessionToHygieneSession(data as SupabaseHygieneSessionRow);
  }

  return null;
}

// ─── Update hygiene check item ────────────────────────────────────────────────

export async function updateCheckItem(
  id: string,
  updates: Partial<HygieneCheckItem>
): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    const row: Partial<SupabaseHygieneCheckItemRow> = {};
    if (updates.checked !== undefined) row.checked = updates.checked;
    if (updates.memo !== undefined) row.memo = updates.memo ?? null;
    if (updates.photoUrl !== undefined) row.photo_url = updates.photoUrl ?? null;

    const { error } = await supabase
      .from("hygiene_check_items")
      .update(row)
      .eq("id", id);

    if (error) {
      console.error("[hygieneRepository] updateCheckItem error:", error.message);
      return false;
    }

    return true;
  }

  return true;
}

// ─── Fetch check items for a session ─────────────────────────────────────────

export async function fetchCheckItems(sessionId: string): Promise<HygieneCheckItem[]> {
  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase
      .from("hygiene_check_items")
      .select("*")
      .eq("session_id", sessionId);

    if (error) {
      console.error("[hygieneRepository] fetchCheckItems error:", error.message);
      return [];
    }

    return (data as SupabaseHygieneCheckItemRow[]).map(mapSupabaseHygieneCheckItemToHygieneCheckItem);
  }

  return [];
}

// Keep legacy function names for backwards compatibility
export const fetchHygieneTemplates = (storeId: string) => fetchTemplates({ organizationId: "", storeId });
export const fetchHygieneSessions = (storeId: string) => fetchSessions({ organizationId: "", storeId });
export const createHygieneSession = (
  session: Omit<HygieneSession, "id" | "createdAt">
) => createSession(session, { organizationId: "" });
export const updateHygieneCheckItem = (id: string, updates: Partial<HygieneCheckItem>) =>
  updateCheckItem(id, updates);
