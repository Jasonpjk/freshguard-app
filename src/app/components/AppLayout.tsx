import { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Calendar,
  PackagePlus,
  Trash2,
  MapPin,
  ClipboardCheck,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  Bell,
  Plus,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Lock,
  Store,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";
import { useAuth } from "../context/AuthContext";

interface AppLayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange?: (page: string) => void;
  onAddItem?: () => void;
}

const menuItems = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "items", label: "품목 관리", icon: Package },
  { id: "calendar", label: "소비기한 캘린더", icon: Calendar },
  { id: "stock", label: "입고/개봉 관리", icon: PackagePlus },
  { id: "disposal", label: "폐기 기록", icon: Trash2 },
  { id: "location", label: "보관 위치 관리", icon: MapPin },
  { id: "hygiene", label: "위생점검", icon: ClipboardCheck },
  { id: "staff", label: "직원 관리", icon: Users },
  { id: "report", label: "리포트", icon: BarChart3 },
  { id: "subscription", label: "구독/결제", icon: CreditCard },
  { id: "settings", label: "설정", icon: Settings },
];

const ROLE_LABELS: Record<string, string> = {
  owner: "점주",
  manager: "매니저",
  staff: "직원",
  hq_admin: "본사관리자",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-[#10b981] text-white",
  manager: "bg-[#3b82f6] text-white",
  staff: "bg-[#f97316] text-white",
  hq_admin: "bg-[#a855f7] text-white",
};

export function AppLayout({ children, currentPage, onPageChange, onAddItem }: AppLayoutProps) {
  const { user, organization, stores, currentStore, switchStore, logout, hasPermission } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function handleMenuClick(id: string) {
    if (!hasPermission(id)) {
      toast.error(`'${menuItems.find((m) => m.id === id)?.label}' 메뉴에 접근할 권한이 없습니다.`, {
        description: `현재 역할(${ROLE_LABELS[user?.role ?? "staff"]})은 해당 기능을 사용할 수 없습니다.`,
      });
      return;
    }
    onPageChange?.(id);
    setIsSidebarOpen(false);
  }

  const accessibleStores = user?.role === "staff"
    ? stores.filter((s) => user.storeIds.includes(s.id))
    : stores;

  return (
    <div className="flex h-screen bg-[#fafafa]">
      <Toaster />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#e4e4e7] transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-[#e4e4e7]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-sm">
                <Package className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-base font-semibold text-[#0a0a0a] tracking-tight">
                FreshGuard
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-[#71717a] hover:text-[#0a0a0a] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Org info */}
          {organization && (
            <div className="px-4 py-2.5 border-b border-[#e4e4e7] bg-[#fafafa]">
              <p className="text-xs text-[#a1a1aa] truncate">{organization.name}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-0.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                const allowed = hasPermission(item.id);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleMenuClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-[#10b981] text-white shadow-sm"
                          : allowed
                          ? "text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#0a0a0a]"
                          : "text-[#c4c4c7] cursor-not-allowed"
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {!allowed && <Lock className="w-3 h-3 text-[#d4d4d8]" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info at bottom */}
          <div className="border-t border-[#e4e4e7] p-3">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-[#10b981] text-white text-xs font-medium">
                  {user?.name?.[0] ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0a0a0a] truncate">{user?.name}</p>
                <p className="text-xs text-[#71717a] truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-2 py-1.5 mt-1 rounded-lg text-sm text-[#71717a] hover:bg-[#fef2f2] hover:text-[#ef4444] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-[#e4e4e7] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-[#71717a] hover:text-[#0a0a0a] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Store switcher */}
            <div className="flex items-center gap-3">
              {accessibleStores.length > 1 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2.5 py-1.5 bg-[#fafafa] hover:bg-[#f4f4f5] rounded-md transition-colors border border-[#e4e4e7]">
                      <Store className="w-3.5 h-3.5 text-[#71717a]" />
                      <span className="text-sm font-medium text-[#0a0a0a]">
                        {currentStore?.name ?? "매장 선택"}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#71717a]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[160px]">
                    {accessibleStores.map((store) => (
                      <DropdownMenuItem
                        key={store.id}
                        onClick={() => switchStore(store.id)}
                        className={`cursor-pointer ${store.id === currentStore?.id ? "text-[#10b981] font-medium" : ""}`}
                      >
                        <Store className="w-4 h-4 mr-2" />
                        {store.name}
                        {store.id === currentStore?.id && (
                          <span className="ml-auto text-xs text-[#10b981]">현재</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                    {(user?.role === "owner" || user?.role === "hq_admin") && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => toast.info("전체 매장 보기 기능은 준비 중입니다.")}
                          className="cursor-pointer text-[#71717a]"
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          전체 매장 보기
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button className="flex items-center gap-2 px-2.5 py-1.5 bg-[#fafafa] rounded-md border border-[#e4e4e7]">
                  <Store className="w-3.5 h-3.5 text-[#71717a]" />
                  <span className="text-sm font-medium text-[#0a0a0a]">
                    {currentStore?.name ?? "매장"}
                  </span>
                </button>
              )}
              <span className="text-xs text-[#71717a] hidden sm:block">
                {new Date().toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="bg-[#10b981] hover:bg-[#059669] text-white shadow-sm border-0 h-8 px-3 text-sm font-medium"
              onClick={onAddItem}
            >
              <Plus className="w-4 h-4 mr-1.5" strokeWidth={2.5} />
              품목 등록
            </Button>

            <button className="relative p-2 hover:bg-[#f4f4f5] rounded-lg transition-colors">
              <Bell className="w-[18px] h-[18px] text-[#71717a]" strokeWidth={2} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-[#e4e4e7]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-[#f4f4f5] rounded-lg px-2 py-1 transition-colors">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-[#10b981] text-white text-xs font-medium">
                        {user?.name?.[0] ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex items-center gap-1.5">
                      <span className="text-sm font-medium text-[#0a0a0a]">{user?.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 border-0 ${ROLE_COLORS[user?.role ?? "staff"]}`}
                      >
                        {ROLE_LABELS[user?.role ?? "staff"]}
                      </Badge>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <div className="px-3 py-2 border-b border-[#e4e4e7]">
                    <p className="text-sm font-medium text-[#0a0a0a]">{user?.name}</p>
                    <p className="text-xs text-[#71717a]">{user?.email}</p>
                  </div>
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-[#ef4444] hover:bg-[#fef2f2] mt-1"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
