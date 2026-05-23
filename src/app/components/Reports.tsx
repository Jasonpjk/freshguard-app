import { Download, TrendingUp } from "lucide-react";
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
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const monthlyDisposalData = [
  { month: "11월", amount: 95000 },
  { month: "12월", amount: 142000 },
  { month: "1월", amount: 118000 },
  { month: "2월", amount: 89000 },
  { month: "3월", amount: 156000 },
  { month: "4월", amount: 138000 },
  { month: "5월", amount: 128000 },
];

const categoryDisposalData = [
  { name: "유제품", value: 38, color: "#ef4444" },
  { name: "채소", value: 25, color: "#f97316" },
  { name: "육류", value: 18, color: "#f59e0b" },
  { name: "수산물", value: 12, color: "#10b981" },
  { name: "기타", value: 7, color: "#71717a" },
];

const complianceData = [
  { month: "11월", rate: 92 },
  { month: "12월", rate: 88 },
  { month: "1월", rate: 95 },
  { month: "2월", rate: 97 },
  { month: "3월", rate: 91 },
  { month: "4월", rate: 94 },
  { month: "5월", rate: 96 },
];

export function Reports() {
  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">
            리포트
          </h1>
          <p className="text-sm text-[#71717a]">
            매장 운영 현황을 분석하고 리포트를 생성합니다
          </p>
        </div>
        <Button
          size="sm"
          className="bg-[#10b981] hover:bg-[#059669] text-white h-9"
        >
          <Download className="w-4 h-4 mr-2" />
          PDF 다운로드
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select defaultValue="this-month">
          <SelectTrigger className="w-[180px] border-[#e4e4e7] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-week">이번 주</SelectItem>
            <SelectItem value="this-month">이번 달</SelectItem>
            <SelectItem value="last-month">지난 달</SelectItem>
            <SelectItem value="last-3-months">최근 3개월</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="gangnam">
          <SelectTrigger className="w-[180px] border-[#e4e4e7] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 매장</SelectItem>
            <SelectItem value="gangnam">강남점</SelectItem>
            <SelectItem value="hongdae">홍대점</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] border-[#e4e4e7] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            <SelectItem value="dairy">유제품</SelectItem>
            <SelectItem value="meat">육류</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">소비기한 준수율</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-[#10b981]">96%</span>
              <span className="text-sm text-[#10b981] flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">폐기 금액</p>
            <span className="text-3xl font-semibold text-[#ef4444]">₩128K</span>
          </CardContent>
        </Card>

        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">폐기 건수</p>
            <span className="text-3xl font-semibold text-[#0a0a0a]">15건</span>
          </CardContent>
        </Card>

        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">위생점검 완료율</p>
            <span className="text-3xl font-semibold text-[#10b981]">100%</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Disposal Trend */}
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0a0a0a] mb-4">
              월별 폐기 금액 추이
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyDisposalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#71717a", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#71717a", fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="폐기 금액"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Disposal */}
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0a0a0a] mb-4">
              카테고리별 폐기 비율
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDisposalData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDisposalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Compliance Rate */}
        <Card className="lg:col-span-2 border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0a0a0a] mb-4">
              소비기한 준수율 추이
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#71717a", fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#71717a", fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="rate" name="준수율 (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
