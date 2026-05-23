import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "./storageService";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = "owner" | "manager" | "staff" | "hq_admin";
export type OrgType = "individual" | "franchise_hq" | "management_company";
export type BusinessType = "restaurant" | "cafe" | "bakery" | "catering" | "franchise" | "other";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  storeIds: string[];
}

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  ownerId: string;
  createdAt: string;
}

export interface AppStore {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  type: BusinessType;
}

export interface StoredAuthSession {
  userId: string;
  organizationId: string;
  currentStoreId: string;
  isOnboardingCompleted: boolean;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  orgType: OrgType;
}

export interface OnboardingData {
  orgName: string;
  storeName: string;
  businessType: BusinessType;
  staffCount: string;
  createDefaultLocations: boolean;
  useSampleData: boolean;
}

interface MockAccount {
  email: string;
  password: string;
  user: AuthUser;
}

// ─── Default demo data ────────────────────────────────────────────────────────

export const DEMO_ORG: Organization = {
  id: "org_demo",
  name: "FreshGuard 데모",
  type: "franchise_hq",
  ownerId: "user_demo",
  createdAt: "2026-01-01",
};

export const DEMO_STORES: AppStore[] = [
  {
    id: "store_gangnnam",
    organizationId: "org_demo",
    name: "강남점",
    address: "서울시 강남구 테헤란로 123",
    type: "restaurant",
  },
  {
    id: "store_hongdae",
    organizationId: "org_demo",
    name: "홍대점",
    address: "서울시 마포구 와우산로 94",
    type: "cafe",
  },
];

const MOCK_ACCOUNTS: MockAccount[] = [
  {
    email: "demo@freshguard.app",
    password: "demo1234",
    user: {
      id: "user_demo",
      email: "demo@freshguard.app",
      name: "김점주",
      role: "owner",
      organizationId: "org_demo",
      storeIds: ["store_gangnnam", "store_hongdae"],
    },
  },
  {
    email: "manager@freshguard.app",
    password: "demo1234",
    user: {
      id: "user_manager",
      email: "manager@freshguard.app",
      name: "이주방",
      role: "manager",
      organizationId: "org_demo",
      storeIds: ["store_gangnnam"],
    },
  },
  {
    email: "staff@freshguard.app",
    password: "demo1234",
    user: {
      id: "user_staff",
      email: "staff@freshguard.app",
      name: "김조리",
      role: "staff",
      organizationId: "org_demo",
      storeIds: ["store_gangnnam"],
    },
  },
];

// ─── Permissions ──────────────────────────────────────────────────────────────

export const MENU_PERMISSIONS: Record<string, UserRole[]> = {
  dashboard: ["owner", "manager", "staff", "hq_admin"],
  items: ["owner", "manager", "staff", "hq_admin"],
  calendar: ["owner", "manager", "staff", "hq_admin"],
  stock: ["owner", "manager", "staff", "hq_admin"],
  disposal: ["owner", "manager", "staff", "hq_admin"],
  location: ["owner", "manager", "hq_admin"],
  hygiene: ["owner", "manager", "staff", "hq_admin"],
  staff: ["owner", "manager", "hq_admin"],
  report: ["owner", "manager", "hq_admin"],
  subscription: ["owner", "hq_admin"],
  settings: ["owner", "hq_admin"],
};

export function checkPermission(role: UserRole, menuId: string): boolean {
  const allowed = MENU_PERMISSIONS[menuId];
  if (!allowed) return true;
  return allowed.includes(role);
}

// ─── Auth service functions ───────────────────────────────────────────────────

export function mockLogin(
  email: string,
  password: string
): { user: AuthUser; org: Organization; stores: AppStore[] } | null {
  // Check built-in mock accounts
  const account = MOCK_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
  );
  if (account) {
    return { user: account.user, org: DEMO_ORG, stores: DEMO_STORES };
  }

  // Check custom-registered users
  const customUsers = loadFromStorage<
    Array<{ user: AuthUser; password: string; org: Organization; stores: AppStore[] }>
  >(STORAGE_KEYS.customUsers, []);
  const custom = customUsers.find(
    (u) => u.user.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (custom) {
    return { user: custom.user, org: custom.org, stores: custom.stores };
  }

  return null;
}

export function mockSignup(data: SignupData): {
  user: AuthUser;
  org: Organization;
  stores: AppStore[];
} {
  const orgId = `org_${Date.now()}`;
  const userId = `user_${Date.now()}`;
  const storeId = `store_${Date.now()}`;

  const org: Organization = {
    id: orgId,
    name: data.name + "의 조직",
    type: data.orgType,
    ownerId: userId,
    createdAt: new Date().toISOString().split("T")[0],
  };

  const defaultStore: AppStore = {
    id: storeId,
    organizationId: orgId,
    name: "내 매장",
    address: "",
    type: "restaurant",
  };

  const user: AuthUser = {
    id: userId,
    email: data.email,
    name: data.name,
    role: "owner",
    organizationId: orgId,
    storeIds: [storeId],
  };

  // Persist custom user
  const existing = loadFromStorage<
    Array<{ user: AuthUser; password: string; org: Organization; stores: AppStore[] }>
  >(STORAGE_KEYS.customUsers, []);
  saveToStorage(STORAGE_KEYS.customUsers, [
    ...existing,
    { user, password: data.password, org, stores: [defaultStore] },
  ]);

  return { user, org, stores: [defaultStore] };
}

export function saveAuthSession(session: StoredAuthSession): void {
  saveToStorage(STORAGE_KEYS.auth, session);
}

export function loadAuthSession(): StoredAuthSession | null {
  return loadFromStorage<StoredAuthSession | null>(STORAGE_KEYS.auth, null);
}

export function clearAuthSession(): void {
  localStorage.removeItem(STORAGE_KEYS.auth);
}

export function resolveUserFromSession(session: StoredAuthSession): {
  user: AuthUser;
  org: Organization;
  stores: AppStore[];
} | null {
  // Check built-in accounts
  const account = MOCK_ACCOUNTS.find((a) => a.user.id === session.userId);
  if (account) {
    return { user: account.user, org: DEMO_ORG, stores: DEMO_STORES };
  }

  // Check custom users
  const customUsers = loadFromStorage<
    Array<{ user: AuthUser; password: string; org: Organization; stores: AppStore[] }>
  >(STORAGE_KEYS.customUsers, []);
  const custom = customUsers.find((u) => u.user.id === session.userId);
  if (custom) {
    return { user: custom.user, org: custom.org, stores: custom.stores };
  }

  return null;
}
