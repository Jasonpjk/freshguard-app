/**
 * camelCase (프론트) ↔ snake_case (Supabase) 변환 함수 모음
 *
 * 원칙:
 * - 프론트 타입은 기존 camelCase 유지 (기존 UI 컴포넌트 변경 없음)
 * - Supabase 컬럼은 snake_case 유지
 * - 숫자 필드는 Number() 보정 (null → 0 또는 null)
 * - null/undefined 는 안전하게 처리
 * - Supabase id(UUID string) → 프론트 id(number) 는 as unknown as number 캐스팅
 *   (런타임 비교는 동일 UUID 문자열이므로 정상 동작)
 */

import type {
  Item,
  StockLog,
  DisposalRecord,
  StorageLocation,
  ItemStatus,
  StockStatus,
  LocationType,
  StaffMember,
  StaffRole,
  StaffStatus,
} from "../context/AppContext";
import { computeStatus } from "../context/AppContext";
import type {
  HygieneTemplate,
  HygieneSession,
  HygieneCheckItem,
} from "./hygieneRepository";

// ─── Raw Supabase row interfaces ──────────────────────────────────────────────

export interface SupabaseItemRow {
  id: string;
  name: string;
  category: string | null;
  received_date: string;
  opened_date: string | null;
  expiry_date: string;
  use_after_open_days: number | null;
  opened_shelf_life_days: number | null;
  location: string | null;
  quantity: number;
  unit: string;
  status: string | null;
  stock_status: string;
  assignee: string | null;
  qr_label_enabled: boolean;
  memo: string | null;
  cost: number | null;
  store_id: string | null;
  organization_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseStockLogRow {
  id: string;
  store_id: string | null;
  organization_id: string | null;
  item_id: string | null;
  item_name: string;
  action: string;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface SupabaseDisposalRow {
  id: string;
  store_id: string | null;
  organization_id: string | null;
  item_id: string | null;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  reason: string | null;
  loss_amount: number | null;
  handler_id: string | null;
  handler_name: string | null;
  approver_id: string | null;
  approver_name: string | null;
  approved_at: string | null;
  status: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseStorageLocationRow {
  id: string;
  store_id: string | null;
  organization_id: string | null;
  name: string;
  type: string;
  temperature: number | null;
  capacity: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseHygieneTemplateRow {
  id: string;
  store_id: string | null;
  organization_id: string | null;
  category: string | null;
  label: string;
  required: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface SupabaseHygieneSessionRow {
  id: string;
  store_id: string;
  organization_id: string | null;
  checker_id: string | null;
  checked_date: string;
  total_count: number;
  done_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseHygieneCheckItemRow {
  id: string;
  session_id: string;
  template_id: string | null;
  label: string | null;
  category: string | null;
  checked: boolean;
  memo: string | null;
  photo_url: string | null;
  updated_at: string;
}

export interface SupabaseStaffRow {
  user_id: string;
  store_id: string;
  role: string;
  assigned_at: string;
  profiles: {
    id: string;
    name: string;
    organization_id: string | null;
    phone: string | null;
    is_active: boolean;
    last_active_at: string | null;
  } | null;
  // Joined from stores (store name)
  stores?: { name: string } | null;
}

// ─── Item mappers ─────────────────────────────────────────────────────────────

export function mapSupabaseItemToItem(row: SupabaseItemRow): Item {
  return {
    id: row.id as unknown as number,
    name: row.name ?? "",
    category: row.category ?? "",
    receivedDate: row.received_date ?? "",
    openedDate: row.opened_date ?? null,
    expiryDate: row.expiry_date ?? "",
    useAfterOpenDays: row.use_after_open_days ?? null,
    openedShelfLifeDays: row.opened_shelf_life_days ?? null,
    location: row.location ?? "",
    quantity: Number(row.quantity ?? 0),
    unit: row.unit ?? "",
    // Always recompute status from expiry date to keep consistent
    status: computeStatus(row.expiry_date ?? "") as ItemStatus,
    stockStatus: (row.stock_status ?? "unopened") as StockStatus,
    assignee: row.assignee ?? "",
    qrLabelEnabled: row.qr_label_enabled ?? false,
    memo: row.memo ?? "",
    cost: Number(row.cost ?? 0),
    storeId: row.store_id ?? undefined,
    organizationId: row.organization_id ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
  };
}

export function mapItemToSupabaseItemInsert(
  item: Omit<Item, "id" | "status">,
  organizationId: string,
  storeId: string
): Omit<SupabaseItemRow, "id" | "created_at" | "updated_at"> {
  return {
    name: item.name,
    category: item.category || null,
    received_date: item.receivedDate,
    opened_date: item.openedDate || null,
    expiry_date: item.expiryDate,
    use_after_open_days: item.useAfterOpenDays ?? null,
    opened_shelf_life_days: item.openedShelfLifeDays ?? null,
    location: item.location || null,
    quantity: item.quantity,
    unit: item.unit,
    status: null, // computed server-side via trigger or ignored (we recompute on fetch)
    stock_status: item.stockStatus ?? "unopened",
    assignee: item.assignee || null,
    qr_label_enabled: item.qrLabelEnabled ?? false,
    memo: item.memo || null,
    cost: item.cost ?? 0,
    store_id: storeId,
    organization_id: organizationId,
    created_by: item.createdBy ?? null,
    updated_by: item.updatedBy ?? null,
  };
}

export function mapItemToSupabaseItemUpdate(
  updates: Partial<Omit<Item, "id">>
): Partial<SupabaseItemRow> {
  const row: Partial<SupabaseItemRow> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.category !== undefined) row.category = updates.category || null;
  if (updates.receivedDate !== undefined) row.received_date = updates.receivedDate;
  if (updates.openedDate !== undefined) row.opened_date = updates.openedDate;
  if (updates.expiryDate !== undefined) row.expiry_date = updates.expiryDate;
  if (updates.useAfterOpenDays !== undefined) row.use_after_open_days = updates.useAfterOpenDays;
  if (updates.openedShelfLifeDays !== undefined) row.opened_shelf_life_days = updates.openedShelfLifeDays;
  if (updates.location !== undefined) row.location = updates.location || null;
  if (updates.quantity !== undefined) row.quantity = updates.quantity;
  if (updates.unit !== undefined) row.unit = updates.unit;
  if (updates.stockStatus !== undefined) row.stock_status = updates.stockStatus;
  if (updates.assignee !== undefined) row.assignee = updates.assignee || null;
  if (updates.qrLabelEnabled !== undefined) row.qr_label_enabled = updates.qrLabelEnabled;
  if (updates.memo !== undefined) row.memo = updates.memo || null;
  if (updates.cost !== undefined) row.cost = updates.cost;
  if (updates.updatedBy !== undefined) row.updated_by = updates.updatedBy ?? null;
  return row;
}

// ─── StockLog mappers ─────────────────────────────────────────────────────────

export function mapSupabaseStockLogToStockLog(row: SupabaseStockLogRow): StockLog {
  return {
    id: row.id as unknown as number,
    date: row.created_at ? row.created_at.split("T")[0] : "",
    type: (row.action ?? "received") as StockLog["type"],
    itemId: (row.item_id ?? "") as unknown as number,
    itemName: row.item_name ?? "",
    quantity: Number(row.quantity ?? 0),
    unit: row.unit ?? "",
    handler: row.actor_id ?? "",
    memo: row.note ?? "",
    storeId: row.store_id ?? undefined,
    organizationId: row.organization_id ?? undefined,
  };
}

export function mapStockLogToSupabaseInsert(
  log: Omit<StockLog, "id">,
  organizationId: string,
  storeId: string
): Omit<SupabaseStockLogRow, "id" | "created_at"> {
  return {
    store_id: storeId,
    organization_id: organizationId,
    item_id: String(log.itemId) || null,
    item_name: log.itemName ?? "",
    action: log.type,
    quantity: log.quantity ?? null,
    unit: log.unit || null,
    note: log.memo || null,
    actor_id: log.handler || null,
  };
}

// ─── DisposalRecord mappers ───────────────────────────────────────────────────

export function mapSupabaseDisposalRecordToDisposalRecord(row: SupabaseDisposalRow): DisposalRecord {
  return {
    id: row.id as unknown as number,
    date: row.created_at ? row.created_at.split("T")[0] : "",
    itemName: row.item_name ?? "",
    quantity: Number(row.quantity ?? 0),
    unit: row.unit ?? "",
    reason: row.reason ?? "",
    loss: Number(row.loss_amount ?? 0),
    handler: row.handler_name ?? "",
    approver: row.approver_name ?? null,
    status: (row.status ?? "pending") as DisposalRecord["status"],
    storeId: row.store_id ?? undefined,
    organizationId: row.organization_id ?? undefined,
  };
}

export function mapDisposalRecordToSupabaseInsert(
  record: Omit<DisposalRecord, "id">,
  organizationId: string,
  storeId: string
): Omit<SupabaseDisposalRow, "id" | "created_at" | "updated_at"> {
  return {
    store_id: storeId,
    organization_id: organizationId,
    item_id: null,
    item_name: record.itemName ?? "",
    quantity: record.quantity ?? null,
    unit: record.unit || null,
    reason: record.reason || null,
    loss_amount: record.loss ?? 0,
    handler_id: null,
    handler_name: record.handler || null,
    approver_id: null,
    approver_name: record.approver || null,
    approved_at: null,
    status: record.status ?? "pending",
    photo_url: null,
  };
}

export function mapDisposalRecordToSupabaseUpdate(
  updates: Partial<DisposalRecord>
): Partial<SupabaseDisposalRow> {
  const row: Partial<SupabaseDisposalRow> = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.approver !== undefined) row.approver_name = updates.approver ?? null;
  if (updates.reason !== undefined) row.reason = updates.reason || null;
  if (updates.loss !== undefined) row.loss_amount = updates.loss;
  return row;
}

// ─── StorageLocation mappers ──────────────────────────────────────────────────

export function mapSupabaseStorageLocationToStorageLocation(row: SupabaseStorageLocationRow): StorageLocation {
  return {
    id: row.id as unknown as number,
    name: row.name ?? "",
    type: (row.type ?? "dry") as LocationType,
    temperature: row.temperature ?? null,
    capacity: Number(row.capacity ?? 0),
    notes: row.notes ?? "",
  };
}

export function mapStorageLocationToSupabaseInsert(
  loc: Omit<StorageLocation, "id">,
  organizationId: string,
  storeId: string
): Omit<SupabaseStorageLocationRow, "id" | "created_at" | "updated_at"> {
  return {
    store_id: storeId,
    organization_id: organizationId,
    name: loc.name ?? "",
    type: loc.type ?? "dry",
    temperature: loc.temperature ?? null,
    capacity: loc.capacity ?? null,
    notes: loc.notes || null,
  };
}

export function mapStorageLocationToSupabaseUpdate(
  updates: Partial<StorageLocation>
): Partial<SupabaseStorageLocationRow> {
  const row: Partial<SupabaseStorageLocationRow> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.type !== undefined) row.type = updates.type;
  if (updates.temperature !== undefined) row.temperature = updates.temperature;
  if (updates.capacity !== undefined) row.capacity = updates.capacity;
  if (updates.notes !== undefined) row.notes = updates.notes || null;
  return row;
}

// ─── HygieneTemplate mappers ──────────────────────────────────────────────────

export function mapSupabaseHygieneTemplateToHygieneTemplate(row: SupabaseHygieneTemplateRow): HygieneTemplate {
  return {
    id: row.id as unknown as number,
    category: row.category ?? "",
    label: row.label ?? "",
    required: row.required ?? false,
    sortOrder: row.sort_order ?? 0,
    storeId: row.store_id ?? undefined,
  };
}

// ─── HygieneSession mappers ───────────────────────────────────────────────────

export function mapSupabaseHygieneSessionToHygieneSession(row: SupabaseHygieneSessionRow): HygieneSession {
  return {
    id: row.id as unknown as number,
    storeId: row.store_id ?? "",
    checkerId: row.checker_id ?? "",
    checkedDate: row.checked_date ?? "",
    totalCount: Number(row.total_count ?? 0),
    doneCount: Number(row.done_count ?? 0),
    status: (row.status ?? "incomplete") as HygieneSession["status"],
    createdAt: row.created_at ?? "",
  };
}

export function mapHygieneSessionToSupabaseInsert(
  session: Omit<HygieneSession, "id" | "createdAt">,
  organizationId: string
): Omit<SupabaseHygieneSessionRow, "id" | "created_at" | "updated_at"> {
  return {
    store_id: session.storeId,
    organization_id: organizationId,
    checker_id: session.checkerId || null,
    checked_date: session.checkedDate,
    total_count: session.totalCount,
    done_count: session.doneCount,
    status: session.status,
  };
}

// ─── HygieneCheckItem mappers ─────────────────────────────────────────────────

export function mapSupabaseHygieneCheckItemToHygieneCheckItem(row: SupabaseHygieneCheckItemRow): HygieneCheckItem {
  return {
    id: row.id as unknown as number,
    sessionId: row.session_id as unknown as number,
    templateId: (row.template_id ?? "") as unknown as number,
    checked: row.checked ?? false,
    memo: row.memo ?? undefined,
    photoUrl: row.photo_url ?? undefined,
  };
}

// ─── StaffMember mappers ──────────────────────────────────────────────────────

export function mapSupabaseStaffToStaffMember(row: SupabaseStaffRow): StaffMember {
  const profile = row.profiles;
  return {
    id: row.user_id as unknown as number,
    name: profile?.name ?? "",
    role: (row.role ?? "staff") as StaffRole,
    phone: profile?.phone ?? "",
    store: (row.stores as { name: string } | null | undefined)?.name ?? "",
    email: "", // email not stored in profiles table (is in auth.users)
    lastActive: profile?.last_active_at?.split("T")[0] ?? "",
    status: (profile?.is_active ? "active" : "inactive") as StaffStatus,
  };
}

export function mapStaffMemberToSupabaseInsert(
  member: Omit<StaffMember, "id">,
  storeId: string
): { role: string; store_id: string } {
  return {
    role: member.role,
    store_id: storeId,
  };
}

export function mapStaffMemberToSupabaseUpdate(
  updates: Partial<StaffMember>
): { role?: string; is_active?: boolean; phone?: string; name?: string } {
  const row: { role?: string; is_active?: boolean; phone?: string; name?: string } = {};
  if (updates.role !== undefined) row.role = updates.role;
  if (updates.status !== undefined) row.is_active = updates.status === "active";
  if (updates.phone !== undefined) row.phone = updates.phone;
  if (updates.name !== undefined) row.name = updates.name;
  return row;
}
