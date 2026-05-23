import { useState } from "react";
import { Plus, MoreHorizontal, UserCheck, UserX, Mail, Phone, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useApp, type StaffMember, type StaffRole, type StaffStatus } from "../context/AppContext";

const ROLE_LABELS: Record<StaffRole, string> = {
  staff: "직원",
  manager: "매니저",
  owner: "점주",
  admin: "본사 관리자",
};

const ROLE_COLORS: Record<StaffRole, string> = {
  staff: "bg-[#f4f4f5] text-[#52525b] border-[#d4d4d8]",
  manager: "bg-[#eff6ff] text-[#3b82f6] border-[#93c5fd]",
  owner: "bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]",
  admin: "bg-[#fdf4ff] text-[#a855f7] border-[#d8b4fe]",
};

const AVATAR_BG: Record<StaffRole, string> = {
  staff: "bg-[#71717a]",
  manager: "bg-[#3b82f6]",
  owner: "bg-[#10b981]",
  admin: "bg-[#a855f7]",
};

const EMPTY_FORM = {
  name: "",
  role: "staff" as StaffRole,
  phone: "",
  store: "강남점",
  email: "",
};

export function StaffManagement() {
  const { staff, addStaff, updateStaff, deleteStaff } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterRole, setFilterRole] = useState<StaffRole | "all">("all");
  const [filterStatus, setFilterStatus] = useState<StaffStatus | "all">("all");

  const filtered = staff.filter((s) => {
    if (filterRole !== "all" && s.role !== filterRole) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: staff.length,
    active: staff.filter((s) => s.status === "active").length,
    managers: staff.filter((s) => s.role === "manager" || s.role === "owner").length,
  };

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(member: StaffMember) {
    setEditTarget(member);
    setForm({ name: member.name, role: member.role, phone: member.phone, store: member.store, email: member.email });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name) return;
    const today = new Date().toISOString().split("T")[0];
    if (editTarget) {
      updateStaff(editTarget.id, form);
    } else {
      addStaff({ ...form, lastActive: today, status: "active" });
    }
    setDialogOpen(false);
  }

  function handleDelete(id: number) {
    if (confirm("이 직원을 삭제하시겠습니까?")) deleteStaff(id);
  }

  function toggleStatus(member: StaffMember) {
    updateStaff(member.id, { status: member.status === "active" ? "inactive" : "active" });
  }

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight mb-1">직원 관리</h1>
          <p className="text-sm text-[#71717a]">매장 직원 및 권한을 관리합니다</p>
        </div>
        <Button size="sm" className="bg-[#10b981] hover:bg-[#059669] text-white h-9" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />직원 초대
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-[#71717a] mb-2">전체 직원</p>
            <p className="text-3xl font-semibold text-[#0a0a0a]">{stats.total}명</p>
          </CardContent>
        </Card>
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-[#71717a] mb-2">활성 직원</p>
            <p className="text-3xl font-semibold text-[#10b981]">{stats.active}명</p>
          </CardContent>
        </Card>
        <Card className="border-[#e4e4e7] shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-[#71717a] mb-2">관리자 이상</p>
            <p className="text-3xl font-semibold text-[#3b82f6]">{stats.managers}명</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterRole} onValueChange={(v) => setFilterRole(v as StaffRole | "all")}>
          <SelectTrigger className="w-[160px] border-[#e4e4e7] h-10"><SelectValue placeholder="전체 역할" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 역할</SelectItem>
            <SelectItem value="staff">직원</SelectItem>
            <SelectItem value="manager">매니저</SelectItem>
            <SelectItem value="owner">점주</SelectItem>
            <SelectItem value="admin">본사 관리자</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StaffStatus | "all")}>
          <SelectTrigger className="w-[160px] border-[#e4e4e7] h-10"><SelectValue placeholder="전체 상태" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="inactive">비활성</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-[#e4e4e7] shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fafafa] border-b border-[#e4e4e7]">
                <tr>
                  {["직원", "역할", "연락처", "소속 매장", "최근 활동", "상태", ""].map((h, i) => (
                    <th key={i} className={`py-3 px-6 text-xs font-medium text-[#71717a] uppercase tracking-wider ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e4e4e7]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-sm text-[#71717a]">직원이 없습니다</td></tr>
                ) : (
                  filtered.map((member) => (
                    <tr key={member.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={`${AVATAR_BG[member.role]} text-white text-xs font-medium`}>
                              {member.name.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-[#0a0a0a]">{member.name}</div>
                            <div className="text-xs text-[#a1a1aa]">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="outline" className={`${ROLE_COLORS[member.role]} text-xs`}>{ROLE_LABELS[member.role]}</Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">
                        <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{member.phone}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{member.store}</td>
                      <td className="py-4 px-6 text-sm text-[#71717a]">{member.lastActive}</td>
                      <td className="py-4 px-6">
                        <Badge
                          variant="outline"
                          className={member.status === "active"
                            ? "bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]"
                            : "bg-[#f4f4f5] text-[#71717a] border-[#d4d4d8]"
                          }
                        >
                          {member.status === "active" ? "활성" : "비활성"}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[#f4f4f5]">
                              <MoreHorizontal className="w-4 h-4 text-[#71717a]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(member)}>
                              <Pencil className="w-4 h-4 mr-2" />수정
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(member)}>
                              {member.status === "active"
                                ? <><UserX className="w-4 h-4 mr-2" />비활성화</>
                                : <><UserCheck className="w-4 h-4 mr-2" />활성화</>
                              }
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />초대 메일 재발송
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-[#ef4444] focus:text-[#ef4444]" onClick={() => handleDelete(member.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editTarget ? "직원 정보 수정" : "직원 초대"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>이름 *</Label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="이름 입력" className="border-[#e4e4e7]" />
            </div>
            <div className="space-y-1.5">
              <Label>이메일</Label>
              <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="이메일 주소" className="border-[#e4e4e7]" />
            </div>
            <div className="space-y-1.5">
              <Label>연락처</Label>
              <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="010-0000-0000" className="border-[#e4e4e7]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>역할</Label>
                <Select value={form.role} onValueChange={(v) => setField("role", v)}>
                  <SelectTrigger className="border-[#e4e4e7]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">직원</SelectItem>
                    <SelectItem value="manager">매니저</SelectItem>
                    <SelectItem value="owner">점주</SelectItem>
                    <SelectItem value="admin">본사 관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>소속 매장</Label>
                <Input value={form.store} onChange={(e) => setField("store", e.target.value)} className="border-[#e4e4e7]" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#e4e4e7]">취소</Button>
            <Button onClick={handleSave} className="bg-[#10b981] hover:bg-[#059669] text-white" disabled={!form.name}>
              {editTarget ? "수정 완료" : "초대 보내기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
