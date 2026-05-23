import { useState } from "react";
import { Package, ArrowLeft, Mail } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export function ForgotPasswordPage() {
  const { requestPasswordReset, setAuthPage } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("이메일을 입력해주세요.");
      return;
    }
    setLoading(true);
    const ok = await requestPasswordReset(email.trim());
    setLoading(false);
    if (ok) {
      setSent(true);
    } else {
      toast.error("재설정 링크 발송에 실패했습니다.");
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
            {!sent ? (
              <>
                <h1 className="text-xl font-semibold text-[#0a0a0a] mb-1">비밀번호 재설정</h1>
                <p className="text-sm text-[#71717a] mb-6">
                  가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="border-[#e4e4e7] h-10"
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#10b981] hover:bg-[#059669] text-white h-10"
                    disabled={loading}
                  >
                    {loading ? "발송 중..." : "재설정 링크 발송"}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-[#ecfdf5] flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-[#10b981]" />
                </div>
                <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">이메일을 확인해주세요</h2>
                <p className="text-sm text-[#71717a] mb-1">
                  <span className="font-medium text-[#0a0a0a]">{email}</span>으로
                </p>
                <p className="text-sm text-[#71717a] mb-6">비밀번호 재설정 링크를 발송했습니다.</p>
                <p className="text-xs text-[#a1a1aa]">
                  이메일이 도착하지 않으면 스팸 폴더를 확인하거나{" "}
                  <button onClick={() => setSent(false)} className="text-[#10b981] hover:underline">
                    다시 시도
                  </button>
                  해주세요.
                </p>
              </div>
            )}

            <button
              onClick={() => setAuthPage("login")}
              className="flex items-center gap-1.5 mt-6 text-sm text-[#71717a] hover:text-[#0a0a0a] transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              로그인으로 돌아가기
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
