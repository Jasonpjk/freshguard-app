import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ItemStatus = "expired" | "urgent" | "warning" | "normal";
export type StockStatus = "unopened" | "opened" | "used" | "disposed";

export interface Item {
  id: number;
  name: string;
  category: string;
  receivedDate: string;
  openedDate: string | null;
  expiryDate: string;
  useAfterOpenDays: number | null;
  openedShelfLifeDays: number | null;
  location: string;
  quantity: number;
  unit: string;
  status: ItemStatus;
  stockStatus: StockStatus;
  assignee: string;
  qrLabelEnabled: boolean;
  memo: string;
  cost: number;
}

export interface StockLog {
  id: number;
  date: string;
  type: "received" | "opened" | "used" | "disposed";
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  handler: string;
  memo: string;
}

export interface DisposalRecord {
  id: number;
  date: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason: string;
  loss: number;
  handler: string;
  approver: string | null;
  status: "approved" | "pending";
}

export type LocationType = "refrigerator" | "freezer" | "dry" | "bar" | "other";

export interface StorageLocation {
  id: number;
  name: string;
  type: LocationType;
  temperature: number | null;
  capacity: number;
  notes: string;
}

export type StaffRole = "staff" | "manager" | "owner" | "admin";
export type StaffStatus = "active" | "inactive";

export interface StaffMember {
  id: number;
  name: string;
  role: StaffRole;
  phone: string;
  store: string;
  email: string;
  lastActive: string;
  status: StaffStatus;
}

export interface AppSettings {
  storeName: string;
  storeAddress: string;
  ownerName: string;
  warningDays: number;
  urgentDays: number;
  defaultOpenUseDays: number;
  notifyExpired: boolean;
  notifyUrgent: boolean;
  notifyWarning: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function computeStatus(expiryDate: string): ItemStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 1) return "urgent";
  if (daysLeft <= 3) return "warning";
  return "normal";
}

