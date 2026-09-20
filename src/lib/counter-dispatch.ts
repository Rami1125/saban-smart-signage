export type DispatchOrder = {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  unitLabel: string;
  estimatedCost: number;
  note?: string;
  source: string;
  screenId?: string;
  createdAt: number;
};

const KEY = "saban.counter.dispatch.v1";

export function readDispatchQueue(): DispatchOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as DispatchOrder[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function dispatchToCounter(order: Omit<DispatchOrder, "id" | "createdAt">): DispatchOrder {
  const entry: DispatchOrder = {
    ...order,
    id: `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  if (typeof window !== "undefined") {
    const next = [entry, ...readDispatchQueue()].slice(0, 50);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  return entry;
}

export function clearDispatchQueue() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}

export const ORDER_WHATSAPP = "972508860896";

export function whatsappLink(message: string): string {
  return `https://wa.me/${ORDER_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
