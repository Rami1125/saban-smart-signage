// dual-storage.ts
// ח. סבן חומרי בניין (1994) בע״מ
// מנוע שמירת זיכרון כפול: זיכרון מקומי במכשיר (Offline First) במקביל לגליון Google Sheets

export interface SavedOrderItem {
  id: string;
  sku: string;
  productName: string;
  unitLabel: string;
  quantity: number;
  unitPrice: number;
  estimatedCost: number;
  areaM2?: number;
  wastePercent?: number;
  warehouse: string;
  branchName: string;
  source: string;
  screenId?: string;
  note?: string;
  createdAt: number;
  clientPhone?: string;
  clientName?: string;
  // Dual Persistence state
  storedLocally: boolean;
  syncedToSheet: boolean;
  sheetSyncTimestamp?: number;
  syncAttempts?: number;
}

export interface ContractorProfile {
  name: string;
  phone: string;
  company?: string;
  preferredBranch: "haharash" | "hatalmid";
}

const STORAGE_KEYS = {
  ORDERS: "saban.device.orders.v2",
  PROFILE: "saban.contractor.profile.v1",
  OFFLINE_QUEUE: "saban.offline.queue.v1",
};

export function getContractorProfile(): ContractorProfile {
  if (typeof window === "undefined") {
    return { name: "", phone: "", preferredBranch: "haharash" };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return { name: "", phone: "", preferredBranch: "haharash" };
    return JSON.parse(raw);
  } catch {
    return { name: "", phone: "", preferredBranch: "haharash" };
  }
}

export function saveContractorProfile(profile: Partial<ContractorProfile>): ContractorProfile {
  const current = getContractorProfile();
  const next = { ...current, ...profile };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next));
    } catch (e) {
      console.warn("Error saving profile to device storage:", e);
    }
  }
  return next;
}

export function getDeviceOrders(): SavedOrderItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.ORDERS);
    const parsed = raw ? (JSON.parse(raw) as SavedOrderItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrderToDevice(order: SavedOrderItem): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getDeviceOrders();
    const filtered = existing.filter((item) => item.id !== order.id);
    const next = [order, ...filtered].slice(0, 100);
    window.localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("saban:storage:change", { detail: { order } }));
  } catch (err) {
    console.warn("Could not save to device memory:", err);
  }
}

export function deleteDeviceOrder(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getDeviceOrders();
    const next = existing.filter((item) => item.id !== id);
    window.localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("saban:storage:change"));
  } catch (err) {
    console.warn("Could not delete from device memory:", err);
  }
}

export function clearAllDeviceOrders(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.ORDERS);
  window.dispatchEvent(new CustomEvent("saban:storage:change"));
}

/**
 * שמירה כפולה: שומר קודם בזיכרון המכשיר (מיידי), ובמקביל משדר לגליון Google Sheets
 */
export async function dispatchDualPersistence(params: {
  sku: string;
  productName: string;
  unitLabel: string;
  quantity: number;
  unitPrice: number;
  estimatedCost: number;
  areaM2?: number;
  wastePercent?: number;
  warehouse: string;
  branchName: string;
  source: string;
  screenId?: string;
  note?: string;
  clientPhone?: string;
  clientName?: string;
}): Promise<SavedOrderItem> {
  const orderId = `SAB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const profile = getContractorProfile();
  const phone = params.clientPhone || profile.phone;
  const name = params.clientName || profile.name;

  // 1. שלב ראשון: שמירה בזיכרון המכשיר (זמין אופליין מיידית)
  const orderItem: SavedOrderItem = {
    ...params,
    id: orderId,
    clientPhone: phone,
    clientName: name,
    createdAt: Date.now(),
    storedLocally: true,
    syncedToSheet: false,
    syncAttempts: 0,
  };

  saveOrderToDevice(orderItem);

  // 2. שלב שני (במקביל): שידור וסנכרון לגליון Google Sheets
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (!isOnline) {
    console.info("[DualStorage] Offline mode: Order saved to device, queued for sheet sync.");
    queueForSheetSync(orderItem);
    return orderItem;
  }

  // Attempt parallel sync
  syncItemToSheet(orderItem).catch((err) => {
    console.warn("[DualStorage] Initial sheet sync attempt failed, queued in device memory:", err);
    queueForSheetSync(orderItem);
  });

  return orderItem;
}

/**
 * שידור בפועל לגליון דרך ה-API הפנימי
 */
export async function syncItemToSheet(item: SavedOrderItem): Promise<boolean> {
  try {
    const response = await fetch("/api/sheets-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "append_order",
        order: item,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      // עדכון סטטוס בזיכרון המכשיר כ-synced
      const updated: SavedOrderItem = {
        ...item,
        syncedToSheet: true,
        sheetSyncTimestamp: Date.now(),
      };
      saveOrderToDevice(updated);
      removeFromOfflineQueue(item.id);
      return true;
    }
  } catch (err) {
    console.warn("[DualStorage] Sync to sheet error:", err);
  }
  return false;
}

function queueForSheetSync(item: SavedOrderItem): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    const queue: SavedOrderItem[] = raw ? JSON.parse(raw) : [];
    if (!queue.some((q) => q.id === item.id)) {
      queue.push(item);
      window.localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    }
  } catch (e) {
    console.warn("Error queueing offline item:", e);
  }
}

function removeFromOfflineQueue(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (!raw) return;
    const queue: SavedOrderItem[] = JSON.parse(raw);
    const filtered = queue.filter((q) => q.id !== id);
    window.localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
  } catch (e) {
    console.warn("Error updating offline queue:", e);
  }
}

export function getOfflinePendingCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    const queue: SavedOrderItem[] = raw ? JSON.parse(raw) : [];
    return queue.length;
  } catch {
    return 0;
  }
}

/**
 * שוטף את תור האופליין ומשדר מחדש לגליון ברגע שחוזר האינטרנט
 */
export async function flushOfflineQueue(): Promise<number> {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (!raw) return 0;
    const queue: SavedOrderItem[] = JSON.parse(raw);
    if (queue.length === 0) return 0;

    let synced = 0;
    for (const item of queue) {
      const ok = await syncItemToSheet(item);
      if (ok) synced++;
    }
    return synced;
  } catch {
    return 0;
  }
}

// Auto-register online recovery listener in client browser
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[DualStorage] Network restored: syncing offline queue to sheet...");
    flushOfflineQueue();
  });
}
