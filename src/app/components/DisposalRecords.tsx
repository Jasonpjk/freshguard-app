import { useState, useMemo } from "react";
import { Download, Plus, MoreHorizontal, CheckCircle } from "lucide-react";
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
import { useApp } from "../context/AppContext";

const DISPOSAL_REASONS = ["소비기한 초과", "개봉 후 기한 초과", "변질", "파손", "오염", "기타"];
const UNITS = ["개", "kg", "g", "팩", "병", "봉", "L", "ml"];
const HANDLERS = ["김조리", "이주방", "박직원"];

const EMPTY_FORM = {
  date: new Date().toISOString().split("T")[0],
  itemName: "",
  quantity: "",
  unit: "개",
  reason: "소비기한 초과",
  loss: "",
  handler: "김조리",
};

export function DisposalRecords() {
  const { disposalRecords, addDisposalRecord, updateDisposalRecord } = useApp();

  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterReason, setFilterReason] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);

  const filtered = useMemo(() => {
    const now = new Date();
    return disposalRecords.filter((r) => {
      if (filterPeriod === "this-week") {
        const d = new Date(r.date);
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        if (diff > 7) return false;
      } else if (filterPeriod === "this-month") {
        if (!r.date.startsWith(thisMonth)) return false;
      } else if (filterPeriod === "last-month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
        if (!r.date.startsWith(lastMonth)) return false;
      }
      if (filterReason !== "all" && r.reason !== filterReason) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [disposalRecords, filterPeriod, filterReason, filterStatus, thisMonth]);

  const stats = useMemo(() => {
    const monthRecords = disposalRecords.filter((r) => r.date.startsWith(thisMonth));
    const totalLoss = monthRecords.reduce((sum, r) => sum + r.loss, 0);

    const itemCounts: Record<string, number> = {};
    monthRecords.forEach((r) => { itemCounts[r.itemName] = (itemCounts[r.itemName] || 0) + 1; });
    const topItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalCount: monthRecords.length,
      totalLoss,
      topItem: topItem ? `${topItem[0]} (${topItem[1]}건)` : "-",
    };
  }, [disposalRecords, thisMonth]);

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.itemName || !form.quantity) return;
    addDisposalRecord({
      date: form.date,
      itemName: form.itemName,
      quantity: Number(form.quantity),
      unit: form.unit,
      reason: form.reason,
      loss: Number(form.loss) || 0,
      handler: form.handler,
      approver: null,
      status: "pending",
    });
    setDialogOpen(false);
    setForm(EMPTY_FORM);
  }

  function handleApprove(id: number) {
    updateDisposalRecord(id, { status: "approved", approver: "김점주" });
  }

  function exportCSV() {
    const csv = [
      ["폐기일", "품목명", "수량", "단위", "사유", "손실금액", "처리자", "상태"].join(","),
      ...filtered.map((r) => [r.date, r.itemName, r.quantity, r.unit, r.reason, r.loss, r.handler, r.status].join(","))
    ].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "disposal-records.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">폐기 기록</h1>
          <p className="text-sm text-[#71717a]">폐기된 품목과 손실 금액을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-[#e4e4e7] h-9" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />엑셀 다운로드
          </Button>
          <Button size="sm" className="bg-[#10b981] hover:bg-[#059669] text-white h-9" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />폐기 등록
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">이번 달 폐기 건수</p>
            <p className="text-3xl font-semibold text-[#0a0a0a]">{stats.totalCount}건</p>
          </CardContent>
        </Card>
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">이번 달 폐기 금액</p>
            <p className="text-3xl font-semibold text-[#ef4444]">
              ₩{stats.totalLoss >= 1000 ? `${Math.round(stats.totalLoss / 1000)}K` : stats.totalLoss.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">가장 많이 폐기된 품목</p>
            <p className="text-lg font-semibold text-[#0a0a0a]">{stats.topItem}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-[180px] border-[#e4e4e7] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 기간</SelectItem>
            <SelectItem value="this-week">이번 주</SelectItem>
            <SelectItem value="this-month">이번 달</SelectItem>
            <SelectItem value="last-month">지난 달</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterReason} onValueChange={setFilterReason}>
          <SelectTrigger className="w-[180px] border-[#e4e4e7] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 사유</SelectItem>
            {DISPOSAL_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] border-[#e4e4e7] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="pending">승인 대기</SelectItem>
            <SelectItem value="approved">승인 완료</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-[#e4e4e7] shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fafafa] border-b border-[#e4e4e7]">
                <tr>
                  {["폐기일", "품목명", "수량", "폐기 사유", "손실 금액", "처리자", "상태", ""].map((h, i) => (
                    <th key={i} className={`py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider ${i === 7 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e4e4e7]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-sm text-[#71717a]">폐기 기록이 없습니다</td></tr>
                ) : (
                  filtered.map((record) => (
                    <tr key={record.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-4 px-6 text-sm text-[#71717a]">{record.date}</td>
                      <td className="py-4 px-6 font-medium text-[#0a0a0a]">{record.itemName}</td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{record.quantity} {record.unit}</td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{record.reason}</td>
                      <td className="py-4 px-6 font-medium text-[#ef4444]">₩{record.loss.toLocaleString()}</td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{record.handler}</td>
                      <td className="py-4 px-6">
                        {record.status === "approved" ? (
                          <Badge className="bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]">
                            <CheckCircle className="w-3 h-3 mr-1" />승인 완료
                          </Badge>
                        ) : (
                          <Badge className="bg-[#fffbeb] text-[#f59e0b] border-[#fcd34d]">승인 대기</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[#f4f4f5]">
                              <MoreHorizontal className="w-4 h-4 text-[#71717a]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {record.status === "pending" && (
                              <DropdownMenuItem onClick={() => handleApprove(record.id)}>
                                <CheckCircle className="w-4 h-4 mr-2 text-[#10b981]" />승인
                              </DropdownMenuItem>
                            )}
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
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>폐기 기록 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>폐기일</Label>
              <Input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} className="border-[#e4e4e7]" />
            </div>
            <div className="space-y-1.5">
              <Label>품목명 *</Label>
              <Input value={form.itemName} onChange={(e) => setField("itemName", e.target.value)} placeholder="품목명 입력" className="border-[#e4e4e7]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>수량 *</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setField("quantity", e.target.value)} min={0} className="border-[#e4e4e7]" />
              </div>
              <div className="space-y-1.5">
                <Label>단위</Label>
                <Select value={form.unit} onValueChange={(v) => setField("unit", v)}>
                  <SelectTrigger className="border-[#e4e4e7]"><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>폐기 사유</Label>
              <Select value={form.reason} onValueChange={(v) => setField("reason", v)}>
                <SelectTrigger className="border-[#e4e4e7]"><SelectValue /></SelectTrigger>
                <SelectContent>{DISPOSAL_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>손실 금액 (원)</Label>
                <Input type="number" value={form.loss} onChange={(e) => setField("loss", e.target.value)} placeholder="0" min={0} className="border-[#e4e4e7]" />
              </div>
              <div className="space-y-1.5">
                <Label>처리 담당자</Label>
                <Select value={form.handler} onValueChange={(v) => setField("handler", v)}>
                  <SelectTrigger className="border-[#e4e4e7]"><SelectValue /></SelectTrigger>
                  <SelectContent>{HANDLERS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#e4e4e7]">취소</Button>
            <Button onClick={handleSave} className="bg-[#10b981] hover:bg-[#059669] text-white" disabled={!form.itemName || !form.quantity}>
              등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
