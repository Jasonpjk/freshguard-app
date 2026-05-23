import { useState } from "react";
import { Search, Download, Upload, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const items = [
  {
    id: 1,
    name: "생크림",
    category: "유제품",
    receivedDate: "2026-05-20",
    openedDate: "2026-05-21",
    expiryDate: "2026-05-23",
    useAfterOpenDays: 2,
    location: "냉장고 1번",
    quantity: 2,
    unit: "개",
    status: "expired",
    assignee: "김조리",
  },
  {
    id: 2,
    name: "닭가슴살",
    category: "육류",
    receivedDate: "2026-05-21",
    openedDate: null,
    expiryDate: "2026-05-24",
    useAfterOpenDays: null,
    location: "냉장고 2번",
    quantity: 5,
    unit: "kg",
    status: "urgent",
    assignee: "이주방",
  },
  {
    id: 3,
    name: "양상추",
    category: "채소",
    receivedDate: "2026-05-22",
    openedDate: null,
    expiryDate: "2026-05-24",
    useAfterOpenDays: null,
    location: "냉장고 1번",
    quantity: 3,
    unit: "개",
    status: "urgent",
    assignee: "박직원",
  },
  {
    id: 4,
    name: "토마토소스",
    category: "소스",
    receivedDate: "2026-05-15",
    openedDate: "2026-05-20",
    expiryDate: "2026-05-25",
    useAfterOpenDays: 5,
    location: "건식 창고",
    quantity: 4,
    unit: "병",
    status: "warning",
    assignee: "김조리",
  },
  {
    id: 5,
    name: "우유",
    category: "유제품",
    receivedDate: "2026-05-20",
    openedDate: null,
    expiryDate: "2026-05-26",
    useAfterOpenDays: null,
    location: "냉장고 1번",
    quantity: 10,
    unit: "팩",
    status: "warning",
    assignee: "이주방",
  },
  {
    id: 6,
    name: "냉동 패티",
    category: "육류",
    receivedDate: "2026-05-10",
    openedDate: null,
    expiryDate: "2026-06-10",
    useAfterOpenDays: null,
    location: "냉동고 A",
    quantity: 50,
    unit: "개",
    status: "normal",
    assignee: "김조리",
  },
  {
    id: 7,
    name: "연어 필렛",
    category: "수산물",
    receivedDate: "2026-05-22",
    openedDate: null,
    expiryDate: "2026-05-27",
    useAfterOpenDays: null,
    location: "냉장고 2번",
    quantity: 2,
    unit: "kg",
    status: "normal",
    assignee: "박직원",
  },
  {
    id: 8,
    name: "계란",
    category: "난류",
    receivedDate: "2026-05-18",
    openedDate: null,
    expiryDate: "2026-06-01",
    useAfterOpenDays: null,
    location: "냉장고 1번",
    quantity: 30,
    unit: "개",
    status: "normal",
    assignee: "이주방",
  },
];

function getStatusBadge(status: string, expiryDate: string) {
  const today = new Date("2026-05-23");
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const configs = {
    expired: {
      className: "bg-[#fef2f2] text-[#ef4444] border-[#fca5a5]",
      text: "만료",
    },
    urgent: {
      className: "bg-[#fff7ed] text-[#f97316] border-[#fdba74]",
      text: `D-${daysLeft}`,
    },
    warning: {
      className: "bg-[#fffbeb] text-[#f59e0b] border-[#fcd34d]",
      text: `D-${daysLeft}`,
    },
    normal: {
      className: "bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]",
      text: "정상",
    },
  };

  const config = configs[status as keyof typeof configs] || configs.normal;
  return (
    <Badge variant="outline" className={`${config.className} font-medium px-2.5 py-0.5 text-xs`}>
      {config.text}
    </Badge>
  );
}

export function ItemsManagement() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">
            품목 관리
          </h1>
          <p className="text-sm text-[#71717a]">
            등록된 모든 식재료와 상품을 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-[#e4e4e7] text-[#52525b] hover:bg-[#f4f4f5] h-9"
          >
            <Download className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-[#e4e4e7] text-[#52525b] hover:bg-[#f4f4f5] h-9"
          >
            <Upload className="w-4 h-4 mr-2" />
            일괄 등록
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#a1a1aa]" />
          <Input
            placeholder="품목명으로 검색..."
            className="pl-10 border-[#e4e4e7] bg-white h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px] border-[#e4e4e7] h-10">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="normal">정상</SelectItem>
            <SelectItem value="warning">주의</SelectItem>
            <SelectItem value="urgent">임박</SelectItem>
            <SelectItem value="expired">만료</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[180px] border-[#e4e4e7] h-10">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            <SelectItem value="dairy">유제품</SelectItem>
            <SelectItem value="meat">육류</SelectItem>
            <SelectItem value="vegetable">채소</SelectItem>
            <SelectItem value="sauce">소스</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items Table */}
      <Card className="border-[#e4e4e7] shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fafafa] border-b border-[#e4e4e7]">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:text-[#0a0a0a] transition-colors">
                      품목명
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    입고일
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    소비기한
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    보관 위치
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    수량
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    상태
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    담당자
                  </th>
                  <th className="text-right py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">

                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e4e4e7]">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#fafafa] transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-[#0a0a0a]">
                      {item.name}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#71717a]">
                      {item.category}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#71717a]">
                      {item.receivedDate}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#71717a]">
                      {item.expiryDate}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#71717a]">
                      {item.location}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#71717a]">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(item.status, item.expiryDate)}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#71717a]">
                      {item.assignee}
                    </td>
                    <td className="py-4 px-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-[#f4f4f5]"
                      >
                        <MoreHorizontal className="w-4 h-4 text-[#71717a]" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
