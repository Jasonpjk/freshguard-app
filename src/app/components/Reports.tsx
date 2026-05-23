import { useMemo, useState } from "react";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useApp } from "../context/AppContext";

const PIE_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#71717a", "#3b82f6"];

const MONTH_LABELS: Record<string, string> = {
  "01": "1월", "02": "2월", "03": "3월", "04": "4월", "05": "5월", "06": "6월",
  "07": "7월", "08": "8월", "09": "9월", "10": "10월", "11": "11월", "12": "12월",
};

export function Reports() {
  const { items, disposalRecords } = useApp();
  const [period, setPeriod] = useState("this-month");

  const today = new Date();
  const thisMonth = today.toISOString().slice(0, 7);

  const periodRecords = useMemo(() => {
    return disposalRecords.filter((r) => {
      if (period === "this-week") {
        const d = new Date(r.date);
        return (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
      }
      if (period === "this-month") return r.date.startsWith(thisMonth);
      if (period === "last-month") {
        const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);
        return r.date.startsWith(lm);
      }
      if (period === "last-3-months") {
        const cutoff = new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().slice(0, 7);
        return r.date >= cutoff;
      }
      return true;
    });
  }, [disposalRecords, period, thisMonth]);

  const metrics = useMemo(() => {
    const totalLoss = periodRecords.reduce((sum, r) => sum + r.loss, 0);
    const totalItems = items.length;
    const expiredCount = items.filter((i) => i.status === "expired").length;
    const complianceRate = totalItems > 0 ? Math.round(((totalItems - expiredCount) / totalItems) * 100) : 100;
    return { totalLoss, count: periodRecords.length, complianceRate };
  }, [periodRecords, items]);

  const monthlyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    disposalRecords.forEach((r) => {
      const month = r.date.slice(0, 7);
      map[month] = (map[month] || 0) + r.loss;
    });
    const sorted = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
    return sorted.map(([key, amount]) => ({ month: MONTH_LABELS[key.slice(5)] || key, amount }));
  }, [disposalRecords]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    periodRecords.forEach((r) => {
      const cat = items.find((i) => i.name === r.itemName)?.category || "기타";
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }));
  }, [periodRecords, items]);

  const statusData = useMemo(() => [
    { name: "정상", value: items.filter((i) => i.status === "normal").length, color: "#10b981" },
    { name: "주의", value: items.filter((i) => i.status === "warning").length, color: "#f59e0b" },
    { name: "임박", value: items.filter((i) => i.status === "urgent").length, color: "#f97316" },
    { name: "만료", value: items.filter((i) => i.status === "expired").length, color: "#ef4444" },
  ].filter((d) => d.value > 0), [items]);

  function exportPDF() {
    window.print();
  }

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">리포트</h1>
          <p className="text-sm text-[#71717a]">매장 운영 현황을 분석하고 리포트를 생성합니다</p>
        </div>
        <Button size="sm" className="bg-[#10b981] hover:bg-[#059669] text-white h-9" onClick={exportPDF}>
          <Download className="w-4 h-4 mr-2" />PDF 다운로드
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px] border-[#e4e4e7] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="this-week">이번 주</SelectItem>
            <SelectItem value="this-month">이번 달</SelectItem>
            <SelectItem value="last-month">지난 달</SelectItem>
            <SelectItem value="last-3-months">최근 3개월</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">소비기한 준수율</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-[#10b981]">{metrics.complianceRate}%</span>
              <span className="text-sm text-[#10b981] flex items-center">
                {metrics.complianceRate >= 90 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {metrics.complianceRate >= 90 ? "양호" : "주의"}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">폐기 금액</p>
            <span className="text-3xl font-semibold text-[#ef4444]">
              ₩{metrics.totalLoss >= 1000 ? `${Math.round(metrics.totalLoss / 1000)}K` : metrics.totalLoss.toLocaleString()}
            </span>
          </CardContent>
        </Card>
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">폐기 건수</p>
            <span className="text-3xl font-semibold text-[#0a0a0a]">{metrics.count}건</span>
          </CardContent>
        </Card>
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">등록 품목 수</p>
            <span className="text-3xl font-semibold text-[#10b981]">{items.length}개</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0a0a0a] mb-4">월별 폐기 금액 추이</h3>
            {monthlyTrend.length === 0 ? (
              <p className="text-sm text-[#a1a1aa] text-center py-16">데이터 없음</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`₩${v.toLocaleString()}`, "폐기 금액"]} />
                  <Line type="monotone" dataKey="amount" name="폐기 금액" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0a0a0a] mb-4">카테고리별 폐기 비율</h3>
            {categoryData.length === 0 ? (
              <p className="text-sm text-[#a1a1aa] text-center py-16">선택 기간 내 폐기 기록 없음</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0a0a0a] mb-4">현재 품목 상태 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [`${v}개`, "품목 수"]} />
                <Bar dataKey="value" name="품목 수" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
