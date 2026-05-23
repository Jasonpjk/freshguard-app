// ─── Storage Keys ─────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  // App data
  items: "fg_items",
  disposalRecords: "fg_disposal",
  locations: "fg_locations",
  staff: "fg_staff",
  settings: "fg_settings",
  stockLogs: "fg_stock_logs",
  // Auth data
  auth: "fg_auth",
  customUsers: "fg_custom_users",
  organizations: "fg_organizations",
  // Future: multi-store
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ─── Core helpers ─────────────────────────────────────────────────────────────

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function clearAllAppStorage(): void {
  const appKeys = [
    STORAGE_KEYS.items,
    STORAGE_KEYS.disposalRecords,
    STORAGE_KEYS.locations,
    STORAGE_KEYS.staff,
    STORAGE_KEYS.settings,
    STORAGE_KEYS.stockLogs,
  ];
  appKeys.forEach(removeFromStorage);
}

export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach(removeFromStorage);
}
