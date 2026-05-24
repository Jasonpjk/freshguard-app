import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
import { isApiEnabled, apiPost, apiGet, setApiToken, ApiError } from "../lib/apiClient";
import {
  mockLogin,
  mockSignup,
  type AuthUser,
  type Organization,
  type AppStore,
  type SignupData,
} from "../services/authService";

export interface SignInResult {
  user: AuthUser | null;
  org: Organization | null;
  stores: AppStore[];
  error: string | null;
  needsOnboarding?: boolean;
}

export interface SignUpResult {
  user: AuthUser | null;
  org: Organization | null;
  stores: AppStore[];
  error: string | null;
}

// ─── Internal: load profile + org + stores from DB (Supabase) ────────────────

async function loadWorkspace(userId: string): Promise<{
  user: AuthUser;
  org: Organization;
  stores: AppStore[];
} | null> {
  if (!supabase) return null;

  try {
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*, organizations(*)")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) {
      console.error("[authRepository] loadWorkspace: profile not found", profileErr?.message);
      return null;
    }

    const { data: members, error: membersErr } = await supabase
      .from("store_members")
      .select("store_id, role, stores(*)")
      .eq("user_id", userId);

    if (membersErr) {
      console.error("[authRepository] loadWorkspace: store_members error", membersErr.message);
    }

    const org = profile.organizations as {
      id: string; name: string; type: string; owner_id: string; plan: string; created_at: string;
    } | null;

    const storeList: AppStore[] = (members ?? [])
      .filter((m) => m.stores)
      .map((m) => {
        const s = m.stores as { id: string; name: string; address: string | null; type: string; organization_id: string };
        return {
          id: s.id,
          organizationId: s.organization_id,
          name: s.name,
          address: s.address ?? "",
          type: s.type as AppStore["type"],
        };
      });

    const authUser: AuthUser = {
      id: profile.id,
      email: "",
      name: profile.name ?? "",
      role: profile.role as AuthUser["role"],
      organizationId: profile.organization_id ?? "",
      storeIds: storeList.map((s) => s.id),
    };

    const organization: Organization | null = org
      ? {
          id: org.id,
          name: org.name,
          type: org.type as Organization["type"],
          ownerId: org.owner_id,
          createdAt: org.created_at?.split("T")[0] ?? "",
        }
      : null;

    if (!organization) return null;

    return { user: authUser, org: organization, stores: storeList };
  } catch (err) {
    console.error("[authRepository] loadWorkspace unexpected error:", err);
    return null;
  }
}

// ─── signIn ───────────────────────────────────────────────────────────────────

interface ApiLoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string;
    storeIds: string[];
  };
  org: { id: string; name: string; type: string; ownerId: string; createdAt: string } | null;
  stores: AppStore[];
  needsOnboarding?: boolean;
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  if (isApiEnabled()) {
    try {
      const res = await apiPost<ApiLoginResponse>("/api/v1/auth/login", { email, password }, { skipAuth: true });
      setApiToken(res.accessToken);
      return {
        user: res.user as AuthUser,
        org: res.org,
        stores: res.stores,
        error: null,
        needsOnboarding: res.needsOnboarding ?? false,
      };
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "로그인에 실패했습니다.";
      return { user: null, org: null, stores: [], error: msg };
    }
  }

  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, org: null, stores: [], error: error.message };
    if (!data.user) return { user: null, org: null, stores: [], error: "로그인에 실패했습니다." };

    const workspace = await loadWorkspace(data.user.id);

    if (!workspace) {
      return {
        user: { id: data.user.id, email, name: email.split("@")[0], role: "owner", organizationId: "", storeIds: [] },
        org: null,
        stores: [],
        error: null,
        needsOnboarding: true,
      };
    }

    workspace.user.email = email;
    return { user: workspace.user, org: workspace.org, stores: workspace.stores, error: null };
  }

  // local mode
  const result = mockLogin(email, password);
  if (!result) return { user: null, org: null, stores: [], error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  return { user: result.user, org: result.org, stores: result.stores, error: null };
}

// ─── signUp + workspace creation ─────────────────────────────────────────────

interface ApiSignupResponse {
  accessToken: string;
  user: AuthUser;
  org: Organization;
  stores: AppStore[];
}

