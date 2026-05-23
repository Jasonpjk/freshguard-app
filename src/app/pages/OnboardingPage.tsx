import { useState } from "react";
import { Package, Check, ChevronRight, Store, Users, MapPin, Database } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { BusinessType, OnboardingData } from "../context/AuthContext";

const BUSINESS_TYPES: { value: BusinessType; label: string; emoji: string }[] = [
  { value: "restaurant", label: "식당", emoji: "🍽️" },
  { value: "cafe", label: "카페", emoji: "☕" },
  { value: "bakery", label: "베이커리", emoji: "🥖" },
  { value: "catering", label: "급식/위탁운영", emoji: "🥗" },
  { value: "franchise", label: "프랜차이즈", emoji: "🏪" },
  { value: "other", label: "기타", emoji: "📦" },
];

const STAFF_COUNT_OPTIONS = ["1명", "2~5명", "6~10명", "11~30명", "30명 이상"];

const STEPS = [
  { id: 1, label: "사업자 정보", icon: Store },
  { id: 2, label: "매장 설정", icon: MapPin },
  { id: 3, label: "초기 데이터", icon: Database },
];

export function OnboardingPage() {
  const { completeOnboarding, user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OnboardingData>({
    orgName: "",
    storeName: "",
    businessType: "restaurant",
    staffCount: "2~5명",
    createDefaultLocations: true,
    useSampleData: true,
  });

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNext() {
    if (step === 1 && !form.orgName.trim()) {
      toast.error("회사/사업자명을 입력해주세요.");
      return;
    }
    if (step === 2 && !form.storeName.trim()) {
      toast.error("매장명을 입력해주세요.");
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  }

  function handleComplete() {
    if (!form.orgName.trim() || !form.storeName.trim()) {
      toast.error("필수 정보를 입력해주세요.");
      return;
    }
    completeOnboarding(form);
    toast.success("설정이 완료되었습니다. FreshGuard에 오신 것을 환영합니다!");
  }

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <Toaster />
      <div className="w-full max-w-[520px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-md">
              <Package className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-[#0a0a0a]">FreshGuard</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0a0a0a] mb-1">시작 설정</h1>
          <p className="text-sm text-[#71717a]">
            {user?.name ?? ""}님, 안녕하세요! 몇 가지 정보를 입력하면 바로 시작할 수 있어요.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 px-4">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isDone = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all ${
                    isDone ? "bg-[#10b981] text-white" : isActive ? "bg-[#10b981] text-white ring-4 ring-[#d1fae5]" : "bg-[#f4f4f5] text-[#a1a1aa]"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" strokeWidth={2.5} /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${isActive ? "text-[#0a0a0a]" : "text-[#a1a1aa]"}`}>
                  {s.label}
                </span>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? "bg-[#10b981]" : "bg-[#e4e4e7]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#e4e4e7] rounded-full h-1 mb-6">
          <div
            className="bg-[#10b981] h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-7">
            {/* Step 1: 사업자 정보 */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#0a0a0a] mb-1">사업자 정보</h2>
                  <p className="text-sm text-[#71717a]">운영하시는 회사 또는 사업장 정보를 입력해주세요.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>회사/사업자명 <span className="text-[#ef4444]">*</span></Label>
                  <Input
                    value={form.orgName}
                    onChange={(e) => update("orgName", e.target.value)}
                    placeholder="예) 홍길동 식당, 행복 프랜차이즈"
                    className="border-[#e4e4e7] h-10"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>직원 수</Label>
                  <div className="flex flex-wrap gap-2">
                    {STAFF_COUNT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => update("staffCount", opt)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                          form.staffCount === opt
                            ? "bg-[#10b981] border-[#10b981] text-white"
                            : "border-[#e4e4e7] text-[#52525b] hover:border-[#a1a1aa]"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: 매장 설정 */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#0a0a0a] mb-1">매장 설정</h2>
                  <p className="text-sm text-[#71717a]">첫 번째 매장 정보를 설정합니다.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>매장명 <span className="text-[#ef4444]">*</span></Label>
                  <Input
                    value={form.storeName}
                    onChange={(e) => update("storeName", e.target.value)}
                    placeholder="예) 강남점, 본점"
                    className="border-[#e4e4e7] h-10"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>업종</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {BUSINESS_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => update("businessType", t.value)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          form.businessType === t.value
                            ? "border-[#10b981] bg-[#ecfdf5] ring-1 ring-[#10b981]"
                            : "border-[#e4e4e7] hover:border-[#a1a1aa]"
                        }`}
                      >
                        <div className="text-xl mb-1">{t.emoji}</div>
                        <div className="text-xs font-medium text-[#0a0a0a]">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: 초기 데이터 */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#0a0a0a] mb-1">초기 데이터 설정</h2>
                  <p className="text-sm text-[#71717a]">빠른 시작을 위한 기본 데이터를 설정합니다.</p>
                </div>
                {[
                  {
                    key: "createDefaultLocations" as const,
                    title: "기본 보관 위치 자동 생성",
                    desc: "냉장고 1번, 냉동고, 건식 창고 등 일반적인 위치를 미리 만들어드립니다.",
                    icon: MapPin,
                  },
                  {
                    key: "useSampleData" as const,
                    title: "샘플 데이터 사용",
                    desc: "식품 관리 흐름을 빠르게 파악할 수 있는 샘플 품목이 등록됩니다.",
                    icon: Database,
                  },
                ].map(({ key, title, desc, icon: Icon }) => (
                  <div
                    key={key}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      form[key] ? "border-[#10b981] bg-[#ecfdf5]" : "border-[#e4e4e7] hover:border-[#a1a1aa]"
                    }`}
                    onClick={() => update(key, !form[key])}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${form[key] ? "bg-[#10b981]" : "bg-[#f4f4f5]"}`}>
                        <Icon className={`w-4 h-4 ${form[key] ? "text-white" : "text-[#71717a]"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-[#0a0a0a]">{title}</p>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${form[key] ? "bg-[#10b981] border-[#10b981]" : "border-[#d4d4d8]"}`}>
                            {form[key] && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>
                        </div>
                        <p className="text-xs text-[#71717a] mt-0.5">{desc}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Summary */}
                <div className="p-4 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7]">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-[#71717a]" />
                    <span className="text-sm font-medium text-[#0a0a0a]">설정 요약</span>
                  </div>
                  <div className="space-y-1 text-xs text-[#52525b]">
                    <div className="flex gap-2"><span className="text-[#a1a1aa] w-16">조직명</span><span className="font-medium">{form.orgName || "-"}</span></div>
                    <div className="flex gap-2"><span className="text-[#a1a1aa] w-16">매장명</span><span className="font-medium">{form.storeName || "-"}</span></div>
                    <div className="flex gap-2"><span className="text-[#a1a1aa] w-16">업종</span><span className="font-medium">{BUSINESS_TYPES.find((t) => t.value === form.businessType)?.label}</span></div>
                    <div className="flex gap-2"><span className="text-[#a1a1aa] w-16">직원 수</span><span className="font-medium">{form.staffCount}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <Button
                  variant="outline"
                  className="border-[#e4e4e7] flex-1"
                  onClick={() => setStep((s) => s - 1)}
                >
                  이전
                </Button>
              )}
              {step < 3 ? (
                <Button
                  className="bg-[#10b981] hover:bg-[#059669] text-white flex-1"
                  onClick={handleNext}
                >
                  다음 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  className="bg-[#10b981] hover:bg-[#059669] text-white flex-1"
                  onClick={handleComplete}
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  설정 완료 및 시작하기
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
