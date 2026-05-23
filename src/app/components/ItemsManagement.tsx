import { useState, useMemo } from "react";
import { Search, Download, Plus, MoreHorizontal, ArrowUpDown, Pencil, Trash2, X } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useApp, computeStatus } from "../context/AppContext";
import type { Item } from "../context/AppContext";

const CATEGORIES = ["유제품", "육류", "채소", "소스", "수산물", "난류", "건식류", "냉동식품", "기타"];
const LOCATIONS = ["냉장고 1번", "냉장고 2번", "냉동고 A", "냉동고 B", "건식 창고", "기타"];
const UNITS = ["개", "kg", "g", "팩", "병", "봉", "L", "ml"];
const ASSIGNEES = ["김조리", "이주방", "박직원"];

function getStatusBadge(status: string, expiryDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const configs = {
    expired: { className: "bg-[#fef2f2] text-[#ef4444] border-[#fca5a5]", text: "만료" },
    urgent: { className: "bg-[#fff7ed] text-[#f97316] border-[#fdba74]", text: `D-${daysLeft}` },
    warning: { className: "bg-[#fffbeb] text-[#f59e0b] border-[#fcd34d]", text: `D-${daysLeft}` },
    normal: { className: "bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]", text: "정상" },
  };

  const config = configs[status as keyof typeof configs] || configs.normal;
  return (
    <Badge variant="outline" className={`${config.className} font-medium px-2.5 py-0.5 text-xs`}>
      {config.text}
    </Badge>
  );
}

type SortKey = "name" | "expiryDate" | "category" | "status";

const EMPTY_FORM = {
  name: "",
  category: "유제품",
  receivedDate: new Date().toISOString().split("T")[0],
  openedDate: "",
  expiryDate: "",
  useAfterOpenDays: "",
  location: "냉장고 1번",
  quantity: "",
  unit: "개",
  assignee: "김조리",
};

