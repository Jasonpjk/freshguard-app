import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const calendarData = {
  "2026-05-23": { expired: 2, urgent: 3, warning: 1 },
  "2026-05-24": { expired: 0, urgent: 2, warning: 2 },
  "2026-05-25": { expired: 0, urgent: 1, warning: 3 },
  "2026-05-26": { expired: 0, urgent: 0, warning: 2 },
  "2026-05-27": { expired: 0, urgent: 0, warning: 1 },
  "2026-05-28": { expired: 0, urgent: 0, warning: 3 },
  "2026-05-30": { expired: 0, urgent: 0, warning: 1 },
  "2026-05-31": { expired: 0, urgent: 0, warning: 2 },
  "2026-06-01": { expired: 0, urgent: 0, warning: 1 },
};

const selectedDateItems = [
  { name: "생크림", category: "유제품", location: "냉장고 1번", status: "expired" },
  { name: "닭가슴살", category: "육류", location: "냉장고 2번", status: "urgent" },
  { name: "양상추", category: "채소", location: "냉장고 1번", status: "urgent" },
  { name: "토마토소스", category: "소스", location: "건식 창고", status: "warning" },
];

export function ExpiryCalendar() {
  const [currentMonth] = useState(new Date("2026-05-23"));
  const [selectedDate, setSelectedDate] = useState("2026-05-23");

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${month}-${dayStr}`;
  };

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">
          소비기한 캘린더
        </h1>
        <p className="text-sm text-[#71717a]">
          월간 품목 만료 일정을 확인하세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#0a0a0a]">
                {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-[#e4e4e7]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-[#e4e4e7]"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <div
                  key={day}
                  className="text-center py-2 text-xs font-medium text-[#71717a]"
                >
                  {day}
                </div>
              ))}
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}
              {days.map((day) => {
                const dateStr = formatDate(day);
                const data = calendarData[dateStr as keyof typeof calendarData];
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === "2026-05-23";

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square p-2 rounded-lg border transition-all ${
                      isSelected
                        ? "border-[#10b981] bg-[#ecfdf5] ring-2 ring-[#10b981] ring-offset-1"
                        : isToday
                        ? "border-[#3b82f6] bg-[#eff6ff]"
                        : "border-[#e4e4e7] hover:border-[#a1a1aa] hover:bg-[#fafafa]"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span
                        className={`text-sm font-medium ${
                          isSelected
                            ? "text-[#10b981]"
                            : isToday
                            ? "text-[#3b82f6]"
                            : "text-[#0a0a0a]"
                        }`}
                      >
                        {day}
                      </span>
                      {data && (
                        <div className="flex gap-0.5 mt-1">
                          {data.expired > 0 && (
                            <div className="w-1 h-1 rounded-full bg-[#ef4444]" />
                          )}
                          {data.urgent > 0 && (
                            <div className="w-1 h-1 rounded-full bg-[#f97316]" />
                          )}
                          {data.warning > 0 && (
                            <div className="w-1 h-1 rounded-full bg-[#f59e0b]" />
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-[#e4e4e7]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                <span className="text-xs text-[#71717a]">만료</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f97316]" />
                <span className="text-xs text-[#71717a]">임박</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                <span className="text-xs text-[#71717a]">주의</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0a0a0a] mb-4">
              {new Date(selectedDate).toLocaleDateString("ko-KR", {
                month: "long",
                day: "numeric",
              })}
            </h3>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className="bg-[#fef2f2] text-[#ef4444] border-[#fca5a5] hover:bg-[#fee2e2]">
                  만료 2개
                </Badge>
                <Badge className="bg-[#fff7ed] text-[#f97316] border-[#fdba74] hover:bg-[#ffedd5]">
                  임박 3개
                </Badge>
              </div>

              <div className="space-y-2">
                {selectedDateItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-[#e4e4e7] hover:border-[#a1a1aa] hover:bg-[#fafafa] transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 ${
                          item.status === "expired"
                            ? "bg-[#ef4444]"
                            : item.status === "urgent"
                            ? "bg-[#f97316]"
                            : "bg-[#f59e0b]"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#0a0a0a] text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#71717a] mt-0.5">
                          {item.category} · {item.location}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
