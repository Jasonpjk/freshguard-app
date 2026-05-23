import { Download, Plus, MoreHorizontal, CheckCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const disposalRecords = [
  {
    id: 1,
    date: "2026-05-23",
    itemName: "양파",
    quantity: 2,
    unit: "kg",
    reason: "변질",
    loss: 8000,
    handler: "김조리",
    approver: "김점주",
    status: "approved",
  },
  {
    id: 2,
    date: "2026-05-22",
    itemName: "딸기",
    quantity: 1,
    unit: "팩",
    reason: "소비기한 초과",
    loss: 15000,
    handler: "이주방",
    approver: "김점주",
    status: "approved",
  },
  {
    id: 3,
    date: "2026-05-21",
    itemName: "우유",
    quantity: 3,
    unit: "팩",
    reason: "개봉 후 기한 초과",
    loss: 12000,
    handler: "박직원",
    approver: null,
    status: "pending",
  },
  {
    id: 4,
    date: "2026-05-20",
    itemName: "토마토",
    quantity: 1.5,
    unit: "kg",
    reason: "파손",
    loss: 9000,
    handler: "김조리",
    approver: "김점주",
    status: "approved",
  },
  {
    id: 5,
    date: "2026-05-19",
    itemName: "치즈",
    quantity: 1,
    unit: "개",
    reason: "오염",
    loss: 18000,
    handler: "이주방",
    approver: "김점주",
    status: "approved",
  },
];

const monthStats = {
  totalCount: 15,
  totalLoss: 128000,
  topItem: "우유 (5건)",
  topCategory: "유제품",
};

export function DisposalRecords() {
  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">
            폐기 기록
          </h1>
          <p className="text-sm text-[#71717a]">
            폐기된 품목과 손실 금액을 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-[#e4e4e7] h-9"
          >
            <Download className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
          <Button
            size="sm"
            className="bg-[#10b981] hover:bg-[#059669] text-white h-9"
          >
            <Plus className="w-4 h-4 mr-2" />
            폐기 등록
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">이번 달 폐기 건수</p>
            <p className="text-3xl font-semibold text-[#0a0a0a]">
              {monthStats.totalCount}건
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">이번 달 폐기 금액</p>
            <p className="text-3xl font-semibold text-[#ef4444]">
              ₩{(monthStats.totalLoss / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">가장 많이 폐기된 품목</p>
            <p className="text-lg font-semibold text-[#0a0a0a]">
              {monthStats.topItem}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-[#71717a] mb-2">폐기율 높은 카테고리</p>
            <p className="text-lg font-semibold text-[#0a0a0a]">
              {monthStats.topCategory}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select defaultValue="all-period">
          <SelectTrigger className="w-[180px] border-[#e4e4e7] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-period">전체 기간</SelectItem>
            <SelectItem value="this-week">이번 주</SelectItem>
            <SelectItem value="this-month">이번 달</SelectItem>
            <SelectItem value="last-month">지난 달</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all-reason">
          <SelectTrigger className="w-[180px] border-[#e4e4e7] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-reason">전체 사유</SelectItem>
            <SelectItem value="expired">소비기한 초과</SelectItem>
            <SelectItem value="spoiled">변질</SelectItem>
            <SelectItem value="damaged">파손</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all-status">
          <SelectTrigger className="w-[180px] border-[#e4e4e7] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-status">전체 상태</SelectItem>
            <SelectItem value="pending">승인 대기</SelectItem>
            <SelectItem value="approved">승인 완료</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Records Table */}
      <Card className="border-[#e4e4e7] shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fafafa] border-b border-[#e4e4e7]">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    폐기일
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    품목명
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    수량
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    폐기 사유
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    손실 금액
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    처리자
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">
                    상태
                  </th>
                  <th className="text-right py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider">

                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e4e4e7]">
                {disposalRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-[#fafafa] transition-colors"
                  >
                    <td className="py-4 px-6 text-sm text-[#71717a]">
                      {record.date}
                    </td>
                    <td className="py-4 px-6 font-medium text-[#0a0a0a]">
                      {record.itemName}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#71717a]">
                      {record.quantity} {record.unit}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#71717a]">
                      {record.reason}
                    </td>
                    <td className="py-4 px-6 font-medium text-[#ef4444]">
                      ₩{record.loss.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#71717a]">
                      {record.handler}
                    </td>
                    <td className="py-4 px-6">
                      {record.status === "approved" ? (
                        <Badge className="bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          승인 완료
                        </Badge>
                      ) : (
                        <Badge className="bg-[#fffbeb] text-[#f59e0b] border-[#fcd34d]">
                          승인 대기
                        </Badge>
                      )}
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
