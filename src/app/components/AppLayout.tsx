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
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";

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

export function AppLayout({ children, currentPage, onPageChange, onAddItem }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#fafafa]">
      {/* Sidebar - Linear inspired */}
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

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-0.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onPageChange?.(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-[#10b981] text-white shadow-sm"
                          : "text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#0a0a0a]"
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
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
        {/* Header - Linear inspired */}
        <header className="h-14 bg-white border-b border-[#e4e4e7] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-[#71717a] hover:text-[#0a0a0a] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-2.5 py-1.5 bg-[#fafafa] hover:bg-[#f4f4f5] rounded-md transition-colors border border-[#e4e4e7]">
                <span className="text-sm font-medium text-[#0a0a0a]">강남점</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#71717a]" />
              </button>
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
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-[#10b981] text-white text-xs font-medium">
                  김
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-[#0a0a0a] hidden sm:block">
                김점주
              </span>
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