export async function signUp(data: SignupData): Promise<SignUpResult> {
  if (isApiEnabled()) {
    try {
      const res = await apiPost<ApiSignupResponse>("/api/v1/auth/signup", {
        email: data.email,
        password: data.password,
        name: data.name,
        orgType: data.orgType,
      }, { skipAuth: true });
      setApiToken(res.accessToken);
      return { user: res.user, org: res.org, stores: res.stores, error: null };
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "회원가입에 실패했습니다.";
      return { user: null, org: null, stores: [], error: msg };
    }
  }

  if (isSupabaseEnabled() && supabase) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name, org_type: data.orgType } },
    });

    if (error) return { user: null, org: null, stores: [], error: error.message };
    if (!authData.user) return { user: null, org: null, stores: [], error: "회원가입에 실패했습니다." };

    const userId = authData.user.id;

    try {
      const { data: orgData, error: orgErr } = await supabase
        .from("organizations")
        .insert({ name: data.name + "의 조직", type: data.orgType, plan: "free" })
        .select()
        .single();

      if (orgErr || !orgData) {
        console.error("[authRepository] signUp: org creation failed", orgErr?.message);
        return { user: null, org: null, stores: [], error: "조직 생성에 실패했습니다." };
      }

      const orgId: string = orgData.id;

      const { data: storeData, error: storeErr } = await supabase
        .from("stores")
        .insert({ organization_id: orgId, name: "내 매장", type: "restaurant", is_active: true })
        .select()
        .single();

      if (storeErr || !storeData) {
        console.error("[authRepository] signUp: store creation failed", storeErr?.message);
        return { user: null, org: null, stores: [], error: "매장 생성에 실패했습니다." };
      }

      const storeId: string = storeData.id;

      const { error: profileErr } = await supabase
        .from("profiles")
        .insert({ id: userId, organization_id: orgId, name: data.name, role: "owner", is_active: true });

      if (profileErr) {
        console.error("[authRepository] signUp: profile creation failed", profileErr.message);
        return { user: null, org: null, stores: [], error: "프로필 생성에 실패했습니다." };
      }

      const { error: memberErr } = await supabase
        .from("store_members")
        .insert({ user_id: userId, store_id: storeId, role: "owner" });

      if (memberErr) {
        console.error("[authRepository] signUp: store_member creation failed", memberErr.message);
      }

      await supabase.from("organizations").update({ owner_id: userId }).eq("id", orgId);

      await supabase.from("app_settings").insert({
        organization_id: orgId,
        store_id: storeId,
        warning_days: 3,
        urgent_days: 1,
        default_open_use_days: 3,
        notify_expired: true,
        notify_urgent: true,
        notify_warning: false,
      });

      const authUser: AuthUser = {
        id: userId,
        email: data.email,
        name: data.name,
        role: "owner",
        organizationId: orgId,
        storeIds: [storeId],
      };

      const organization: Organization = {
        id: orgId,
        name: orgData.name,
        type: data.orgType,
        ownerId: userId,
        createdAt: new Date().toISOString().split("T")[0],
      };

      const store: AppStore = {
        id: storeId,
        organizationId: orgId,
        name: "내 매장",
        address: "",
        type: "restaurant",
      };

      return { user: authUser, org: organization, stores: [store], error: null };
    } catch (err) {
      console.error("[authRepository] signUp: unexpected error", err);
      return { user: null, org: null, stores: [], error: "회원가입 중 오류가 발생했습니다." };
    }
  }

  // local mode
  const result = mockSignup(data);
  return { user: result.user, org: result.org, stores: result.stores, error: null };
}

// ─── signOut ──────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  if (isApiEnabled()) {
    try {
      await apiPost("/api/v1/auth/logout");
    } catch {
      // ignore errors on logout
    }
    setApiToken(null);
    return;
  }

  if (isSupabaseEnabled() && supabase) {
    await supabase.auth.signOut();
  }
  // local mode: caller clears localStorage session
}

// ─── getSupabaseSession ───────────────────────────────────────────────────────

export async function getSupabaseSession() {
  if (!isSupabaseEnabled() || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── loadUserProfile ──────────────────────────────────────────────────────────

interface ApiMeResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  storeIds: string[];
  org: Organization | null;
  stores: AppStore[];
}

export async function loadUserProfile(
  userId: string,
  email: string
): Promise<{ user: AuthUser; org: Organization; stores: AppStore[] } | null> {
  if (isApiEnabled()) {
    try {
      const res = await apiGet<ApiMeResponse>("/api/v1/auth/me");
      if (!res.org) return null;
      return {
        user: { id: res.id, email: res.email, name: res.name, role: res.role as AuthUser["role"], organizationId: res.organizationId, storeIds: res.storeIds },
        org: res.org,
        stores: res.stores,
      };
    } catch {
      return null;
    }
  }

  if (!isSupabaseEnabled() || !supabase) return null;

  const workspace = await loadWorkspace(userId);
  if (!workspace) return null;

  workspace.user.email = email;
  return workspace;
}

// ─── requestPasswordReset ────────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<{ error: string | null }> {
  if (isApiEnabled()) {
    try {
      await apiPost("/api/v1/auth/password-reset", { email }, { skipAuth: true });
      return { error: null };
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "요청에 실패했습니다.";
      return { error: msg };
    }
  }

  if (isSupabaseEnabled() && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  }

  return { error: null };
}

// ─── updateOnboardingWorkspace ────────────────────────────────────────────────

export async function updateOnboardingWorkspace(
  organizationId: string,
  storeId: string,
  data: { orgName: string; storeName: string; businessType: string }
): Promise<boolean> {
  if (isApiEnabled()) {
    try {
      await apiPost("/api/v1/auth/onboarding", { organizationId, storeId, ...data });
      return true;
    } catch {
      return false;
    }
  }

  if (!isSupabaseEnabled() || !supabase) return false;

  const { error: orgErr } = await supabase
    .from("organizations")
    .update({ name: data.orgName })
    .eq("id", organizationId);

  if (orgErr) {
    console.error("[authRepository] updateOnboardingWorkspace: org update failed", orgErr.message);
    return false;
  }

  const { error: storeErr } = await supabase
    .from("stores")
    .update({ name: data.storeName, type: data.businessType })
    .eq("id", storeId);

  if (storeErr) {
    console.error("[authRepository] updateOnboardingWorkspace: store update failed", storeErr.message);
    return false;
  }

  return true;
}
