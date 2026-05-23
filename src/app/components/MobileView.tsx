import { useState } from "react";
import {
  Home,
  Package,
  QrCode,
  ClipboardCheck,
  User,
  CheckCircle2,
  Trash2,
  Camera,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const mobileItems = [
  {
    id: 1,
    name: "생크림",
    category: "유제품",
    location: "냉장고 1번",
    daysLeft: 0,
    status: "expired",
  },
  {
    id: 2,
    name: "닭가슴살",
    category: "육류",
    location: "냉장고 2번",
    daysLeft: 1,
    status: "urgent",
  },
  {
    id: 3,
    name: "양상추",
    category: "채소",
    location: "냉장고 1번",
    daysLeft: 1,
    status: "urgent",
  },
];

const hygieneChecklist = [
  { id: 1, item: "냉장고 온도 확인", checked: false },
  { id: 2, item: "냉동고 온도 확인", checked: false },
  { id: 3, item: "소비기한 만료품 확인", checked: false },
  { id: 4, item: "조리도구 세척 상태", checked: false },
  { id: 5, item: "작업대 청결 확인", checked: false },
];

export function MobileView() {
  const [currentTab, setCurrentTab] = useState("home");
  const [checklist, setChecklist] = useState(hygieneChecklist);

  const toggleCheck = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#fafafa]">
      {/* Mobile Header */}
      <header className="bg-white border-b border-[#e4e4e7] px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
              <Package className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-semibold text-[#0a0a0a]">FreshGuard</span>
          </div>
          <div className="text-sm font-medium text-[#71717a]">강남점</div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {currentTab === "home" && (
          <div className="p-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-[#e4e4e7] shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-semibold text-[#ef4444] mb-1">2</div>
                  <div className="text-xs text-[#71717a]">만료</div>
                </CardContent>
              </Card>
              <Card className="border-[#e4e4e7] shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-semibold text-[#f97316] mb-1">3</div>
                  <div className="text-xs text-[#71717a]">임박</div>
                </CardContent>
              </Card>
              <Card className="border-[#e4e4e7] shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-semibold text-[#f59e0b] mb-1">5</div>
                  <div className="text-xs text-[#71717a]">주의</div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Items */}
            <Card className="border-[#e4e4e7] shadow-sm">
              <CardContent className="p-4">
                <h2 className="text-base font-semibold text-[#0a0a0a] mb-3">
                  오늘 처리 필요 품목
                </h2>
                <div className="space-y-3">
                  {mobileItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-[#e4e4e7] bg-white"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                item.status === "expired"
                                  ? "bg-[#ef4444]"
                                  : item.status === "urgent"
                                  ? "bg-[#f97316]"
                                  : "bg-[#f59e0b]"
                              }`}
                            />
                            <span className="font-medium text-[#0a0a0a]">
                              {item.name}
                            </span>
                          </div>
                          <div className="text-sm text-[#71717a]">
                            {item.category} · {item.location}
                          </div>
                          <div
                            className={`text-sm font-medium mt-1 ${
                              item.daysLeft === 0
                                ? "text-[#ef4444]"
                                : "text-[#f97316]"
                            }`}
                          >
                            {item.daysLeft === 0
                              ? "오늘 만료"
                              : `${item.daysLeft}일 남음`}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white h-9"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          사용 완료
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-[#ef4444] border-[#e4e4e7] hover:bg-[#fef2f2] h-9"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          폐기
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === "items" && (
          <div className="p-4">
            <Card className="border-[#e4e4e7] shadow-sm">
              <CardContent className="p-4">
                <h2 className="text-base font-semibold text-[#0a0a0a] mb-3">품목 목록</h2>
                <div className="space-y-2">
                  {mobileItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-[#e4e4e7] bg-white hover:border-[#a1a1aa] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-[#0a0a0a]">
                            {item.name}
                          </div>
                          <div className="text-sm text-[#71717a]">
                            {item.category}
                          </div>
                        </div>
                        <Badge
                          className={
                            item.status === "expired"
                              ? "bg-[#fef2f2] text-[#ef4444] border-[#fca5a5]"
                              : "bg-[#fff7ed] text-[#f97316] border-[#fdba74]"
                          }
                        >
                          {item.status === "expired" ? "만료" : "임박"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === "scan" && (
          <div className="p-4">
            <Card className="border-[#e4e4e7] shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-[#f4f4f5] rounded-xl flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-[#71717a]" />
                </div>
                <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2">
                  QR 코드 스캔
                </h3>
                <p className="text-sm text-[#71717a] mb-6">
                  품목의 QR 코드를 스캔하여
                  <br />
                  빠르게 정보를 확인하세요
                </p>
                <Button className="w-full bg-[#10b981] hover:bg-[#059669] text-white h-10">
                  <Camera className="w-4 h-4 mr-2" />
                  카메라 열기
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === "check" && (
          <div className="p-4">
            <Card className="border-[#e4e4e7] shadow-sm">
              <CardContent className="p-4">
                <h2 className="text-base font-semibold text-[#0a0a0a] mb-3">위생점검</h2>
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[#e4e4e7] bg-white"
                    >
                      <button
                        onClick={() => toggleCheck(item.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          item.checked
                            ? "bg-[#10b981] border-[#10b981]"
                            : "border-[#d4d4d8]"
                        }`}
                      >
                        {item.checked && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          item.checked
                            ? "text-[#a1a1aa] line-through"
                            : "text-[#0a0a0a]"
                        }`}
                      >
                        {item.item}
                      </span>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4 bg-[#10b981] hover:bg-[#059669] text-white h-10">
                  점검 완료
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === "profile" && (
          <div className="p-4">
            <Card className="border-[#e4e4e7] shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-semibold text-[#0a0a0a]">김조리</h3>
                <p className="text-sm text-[#71717a] mt-1">직원</p>
                <div className="mt-6 space-y-2 text-left">
                  <div className="p-3 rounded-lg bg-[#fafafa] border border-[#e4e4e7]">
                    <div className="text-xs text-[#71717a] mb-1">소속 매장</div>
                    <div className="font-medium text-[#0a0a0a]">강남점</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#fafafa] border border-[#e4e4e7]">
                    <div className="text-xs text-[#71717a] mb-1">담당 업무</div>
                    <div className="font-medium text-[#0a0a0a]">
                      조리 및 품목 관리
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#e4e4e7] shadow-lg">
        <div className="grid grid-cols-5">
          {[
            { id: "home", label: "홈", icon: Home },
            { id: "items", label: "품목", icon: Package },
            { id: "scan", label: "스캔", icon: QrCode },
            { id: "check", label: "점검", icon: ClipboardCheck },
            { id: "profile", label: "내 정보", icon: User },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentTab(id)}
              className={`flex flex-col items-center gap-1 py-3 transition-colors ${
                currentTab === id ? "text-[#10b981]" : "text-[#71717a]"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
