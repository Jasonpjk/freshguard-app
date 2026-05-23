import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const BACKEND_MODE = import.meta.env.VITE_BACKEND_MODE as string | undefined;

// Returns true only when VITE_BACKEND_MODE=supabase AND both env vars are present
export function isSupabaseEnabled(): boolean {
  return BACKEND_MODE === "supabase" && !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

// supabase is null when running in local mode or when env vars are missing.
// All callers must guard with isSupabaseEnabled() before using this client.
export const supabase: SupabaseClient | null = isSupabaseEnabled()
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  : null;

export type { SupabaseClient };
