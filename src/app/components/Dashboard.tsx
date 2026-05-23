import {
  AlertTriangle,
  Clock,
  XCircle,
  DollarSign,
  ClipboardCheck,
  Bell,
  ArrowRight,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useApp, getDaysLeft } from "../context/AppContext";
import { useMemo, useState } from "react";
import { DisposalDialog } from "./DisposalDialog";
import type { Item } from "../context/AppContext";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  status?: "normal" | "warning" | "urgent" | "expired" | "critical";
  trend?: string;
  description?: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  status = "normal",
  trend,
  description,
}: StatCardProps) {
  const statusConfig = {
    normal: { bg: "bg-[#ecfdf5]", iconColor: "text-[#10b981]", valueColor: "text-[#0a0a0a]" },
    warning: { bg: "bg-[#fffbeb]", iconColor: "text-[#f59e0b]", valueColor: "text-[#0a0a0a]" },
    urgent: { bg: "bg-[#fff7ed]", iconColor: "text-[#f97316]", valueColor: "text-[#0a0a0a]" },
    expired: { bg: "bg-[#fef2f2]", iconColor: "text-[#ef4444]", valueColor: "text-[#ef4444]" },
    critical: { bg: "bg-[#fef2f2]", iconColor: "text-[#dc2626]", valueColor: "text-[#dc2626]" },
  };

  const config = statusConfig[status];

  return (
    <Card className="border-[#e4e4e7] shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-lg ${config.bg}`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} strokeWidth={2} />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-[#71717a] font-medium">{title}</p>
          <p className={`text-3xl font-semibold tracking-tight ${config.valueColor}`}>
            {value}
          </p>
          {(trend || description) && (
            <p className="text-xs text-[#a1a1aa] mt-2">{trend || description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string, daysLeft: number) {
  const configs = {
    expired: { className: "bg-[#fef2f2] text-[#ef4444] border-[#fca5a5] hover:bg-[#fee2e2]", text: "만료" },
    urgent: { className: "bg-[#fff7ed] text-[#f97316] border-[#fdba74] hover:bg-[#ffedd5]", text: `D-${daysLeft}` },
    warning: { className: "bg-[#fffbeb] text-[#f59e0b] border-[#fcd34d] hover:bg-[#fef3c7]", text: `D-${daysLeft}` },
    normal: { className: "bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0] hover:bg-[#d1fae5]", text: "정상" },
  };

  const config = configs[status as keyof typeof configs] || configs.normal;
  return (
    <Badge variant="outline" className={`${config.className} font-medium px-2.5 py-0.5 text-xs`}>
      {config.text}
    </Badge>
  );
}

export function Dashboard() {
  const { items, disposalRecords, updateItem, addDisposalRecord } = useApp();
  const [disposalTarget, setDisposalTarget] = useState<Item | null>(null);

  const stats = useMemo(() => {
    const expired = items.filter((i) => i.status === "expired").length;
    const urgent = items.filter((i) => i.status === "urgent").length;
    const warning = items.filter((i) => i.status === "warning").length;
    const needAction = expired + urgent + warning;

    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthlyLoss = disposalRecords
      .filter((r) => r.date.startsWith(thisMonth))
      .reduce((sum, r) => sum + r.loss, 0);

    const pendingDisposals = disposalRecords.filter((r) => r.status === "pending").length;

    return { expired, urgent, warning, needAction, monthlyLoss, pendingDisposals };
  }, [items, disposalRecords]);

  const priorityItems = useMemo(() =>
    items
      .filter((i) => i.status !== "normal")
      .sort((a, b) => {
        const order = { expired: 0, urgent: 1, warning: 2, normal: 3 };
        return order[a.status] - order[b.status];
      })
      .slice(0, 5)
      .map((item, idx) => ({ ...item, priority: idx + 1, daysLeft: getDaysLeft(item.expiryDate) })),
    [items]
  );

  function handleMarkUsed(id: number) {
    updateItem(id, { quantity: 0, status: "normal" });
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">대시보드</h1>
        <p className="text-sm text-[#71717a]">오늘의 품목 상태를 한눈에 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="오늘 처리 필요" value={stats.needAction} icon={AlertTriangle} status="warning" description="만료+임박+주의" />
        <StatCard title="임박 품목" value={stats.urgent} icon={Clock} status="urgent" description="D-1 이내" />
        <StatCard title="만료 품목" value={stats.expired} icon={XCircle} status="expired" description="즉시 처리 필요" />
        <StatCard
          title="이번 달 폐기"
          value={`₩${Math.round(stats.monthlyLoss / 1000)}K`}
          icon={DollarSign}
          status="critical"
          description={`총 ${disposalRecords.filter((r) => r.date.startsWith(new Date().toISOString().slice(0, 7))).length}건`}
        />
        <StatCard title="주의 품목" value={stats.warning} icon={ClipboardCheck} status="warning" description="D-3 이내" />
        <StatCard title="승인 대기" value={stats.pendingDisposals} icon={Bell} status="urgent" description="폐기 승인 필요" />
      </div>

      <Card className="border-[#e4e4e7] shadow-sm">
        <CardContent className="p-0">
          <div className="p-6 border-b border-[#e4e4e7]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#0a0a0a] tracking-tight">오늘 먼저 사용해야 할 품목</h2>
                <p className="text-sm text-[#71717a] mt-1">소비기한이 임박하거나 만료된 품목입니다</p>
              </div>
              <Button variant="ghost" size="sm" className="text-[#71717a] hover:text-[#0a0a0a] hover:bg-[#f4f4f5]">
                전체 보기
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fafafa] border-b border-[#e4e4e7]">
                <tr>
                  {["우선순위", "품목명", "카테고리", "보관 위치", "남은 기한", "상태", "담당자", "조치"].map((h, i) => (
                    <th key={h} className={`py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider ${i === 7 ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e4e4e7]">
                {priorityItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-[#71717a]">처리가 필요한 품목이 없습니다</td>
                  </tr>
                ) : (
                  priorityItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[#f4f4f5] text-[#52525b] text-xs font-semibold">
                          {item.priority}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-[#0a0a0a]">{item.name}</td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{item.category}</td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{item.location}</td>
                      <td className="py-4 px-6">
                        <span className={`text-sm font-medium ${item.daysLeft < 0 ? "text-[#ef4444]" : item.daysLeft <= 1 ? "text-[#f97316]" : "text-[#f59e0b]"}`}>
                          {item.daysLeft < 0 ? "만료됨" : item.daysLeft === 0 ? "오늘 만료" : `${item.daysLeft}일 남음`}
                        </span>
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(item.status, item.daysLeft)}</td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{item.assignee}</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-[#10b981] hover:bg-[#059669] text-white border-0 h-8 px-3 shadow-sm"
                            onClick={() => handleMarkUsed(item.id)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            사용 완료
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#ef4444] border-[#e4e4e7] hover:bg-[#fef2f2] hover:border-[#fca5a5] h-8 px-3"
                            onClick={() => setDisposalTarget(item)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            폐기
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {disposalTarget && (
        <DisposalDialog
          item={disposalTarget}
          open={!!disposalTarget}
          onClose={() => setDisposalTarget(null)}
          onConfirm={(record) => {
            addDisposalRecord(record);
            updateItem(disposalTarget.id, { quantity: 0, status: "normal" });
            setDisposalTarget(null);
          }}
        />
      )}
    </div>
  );
}
