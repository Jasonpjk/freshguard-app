import { lazy, Suspense, useState } from "react";
import { AppLayout } from "./components/AppLayout";
import { Button } from "./components/ui/button";
import { Monitor, Smartphone } from "lucide-react";
import { AppProvider } from "./context/AppContext";

const Dashboard = lazy(() => import("./components/Dashboard").then((m) => ({ default: m.Dashboard })));
const ItemsManagement = lazy(() => import("./components/ItemsManagement").then((m) => ({ default: m.ItemsManagement })));
const ExpiryCalendar = lazy(() => import("./components/ExpiryCalendar").then((m) => ({ default: m.ExpiryCalendar })));
const StockManagement = lazy(() => import("./components/StockManagement").then((m) => ({ default: m.StockManagement })));
const DisposalRecords = lazy(() => import("./components/DisposalRecords").then((m) => ({ default: m.DisposalRecords })));
const StorageLocations = lazy(() => import("./components/StorageLocations").then((m) => ({ default: m.StorageLocations })));
const HygieneCheck = lazy(() => import("./components/HygieneCheck").then((m) => ({ default: m.HygieneCheck })));
const StaffManagement = lazy(() => import("./components/StaffManagement").then((m) => ({ default: m.StaffManagement })));
const Reports = lazy(() => import("./components/Reports").then((m) => ({ default: m.Reports })));
const Subscription = lazy(() => import("./components/Subscription").then((m) => ({ default: m.Subscription })));
const AppSettings = lazy(() => import("./components/AppSettings").then((m) => ({ default: m.AppSettings })));
const MobileView = lazy(() => import("./components/MobileView").then((m) => ({ default: m.MobileView })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#71717a]">로딩 중...</span>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":    return <Dashboard onNavigate={setCurrentPage} />;
      case "items":        return <ItemsManagement />;
      case "calendar":     return <ExpiryCalendar />;
      case "stock":        return <StockManagement />;
      case "disposal":     return <DisposalRecords />;
      case "location":     return <StorageLocations />;
      case "hygiene":      return <HygieneCheck />;
      case "staff":        return <StaffManagement />;
      case "report":       return <Reports />;
      case "subscription": return <Subscription />;
      case "settings":     return <AppSettings />;
      default:             return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  if (viewMode === "mobile") {
    return (
      <AppProvider>
        <div className="size-full bg-gray-100">
          <div className="fixed top-4 right-4 z-50">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewMode("desktop")}
              className="gap-2 bg-white shadow-lg"
            >
              <Monitor className="w-4 h-4" />
              데스크톱 보기
            </Button>
          </div>
          <Suspense fallback={<PageLoader />}>
            <MobileView />
          </Suspense>
        </div>
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <div className="size-full relative">
        <div className="fixed top-4 right-4 z-50">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewMode("mobile")}
            className="gap-2 bg-white shadow-lg"
          >
            <Smartphone className="w-4 h-4" />
            모바일 보기
          </Button>
        </div>
        <AppLayout currentPage={currentPage} onPageChange={setCurrentPage} onAddItem={() => setCurrentPage("items")}>
          <Suspense fallback={<PageLoader />}>
            {renderPage()}
          </Suspense>
        </AppLayout>
      </div>
    </AppProvider>
  );
}
