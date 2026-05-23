import { useState } from "react";
import { Package, Eye, EyeOff, Check } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { OrgType } from "../services/authService";

const ORG_TYPES: { value: OrgType; label: string; desc: string }[] = [
  { value: "individual", label: "개인사업자", desc: "단일 매장 운영" },
  { value: "franchise_hq", label: "프랜차이즈 본사", desc: "다점포 총괄 운영" },
  { value: "management_company", label: "위탁운영사", desc: "외부 위탁 관리" },
];

export function SignupPage() {
  const { signup, setAuthPage } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    orgType: "individual" as OrgType,
    agreeTerms: false,
    agreePrivacy: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string | boolean | OrgType) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("모든 필수 항목을 입력해주세요.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (!form.agreeTerms || !form.agreePrivacy) {
      toast.error("약관에 동의해주세요.");
      return;
    }
    setLoading(true);
    const result = await signup({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      orgType: form.orgType,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "회원가입에 실패했습니다.");
    }
    // On success, AuthContext sets isAuthenticated = true, isOnboardingCompleted = false
    // → App will render OnboardingPage automatically
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <Toaster />
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-md">
            <Package className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold text-[#0a0a0a] tracking-tight">FreshGuard</span>
        </div>

        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-7">
            <h1 className="text-xl font-semibold text-[#0a0a0a] mb-1">회원가입</h1>
            <p className="text-sm text-[#71717a] mb-6">무료로 시작하세요. 카드 불필요.</p>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label>이름 <span className="text-[#ef4444]">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="홍길동"
                  className="border-[#e4e4e7] h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>이메일 <span className="text-[#ef4444]">*</span></Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="example@email.com"
                  className="border-[#e4e4e7] h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>비밀번호 <span className="text-[#ef4444]">*</span></Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="6자 이상"
                    className="border-[#e4e4e7] h-10 pr-10"
                  />
                  <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>비밀번호 확인 <span className="text-[#ef4444]">*</span></Label>
                <Input
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(e) => update("passwordConfirm", e.target.value)}
                  placeholder="비밀번호 재입력"
                  className="border-[#e4e4e7] h-10"
                />
              </div>

              {/* Org type */}
              <div className="space-y-2">
                <Label>사업자 유형 <span className="text-[#ef4444]">*</span></Label>
                <div className="grid grid-cols-3 gap-2">
                  {ORG_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => update("orgType", t.value)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        form.orgType === t.value
                          ? "border-[#10b981] bg-[#ecfdf5] ring-1 ring-[#10b981]"
                          : "border-[#e4e4e7] hover:border-[#a1a1aa]"
                      }`}
                    >
                      <div className="text-xs font-semibold text-[#0a0a0a] mb-0.5">{t.label}</div>
                      <div className="text-[10px] text-[#71717a]">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Agreements */}
              <div className="space-y-2 pt-1">
                {[
                  { key: "agreeTerms" as const, label: "이용약관에 동의합니다", required: true },
                  { key: "agreePrivacy" as const, label: "개인정보 처리방침에 동의합니다", required: true },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => update(key, !form[key])}
                      className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        form[key] ? "bg-[#10b981] border-[#10b981]" : "border-[#d4d4d8]"
                      }`}
                    >
                      {form[key] && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </button>
                    <span className="text-sm text-[#52525b]">{label} <span className="text-[#ef4444]">*</span></span>
                  </label>
                ))}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white h-10 mt-1"
                disabled={loading}
              >
                {loading ? "처리 중..." : "회원가입"}
              </Button>
            </form>

            <p className="text-center text-sm text-[#71717a] mt-5">
              이미 계정이 있으신가요?{" "}
              <button onClick={() => setAuthPage("login")} className="text-[#10b981] font-medium hover:underline">
                로그인
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