export function getDaysLeft(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const defaultItems: Item[] = [
  { id: 1, name: "생크림", category: "유제품", receivedDate: "2026-05-20", openedDate: "2026-05-21", expiryDate: "2026-05-23", useAfterOpenDays: 2, openedShelfLifeDays: 2, location: "냉장고 1번", quantity: 2, unit: "개", status: "expired", stockStatus: "opened", assignee: "김조리", qrLabelEnabled: false, memo: "", cost: 3500 },
  { id: 2, name: "닭가슴살", category: "육류", receivedDate: "2026-05-21", openedDate: null, expiryDate: "2026-05-24", useAfterOpenDays: null, openedShelfLifeDays: null, location: "냉장고 2번", quantity: 5, unit: "kg", status: "urgent", stockStatus: "unopened", assignee: "이주방", qrLabelEnabled: false, memo: "", cost: 12000 },
  { id: 3, name: "양상추", category: "채소", receivedDate: "2026-05-22", openedDate: null, expiryDate: "2026-05-24", useAfterOpenDays: null, openedShelfLifeDays: null, location: "냉장고 1번", quantity: 3, unit: "개", status: "urgent", stockStatus: "unopened", assignee: "박직원", qrLabelEnabled: false, memo: "", cost: 2000 },
  { id: 4, name: "토마토소스", category: "소스", receivedDate: "2026-05-15", openedDate: "2026-05-20", expiryDate: "2026-05-25", useAfterOpenDays: 5, openedShelfLifeDays: 5, location: "건식 창고", quantity: 4, unit: "병", status: "warning", stockStatus: "opened", assignee: "김조리", qrLabelEnabled: false, memo: "", cost: 5000 },
  { id: 5, name: "우유", category: "유제품", receivedDate: "2026-05-20", openedDate: null, expiryDate: "2026-05-26", useAfterOpenDays: null, openedShelfLifeDays: null, location: "냉장고 1번", quantity: 10, unit: "팩", status: "warning", stockStatus: "unopened", assignee: "이주방", qrLabelEnabled: false, memo: "", cost: 1500 },
  { id: 6, name: "냉동 패티", category: "육류", receivedDate: "2026-05-10", openedDate: null, expiryDate: "2026-06-10", useAfterOpenDays: null, openedShelfLifeDays: null, location: "냉동고 A", quantity: 50, unit: "개", status: "normal", stockStatus: "unopened", assignee: "김조리", qrLabelEnabled: true, memo: "월별 정기입고", cost: 800 },
  { id: 7, name: "연어 필렛", category: "수산물", receivedDate: "2026-05-22", openedDate: null, expiryDate: "2026-05-27", useAfterOpenDays: null, openedShelfLifeDays: null, location: "냉장고 2번", quantity: 2, unit: "kg", status: "normal", stockStatus: "unopened", assignee: "박직원", qrLabelEnabled: false, memo: "", cost: 25000 },
  { id: 8, name: "계란", category: "난류", receivedDate: "2026-05-18", openedDate: null, expiryDate: "2026-06-01", useAfterOpenDays: null, openedShelfLifeDays: null, location: "냉장고 1번", quantity: 30, unit: "개", status: "normal", stockStatus: "unopened", assignee: "이주방", qrLabelEnabled: false, memo: "", cost: 300 },
];

const defaultStockLogs: StockLog[] = [
  { id: 1, date: "2026-05-23", type: "received", itemId: 7, itemName: "연어 필렛", quantity: 2, unit: "kg", handler: "박직원", memo: "" },
  { id: 2, date: "2026-05-22", type: "received", itemId: 3, itemName: "양상추", quantity: 3, unit: "개", handler: "박직원", memo: "" },
  { id: 3, date: "2026-05-21", type: "opened", itemId: 1, itemName: "생크림", quantity: 2, unit: "개", handler: "김조리", memo: "" },
  { id: 4, date: "2026-05-20", type: "received", itemId: 1, itemName: "생크림", quantity: 2, unit: "개", handler: "김조리", memo: "" },
  { id: 5, date: "2026-05-20", type: "opened", itemId: 4, itemName: "토마토소스", quantity: 4, unit: "병", handler: "김조리", memo: "" },
];

const defaultDisposalRecords: DisposalRecord[] = [
  { id: 1, date: "2026-05-23", itemName: "양파", quantity: 2, unit: "kg", reason: "변질", loss: 8000, handler: "김조리", approver: "김점주", status: "approved" },
  { id: 2, date: "2026-05-22", itemName: "딸기", quantity: 1, unit: "팩", reason: "소비기한 초과", loss: 15000, handler: "이주방", approver: "김점주", status: "approved" },
  { id: 3, date: "2026-05-21", itemName: "우유", quantity: 3, unit: "팩", reason: "개봉 후 기한 초과", loss: 12000, handler: "박직원", approver: null, status: "pending" },
  { id: 4, date: "2026-05-20", itemName: "토마토", quantity: 1.5, unit: "kg", reason: "파손", loss: 9000, handler: "김조리", approver: "김점주", status: "approved" },
  { id: 5, date: "2026-05-19", itemName: "치즈", quantity: 1, unit: "개", reason: "오염", loss: 18000, handler: "이주방", approver: "김점주", status: "approved" },
  { id: 6, date: "2026-05-18", itemName: "샐러드채소", quantity: 2, unit: "봉", reason: "소비기한 초과", loss: 6000, handler: "박직원", approver: "김점주", status: "approved" },
  { id: 7, date: "2026-05-17", itemName: "생크림", quantity: 1, unit: "개", reason: "개봉 후 기한 초과", loss: 8500, handler: "김조리", approver: "김점주", status: "approved" },
  { id: 8, date: "2026-05-16", itemName: "버섯", quantity: 0.5, unit: "kg", reason: "변질", loss: 4500, handler: "이주방", approver: "김점주", status: "approved" },
  { id: 9, date: "2026-05-15", itemName: "새우", quantity: 1, unit: "kg", reason: "소비기한 초과", loss: 22000, handler: "박직원", approver: "김점주", status: "approved" },
  { id: 10, date: "2026-05-14", itemName: "두부", quantity: 3, unit: "개", reason: "파손", loss: 7000, handler: "김조리", approver: "김점주", status: "approved" },
];

const defaultLocations: StorageLocation[] = [
  { id: 1, name: "냉장고 1번", type: "refrigerator", temperature: 4, capacity: 100, notes: "채소/유제품 전용" },
  { id: 2, name: "냉장고 2번", type: "refrigerator", temperature: 3, capacity: 80, notes: "육류/수산물 전용" },
  { id: 3, name: "냉동고 A", type: "freezer", temperature: -18, capacity: 200, notes: "냉동식품 전용" },
  { id: 4, name: "건식 창고", type: "dry", temperature: null, capacity: 500, notes: "상온 보관" },
  { id: 5, name: "바 냉장고", type: "bar", temperature: 5, capacity: 60, notes: "음료/주류 전용" },
];

const defaultStaff: StaffMember[] = [
  { id: 1, name: "김점주", role: "owner", phone: "010-1234-5678", store: "강남점", email: "owner@freshguard.kr", lastActive: "2026-05-23", status: "active" },
  { id: 2, name: "이주방", role: "manager", phone: "010-2345-6789", store: "강남점", email: "manager@freshguard.kr", lastActive: "2026-05-23", status: "active" },
  { id: 3, name: "김조리", role: "staff", phone: "010-3456-7890", store: "강남점", email: "cook@freshguard.kr", lastActive: "2026-05-22", status: "active" },
  { id: 4, name: "박직원", role: "staff", phone: "010-4567-8901", store: "강남점", email: "staff@freshguard.kr", lastActive: "2026-05-21", status: "active" },
  { id: 5, name: "최알바", role: "staff", phone: "010-5678-9012", store: "강남점", email: "part@freshguard.kr", lastActive: "2026-05-18", status: "inactive" },
];

const defaultSettings: AppSettings = {
  storeName: "강남점",
  storeAddress: "서울시 강남구 테헤란로 123",
  ownerName: "김점주",
  warningDays: 3,
  urgentDays: 1,
  defaultOpenUseDays: 3,
  notifyExpired: true,
  notifyUrgent: true,
  notifyWarning: false,
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEYS = {
  items: "fg_items",
  disposalRecords: "fg_disposal",
  locations: "fg_locations",
  staff: "fg_staff",
  settings: "fg_settings",
  stockLogs: "fg_stock_logs",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

function migrateItem(raw: Record<string, unknown>): Item {
  const openedDate = (raw.openedDate as string | null) ?? null;
  return {
    id: raw.id as number,
    name: (raw.name as string) ?? "",
    category: (raw.category as string) ?? "",
    receivedDate: (raw.receivedDate as string) ?? "",
    openedDate,
    expiryDate: (raw.expiryDate as string) ?? "",
    useAfterOpenDays: (raw.useAfterOpenDays as number | null) ?? null,
    openedShelfLifeDays: (raw.openedShelfLifeDays as number | null) ?? null,
    location: (raw.location as string) ?? "",
    quantity: (raw.quantity as number) ?? 0,
    unit: (raw.unit as string) ?? "",
    status: computeStatus((raw.expiryDate as string) ?? ""),
    stockStatus: (raw.stockStatus as StockStatus) ?? (openedDate ? "opened" : "unopened"),
    assignee: (raw.assignee as string) ?? "",
    qrLabelEnabled: (raw.qrLabelEnabled as boolean) ?? false,
    memo: (raw.memo as string) ?? "",
    cost: (raw.cost as number) ?? 0,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  items: Item[];
  disposalRecords: DisposalRecord[];
  locations: StorageLocation[];
  staff: StaffMember[];
  settings: AppSettings;
  stockLogs: StockLog[];
  today: string;
  // Items
  addItem: (item: Omit<Item, "id" | "status">) => void;
  updateItem: (id: number, updates: Partial<Omit<Item, "id">>) => void;
  deleteItem: (id: number) => void;
  // Stock actions
  receiveItem: (item: Omit<Item, "id" | "status">) => void;
  openItem: (id: number, data?: { openedDate?: string; openedShelfLifeDays?: number; memo?: string; handler?: string }) => void;
  markItemUsed: (id: number) => void;
  disposeItem: (id: number, data: { reason: string; loss: number; handler: string }) => void;
  getItemsByStockStatus: (status: StockStatus) => Item[];
  // Disposal
  addDisposalRecord: (record: Omit<DisposalRecord, "id">) => void;
  updateDisposalRecord: (id: number, updates: Partial<Omit<DisposalRecord, "id">>) => void;
  // Locations
  addLocation: (loc: Omit<StorageLocation, "id">) => void;
  updateLocation: (id: number, updates: Partial<Omit<StorageLocation, "id">>) => void;
  deleteLocation: (id: number) => void;
  // Staff
  addStaff: (member: Omit<StaffMember, "id">) => void;
  updateStaff: (id: number, updates: Partial<Omit<StaffMember, "id">>) => void;
  deleteStaff: (id: number) => void;
  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;
  // Reset
  resetData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(() => {
    const raw = load(LS_KEYS.items, defaultItems) as Record<string, unknown>[];
    return raw.map(migrateItem);
  });
  const [disposalRecords, setDisposalRecords] = useState<DisposalRecord[]>(() =>
    load(LS_KEYS.disposalRecords, defaultDisposalRecords)
  );
  const [locations, setLocations] = useState<StorageLocation[]>(() =>
    load(LS_KEYS.locations, defaultLocations)
  );
  const [staff, setStaff] = useState<StaffMember[]>(() =>
    load(LS_KEYS.staff, defaultStaff)
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    load(LS_KEYS.settings, defaultSettings)
  );
  const [stockLogs, setStockLogs] = useState<StockLog[]>(() =>
    load(LS_KEYS.stockLogs, defaultStockLogs)
  );

  // Persist to localStorage on every change
  useEffect(() => { save(LS_KEYS.items, items); }, [items]);
  useEffect(() => { save(LS_KEYS.disposalRecords, disposalRecords); }, [disposalRecords]);
  useEffect(() => { save(LS_KEYS.locations, locations); }, [locations]);
  useEffect(() => { save(LS_KEYS.staff, staff); }, [staff]);
  useEffect(() => { save(LS_KEYS.settings, settings); }, [settings]);
  useEffect(() => { save(LS_KEYS.stockLogs, stockLogs); }, [stockLogs]);

  // ─── Items ──────────────────────────────────────────────────────────────────
  const addItem = useCallback((item: Omit<Item, "id" | "status">) => {
    setItems((prev) => [
      ...prev,
      { ...item, id: Date.now(), status: computeStatus(item.expiryDate) },
    ]);
  }, []);

  const updateItem = useCallback((id: number, updates: Partial<Omit<Item, "id">>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        return { ...updated, status: computeStatus(updated.expiryDate) };
      })
    );
  }, []);

  const deleteItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // ─── Stock Actions ──────────────────────────────────────────────────────────
  const receiveItem = useCallback((item: Omit<Item, "id" | "status">) => {
    const id = Date.now();
    const newItem: Item = {
      ...item,
      id,
      status: computeStatus(item.expiryDate),
      stockStatus: "unopened",
    };
    setItems((prev) => [...prev, newItem]);
    setStockLogs((prev) => [
      {
        id: Date.now() + 1,
        date: new Date().toISOString().split("T")[0],
        type: "received",
        itemId: id,
        itemName: item.name,
        quantity: item.quantity,
        unit: item.unit,
        handler: item.assignee,
        memo: item.memo ?? "",
      },
      ...prev,
    ]);
  }, []);

  const openItem = useCallback(
    (id: number, data?: { openedDate?: string; openedShelfLifeDays?: number; memo?: string; handler?: string }) => {
      const today = new Date().toISOString().split("T")[0];
      const openedDate = data?.openedDate ?? today;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const lifeDays = data?.openedShelfLifeDays ?? item.openedShelfLifeDays ?? item.useAfterOpenDays;
          const newExpiryDate = lifeDays
            ? new Date(new Date(openedDate).getTime() + lifeDays * 86400000).toISOString().split("T")[0]
            : item.expiryDate;
          const updated = {
            ...item,
            stockStatus: "opened" as StockStatus,
            openedDate,
            openedShelfLifeDays: lifeDays,
            expiryDate: newExpiryDate,
            memo: data?.memo ?? item.memo,
          };
          return { ...updated, status: computeStatus(updated.expiryDate) };
        })
      );
      setItems((prev) => {
        const found = prev.find((i) => i.id === id);
        if (found) {
          setStockLogs((logs) => [
            {
              id: Date.now(),
              date: today,
              type: "opened",
              itemId: id,
              itemName: found.name,
              quantity: found.quantity,
              unit: found.unit,
              handler: data?.handler ?? found.assignee,
              memo: data?.memo ?? "",
            },
            ...logs,
          ]);
        }
        return prev;
      });
    },
    []
  );

  const markItemUsed = useCallback((id: number) => {
    const today = new Date().toISOString().split("T")[0];
    setItems((prev) => {
      const found = prev.find((i) => i.id === id);
      if (found) {
        setStockLogs((logs) => [
          {
            id: Date.now(),
            date: today,
            type: "used",
            itemId: id,
            itemName: found.name,
            quantity: found.quantity,
            unit: found.unit,
            handler: found.assignee,
            memo: "",
          },
          ...logs,
        ]);
      }
      return prev.map((item) =>
        item.id === id ? { ...item, stockStatus: "used", quantity: 0, status: "normal" } : item
      );
    });
  }, []);

  const disposeItem = useCallback((id: number, data: { reason: string; loss: number; handler: string }) => {
    const today = new Date().toISOString().split("T")[0];
    setItems((prev) => {
      const found = prev.find((i) => i.id === id);
      if (found) {
        setDisposalRecords((records) => [
          {
            id: Date.now(),
            date: today,
            itemName: found.name,
            quantity: found.quantity,
            unit: found.unit,
            reason: data.reason,
            loss: data.loss,
            handler: data.handler,
            approver: null,
            status: "pending",
          },
          ...records,
        ]);
        setStockLogs((logs) => [
          {
            id: Date.now() + 1,
            date: today,
            type: "disposed",
            itemId: id,
            itemName: found.name,
            quantity: found.quantity,
            unit: found.unit,
            handler: data.handler,
            memo: data.reason,
          },
          ...logs,
        ]);
      }
      return prev.map((item) =>
        item.id === id ? { ...item, stockStatus: "disposed", quantity: 0, status: "normal" } : item
      );
    });
  }, []);

  const getItemsByStockStatus = useCallback(
    (status: StockStatus) => items.filter((i) => i.stockStatus === status),
    [items]
  );

  // ─── Disposal ───────────────────────────────────────────────────────────────
  const addDisposalRecord = useCallback((record: Omit<DisposalRecord, "id">) => {
    setDisposalRecords((prev) => [{ ...record, id: Date.now() }, ...prev]);
  }, []);

  const updateDisposalRecord = useCallback(
    (id: number, updates: Partial<Omit<DisposalRecord, "id">>) => {
      setDisposalRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
    },
    []
  );

  // ─── Locations ──────────────────────────────────────────────────────────────
  const addLocation = useCallback((loc: Omit<StorageLocation, "id">) => {
    setLocations((prev) => [...prev, { ...loc, id: Date.now() }]);
  }, []);

  const updateLocation = useCallback(
    (id: number, updates: Partial<Omit<StorageLocation, "id">>) => {
      setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    },
    []
  );

  const deleteLocation = useCallback((id: number) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
  }, []);

  // ─── Staff ──────────────────────────────────────────────────────────────────
  const addStaff = useCallback((member: Omit<StaffMember, "id">) => {
    setStaff((prev) => [...prev, { ...member, id: Date.now() }]);
  }, []);

  const updateStaff = useCallback(
    (id: number, updates: Partial<Omit<StaffMember, "id">>) => {
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    },
    []
  );

  const deleteStaff = useCallback((id: number) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ─── Settings ───────────────────────────────────────────────────────────────
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // ─── Reset ──────────────────────────────────────────────────────────────────
  const resetData = useCallback(() => {
    Object.values(LS_KEYS).forEach((k) => localStorage.removeItem(k));
    setItems(defaultItems.map(migrateItem));
    setDisposalRecords(defaultDisposalRecords);
    setLocations(defaultLocations);
    setStaff(defaultStaff);
    setSettings(defaultSettings);
    setStockLogs(defaultStockLogs);
  }, []);

  return (
    <AppContext.Provider
      value={{
        items, disposalRecords, locations, staff, settings, stockLogs,
        today: new Date().toISOString().split("T")[0],
        addItem, updateItem, deleteItem,
        receiveItem, openItem, markItemUsed, disposeItem, getItemsByStockStatus,
        addDisposalRecord, updateDisposalRecord,
        addLocation, updateLocation, deleteLocation,
        addStaff, updateStaff, deleteStaff,
        updateSettings, resetData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