export function ItemsManagement() {
  const { items, addItem, updateItem, deleteItem } = useApp();

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("expiryDate");
  const [sortAsc, setSortAsc] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Item | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (filterCategory !== "all" && item.category !== filterCategory) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "expiryDate") cmp = a.expiryDate.localeCompare(b.expiryDate);
      else if (sortKey === "category") cmp = a.category.localeCompare(b.category);
      else if (sortKey === "status") {
        const order = { expired: 0, urgent: 1, warning: 2, normal: 3 };
        cmp = order[a.status] - order[b.status];
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [items, filterStatus, filterCategory, searchQuery, sortKey, sortAsc]);

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: Item) {
    setEditTarget(item);
    setForm({
      name: item.name,
      category: item.category,
      receivedDate: item.receivedDate,
      openedDate: item.openedDate ?? "",
      expiryDate: item.expiryDate,
      useAfterOpenDays: item.useAfterOpenDays != null ? String(item.useAfterOpenDays) : "",
      location: item.location,
      quantity: String(item.quantity),
      unit: item.unit,
      assignee: item.assignee,
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name || !form.expiryDate || !form.quantity) return;
    const payload = {
      name: form.name,
      category: form.category,
      receivedDate: form.receivedDate,
      openedDate: form.openedDate || null,
      expiryDate: form.expiryDate,
      useAfterOpenDays: form.useAfterOpenDays ? Number(form.useAfterOpenDays) : null,
      location: form.location,
      quantity: Number(form.quantity),
      unit: form.unit,
      assignee: form.assignee,
    };

    if (editTarget) {
      updateItem(editTarget.id, payload);
    } else {
      addItem(payload);
    }
    setDialogOpen(false);
  }

  function handleDelete(id: number) {
    if (confirm("이 품목을 삭제하시겠습니까?")) deleteItem(id);
  }

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">품목 관리</h1>
          <p className="text-sm text-[#71717a]">등록된 모든 식재료와 상품을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-[#e4e4e7] text-[#52525b] hover:bg-[#f4f4f5] h-9"
            onClick={() => {
              const csv = [
                ["품목명", "카테고리", "입고일", "소비기한", "보관위치", "수량", "단위", "상태", "담당자"].join(","),
                ...filtered.map((i) => [i.name, i.category, i.receivedDate, i.expiryDate, i.location, i.quantity, i.unit, i.status, i.assignee].join(","))
              ].join("\n");
              const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "items.csv"; a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
          <Button
            size="sm"
            className="bg-[#10b981] hover:bg-[#059669] text-white h-9"
            onClick={openAdd}
          >
            <Plus className="w-4 h-4 mr-2" />
            품목 추가
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#a1a1aa]" />
          <Input
            placeholder="품목명으로 검색..."
            className="pl-10 border-[#e4e4e7] bg-white h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearchQuery("")}>
              <X className="w-4 h-4 text-[#a1a1aa]" />
            </button>
          )}
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px] border-[#e4e4e7] h-10">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="normal">정상</SelectItem>
            <SelectItem value="warning">주의</SelectItem>
            <SelectItem value="urgent">임박</SelectItem>
            <SelectItem value="expired">만료</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[180px] border-[#e4e4e7] h-10">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-[#71717a]">
        총 <span className="font-semibold text-[#0a0a0a]">{filtered.length}</span>개 품목
      </div>

      <Card className="border-[#e4e4e7] shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fafafa] border-b border-[#e4e4e7]">
                <tr>
                  {(["name", "category", "receivedDate", "expiryDate", "location", "quantity", "status", "assignee"] as const).map((key) => {
                    const labels: Record<string, string> = {
                      name: "품목명", category: "카테고리", receivedDate: "입고일",
                      expiryDate: "소비기한", location: "보관 위치", quantity: "수량",
                      status: "상태", assignee: "담당자"
                    };
                    const sortable = ["name", "category", "expiryDate", "status"].includes(key);
                    return (
                      <th key={key} className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                        {sortable ? (
                          <button
                            className="flex items-center gap-1 hover:text-[#0a0a0a] transition-colors"
                            onClick={() => toggleSort(key as SortKey)}
                          >
                            {labels[key]}
                            <ArrowUpDown className={`w-3 h-3 ${sortKey === key ? "text-[#10b981]" : ""}`} />
                          </button>
                        ) : labels[key]}
                      </th>
                    );
                  })}
                  <th className="text-right py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e4e4e7]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-sm text-[#71717a]">검색 결과가 없습니다</td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-4 px-6 font-medium text-[#0a0a0a]">{item.name}</td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{item.category}</td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{item.receivedDate}</td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{item.expiryDate}</td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{item.location}</td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{item.quantity} {item.unit}</td>
                      <td className="py-4 px-6">{getStatusBadge(item.status, item.expiryDate)}</td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{item.assignee}</td>
                      <td className="py-4 px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[#f4f4f5]">
                              <MoreHorizontal className="w-4 h-4 text-[#71717a]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Pencil className="w-4 h-4 mr-2" />수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-[#ef4444] focus:text-[#ef4444]"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editTarget ? "품목 수정" : "새 품목 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>품목명 *</Label>
                <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="품목명 입력" className="border-[#e4e4e7]" />
              </div>
              <div className="space-y-1.5">
                <Label>카테고리</Label>
                <Select value={form.category} onValueChange={(v) => setField("category", v)}>
                  <SelectTrigger className="border-[#e4e4e7]"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>보관 위치</Label>
                <Select value={form.location} onValueChange={(v) => setField("location", v)}>
                  <SelectTrigger className="border-[#e4e4e7]"><SelectValue /></SelectTrigger>
                  <SelectContent>{LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>입고일</Label>
                <Input type="date" value={form.receivedDate} onChange={(e) => setField("receivedDate", e.target.value)} className="border-[#e4e4e7]" />
              </div>
              <div className="space-y-1.5">
                <Label>소비기한 *</Label>
                <Input type="date" value={form.expiryDate} onChange={(e) => setField("expiryDate", e.target.value)} className="border-[#e4e4e7]" />
              </div>
              <div className="space-y-1.5">
                <Label>개봉일</Label>
                <Input type="date" value={form.openedDate} onChange={(e) => setField("openedDate", e.target.value)} className="border-[#e4e4e7]" />
              </div>
              <div className="space-y-1.5">
                <Label>개봉 후 유효기간 (일)</Label>
                <Input type="number" value={form.useAfterOpenDays} onChange={(e) => setField("useAfterOpenDays", e.target.value)} placeholder="없음" min={0} className="border-[#e4e4e7]" />
              </div>
              <div className="space-y-1.5">
                <Label>수량 *</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setField("quantity", e.target.value)} placeholder="0" min={0} className="border-[#e4e4e7]" />
              </div>
              <div className="space-y-1.5">
                <Label>단위</Label>
                <Select value={form.unit} onValueChange={(v) => setField("unit", v)}>
                  <SelectTrigger className="border-[#e4e4e7]"><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>담당자</Label>
                <Select value={form.assignee} onValueChange={(v) => setField("assignee", v)}>
                  <SelectTrigger className="border-[#e4e4e7]"><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSIGNEES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#e4e4e7]">취소</Button>
            <Button
              onClick={handleSave}
              className="bg-[#10b981] hover:bg-[#059669] text-white"
              disabled={!form.name || !form.expiryDate || !form.quantity}
            >
              {editTarget ? "수정 완료" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
