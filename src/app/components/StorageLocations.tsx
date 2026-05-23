import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Thermometer, Package, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useApp, type StorageLocation, type LocationType } from "../context/AppContext";

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  refrigerator: "냉장",
  freezer: "냉동",
  dry: "상온",
  bar: "바",
  other: "기타",
};

const LOCATION_TYPE_COLORS: Record<LocationType, string> = {
  refrigerator: "bg-[#eff6ff] text-[#3b82f6] border-[#93c5fd]",
  freezer: "bg-[#f0f9ff] text-[#0ea5e9] border-[#7dd3fc]",
  dry: "bg-[#fffbeb] text-[#f59e0b] border-[#fcd34d]",
  bar: "bg-[#fdf4ff] text-[#a855f7] border-[#d8b4fe]",
  other: "bg-[#f4f4f5] text-[#71717a] border-[#d4d4d8]",
};

const LOCATION_TYPE_BG: Record<LocationType, string> = {
  refrigerator: "from-[#3b82f6] to-[#2563eb]",
  freezer: "from-[#0ea5e9] to-[#0284c7]",
  dry: "from-[#f59e0b] to-[#d97706]",
  bar: "from-[#a855f7] to-[#9333ea]",
  other: "from-[#71717a] to-[#52525b]",
};

const EMPTY_FORM = {
  name: "",
  type: "refrigerator" as LocationType,
  temperature: "",
  capacity: "",
  notes: "",
};

