import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ItemStatus = "expired" | "urgent" | "warning" | "normal";

export interface Item {
  id: number;
  name: string;
  category: string;
  receivedDate: string;
  openedDate: string | null;
  expiryDate: string;
  useAfterOpenDays: number | null;
  location: string;
  quantity: number;
  unit: string;
  status: ItemStatus;
  assignee: string;
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

const TODAY = new Date().toISOString().split("T")[0];

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

const initialItems: Item[] = [
  { id: 1, name: "생크림", category: "유제품", receivedDate: "2026-05-20", openedDate: "2026-05-21", expiryDate: "2026-05-23", useAfterOpenDays: 2, location: "냉장고 1번", quantity: 2, unit: "개", status: "expired", assignee: "김조리" },
  { id: 2, name: "닭가슴살", category: "육류", receivedDate: "2026-05-21", openedDate: null, expiryDate: "2026-05-24", useAfterOpenDays: null, location: "냉장고 2번", quantity: 5, unit: "kg", status: "urgent", assignee: "이주방" },
  { id: 3, name: "양상추", category: "채소", receivedDate: "2026-05-22", openedDate: null, expiryDate: "2026-05-24", useAfterOpenDays: null, location: "냉장고 1번", quantity: 3, unit: "개", status: "urgent", assignee: "박직원" },
  { id: 4, name: "토마토소스", category: "소스", receivedDate: "2026-05-15", openedDate: "2026-05-20", expiryDate: "2026-05-25", useAfterOpenDays: 5, location: "건식 창고", quantity: 4, unit: "병", status: "warning", assignee: "김조리" },
  { id: 5, name: "우유", category: "유제품", receivedDate: "2026-05-20", openedDate: null, expiryDate: "2026-05-26", useAfterOpenDays: null, location: "냉장고 1번", quantity: 10, unit: "팩", status: "warning", assignee: "이주방" },
  { id: 6, name: "냉동 패티", category: "육류", receivedDate: "2026-05-10", openedDate: null, expiryDate: "2026-06-10", useAfterOpenDays: null, location: "냉동고 A", quantity: 50, unit: "개", status: "normal", assignee: "김조리" },
  { id: 7, name: "연어 필렛", category: "수산물", receivedDate: "2026-05-22", openedDate: null, expiryDate: "2026-05-27", useAfterOpenDays: null, location: "냉장고 2번", quantity: 2, unit: "kg", status: "normal", assignee: "박직원" },
  { id: 8, name: "계란", category: "난류", receivedDate: "2026-05-18", openedDate: null, expiryDate: "2026-06-01", useAfterOpenDays: null, location: "냉장고 1번", quantity: 30, unit: "개", status: "normal", assignee: "이주방" },
];

const initialDisposalRecords: DisposalRecord[] = [
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

interface AppContextValue {
  items: Item[];
  disposalRecords: DisposalRecord[];
  today: string;
  addItem: (item: Omit<Item, "id" | "status">) => void;
  updateItem: (id: number, updates: Partial<Omit<Item, "id">>) => void;
  deleteItem: (id: number) => void;
  addDisposalRecord: (record: Omit<DisposalRecord, "id">) => void;
  updateDisposalRecord: (id: number, updates: Partial<Omit<DisposalRecord, "id">>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(() =>
    initialItems.map((item) => ({ ...item, status: computeStatus(item.expiryDate) }))
  );
  const [disposalRecords, setDisposalRecords] = useState<DisposalRecord[]>(initialDisposalRecords);

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

  const addDisposalRecord = useCallback((record: Omit<DisposalRecord, "id">) => {
    setDisposalRecords((prev) => [{ ...record, id: Date.now() }, ...prev]);
  }, []);

  const updateDisposalRecord = useCallback((id: number, updates: Partial<Omit<DisposalRecord, "id">>) => {
    setDisposalRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  return (
    <AppContext.Provider
      value={{ items, disposalRecords, today: TODAY, addItem, updateItem, deleteItem, addDisposalRecord, updateDisposalRecord }}
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
