import { useState } from "react";
import { Check, CreditCard, Zap, Building2, Star } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner";

type PlanId = "free" | "basic" | "pro" | "franchise";

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  unit: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  color: string;
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    unit: "월",
    description: "소규모 1인 매장을 위한 기본 기능",
    features: [
      "품목 관리 (최대 50개)",
      "소비기한 알림",
      "기본 대시보드",
      "1명 사용자",
    ],
    icon: Star,
    color: "text-[#71717a]",
  },
  {
    id: "basic",
    name: "Basic",
    price: 19900,
    unit: "월",
    description: "일반 식당/카페를 위한 핵심 기능",
    features: [
      "품목 관리 (최대 300개)",
      "소비기한 알림 (카카오톡 연동)",
      "폐기 기록 관리",
      "소비기한 캘린더",
      "직원 최대 3명",
      "CSV 다운로드",
    ],
    icon: Zap,
    color: "text-[#3b82f6]",
  },
  {
    id: "pro",
    name: "Pro",
    price: 49900,
    unit: "월",
    description: "체인점/프랜차이즈 단일 매장 완전 기능",
    features: [
      "품목 관리 무제한",
      "실시간 알림 (앱 푸시 포함)",
      "리포트 & 분석",
      "위생점검 관리",
      "보관 위치 관리",
      "직원 무제한",
      "API 연동",
      "우선 지원",
    ],
    icon: CreditCard,
    color: "text-[#10b981]",
    recommended: true,
  },
  {
    id: "franchise",
    name: "Franchise",
    price: 149900,
    unit: "월",
    description: "다점포 운영 본사를 위한 엔터프라이즈",
    features: [
      "Pro 모든 기능 포함",
      "다매장 통합 관리",
      "본사 대시보드",
      "직원/권한 중앙 관리",
      "브랜드 커스터마이징",
      "전담 CS 매니저",
      "SLA 99.9% 보장",
    ],
    icon: Building2,
    color: "text-[#a855f7]",
  },
];

const NEXT_BILLING = "2026-06-23";
const PAYMENT_METHOD = { type: "card", last4: "4242", brand: "Visa" };

export function Subscription() {
  const [currentPlan, setCurrentPlan] = useState<PlanId>("pro");
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);

  function handleChangePlan(planId: PlanId) {
    if (planId === currentPlan) return;
    setPendingPlan(planId);
  }

  function confirmChange() {
    if (!pendingPlan) return;
    const plan = PLANS.find((p) => p.id === pendingPlan);
    setCurrentPlan(pendingPlan);
    setPendingPlan(null);
    toast.success(`${plan?.name} 요금제로 변경되었습니다.`);
  }

  const currentPlanInfo = PLANS.find((p) => p.id === currentPlan)!;

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <Toaster />
      <div>
        <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">구독/결제</h1>
        <p className="text-sm text-[#71717a]">요금제와 결제 정보를 관리합니다</p>
      </div>

      {/* Current Plan */}
      <Card className="border-[#10b981] shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#71717a] mb-1">현재 요금제</p>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-[#0a0a0a]">{currentPlanInfo.name}</h2>
                <Badge className="bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]">현재 사용 중</Badge>
              </div>
              <p className="text-sm text-[#71717a] mt-1">{currentPlanInfo.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#0a0a0a]">
                {currentPlanInfo.price === 0 ? "무료" : `₩${currentPlanInfo.price.toLocaleString()}`}
                {currentPlanInfo.price > 0 && <span className="text-base font-normal text-[#71717a]">/{currentPlanInfo.unit}</span>}
              </div>
              {currentPlanInfo.price > 0 && (
                <p className="text-sm text-[#71717a] mt-1">다음 결제: {NEXT_BILLING}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-[#0a0a0a] mb-4">요금제 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isActive = plan.id === currentPlan;
            const isPending = plan.id === pendingPlan;
            return (
              <Card
                key={plan.id}
                className={`border-[#e4e4e7] shadow-sm transition-all relative ${
                  isActive ? "border-[#10b981] ring-2 ring-[#10b981]" :
                  isPending ? "border-[#3b82f6] ring-2 ring-[#3b82f6]" :
                  "hover:shadow-md hover:border-[#a1a1aa]"
                }`}
              >
                {plan.recommended && !isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#10b981] text-white border-0 shadow-sm">추천</Badge>
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-5 h-5 ${plan.color}`} />
                    <h3 className="font-bold text-[#0a0a0a]">{plan.name}</h3>
                  </div>
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-[#0a0a0a]">
                      {plan.price === 0 ? "무료" : `₩${(plan.price / 1000).toFixed(0)}K`}
                    </span>
                    {plan.price > 0 && <span className="text-sm text-[#71717a]">/{plan.unit}</span>}
                  </div>
                  <p className="text-xs text-[#71717a] mb-4">{plan.description}</p>
                  <ul className="space-y-2 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-[#52525b]">
                        <Check className="w-3.5 h-3.5 text-[#10b981] mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isActive ? (
                    <Button disabled className="w-full bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]">
                      현재 요금제
                    </Button>
                  ) : isPending ? (
                    <Button onClick={confirmChange} className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white">
                      변경 확인
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full border-[#e4e4e7] hover:bg-[#f4f4f5]"
                      onClick={() => handleChangePlan(plan.id)}
                    >
                      {currentPlan === "free" || PLANS.findIndex((p) => p.id === plan.id) > PLANS.findIndex((p) => p.id === currentPlan) ? "업그레이드" : "다운그레이드"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator className="bg-[#e4e4e7]" />

      {/* Payment Method */}
      <div>
        <h2 className="text-lg font-semibold text-[#0a0a0a] mb-4">결제 수단</h2>
        <Card className="border-[#e4e4e7] shadow-sm max-w-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 bg-[#1a1f71] rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-bold">VISA</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0a0a0a]">{PAYMENT_METHOD.brand} •••• {PAYMENT_METHOD.last4}</p>
                  <p className="text-xs text-[#71717a]">만료: 12/27</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]">기본</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-[#e4e4e7]" onClick={() => toast.info("결제 수단 변경 기능은 준비 중입니다.")}>
                카드 변경
              </Button>
              <Button variant="outline" size="sm" className="border-[#e4e4e7]" onClick={() => toast.info("결제 수단 추가 기능은 준비 중입니다.")}>
                카드 추가
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Info */}
      {currentPlanInfo.price > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#0a0a0a] mb-4">결제 정보</h2>
          <Card className="border-[#e4e4e7] shadow-sm max-w-md">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#71717a]">다음 결제일</span>
                <span className="font-medium text-[#0a0a0a]">{NEXT_BILLING}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#71717a]">결제 금액</span>
                <span className="font-medium text-[#0a0a0a]">₩{currentPlanInfo.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#71717a]">결제 수단</span>
                <span className="font-medium text-[#0a0a0a]">{PAYMENT_METHOD.brand} •••• {PAYMENT_METHOD.last4}</span>
              </div>
              <Separator className="bg-[#e4e4e7]" />
              <Button variant="outline" size="sm" className="border-[#fca5a5] text-[#ef4444] hover:bg-[#fef2f2] w-full" onClick={() => toast.info("구독 취소는 고객센터로 문의해주세요.")}>
                구독 취소
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
