import type { Item, StockStatus } from "../context/AppContext";

// ─── Store filtering ──────────────────────────────────────────────────────────

export function filterItemsByStore(items: Item[], storeId: string | null | undefined): Item[] {
  if (!storeId) return items;
  // Items without storeId (legacy) belong to default store; show them everywhere for backwards compat
  return items.filter((i) => !i.storeId || i.storeId === storeId);
}

export function filterItemsByStatus(items: Item[], status: string): Item[] {
  if (status === "all") return items;
  return items.filter((i) => i.status === status);
}

export function filterItemsByStockStatus(items: Item[], stockStatus: StockStatus | "all"): Item[] {
  if (stockStatus === "all") return items;
  return items.filter((i) => i.stockStatus === stockStatus);
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

export function computeItemStats(items: Item[], today: string) {
  const expired = items.filter((i) => i.status === "expired").length;
  const urgent = items.filter((i) => i.status === "urgent").length;
  const warning = items.filter((i) => i.status === "warning").length;
  const needAction = expired + urgent + warning;
  const todayReceived = items.filter((i) => i.receivedDate === today).length;
  const unopened = items.filter((i) => i.stockStatus === "unopened").length;
  const todayOpened = items.filter((i) => i.openedDate === today).length;
  return { expired, urgent, warning, needAction, todayReceived, unopened, todayOpened };
}

// ─── Future API replacement stub ─────────────────────────────────────────────
// When ready for backend: replace these with fetch() calls.

// export async function apiFetchItems(storeId: string): Promise<Item[]> {
//   const res = await fetch(`/api/stores/${storeId}/items`, { credentials: "include" });
//   return res.json();
// }