export function StorageLocations() {
  const { locations, items, addLocation, updateLocation, deleteLocation } = useApp();
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StorageLocation | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const locationStats = useMemo(() => {
    const map: Record<number, { total: number; urgent: number; warning: number; expired: number }> = {};
    locations.forEach((loc) => {
      const locItems = items.filter((i) => i.location === loc.name);
      map[loc.id] = {
        total: locItems.length,
        expired: locItems.filter((i) => i.status === "expired").length,
        urgent: locItems.filter((i) => i.status === "urgent").length,
        warning: locItems.filter((i) => i.status === "warning").length,
      };
    });
    return map;
  }, [locations, items]);

  const selectedLocItems = useMemo(() => {
    if (!selectedLocation) return [];
    const loc = locations.find((l) => l.id === selectedLocation);
    if (!loc) return [];
    return items.filter((i) => i.location === loc.name);
  }, [selectedLocation, locations, items]);

  const selectedLoc = locations.find((l) => l.id === selectedLocation);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(loc: StorageLocation) {
    setEditTarget(loc);
    setForm({
      name: loc.name,
      type: loc.type,
      temperature: loc.temperature != null ? String(loc.temperature) : "",
      capacity: String(loc.capacity),
      notes: loc.notes,
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name) return;
    const payload = {
      name: form.name,
      type: form.type,
      temperature: form.temperature !== "" ? Number(form.temperature) : null,
      capacity: Number(form.capacity) || 0,
      notes: form.notes,
    };
    if (editTarget) {
      updateLocation(editTarget.id, payload);
    } else {
      addLocation(payload);
    }
    setDialogOpen(false);
  }

  function handleDelete(id: number) {
    if (confirm("이 보관 위치를 삭제하시겠습니까?")) {
      deleteLocation(id);
      if (selectedLocation === id) setSelectedLocation(null);
    }
  }

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">보관 위치 관리</h1>
          <p className="text-sm text-[#71717a]">냉장고, 냉동고, 창고 등 보관 위치를 관리합니다</p>
        </div>
        <Button size="sm" className="bg-[#10b981] hover:bg-[#059669] text-white h-9" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />위치 추가
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => {
          const stat = locationStats[loc.id] || { total: 0, expired: 0, urgent: 0, warning: 0 };
          const isSelected = selectedLocation === loc.id;
          const hasIssue = stat.expired > 0 || stat.urgent > 0;
          return (
            <Card
              key={loc.id}
              className={`border-[#e4e4e7] shadow-sm cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-[#10b981]" : ""}`}
              onClick={() => setSelectedLocation(isSelected ? null : loc.id)}
            >
              <CardContent className="p-0">
                <div className={`h-2 rounded-t-lg bg-gradient-to-r ${LOCATION_TYPE_BG[loc.type]}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-[#0a0a0a]">{loc.name}</h3>
                      <Badge variant="outline" className={`${LOCATION_TYPE_COLORS[loc.type]} text-xs mt-1`}>
                        {LOCATION_TYPE_LABELS[loc.type]}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-[#f4f4f5]"
                        onClick={(e) => { e.stopPropagation(); openEdit(loc); }}
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#71717a]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-[#fef2f2]"
                        onClick={(e) => { e.stopPropagation(); handleDelete(loc.id); }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#ef4444]" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 bg-[#fafafa] rounded-md">
                      <div className="text-lg font-semibold text-[#0a0a0a]">{stat.total}</div>
                      <div className="text-xs text-[#71717a]">전체</div>
                    </div>
                    <div className="text-center p-2 bg-[#fff7ed] rounded-md">
                      <div className="text-lg font-semibold text-[#f97316]">{stat.urgent}</div>
                      <div className="text-xs text-[#71717a]">임박</div>
                    </div>
                    <div className="text-center p-2 bg-[#fef2f2] rounded-md">
                      <div className="text-lg font-semibold text-[#ef4444]">{stat.expired}</div>
                      <div className="text-xs text-[#71717a]">만료</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#71717a]">
                    {loc.temperature != null && (
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5" />{loc.temperature}°C
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />최대 {loc.capacity}개
                    </span>
                    {hasIssue && (
                      <span className="flex items-center gap-1 text-[#ef4444] ml-auto">
                        <AlertTriangle className="w-3.5 h-3.5" />주의
                      </span>
                    )}
                  </div>

                  {loc.notes && (
                    <p className="text-xs text-[#a1a1aa] mt-2 border-t border-[#f4f4f5] pt-2">{loc.notes}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedLoc && (
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-0">
            <div className="p-6 border-b border-[#e4e4e7] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#0a0a0a]">{selectedLoc.name} 품목 목록</h2>
                <p className="text-sm text-[#71717a] mt-0.5">총 {selectedLocItems.length}개 품목</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLocation(null)}>
                <XCircle className="w-4 h-4 text-[#71717a]" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#fafafa] border-b border-[#e4e4e7]">
                  <tr>
                    {["품목명", "카테고리", "소비기한", "수량", "상태", "담당자"].map((h) => (
                      <th key={h} className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#e4e4e7]">
                  {selectedLocItems.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-sm text-[#71717a]">이 위치에 등록된 품목이 없습니다</td></tr>
                  ) : (
                    selectedLocItems.map((item) => (
                      <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-4 px-6 font-medium text-[#0a0a0a]">{item.name}</td>
                        <td className="py-4 px-6 text-sm text-[#71717a]">{item.category}</td>
                        <td className="py-4 px-6 text-sm text-[#71717a]">{item.expiryDate}</td>
                        <td className="py-4 px-6 text-sm text-[#71717a]">{item.quantity} {item.unit}</td>
                        <td className="py-4 px-6">
                          <Badge variant="outline" className={
                            item.status === "expired" ? "bg-[#fef2f2] text-[#ef4444] border-[#fca5a5]" :
                            item.status === "urgent" ? "bg-[#fff7ed] text-[#f97316] border-[#fdba74]" :
                            item.status === "warning" ? "bg-[#fffbeb] text-[#f59e0b] border-[#fcd34d]" :
                            "bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]"
                          }>
                            {item.status === "expired" ? "만료" : item.status === "urgent" ? "임박" : item.status === "warning" ? "주의" : "정상"}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#71717a]">{item.assignee}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editTarget ? "위치 수정" : "새 위치 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>위치명 *</Label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="예: 냉장고 3번" className="border-[#e4e4e7]" />
            </div>
            <div className="space-y-1.5">
              <Label>보관 유형</Label>
              <Select value={form.type} onValueChange={(v) => setField("type", v as LocationType)}>
                <SelectTrigger className="border-[#e4e4e7]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="refrigerator">냉장</SelectItem>
                  <SelectItem value="freezer">냉동</SelectItem>
                  <SelectItem value="dry">상온</SelectItem>
                  <SelectItem value="bar">바</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>온도 (°C)</Label>
                <Input type="number" value={form.temperature} onChange={(e) => setField("temperature", e.target.value)} placeholder="해당 없음" className="border-[#e4e4e7]" />
              </div>
              <div className="space-y-1.5">
                <Label>최대 수용량</Label>
                <Input type="number" value={form.capacity} onChange={(e) => setField("capacity", e.target.value)} placeholder="0" min={0} className="border-[#e4e4e7]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>메모</Label>
              <Input value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="보관 특이사항" className="border-[#e4e4e7]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#e4e4e7]">취소</Button>
            <Button onClick={handleSave} className="bg-[#10b981] hover:bg-[#059669] text-white" disabled={!form.name}>
              {editTarget ? "수정 완료" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
