import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import {
  type AuthUser,
  type Organization,
  type AppStore,
  type StoredAuthSession,
  type SignupData,
  type OnboardingData,
  type UserRole,
  mockLogin,
  mockSignup,
  saveAuthSession,
  loadAuthSession,
  clearAuthSession,
  resolveUserFromSession,
  checkPermission,
  DEMO_ORG,
  DEMO_STORES,
} from "../services/authService";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../services/storageService";
import { isSupabaseEnabled, supabase } from "../lib/supabaseClient";
import {
  signIn as repoSignIn,
  signUp as repoSignUp,
  signOut as repoSignOut,
  getSupabaseSession,
  loadUserProfile,
  requestPasswordReset as repoRequestPasswordReset,
} from "../repositories/authRepository";

export type AuthPage = "login" | "signup" | "forgot";

// ─── Context value ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  organization: Organization | null;
  stores: AppStore[];
  currentStore: AppStore | null;
  isAuthenticated: boolean;
  isOnboardingCompleted: boolean;
  authPage: AuthPage;
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<boolean>;
  completeOnboarding: (data: OnboardingData) => void;
  switchStore: (storeId: string) => void;
  setAuthPage: (page: AuthPage) => void;
  hasPermission: (menuId: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stores, setStores] = useState<AppStore[]>([]);
  const [currentStore, setCurrentStore] = useState<AppStore | null>(null);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [authPage, setAuthPage] = useState<AuthPage>("login");
  const [initialized, setInitialized] = useState(false);

  // ─── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (isSupabaseEnabled() && supabase) {
        // Supabase mode: restore via supabase.auth.getSession
        const session = await getSupabaseSession();
        if (!cancelled && session?.user) {
          const workspace = await loadUserProfile(session.user.id, session.user.email ?? "");
          if (!cancelled && workspace) {
            const defaultStore = workspace.stores[0] ?? null;
            setUser(workspace.user);
            setOrganization(workspace.org);
            setStores(workspace.stores);
            setCurrentStore(defaultStore);
            setIsOnboardingCompleted(true);
          }
        }
        if (!cancelled) setInitialized(true);

        // Listen for Supabase auth state changes (sign-in, sign-out, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sbSession) => {
          if (cancelled) return;
          if (!sbSession) {
            setUser(null);
            setOrganization(null);
            setStores([]);
            setCurrentStore(null);
            setIsOnboardingCompleted(false);
          } else if (event === "SIGNED_IN" && sbSession.user) {
            const workspace = await loadUserProfile(sbSession.user.id, sbSession.user.email ?? "");
            if (!cancelled && workspace) {
              const defaultStore = workspace.stores[0] ?? null;
              setUser(workspace.user);
              setOrganization(workspace.org);
              setStores(workspace.stores);
              setCurrentStore(defaultStore);
              setIsOnboardingCompleted(true);
            }
          }
        });
        return () => { cancelled = true; subscription.unsubscribe(); };
      } else {
        // Local mode: restore from localStorage session
        const session = loadAuthSession();
        if (session) {
          const resolved = resolveUserFromSession(session);
          if (resolved) {
            setUser(resolved.user);
            setOrganization(resolved.org);
            setStores(resolved.stores);
            const store =
              resolved.stores.find((s) => s.id === session.currentStoreId) ?? resolved.stores[0] ?? null;
            setCurrentStore(store);
            setIsOnboardingCompleted(session.isOnboardingCompleted);
          } else {
            clearAuthSession();
          }
        }
        if (!cancelled) setInitialized(true);
        return () => { cancelled = true; };
      }
    }

    const cleanup = restoreSession();
    return () => { cancelled = true; cleanup.then((fn) => fn?.())};
  }, []);

  // ─── login ────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      if (isSupabaseEnabled()) {
        // Supabase mode
        const result = await repoSignIn(email, password);
        if (result.error) return { success: false, error: result.error };

        if (result.user) {
          const defaultStore = result.stores[0] ?? null;
          setUser(result.user);
          setOrganization(result.org);
          setStores(result.stores);
          setCurrentStore(defaultStore);
          setIsOnboardingCompleted(!result.needsOnboarding);
        }
        return { success: true };
      }

      // Local mode: existing mock auth
      const result = mockLogin(email, password);
      if (!result) {
        return { success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." };
      }

      const { user: u, org, stores: storeList } = result;
      const defaultStore = storeList.find((s) => u.storeIds.includes(s.id)) ?? storeList[0] ?? null;

      const onboardingKey = `fg_onboarding_${u.id}`;
      const onboarded = loadFromStorage<boolean>(onboardingKey, false);
      const isDemo = ["user_demo", "user_manager", "user_staff"].includes(u.id);

      setUser(u);
      setOrganization(org);
      setStores(storeList);
      setCurrentStore(defaultStore);
      setIsOnboardingCompleted(isDemo || onboarded);

      saveAuthSession({
        userId: u.id,
        organizationId: org.id,
        currentStoreId: defaultStore?.id ?? "",
        isOnboardingCompleted: isDemo || onboarded,
      });

      return { success: true };
    },
    []
  );

  // ─── signup ───────────────────────────────────────────────────────────────
  const signup = useCallback(
    async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
      if (!data.email || !data.password || !data.name) {
        return { success: false, error: "모든 필수 항목을 입력해주세요." };
      }
      if (data.password.length < 6) {
        return { success: false, error: "비밀번호는 6자 이상이어야 합니다." };
      }

      if (isSupabaseEnabled()) {
        // Supabase mode
        const result = await repoSignUp(data);
        if (result.error) return { success: false, error: result.error };

        if (result.user) {
          const defaultStore = result.stores[0] ?? null;
          setUser(result.user);
          setOrganization(result.org);
          setStores(result.stores);
          setCurrentStore(defaultStore);
          setIsOnboardingCompleted(false); // always go through onboarding after signup
        }
        return { success: true };
      }

      // Local mode: existing mock signup
      const { user: u, org, stores: storeList } = mockSignup(data);
      const defaultStore = storeList[0] ?? null;

      setUser(u);
      setOrganization(org);
      setStores(storeList);
      setCurrentStore(defaultStore);
      setIsOnboardingCompleted(false);

      saveAuthSession({
        userId: u.id,
        organizationId: org.id,
        currentStoreId: defaultStore?.id ?? "",
        isOnboardingCompleted: false,
      });

      return { success: true };
    },
    []
  );

  // ─── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (isSupabaseEnabled()) {
      await repoSignOut();
    } else {
      clearAuthSession();
    }
    setUser(null);
    setOrganization(null);
    setStores([]);
    setCurrentStore(null);
    setIsOnboardingCompleted(false);
    setAuthPage("login");
  }, []);

  // ─── requestPasswordReset ─────────────────────────────────────────────────
  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    if (!email.trim()) return false;
    if (isSupabaseEnabled()) {
      const { error } = await repoRequestPasswordReset(email);
      return !error;
    }
    // Local mode: always succeed (mock)
    return true;
  }, []);

  // ─── completeOnboarding ───────────────────────────────────────────────────
  const completeOnboarding = useCallback(
    (data: OnboardingData) => {
      if (!user) return;

      // Update org name and first store name
      const updatedOrg: Organization = {
        ...(organization ?? DEMO_ORG),
        name: data.orgName,
      };
      const updatedStore: AppStore = {
        ...(currentStore ?? DEMO_STORES[0]),
        name: data.storeName,
        type: data.businessType,
      };

      setOrganization(updatedOrg);
      setStores((prev) => prev.map((s) => (s.id === updatedStore.id ? updatedStore : s)));
      setCurrentStore(updatedStore);
      setIsOnboardingCompleted(true);

      // Persist onboarding completion
      const onboardingKey = `fg_onboarding_${user.id}`;
      saveToStorage(onboardingKey, true);

      // Also store org/store overrides
      saveToStorage(`fg_org_override_${user.id}`, { org: updatedOrg, store: updatedStore });

      // Update auth session
      saveAuthSession({
        userId: user.id,
        organizationId: updatedOrg.id,
        currentStoreId: updatedStore.id,
        isOnboardingCompleted: true,
      });
    },
    [user, organization, currentStore]
  );

  // ─── switchStore ──────────────────────────────────────────────────────────
  const switchStore = useCallback(
    (storeId: string) => {
      const target = stores.find((s) => s.id === storeId);
      if (!target || !user) return;
      setCurrentStore(target);
      saveAuthSession({
        userId: user.id,
        organizationId: organization?.id ?? "",
        currentStoreId: storeId,
        isOnboardingCompleted,
      });
    },
    [stores, user, organization, isOnboardingCompleted]
  );

  // ─── hasPermission ────────────────────────────────────────────────────────
  const hasPermission = useCallback(
    (menuId: string): boolean => {
      if (!user) return false;
      return checkPermission(user.role as UserRole, menuId);
    },
    [user]
  );

  if (!initialized) return null;

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        stores,
        currentStore,
        isAuthenticated: !!user,
        isOnboardingCompleted,
        authPage,
        login,
        signup,
        logout,
        requestPasswordReset,
        completeOnboarding,
        switchStore,
        setAuthPage,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Re-export types that consumers may need
export type { AuthUser, Organization, AppStore, OnboardingData, SignupData, UserRole };
