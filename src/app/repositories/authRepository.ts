import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
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

// ─── Internal: load profile + org + stores from DB ───────────────────────────

async function loadWorkspace(userId: string): Promise<{
  user: AuthUser;
  org: Organization;
  stores: AppStore[];
} | null> {
  if (!supabase) return null;

  try {
    // 1. Load profile + organization in one query
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*, organizations(*)")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) {
      console.error("[authRepository] loadWorkspace: profile not found", profileErr?.message);
      return null;
    }

    // 2. Get store_members → stores for this user
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
      email: "", // email is in auth.users, not profiles — populated by caller from supabase session
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

export async function signIn(email: string, password: string): Promise<SignInResult> {
  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, org: null, stores: [], error: error.message };
    if (!data.user) return { user: null, org: null, stores: [], error: "로그인에 실패했습니다." };

    const workspace = await loadWorkspace(data.user.id);

    if (!workspace) {
      // Profile/org not found → needs onboarding
      return {
        user: { id: data.user.id, email, name: email.split("@")[0], role: "owner", organizationId: "", storeIds: [] },
        org: null,
        stores: [],
        error: null,
        needsOnboarding: true,
      };
    }

    // Inject email from auth session (not stored in profiles)
    workspace.user.email = email;

    return { user: workspace.user, org: workspace.org, stores: workspace.stores, error: null };
  }

  // local mode
  const result = mockLogin(email, password);
  if (!result) return { user: null, org: null, stores: [], error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  return { user: result.user, org: result.org, stores: result.stores, error: null };
}

// ─── signUp + workspace creation ─────────────────────────────────────────────
// TODO: 향후 단일 RPC 함수 create_initial_workspace()로 대체 권장.
// create_initial_workspace(user_id, user_name, org_name, org_type, store_name, business_type)
// 를 하나의 트랜잭션으로 처리하면 부분 실패 없이 안전하게 생성 가능.

export async function signUp(data: SignupData): Promise<SignUpResult> {
  if (isSupabaseEnabled() && supabase) {
    // Step 1: Supabase Auth 회원가입
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name, org_type: data.orgType } },
    });

    if (error) return { user: null, org: null, stores: [], error: error.message };
    if (!authData.user) return { user: null, org: null, stores: [], error: "회원가입에 실패했습니다." };

    const userId = authData.user.id;

    try {
      // Step 2: organization 생성
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

      // Step 3: 기본 store 생성
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

      // Step 4: profile 생성
      const { error: profileErr } = await supabase
        .from("profiles")
        .insert({ id: userId, organization_id: orgId, name: data.name, role: "owner", is_active: true });

      if (profileErr) {
        console.error("[authRepository] signUp: profile creation failed", profileErr.message);
        return { user: null, org: null, stores: [], error: "프로필 생성에 실패했습니다." };
      }

      // Step 5: store_member 생성
      const { error: memberErr } = await supabase
        .from("store_members")
        .insert({ user_id: userId, store_id: storeId, role: "owner" });

      if (memberErr) {
        console.error("[authRepository] signUp: store_member creation failed", memberErr.message);
        // Non-fatal: continue
      }

      // Step 6: organizations.owner_id 업데이트
      await supabase.from("organizations").update({ owner_id: userId }).eq("id", orgId);

      // Step 7: app_settings 기본값 생성
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

export async function loadUserProfile(
  userId: string,
  email: string
): Promise<{ user: AuthUser; org: Organization; stores: AppStore[] } | null> {
  if (!isSupabaseEnabled() || !supabase) return null;

  const workspace = await loadWorkspace(userId);
  if (!workspace) return null;

  workspace.user.email = email;
  return workspace;
}

// ─── requestPasswordReset ────────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<{ error: string | null }> {
  if (isSupabaseEnabled() && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  }
  return { error: null };
}

// ─── updateOnboardingWorkspace ────────────────────────────────────────────────
// 온보딩 완료 후 organization/store 이름 및 타입 업데이트

export async function updateOnboardingWorkspace(
  organizationId: string,
  storeId: string,
  data: { orgName: string; storeName: string; businessType: string }
): Promise<boolean> {
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
