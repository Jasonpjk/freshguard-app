import { useState } from "react";
import { AppLayout } from "./components/AppLayout";
import { Dashboard } from "./components/Dashboard";
import { ItemsManagement } from "./components/ItemsManagement";
import { ExpiryCalendar } from "./components/ExpiryCalendar";
import { DisposalRecords } from "./components/DisposalRecords";
import { Reports } from "./components/Reports";
import { MobileView } from "./components/MobileView";
import { StorageLocations } from "./components/StorageLocations";
import { HygieneCheck } from "./components/HygieneCheck";
import { StaffManagement } from "./components/StaffManagement";
import { AppSettings } from "./components/AppSettings";
import { Subscription } from "./components/Subscription";
import { Button } from "./components/ui/button";
import { Monitor, Smartphone } from "lucide-react";
import { AppProvider } from "./context/AppContext";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":   return <Dashboard onNavigate={setCurrentPage} />;
      case "items":       return <ItemsManagement />;
      case "calendar":    return <ExpiryCalendar />;
      case "disposal":    return <DisposalRecords />;
      case "location":    return <StorageLocations />;
      case "hygiene":     return <HygieneCheck />;
      case "staff":       return <StaffManagement />;
      case "report":      return <Reports />;
      case "subscription":return <Subscription />;
      case "settings":    return <AppSettings />;
      default:            return <Dashboard onNavigate={setCurrentPage} />;
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
          <MobileView />
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
          {renderPage()}
        </AppLayout>
      </div>
    </AppProvider>
  );
}
