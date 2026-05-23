import { useState, useMemo } from "react";
import { CheckCircle2, Circle, Camera, FileText, RotateCcw, ClipboardCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner";

interface CheckItem {
  id: number;
  category: string;
  label: string;
  checked: boolean;
  memo: string;
  required: boolean;
}

const INITIAL_CHECKLIST: CheckItem[] = [
  { id: 1, category: "온도관리", label: "냉장고 온도 확인 (0~10°C)", checked: false, memo: "", required: true },
  { id: 2, category: "온도관리", label: "냉동고 온도 확인 (-18°C 이하)", checked: false, memo: "", required: true },
  { id: 3, category: "품목관리", label: "소비기한 만료품 확인 및 처리", checked: false, memo: "", required: true },
  { id: 4, category: "품목관리", label: "폐기 대상 처리 확인", checked: false, memo: "", required: true },
  { id: 5, category: "위생", label: "조리도구 세척 상태 확인", checked: false, memo: "", required: true },
  { id: 6, category: "위생", label: "작업대 청결 확인", checked: false, memo: "", required: true },
  { id: 7, category: "위생", label: "직원 위생 상태 확인 (복장, 손 씻기)", checked: false, memo: "", required: false },
  { id: 8, category: "방역", label: "해충 흔적 확인", checked: false, memo: "", required: false },
];

interface HistoryEntry {
  date: string;
  completed: number;
  total: number;
  completedBy: string;
}

const SAMPLE_HISTORY: HistoryEntry[] = [
  { date: "2026-05-22", completed: 8, total: 8, completedBy: "이주방" },
  { date: "2026-05-21", completed: 7, total: 8, completedBy: "김조리" },
  { date: "2026-05-20", completed: 8, total: 8, completedBy: "박직원" },
  { date: "2026-05-19", completed: 6, total: 8, completedBy: "이주방" },
  { date: "2026-05-18", completed: 8, total: 8, completedBy: "김조리" },
];

const CATEGORIES = ["전체", "온도관리", "품목관리", "위생", "방역"];

export function HygieneCheck() {
  const [checklist, setChecklist] = useState<CheckItem[]>(INITIAL_CHECKLIST);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [editingMemo, setEditingMemo] = useState<number | null>(null);
  const [history] = useState<HistoryEntry[]>(SAMPLE_HISTORY);
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  const filtered = useMemo(() =>
    activeCategory === "전체" ? checklist : checklist.filter((c) => c.category === activeCategory),
    [checklist, activeCategory]
  );

  const stats = useMemo(() => {
    const total = checklist.length;
    const done = checklist.filter((c) => c.checked).length;
    const required = checklist.filter((c) => c.required).length;
    const requiredDone = checklist.filter((c) => c.required && c.checked).length;
    return { total, done, required, requiredDone };
  }, [checklist]);

  const overallStatus = useMemo(() => {
    if (stats.done === stats.total) return "completed";
    if (stats.requiredDone === stats.required && stats.done > 0) return "partial";
    if (stats.done > 0) return "partial";
    return "none";
  }, [stats]);

  function toggle(id: number) {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)));
  }

  function setMemo(id: number, memo: string) {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, memo } : c)));
  }

  function reset() {
    setChecklist(INITIAL_CHECKLIST);
    toast.info("점검 항목이 초기화되었습니다.");
  }

  function completeCheck() {
    if (stats.requiredDone < stats.required) {
      toast.error("필수 항목을 모두 완료해주세요.");
      return;
    }
    toast.success(`점검 완료! ${stats.done}/${stats.total}개 항목이 확인되었습니다.`);
    setChecklist((prev) => prev.map((c) => ({ ...c, checked: true })));
  }

  const statusConfig = {
    completed: { label: "점검 완료", className: "bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]" },
    partial: { label: "일부 완료", className: "bg-[#fffbeb] text-[#f59e0b] border-[#fcd34d]" },
    none: { label: "미완료", className: "bg-[#fef2f2] text-[#ef4444] border-[#fca5a5]" },
  };

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <Toaster />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">위생점검</h1>
          <p className="text-sm text-[#71717a]">{today} 일일 위생점검</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-[#e4e4e7] h-9" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-2" />초기화
          </Button>
          <Button
            size="sm"
            className="bg-[#10b981] hover:bg-[#059669] text-white h-9"
            onClick={completeCheck}
            disabled={overallStatus === "completed"}
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            {overallStatus === "completed" ? "점검 완료됨" : "점검 완료"}
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-[#71717a] mb-2">오늘 점검 상태</p>
            <Badge variant="outline" className={`${statusConfig[overallStatus].className} text-sm px-3 py-1`}>
              {statusConfig[overallStatus].label}
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-[#71717a] mb-2">전체 완료율</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-[#0a0a0a]">
                {stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%
              </span>
              <span className="text-sm text-[#71717a]">({stats.done}/{stats.total})</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-[#71717a] mb-2">필수 항목 완료</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-semibold ${stats.requiredDone === stats.required ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                {stats.requiredDone}/{stats.required}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-[#71717a] mb-2">이번 달 준수율</p>
            <span className="text-2xl font-semibold text-[#10b981]">
              {Math.round((history.reduce((s, h) => s + h.completed / h.total, 0) / history.length) * 100)}%
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklist */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-[#10b981] text-white"
                    : "bg-white border border-[#e4e4e7] text-[#52525b] hover:bg-[#f4f4f5]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Card className="border-[#e4e4e7] shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-[#e4e4e7]">
                {filtered.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-[#fafafa] transition-colors">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggle(item.id)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {item.checked ? (
                          <CheckCircle2 className="w-5 h-5 text-[#10b981]" strokeWidth={2} />
                        ) : (
                          <Circle className="w-5 h-5 text-[#d4d4d8]" strokeWidth={2} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium ${item.checked ? "line-through text-[#a1a1aa]" : "text-[#0a0a0a]"}`}>
                            {item.label}
                          </span>
                          {item.required && (
                            <Badge variant="outline" className="bg-[#fef2f2] text-[#ef4444] border-[#fca5a5] text-xs px-1.5 py-0">필수</Badge>
                          )}
                          <Badge variant="outline" className="text-xs text-[#71717a] border-[#e4e4e7] px-1.5 py-0">{item.category}</Badge>
                        </div>

                        {editingMemo === item.id ? (
                          <div className="mt-2 flex gap-2">
                            <Input
                              value={item.memo}
                              onChange={(e) => setMemo(item.id, e.target.value)}
                              placeholder="메모 입력..."
                              className="h-8 text-xs border-[#e4e4e7]"
                              autoFocus
                              onBlur={() => setEditingMemo(null)}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 mt-1.5">
                            <button
                              className="text-xs text-[#a1a1aa] hover:text-[#71717a] flex items-center gap-1"
                              onClick={() => setEditingMemo(item.id)}
                            >
                              <FileText className="w-3 h-3" />
                              {item.memo || "메모 추가"}
                            </button>
                            <button className="text-xs text-[#a1a1aa] hover:text-[#71717a] flex items-center gap-1">
                              <Camera className="w-3 h-3" />사진 첨부
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#0a0a0a]">최근 점검 이력</h2>
          <div className="space-y-3">
            {history.map((h, i) => {
              const rate = Math.round((h.completed / h.total) * 100);
              return (
                <Card key={i} className="border-[#e4e4e7] shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#0a0a0a]">{h.date}</span>
                      <Badge
                        variant="outline"
                        className={rate === 100 ? "bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]" : "bg-[#fffbeb] text-[#f59e0b] border-[#fcd34d]"}
                      >
                        {rate}%
                      </Badge>
                    </div>
                    <div className="w-full bg-[#f4f4f5] rounded-full h-1.5 mb-2">
                      <div
                        className={`h-1.5 rounded-full ${rate === 100 ? "bg-[#10b981]" : "bg-[#f59e0b]"}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#71717a]">
                      <span>{h.completed}/{h.total}개 완료</span>
                      <span>{h.completedBy}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {stats.requiredDone < stats.required && (
            <Card className="border-[#fca5a5] bg-[#fef2f2] shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#ef4444] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#ef4444]">
                    필수 점검 항목 {stats.required - stats.requiredDone}개가 남아 있습니다. 완료 후 점검을 마무리해주세요.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
