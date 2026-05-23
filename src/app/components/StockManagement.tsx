import { useState, useMemo } from "react";
import {
  PackagePlus,
  Package,
  PackageOpen,
  CheckCircle2,
  Trash2,
  Search,
  QrCode,
  TrendingUp,
  AlertTriangle,
  X,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner";
import { useApp, getDaysLeft } from "../context/AppContext";
import type { Item, StockStatus } from "../context/AppContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReceiveForm {
  name: string;
  category: string;
  expiryDate: string;
  quantity: string;
  unit: string;
  location: string;
  cost: string;
  assignee: string;
  openedShelfLifeDays: string;
  memo: string;
}

interface OpenForm {
  openedDate: string;
  openedShelfLifeDays: string;
  assignee: string;
  memo: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["유제품", "육류", "채소", "소스", "수산물", "난류", "건식류", "냉동식품"];
const UNITS = ["개", "kg", "g", "팩", "병", "봉", "L", "ml", "캔", "박스"];

const STOCK_STATUS_CONFIG: Record<StockStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  unopened: { label: "미개봉", color: "text-[#3b82f6]", bg: "bg-[#eff6ff]", border: "border-[#bfdbfe]", icon: Package },
  opened: { label: "개봉", color: "text-[#f97316]", bg: "bg-[#fff7ed]", border: "border-[#fdba74]", icon: PackageOpen },
  used: { label: "사용완료", color: "text-[#10b981]", bg: "bg-[#ecfdf5]", border: "border-[#a7f3d0]", icon: CheckCircle2 },
  disposed: { label: "폐기", color: "text-[#71717a]", bg: "bg-[#f4f4f5]", border: "border-[#d4d4d8]", icon: Trash2 },
};

const FILTER_TABS: { id: "all" | StockStatus; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "unopened", label: "미개봉" },
  { id: "opened", label: "개봉" },
  { id: "used", label: "사용완료" },
  { id: "disposed", label: "폐기" },
];

