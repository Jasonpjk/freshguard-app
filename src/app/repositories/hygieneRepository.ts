import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────
// These mirror the hygiene check data used in HygieneCheck.tsx

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

// ─── Fetch hygiene templates ──────────────────────────────────────────────────

export async function fetchHygieneTemplates(storeId: string): Promise<HygieneTemplate[]> {
  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase
      .from("hygiene_check_templates")
      .select("*")
      .or(`store_id.eq.${storeId},store_id.is.null`)
      .order("sort_order");

    if (error) {
      console.error("[hygieneRepository] fetchHygieneTemplates error:", error.message);
      return [];
    }

    return data as unknown as HygieneTemplate[];
  }

  // local mode: HygieneCheck.tsx uses internal hardcoded templates
  return [];
}

// ─── Fetch hygiene sessions ───────────────────────────────────────────────────

export async function fetchHygieneSessions(storeId: string): Promise<HygieneSession[]> {
  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase
      .from("hygiene_check_sessions")
      .select("*")
      .eq("store_id", storeId)
      .order("checked_date", { ascending: false })
      .limit(30);

    if (error) {
      console.error("[hygieneRepository] fetchHygieneSessions error:", error.message);
      return [];
    }

    return data as unknown as HygieneSession[];
  }

  return [];
}

// ─── Create session ───────────────────────────────────────────────────────────

export async function createHygieneSession(session: Omit<HygieneSession, "id" | "createdAt">): Promise<HygieneSession | null> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: insert to hygiene_check_sessions
    return null;
  }
  return null;
}

// ─── Update check item ────────────────────────────────────────────────────────

export async function updateHygieneCheckItem(id: string, updates: Partial<HygieneCheckItem>): Promise<boolean> {
  if (isSupabaseEnabled() && supabase) {
    // TODO: update hygiene_check_items row
    return false;
  }
  return true;
}
