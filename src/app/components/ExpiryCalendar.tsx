import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useApp } from "../context/AppContext";

export function ExpiryCalendar() {
  const { items } = useApp();
  const todayStr = new Date().toISOString().split("T")[0];
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const calendarData = useMemo(() => {
    const map: Record<string, { expired: Item[]; urgent: Item[]; warning: Item[] }> = {};
    items.forEach((item) => {
      const key = item.expiryDate;
      if (!map[key]) map[key] = { expired: [], urgent: [], warning: [] };
      if (item.status === "expired") map[key].expired.push(item);
      else if (item.status === "urgent") map[key].urgent.push(item);
      else if (item.status === "warning") map[key].warning.push(item);
    });
    return map;
  }, [items]);

  const selectedItems = useMemo(() =>
    items.filter((i) => i.expiryDate === selectedDate && i.status !== "normal"),
    [items, selectedDate]
  );

  const { daysInMonth, startingDayOfWeek } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
  }, [currentMonth]);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  function formatDate(day: number) {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-${String(day).padStart(2, "0")}`;
  }

  function prevMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const selectedData = calendarData[selectedDate];

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">소비기한 캘린더</h1>
        <p className="text-sm text-[#71717a]">월간 품목 만료 일정을 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#0a0a0a]">
                {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#e4e4e7]" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 border-[#e4e4e7] text-xs" onClick={() => { setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); setSelectedDate(todayStr); }}>
                  오늘
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#e4e4e7]" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <div key={day} className="text-center py-2 text-xs font-medium text-[#71717a]">{day}</div>
              ))}
              {emptyDays.map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
              {days.map((day) => {
                const dateStr = formatDate(day);
                const data = calendarData[dateStr];
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayStr;

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
                      <span className={`text-sm font-medium ${isSelected ? "text-[#10b981]" : isToday ? "text-[#3b82f6]" : "text-[#0a0a0a]"}`}>
                        {day}
                      </span>
                      {data && (
                        <div className="flex gap-0.5 mt-1">
                          {data.expired.length > 0 && <div className="w-1 h-1 rounded-full bg-[#ef4444]" />}
                          {data.urgent.length > 0 && <div className="w-1 h-1 rounded-full bg-[#f97316]" />}
                          {data.warning.length > 0 && <div className="w-1 h-1 rounded-full bg-[#f59e0b]" />}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-[#e4e4e7]">
              {[["bg-[#ef4444]", "만료"], ["bg-[#f97316]", "임박"], ["bg-[#f59e0b]", "주의"]].map(([color, label]) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xs text-[#71717a]">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0a0a0a] mb-4">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
            </h3>

            {selectedData ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedData.expired.length > 0 && (
                    <Badge className="bg-[#fef2f2] text-[#ef4444] border-[#fca5a5] hover:bg-[#fee2e2]">
                      만료 {selectedData.expired.length}개
                    </Badge>
                  )}
                  {selectedData.urgent.length > 0 && (
                    <Badge className="bg-[#fff7ed] text-[#f97316] border-[#fdba74] hover:bg-[#ffedd5]">
                      임박 {selectedData.urgent.length}개
                    </Badge>
                  )}
                  {selectedData.warning.length > 0 && (
                    <Badge className="bg-[#fffbeb] text-[#f59e0b] border-[#fcd34d] hover:bg-[#fef3c7]">
                      주의 {selectedData.warning.length}개
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg border border-[#e4e4e7] hover:border-[#a1a1aa] hover:bg-[#fafafa] transition-all">
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                          item.status === "expired" ? "bg-[#ef4444]" : item.status === "urgent" ? "bg-[#f97316]" : "bg-[#f59e0b]"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#0a0a0a] text-sm">{item.name}</p>
                          <p className="text-xs text-[#71717a] mt-0.5">{item.category} · {item.location}</p>
                          <p className="text-xs text-[#a1a1aa] mt-0.5">{item.quantity} {item.unit} · {item.assignee}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#a1a1aa]">이 날짜에 만료/임박 품목이 없습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type Item = import("../context/AppContext").Item;
