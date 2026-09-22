// ============================================================================
// Counter Dispatch: Route Click & Collect Orders to Warehouse 4 or 1
// Version: 3.0.0
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

export function whatsappLink(text: string, phone: string = "972504482285"): string {
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}

export function dispatchToCounter(params: DispatchCounterParams) {
  try {
    const KEY = "saban_counter_dispatches";
    const existing = JSON.parse(localStorage.getItem(KEY) || "[]");
    existing.unshift({
      ...params,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(KEY, JSON.stringify(existing.slice(0, 50)));
  } catch (err) {
    console.warn("Could not save to local storage:", err);
  }

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
