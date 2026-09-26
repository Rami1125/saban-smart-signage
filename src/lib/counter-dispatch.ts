// ============================================================================
// Counter Dispatch: Route Click & Collect Orders to Warehouse 4 or 1
// Version: 3.2.0 (Added Paint Tinting Order Schema, Sample Seed & POS Sync)
// ============================================================================

import type { PaintTintOrderData } from "@/components/paint";

export interface DispatchCounterParams {
  id?: string;
  sku: string;
  productName: string;
  quantity: number;
  unitLabel: string;
  estimatedCost: number;
  note: string;
  source: string;
  screenId?: string;
  createdAt?: string;
  customerName?: string;
  customerPhone?: string;
  customerStatus?: string;
  branchName?: string;
  status?: string;
  tintDetails?: PaintTintOrderData;
}

export interface DispatchedQueueItem extends DispatchCounterParams {
  id: string;
  timestamp: string;
  createdAt: string;
}

export type DispatchOrder = DispatchedQueueItem;

export const DEFAULT_TINT_ORDER_889413: DispatchedQueueItem = {
  id: "ORD-889413",
  sku: "9889488",
  productName: "סופרקריל מט טמבור — 10 ליטר (חצי פח)",
  quantity: 1,
  unitLabel: "חצי פח",
  estimatedCost: 260,
  note: "גוון 0524T (אפור בטון עדין) | בסיס P/A | סדרה: סופרקריל מט+ | הערות: צובע 40 מ״ר, בחישה במערבל ומדבקה על המכסה",
  source: "נועה AI (צ'אט שילוט)",
  timestamp: "2026-09-26T10:15:00.000Z",
  createdAt: "2026-09-26T10:15:00.000Z",
  customerName: "ראמי מסארוה",
  customerPhone: "050-8860896",
  customerStatus: "לקוח רשום (קבלן)",
  branchName: "סניף החרש (מחסן 4)",
  status: "ממתין להכנה בדלפק ⏳",
  tintDetails: {
    orderNumber: "ORD-889413",
    dateTime: "26/09/2026 10:15",
    branch: "סניף החרש (מחסן 4)",
    source: "נועה AI (צ'אט שילוט)",
    customerName: "ראמי מסארוה",
    customerStatus: "לקוח רשום (קבלן)",
    customerPhone: "050-8860896",
    estimatedPickupTime: "11:15",
    paintItem: {
      sku: "9889488",
      name: "סופרקריל מט טמבור — 10 ליטר (חצי פח)",
      colorCode: "0524T",
      colorName: "אפור בטון עדין",
      colorHex: "#D6D5D0",
      machineBase: "בסיס P/A",
      series: "סופרקריל מט+",
      quantity: "1 חצי פח",
    },
    companions: [
      {
        sku: "554102",
        name: "רולר פרו 9 אינץ׳ מושלם עם ידית",
        quantity: "1 יח׳",
      },
      {
        sku: "663201",
        name: "סרט הדבקה מסקנטייפ שריון עמיד",
        quantity: "2 יח׳",
      },
    ],
    operatorNotes: [
      "הלקוח צובע 40 מ״ר קירות פנים.",
      "לוודא בחישה במערבל צבע וסימון מדבקת גוון 0524T על המכסה.",
    ],
    status: "ממתין להכנה בדלפק ⏳",
  },
};

const STORAGE_QUEUE_KEY = "saban_counter_dispatches";

export function whatsappLink(text: string, phone: string = "972504482285"): string {
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}

export function readDispatchQueue(): DispatchedQueueItem[] {
  if (typeof window === "undefined") return [DEFAULT_TINT_ORDER_889413];
  try {
    const raw = window.localStorage.getItem(STORAGE_QUEUE_KEY);
    if (!raw) {
      const initial = [DEFAULT_TINT_ORDER_889413];
      window.localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure ORD-889413 has its full tintDetails if present
      const has889413 = parsed.some((item) => item.id === "ORD-889413");
      if (!has889413) {
        parsed.unshift(DEFAULT_TINT_ORDER_889413);
        window.localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    const initial = [DEFAULT_TINT_ORDER_889413];
    window.localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(initial));
    return initial;
  } catch (err) {
    console.warn("Could not read dispatch queue from localStorage:", err);
    return [DEFAULT_TINT_ORDER_889413];
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
      const id = params.id || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date().toISOString();
      existing.unshift({
        ...params,
        id,
        timestamp: now,
        createdAt: params.createdAt || now,
      });
      window.localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(existing.slice(0, 50)));
    }
  } catch (err) {
    console.warn("Could not save to local storage:", err);
  }

  // הפעלת התראת OneSignal במידה וה-SDK נטען בדפדפן
  if (typeof window !== "undefined") {
    const win = window as unknown as {
      OneSignal?: {
        push: (cb: () => void) => void;
        sendSelfNotification: (title: string, message: string) => void;
      };
    };
    if (win.OneSignal) {
      try {
        win.OneSignal.push(() => {
          win.OneSignal?.sendSelfNotification(
            "ח. סבן — הזמנת איסוף חדשה 📦",
            `הזמנה עבור ${params.productName} (${params.quantity} ${params.unitLabel}) ממתינה לליקוט בדלפק.`,
          );
        });
      } catch {
        //
      }
    }
  }
}
