import { useState } from "react";
import { Save, RotateCcw, Store, Bell, Tag, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";

const CATEGORIES_DEFAULT = ["유제품", "육류", "채소", "소스", "수산물", "난류", "건식류", "냉동식품"];

export function AppSettings() {
  const { settings, updateSettings, resetData } = useApp();
  const [categories, setCategories] = useState<string[]>(CATEGORIES_DEFAULT);
  const [newCategory, setNewCategory] = useState("");

  function handleSaveStore() {
    toast.success("매장 정보가 저장되었습니다.");
  }

  function handleSaveNotify() {
    toast.success("알림 설정이 저장되었습니다.");
  }

  function handleSaveThreshold() {
    toast.success("알림 기준이 저장되었습니다.");
  }

  function handleAddCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories((prev) => [...prev, trimmed]);
    setNewCategory("");
  }

  function handleDeleteCategory(cat: string) {
    setCategories((prev) => prev.filter((c) => c !== cat));
  }

  function handleReset() {
    if (confirm("모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      resetData();
      toast.success("데이터가 초기화되었습니다.");
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-[900px] mx-auto">
      <Toaster />
      <div>
        <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">설정</h1>
        <p className="text-sm text-[#71717a]">앱 설정과 매장 정보를 관리합니다</p>
      </div>

      {/* 매장 정보 */}
      <Card className="border-[#e4e4e7] shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-[#ecfdf5]">
              <Store className="w-4 h-4 text-[#10b981]" />
            </div>
            <h2 className="text-lg font-semibold text-[#0a0a0a]">매장 정보</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>매장명</Label>
                <Input
                  value={settings.storeName}
                  onChange={(e) => updateSettings({ storeName: e.target.value })}
                  className="border-[#e4e4e7]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>점주 이름</Label>
                <Input
                  value={settings.ownerName}
                  onChange={(e) => updateSettings({ ownerName: e.target.value })}
                  className="border-[#e4e4e7]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>매장 주소</Label>
              <Input
                value={settings.storeAddress}
                onChange={(e) => updateSettings({ storeAddress: e.target.value })}
                className="border-[#e4e4e7]"
              />
            </div>
            <Button onClick={handleSaveStore} className="bg-[#10b981] hover:bg-[#059669] text-white">
              <Save className="w-4 h-4 mr-2" />저장
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card className="border-[#e4e4e7] shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-[#fffbeb]">
              <Bell className="w-4 h-4 text-[#f59e0b]" />
            </div>
            <h2 className="text-lg font-semibold text-[#0a0a0a]">알림 설정</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: "notifyExpired" as const, label: "만료 품목 알림", desc: "소비기한이 지난 품목이 있을 때 알림을 받습니다" },
              { key: "notifyUrgent" as const, label: "임박 품목 알림", desc: "소비기한이 1일 이내인 품목이 있을 때 알림을 받습니다" },
              { key: "notifyWarning" as const, label: "주의 품목 알림", desc: "소비기한이 3일 이내인 품목이 있을 때 알림을 받습니다" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-[#fafafa] border border-[#e4e4e7]">
                <div>
                  <p className="text-sm font-medium text-[#0a0a0a]">{label}</p>
                  <p className="text-xs text-[#71717a] mt-0.5">{desc}</p>
                </div>
                <Switch
                  checked={settings[key]}
                  onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                />
              </div>
            ))}
            <Button onClick={handleSaveNotify} className="bg-[#10b981] hover:bg-[#059669] text-white">
              <Save className="w-4 h-4 mr-2" />저장
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 소비기한 알림 기준 */}
      <Card className="border-[#e4e4e7] shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-[#fff7ed]">
              <Clock className="w-4 h-4 text-[#f97316]" />
            </div>
            <h2 className="text-lg font-semibold text-[#0a0a0a]">소비기한 알림 기준</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>임박 기준 (일)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={settings.urgentDays}
                  onChange={(e) => updateSettings({ urgentDays: Number(e.target.value) })}
                  min={1}
                  max={7}
                  className="border-[#e4e4e7]"
                />
                <span className="text-sm text-[#71717a] whitespace-nowrap">일 이내</span>
              </div>
              <p className="text-xs text-[#a1a1aa]">현재: D-{settings.urgentDays} 이내 = 임박</p>
            </div>
            <div className="space-y-1.5">
              <Label>주의 기준 (일)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={settings.warningDays}
                  onChange={(e) => updateSettings({ warningDays: Number(e.target.value) })}
                  min={1}
                  max={14}
                  className="border-[#e4e4e7]"
                />
                <span className="text-sm text-[#71717a] whitespace-nowrap">일 이내</span>
              </div>
              <p className="text-xs text-[#a1a1aa]">현재: D-{settings.warningDays} 이내 = 주의</p>
            </div>
            <div className="space-y-1.5">
              <Label>개봉 후 기본 유효기간 (일)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={settings.defaultOpenUseDays}
                  onChange={(e) => updateSettings({ defaultOpenUseDays: Number(e.target.value) })}
                  min={1}
                  max={30}
                  className="border-[#e4e4e7]"
                />
                <span className="text-sm text-[#71717a] whitespace-nowrap">일</span>
              </div>
            </div>
          </div>
          <Button onClick={handleSaveThreshold} className="mt-4 bg-[#10b981] hover:bg-[#059669] text-white">
            <Save className="w-4 h-4 mr-2" />저장
          </Button>
        </CardContent>
      </Card>

      {/* 카테고리 관리 */}
      <Card className="border-[#e4e4e7] shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-[#eff6ff]">
              <Tag className="w-4 h-4 text-[#3b82f6]" />
            </div>
            <h2 className="text-lg font-semibold text-[#0a0a0a]">카테고리 관리</h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <span key={cat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4f4f5] text-sm text-[#52525b]">
                {cat}
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="text-[#a1a1aa] hover:text-[#ef4444] transition-colors ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="새 카테고리 이름"
              className="border-[#e4e4e7] max-w-[200px]"
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <Button variant="outline" onClick={handleAddCategory} className="border-[#e4e4e7]">추가</Button>
          </div>
        </CardContent>
      </Card>

      {/* 데이터 초기화 */}
      <Card className="border-[#fca5a5] shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-[#fef2f2]">
              <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
            </div>
            <h2 className="text-lg font-semibold text-[#0a0a0a]">데이터 초기화</h2>
          </div>
          <p className="text-sm text-[#71717a] mb-4">
            모든 품목, 폐기 기록, 설정을 초기 샘플 데이터로 되돌립니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <Button variant="outline" className="border-[#fca5a5] text-[#ef4444] hover:bg-[#fef2f2]" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />전체 데이터 초기화
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
