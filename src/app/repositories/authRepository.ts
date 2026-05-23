import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
import {
  mockLogin,
  mockSignup,
  type AuthUser,
  type Organization,
  type AppStore,
  type SignupData,
  DEMO_ORG,
  DEMO_STORES,
} from "../services/authService";

export interface SignInResult {
  user: AuthUser | null;
  org: Organization | null;
  stores: AppStore[];
  error: string | null;
}

export interface SignUpResult {
  user: AuthUser | null;
  org: Organization | null;
  stores: AppStore[];
  error: string | null;
}

// ─── signIn ───────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<SignInResult> {
  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, org: null, stores: [], error: error.message };

    // TODO: load profile + organization + stores from Supabase tables using data.user.id
    // const profile = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    // const org = await supabase.from("organizations").select("*").eq("id", profile.organization_id).single();
    // const stores = await supabase.from("stores").select("*").eq("organization_id", org.id);
    // return { user: mapProfile(profile), org: mapOrg(org.data), stores: mapStores(stores.data), error: null };

    // Temporary: local fallback while Supabase tables are not yet populated
    return { user: null, org: null, stores: [], error: "Supabase profile loading not yet implemented" };
  }

  // local mode
  const result = mockLogin(email, password);
  if (!result) return { user: null, org: null, stores: [], error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  return { user: result.user, org: result.org, stores: result.stores, error: null };
}

// ─── signUp ───────────────────────────────────────────────────────────────────

export async function signUp(data: SignupData): Promise<SignUpResult> {
  if (isSupabaseEnabled() && supabase) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name, org_type: data.orgType } },
    });
    if (error) return { user: null, org: null, stores: [], error: error.message };
    if (!authData.user) return { user: null, org: null, stores: [], error: "회원가입에 실패했습니다." };

    // TODO: create organization + store + profile rows via RPC or server function
    // const { error: profileError } = await supabase.rpc("create_user_setup", {
    //   user_id: authData.user.id,
    //   user_name: data.name,
    //   org_type: data.orgType,
    // });

    return { user: null, org: null, stores: [], error: "Supabase signup profile creation not yet implemented" };
  }

  // local mode
  const result = mockSignup(data);
  return { user: result.user, org: result.org, stores: result.stores, error: null };
}

// ─── signOut ──────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  if (isSupabaseEnabled() && supabase) {
    await supabase.auth.signOut();
    return;
  }
  // local mode: caller clears localStorage session
}

// ─── getSession ───────────────────────────────────────────────────────────────

export async function getSupabaseSession() {
  if (!isSupabaseEnabled() || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── loadUserProfile ─────────────────────────────────────────────────────────

export async function loadUserProfile(userId: string): Promise<{ user: AuthUser; org: Organization; stores: AppStore[] } | null> {
  if (!isSupabaseEnabled() || !supabase) return null;

  // TODO: implement when Supabase tables are ready
  // const { data: profile } = await supabase.from("profiles").select("*, organizations(*), stores(*)").eq("id", userId).single();
  // return mapProfileToAuthData(profile);

  return null;
}

// ─── requestPasswordReset ────────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<{ error: string | null }> {
  if (isSupabaseEnabled() && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  }
  // local mode: always succeeds (mock)
  return { error: null };
}
