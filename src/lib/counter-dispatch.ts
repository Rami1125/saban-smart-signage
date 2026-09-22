// ============================================================================
// Counter Dispatch: Route Click & Collect Orders to Warehouse 4 or 1
// Version: 3.1.0 (Added queue inspection and clearance for Dashboard/Index)
// ============================================================================

export interface DispatchCounterParams {
  sku: string;
  productName: string;
  quantity: number;
  unitLabel: string;
  estimatedCost: number;
  note: string;
  source: string;
  screenId?: string;
}

export interface DispatchedQueueItem extends DispatchCounterParams {
  timestamp: string;
}

const STORAGE_QUEUE_KEY = "saban_counter_dispatches";

export function whatsappLink(text: string, phone: string = "972504482285"): string {
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}

export function readDispatchQueue(): DispatchedQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Could not read dispatch queue from localStorage:", err);
    return [];
  }
}

export function clearDispatchQueue(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_QUEUE_KEY);
  } catch (err) {
    console.warn("Could not clear dispatch queue from localStorage:", err);
  }
}

export function dispatchToCounter(params: DispatchCounterParams) {
  try {
    if (typeof window !== "undefined") {
      const existing = readDispatchQueue();
      existing.unshift({
        ...params,
        timestamp: new Date().toISOString(),
      });
      window.localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(existing.slice(0, 50)));
    }
  } catch (err) {
    console.warn("Could not save to local storage:", err);
  }

  // הפעלת התראת OneSignal במידה וה-SDK נטען בדפדפן
  if (typeof window !== "undefined" && (window as any).OneSignal) {
    try {
      (window as any).OneSignal.push(() => {
        (window as any).OneSignal.sendSelfNotification(
          "ח. סבן — הזמנת איסוף חדשה 📦",
          `הזמנה עבור ${params.productName} (${params.quantity} ${params.unitLabel}) ממתינה לליקוט בדלפק.`
        );
      });
    } catch {
      //
    }
  }
}