const emptyReceiveForm: ReceiveForm = {
  name: "",
  category: "유제품",
  expiryDate: "",
  quantity: "",
  unit: "개",
  location: "",
  cost: "",
  assignee: "",
  openedShelfLifeDays: "",
  memo: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StockManagement() {
  const { items, locations, staff, receiveItem, openItem, markItemUsed, disposeItem } = useApp();
  const today = new Date().toISOString().split("T")[0];

  const [activeFilter, setActiveFilter] = useState<"all" | StockStatus>("all");
  const [search, setSearch] = useState("");
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openTarget, setOpenTarget] = useState<Item | null>(null);
  const [receiveForm, setReceiveForm] = useState<ReceiveForm>(emptyReceiveForm);
  const [openForm, setOpenForm] = useState<OpenForm>({ openedDate: today, openedShelfLifeDays: "", assignee: "", memo: "" });

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const todayReceived = items.filter((i) => i.receivedDate === today).length;
    const unopened = items.filter((i) => i.stockStatus === "unopened").length;
    const opened = items.filter((i) => i.stockStatus === "opened").length;
    const openedNearExpiry = items.filter(
      (i) => i.stockStatus === "opened" && getDaysLeft(i.expiryDate) <= 1
    ).length;
    const used = items.filter((i) => i.stockStatus === "used").length;
    const disposed = items.filter((i) => i.stockStatus === "disposed").length;
    const todayOpened = items.filter((i) => i.openedDate === today).length;
    return { todayReceived, unopened, opened, openedNearExpiry, used, disposed, todayOpened };
  }, [items, today]);

  // ─── Filtered items ────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let list = activeFilter === "all" ? items : items.filter((i) => i.stockStatus === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      const order: Record<StockStatus, number> = { opened: 0, unopened: 1, used: 2, disposed: 3 };
      return order[a.stockStatus] - order[b.stockStatus];
    });
  }, [items, activeFilter, search]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  function handleReceive() {
    if (!receiveForm.name.trim() || !receiveForm.expiryDate || !receiveForm.quantity) {
      toast.error("품목명, 소비기한, 수량은 필수 입력항목입니다.");
      return;
    }
    receiveItem({
      name: receiveForm.name.trim(),
      category: receiveForm.category,
      receivedDate: today,
      openedDate: null,
      expiryDate: receiveForm.expiryDate,
      useAfterOpenDays: receiveForm.openedShelfLifeDays ? Number(receiveForm.openedShelfLifeDays) : null,
      openedShelfLifeDays: receiveForm.openedShelfLifeDays ? Number(receiveForm.openedShelfLifeDays) : null,
      location: receiveForm.location || (locations[0]?.name ?? ""),
      quantity: Number(receiveForm.quantity),
      unit: receiveForm.unit,
      stockStatus: "unopened",
      assignee: receiveForm.assignee || (staff.find((s) => s.status === "active")?.name ?? ""),
      qrLabelEnabled: false,
      memo: receiveForm.memo,
      cost: receiveForm.cost ? Number(receiveForm.cost) : 0,
    });
    toast.success(`${receiveForm.name} 입고 완료`);
    setShowReceiveModal(false);
    setReceiveForm(emptyReceiveForm);
  }

  function handleOpenSubmit() {
    if (!openTarget) return;
    openItem(openTarget.id, {
      openedDate: openForm.openedDate || today,
      openedShelfLifeDays: openForm.openedShelfLifeDays ? Number(openForm.openedShelfLifeDays) : undefined,
      memo: openForm.memo,
      handler: openForm.assignee || openTarget.assignee,
    });
    toast.success(`${openTarget.name} 개봉 처리 완료`);
    setShowOpenModal(false);
    setOpenTarget(null);
    setOpenForm({ openedDate: today, openedShelfLifeDays: "", assignee: "", memo: "" });
  }

  function handleMarkUsed(item: Item) {
    markItemUsed(item.id);
    toast.success(`${item.name} 사용 완료 처리`);
  }

  function handleDispose(item: Item) {
    disposeItem(item.id, { reason: "소비기한 임박/만료", loss: item.cost * item.quantity, handler: item.assignee });
    toast.success(`${item.name} 폐기 처리 완료`);
  }

  function openOpenModal(item: Item) {
    setOpenTarget(item);
    setOpenForm({
      openedDate: today,
      openedShelfLifeDays: item.openedShelfLifeDays?.toString() ?? item.useAfterOpenDays?.toString() ?? "",
      assignee: item.assignee,
      memo: "",
    });
    setShowOpenModal(true);
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">입고/개봉 관리</h1>
          <p className="text-sm text-[#71717a]">품목의 입고부터 개봉, 사용, 폐기까지 재고 흐름을 관리합니다</p>
        </div>
        <Button
          className="bg-[#10b981] hover:bg-[#059669] text-white shadow-sm"
          onClick={() => setShowReceiveModal(true)}
        >
          <PackagePlus className="w-4 h-4 mr-2" />
          입고 등록
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#ecfdf5]">
                <TrendingUp className="w-4 h-4 text-[#10b981]" />
              </div>
              <span className="text-sm text-[#71717a]">오늘 입고</span>
            </div>
            <div className="text-2xl font-semibold text-[#0a0a0a]">{stats.todayReceived}건</div>
          </CardContent>
        </Card>
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#eff6ff]">
                <Package className="w-4 h-4 text-[#3b82f6]" />
              </div>
              <span className="text-sm text-[#71717a]">미개봉</span>
            </div>
            <div className="text-2xl font-semibold text-[#0a0a0a]">{stats.unopened}개</div>
          </CardContent>
        </Card>
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#fff7ed]">
                <PackageOpen className="w-4 h-4 text-[#f97316]" />
              </div>
              <span className="text-sm text-[#71717a]">개봉 중</span>
            </div>
            <div className="text-2xl font-semibold text-[#0a0a0a]">{stats.opened}개</div>
            {stats.openedNearExpiry > 0 && (
              <p className="text-xs text-[#ef4444] mt-1">기한 임박 {stats.openedNearExpiry}개</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#fef2f2]">
                <Trash2 className="w-4 h-4 text-[#ef4444]" />
              </div>
              <span className="text-sm text-[#71717a]">폐기</span>
            </div>
            <div className="text-2xl font-semibold text-[#0a0a0a]">{stats.disposed}개</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === tab.id
                  ? "bg-[#10b981] text-white"
                  : "bg-white border border-[#e4e4e7] text-[#52525b] hover:bg-[#f4f4f5]"
              }`}
            >
              {tab.label}
              {tab.id !== "all" && (
                <span className="ml-1.5 text-xs opacity-70">
                  {tab.id === "unopened" ? stats.unopened
                    : tab.id === "opened" ? stats.opened
                    : tab.id === "used" ? stats.used
                    : stats.disposed}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1aa]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="품목명, 카테고리, 위치 검색"
            className="pl-9 border-[#e4e4e7] h-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#52525b]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Items Table */}
      <Card className="border-[#e4e4e7] shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fafafa] border-b border-[#e4e4e7]">
                <tr>
                  {["품목명", "카테고리", "입고일", "개봉일", "소비기한", "수량", "보관위치", "재고상태", "원가", "액션"].map((h, i) => (
                    <th
                      key={h}
                      className={`py-3 px-4 text-xs font-medium text-[#71717a] uppercase tracking-wider whitespace-nowrap ${
                        i === 9 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e4e4e7]">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-sm text-[#71717a]">
                      {search ? `"${search}" 검색 결과가 없습니다` : "해당 재고 상태의 품목이 없습니다"}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const daysLeft = getDaysLeft(item.expiryDate);
                    const cfg = STOCK_STATUS_CONFIG[item.stockStatus];
                    const StatusIcon = cfg.icon;
                    return (
                      <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#0a0a0a] whitespace-nowrap">{item.name}</span>
                            {item.qrLabelEnabled && (
                              <QrCode className="w-3.5 h-3.5 text-[#71717a]" />
                            )}
                          </div>
                          {item.memo && <p className="text-xs text-[#a1a1aa] mt-0.5 truncate max-w-[120px]">{item.memo}</p>}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#71717a] whitespace-nowrap">{item.category}</td>
                        <td className="py-3 px-4 text-sm text-[#71717a] whitespace-nowrap">{item.receivedDate}</td>
                        <td className="py-3 px-4 text-sm text-[#71717a] whitespace-nowrap">
                          {item.openedDate ?? <span className="text-[#d4d4d8]">-</span>}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-sm text-[#0a0a0a]">{item.expiryDate}</div>
                          {item.stockStatus !== "used" && item.stockStatus !== "disposed" && (
                            <div className={`text-xs mt-0.5 font-medium ${
                              daysLeft < 0 ? "text-[#ef4444]" : daysLeft <= 1 ? "text-[#f97316]" : daysLeft <= 3 ? "text-[#f59e0b]" : "text-[#10b981]"
                            }`}>
                              {daysLeft < 0 ? "만료됨" : daysLeft === 0 ? "오늘 만료" : `D-${daysLeft}`}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#0a0a0a] whitespace-nowrap">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#71717a] whitespace-nowrap">{item.location}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`${cfg.bg} ${cfg.color} ${cfg.border} whitespace-nowrap flex items-center gap-1 w-fit`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </Badge>
                          {item.stockStatus === "opened" && item.openedShelfLifeDays && (
                            <p className="text-xs text-[#a1a1aa] mt-0.5">개봉 후 {item.openedShelfLifeDays}일</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#0a0a0a] whitespace-nowrap">
                          {item.cost > 0 ? `₩${item.cost.toLocaleString()}` : <span className="text-[#d4d4d8]">-</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.stockStatus === "unopened" && (
                              <Button
                                size="sm"
                                className="bg-[#f97316] hover:bg-[#ea580c] text-white h-7 px-2.5 text-xs"
                                onClick={() => openOpenModal(item)}
                              >
                                <PackageOpen className="w-3.5 h-3.5 mr-1" />
                                개봉
                              </Button>
                            )}
                            {item.stockStatus === "opened" && (
                              <Button
                                size="sm"
                                className="bg-[#10b981] hover:bg-[#059669] text-white h-7 px-2.5 text-xs"
                                onClick={() => handleMarkUsed(item)}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                사용완료
                              </Button>
                            )}
                            {(item.stockStatus === "unopened" || item.stockStatus === "opened") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[#ef4444] border-[#e4e4e7] hover:bg-[#fef2f2] h-7 px-2.5 text-xs"
                                onClick={() => handleDispose(item)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                폐기
                              </Button>
                            )}
                            {(item.stockStatus === "used" || item.stockStatus === "disposed") && (
                              <span className="text-xs text-[#a1a1aa]">처리 완료</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stock Log Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0]">
          <div className="text-lg font-semibold text-[#10b981]">{stats.todayReceived}</div>
          <div className="text-xs text-[#52525b] mt-0.5">오늘 입고</div>
        </div>
        <div className="p-3 rounded-lg bg-[#fff7ed] border border-[#fdba74]">
          <div className="text-lg font-semibold text-[#f97316]">{stats.todayOpened}</div>
          <div className="text-xs text-[#52525b] mt-0.5">오늘 개봉</div>
        </div>
        <div className="p-3 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0]">
          <div className="text-lg font-semibold text-[#10b981]">{stats.used}</div>
          <div className="text-xs text-[#52525b] mt-0.5">사용 완료</div>
        </div>
        <div className="p-3 rounded-lg bg-[#fef2f2] border border-[#fca5a5]">
          <div className="text-lg font-semibold text-[#ef4444]">{stats.openedNearExpiry}</div>
          <div className="text-xs text-[#52525b] mt-0.5">개봉 기한 임박</div>
        </div>
      </div>

      {/* ─── 입고 등록 Modal ──────────────────────────────────────────────────── */}
      <Dialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-[#10b981]" />
              입고 등록
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              {/* 품목명 */}
              <div className="col-span-2 space-y-1.5">
                <Label>품목명 <span className="text-[#ef4444]">*</span></Label>
                <Input
                  value={receiveForm.name}
                  onChange={(e) => setReceiveForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="예) 생크림"
                  className="border-[#e4e4e7]"
                />
              </div>
              {/* 카테고리 */}
              <div className="space-y-1.5">
                <Label>카테고리</Label>
                <Select value={receiveForm.category} onValueChange={(v) => setReceiveForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger className="border-[#e4e4e7]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* 소비기한 */}
              <div className="space-y-1.5">
                <Label>소비기한 <span className="text-[#ef4444]">*</span></Label>
                <Input
                  type="date"
                  value={receiveForm.expiryDate}
                  onChange={(e) => setReceiveForm((p) => ({ ...p, expiryDate: e.target.value }))}
                  className="border-[#e4e4e7]"
                />
              </div>
              {/* 수량 */}
              <div className="space-y-1.5">
                <Label>수량 <span className="text-[#ef4444]">*</span></Label>
                <Input
                  type="number"
                  min={1}
                  value={receiveForm.quantity}
                  onChange={(e) => setReceiveForm((p) => ({ ...p, quantity: e.target.value }))}
                  placeholder="0"
                  className="border-[#e4e4e7]"
                />
              </div>
              {/* 단위 */}
              <div className="space-y-1.5">
                <Label>단위</Label>
                <Select value={receiveForm.unit} onValueChange={(v) => setReceiveForm((p) => ({ ...p, unit: v }))}>
                  <SelectTrigger className="border-[#e4e4e7]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* 보관 위치 */}
              <div className="space-y-1.5">
                <Label>보관 위치</Label>
                <Select value={receiveForm.location} onValueChange={(v) => setReceiveForm((p) => ({ ...p, location: v }))}>
                  <SelectTrigger className="border-[#e4e4e7]">
                    <SelectValue placeholder="위치 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* 원가 */}
              <div className="space-y-1.5">
                <Label>단위 원가 (₩)</Label>
                <Input
                  type="number"
                  min={0}
                  value={receiveForm.cost}
                  onChange={(e) => setReceiveForm((p) => ({ ...p, cost: e.target.value }))}
                  placeholder="0"
                  className="border-[#e4e4e7]"
                />
              </div>
              {/* 담당자 */}
              <div className="space-y-1.5">
                <Label>담당자</Label>
                <Select value={receiveForm.assignee} onValueChange={(v) => setReceiveForm((p) => ({ ...p, assignee: v }))}>
                  <SelectTrigger className="border-[#e4e4e7]">
                    <SelectValue placeholder="담당자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.filter((s) => s.status === "active").map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name} ({s.role === "owner" ? "점주" : s.role === "manager" ? "매니저" : "직원"})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* 개봉 후 유효기간 */}
              <div className="space-y-1.5">
                <Label>개봉 후 유효기간 (일)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={receiveForm.openedShelfLifeDays}
                    onChange={(e) => setReceiveForm((p) => ({ ...p, openedShelfLifeDays: e.target.value }))}
                    placeholder="없음"
                    className="border-[#e4e4e7]"
                  />
                  <span className="text-sm text-[#71717a] whitespace-nowrap">일</span>
                </div>
              </div>
              {/* 메모 */}
              <div className="col-span-2 space-y-1.5">
                <Label>메모</Label>
                <Input
                  value={receiveForm.memo}
                  onChange={(e) => setReceiveForm((p) => ({ ...p, memo: e.target.value }))}
                  placeholder="특이사항 입력"
                  className="border-[#e4e4e7]"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowReceiveModal(false); setReceiveForm(emptyReceiveForm); }} className="border-[#e4e4e7]">
              취소
            </Button>
            <Button onClick={handleReceive} className="bg-[#10b981] hover:bg-[#059669] text-white">
              <PackagePlus className="w-4 h-4 mr-2" />
              입고 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── 개봉 처리 Modal ──────────────────────────────────────────────────── */}
      <Dialog open={showOpenModal} onOpenChange={setShowOpenModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageOpen className="w-5 h-5 text-[#f97316]" />
              개봉 처리 — {openTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {openTarget && (
              <div className="p-3 rounded-lg bg-[#f4f4f5] text-sm text-[#52525b]">
                소비기한: <span className="font-medium text-[#0a0a0a]">{openTarget.expiryDate}</span>
                {openTarget.openedShelfLifeDays && (
                  <span className="ml-2">· 개봉 후 {openTarget.openedShelfLifeDays}일 유효</span>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>개봉일</Label>
              <Input
                type="date"
                value={openForm.openedDate}
                onChange={(e) => setOpenForm((p) => ({ ...p, openedDate: e.target.value }))}
                className="border-[#e4e4e7]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>개봉 후 유효기간 (일)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={openForm.openedShelfLifeDays}
                  onChange={(e) => setOpenForm((p) => ({ ...p, openedShelfLifeDays: e.target.value }))}
                  placeholder="원래 기한 유지"
                  className="border-[#e4e4e7]"
                />
                <span className="text-sm text-[#71717a] whitespace-nowrap">일</span>
              </div>
              <p className="text-xs text-[#a1a1aa]">입력 시 소비기한이 개봉일 기준으로 재계산됩니다</p>
            </div>
            <div className="space-y-1.5">
              <Label>처리 담당자</Label>
              <Select value={openForm.assignee} onValueChange={(v) => setOpenForm((p) => ({ ...p, assignee: v }))}>
                <SelectTrigger className="border-[#e4e4e7]">
                  <SelectValue placeholder="담당자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {staff.filter((s) => s.status === "active").map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>메모</Label>
              <Input
                value={openForm.memo}
                onChange={(e) => setOpenForm((p) => ({ ...p, memo: e.target.value }))}
                placeholder="특이사항 입력"
                className="border-[#e4e4e7]"
              />
            </div>

            {openTarget?.stockStatus === "opened" && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[#fffbeb] border border-[#fcd34d]">
                <AlertTriangle className="w-4 h-4 text-[#f59e0b] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#92400e]">이미 개봉된 품목입니다. 개봉일과 유효기간을 수정합니다.</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowOpenModal(false); setOpenTarget(null); }} className="border-[#e4e4e7]">
              취소
            </Button>
            <Button onClick={handleOpenSubmit} className="bg-[#f97316] hover:bg-[#ea580c] text-white">
              <PackageOpen className="w-4 h-4 mr-2" />
              개봉 처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
