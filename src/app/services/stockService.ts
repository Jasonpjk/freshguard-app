import type { StockLog } from "../context/AppContext";

// ─── Store filtering ──────────────────────────────────────────────────────────

export function filterStockLogsByStore(logs: StockLog[], storeId: string | null | undefined): StockLog[] {
  if (!storeId) return logs;
  return logs.filter((l) => !l.storeId || l.storeId === storeId);
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

export function computeStockStats(logs: StockLog[], today: string) {
  const todayLogs = logs.filter((l) => l.date === today);
  return {
    todayReceived: todayLogs.filter((l) => l.type === "received").length,
    todayOpened: todayLogs.filter((l) => l.type === "opened").length,
    todayUsed: todayLogs.filter((l) => l.type === "used").length,
    todayDisposed: todayLogs.filter((l) => l.type === "disposed").length,
  };
}

// ─── Future API replacement stub ─────────────────────────────────────────────

// export async function apiFetchStockLogs(storeId: string): Promise<StockLog[]> {
//   const res = await fetch(`/api/stores/${storeId}/stock-logs`, { credentials: "include" });
//   return res.json();
// }
