import { useState } from "react";
import { Package, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login, setAuthPage } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "로그인에 실패했습니다.");
    }
  }

  async function handleDemo() {
    setLoading(true);
    const result = await login("demo@freshguard.app", "demo1234");
    setLoading(false);
    if (!result.success) {
      toast.error("데모 로그인에 실패했습니다.");
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <Toaster />
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-md">
            <Package className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold text-[#0a0a0a] tracking-tight">FreshGuard</span>
        </div>

        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-7">
            <h1 className="text-xl font-semibold text-[#0a0a0a] mb-1">로그인</h1>
            <p className="text-sm text-[#71717a] mb-6">계정에 로그인하세요</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="border-[#e4e4e7] h-10"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">비밀번호</Label>
                  <button
                    type="button"
                    onClick={() => setAuthPage("forgot")}
                    className="text-xs text-[#10b981] hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="border-[#e4e4e7] h-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#71717a]"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white h-10 mt-2"
                disabled={loading}
              >
                {loading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e4e4e7]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-[#a1a1aa]">또는</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-[#e4e4e7] h-10 text-[#52525b] hover:bg-[#f4f4f5]"
              onClick={handleDemo}
              disabled={loading}
            >
              <span className="mr-2">🎯</span>
              데모 계정으로 시작하기
            </Button>

            <p className="text-center text-sm text-[#71717a] mt-6">
              계정이 없으신가요?{" "}
              <button
                onClick={() => setAuthPage("signup")}
                className="text-[#10b981] font-medium hover:underline"
              >
                회원가입
              </button>
            </p>
          </CardContent>
        </Card>

        {/* Demo hint */}
        <div className="mt-4 p-3 rounded-lg border border-[#e4e4e7] bg-white">
          <p className="text-xs text-[#71717a] font-medium mb-1">데모 계정 안내</p>
          <div className="space-y-1 text-xs text-[#a1a1aa]">
            <div className="flex gap-2"><span className="text-[#10b981] font-medium w-14">점주</span><span>demo@freshguard.app / demo1234</span></div>
            <div className="flex gap-2"><span className="text-[#3b82f6] font-medium w-14">매니저</span><span>manager@freshguard.app / demo1234</span></div>
            <div className="flex gap-2"><span className="text-[#f97316] font-medium w-14">직원</span><span>staff@freshguard.app / demo1234</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
