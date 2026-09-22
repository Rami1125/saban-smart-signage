// ============================================================================
// File: src/components/noa/NoaChat.tsx
// Version: 2.6.0 (SabanOS Smart Signage — High-Contrast UI & Quick Action Decision Tree)
// Maintained & Upgraded: 2026-09-22
// ============================================================================

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  MessageCircle,
  Plus,
  Send,
  Trash2,
  X,
  Headset,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { dispatchToCounter, whatsappLink } from "@/lib/counter-dispatch";
import { dispatchDualPersistence } from "@/lib/dual-storage";
import { playLocationChime } from "@/lib/location-chime";
import { effectivePrice, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
};

const STORAGE_KEY = "saban.noa.threads.v1";

function newThread(): Thread {
  return {
    id: `noa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    title: "שיחה חדשה",
    updatedAt: Date.now(),
    messages: [],
  };
}

function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Thread[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveThreads(threads: Thread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads.slice(0, 20)));
}

function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

type ParsedOrder = { quantity: number; cost: number };

export type SelfPickupItem = {
  sku: string;
  productName: string;
  quantity: number;
  unit: string;
  unitWeightKg?: number;
  requiresPalletDeposit?: boolean;
};

export type SelfPickupOrder = {
  orderType: "SELF_PICKUP";
  branch: string;
  branchAddress: string;
  customerName: string;
  customerPhone: string;
  estimatedArrival: string;
  vehicleType: string;
  totalWeightKg?: number;
  vehicleFeasibility?: string;
  isWeightMismatch?: boolean;
  technicalRecommendations?: string[];
  items: SelfPickupItem[];
  status: string;
};

function parsePickupJson(text: string): SelfPickupOrder | null {
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.orderType === "SELF_PICKUP" && Array.isArray(parsed.items)) {
        return parsed as SelfPickupOrder;
      }
    }
    const directMatch = text.match(/\{[\s\S]*"orderType"\s*:\s*"SELF_PICKUP"[\s\S]*\}/);
    if (directMatch) {
      const parsed = JSON.parse(directMatch[0]);
      if (parsed.orderType === "SELF_PICKUP" && Array.isArray(parsed.items)) {
        return parsed as SelfPickupOrder;
      }
    }
  } catch {
    //
  }
  return null;
}

function stripJsonFromText(text: string): string {
  return text.replace(/```json[\s\S]*?```/g, "").trim();
}

function parseOrder(text: string): ParsedOrder | null {
  const line = text.split("\n").find((l) => l.includes("הזמנה:"));
  if (!line) return null;
  const quantity = Number(line.match(/כמות:\s*(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  const cost = Number(line.match(/עלות מוערכת:\s*([\d.,]+)/)?.[1]?.replace(/,/g, "") ?? 0);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  return { quantity, cost: Number.isFinite(cost) ? cost : 0 };
}

type QuickAction = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  prompt: string;
  badge?: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "talmid",
    icon: "🏟️",
    title: "איסוף מסניף התלמיד 6",
    subtitle: "גבס, צבע, שפכטל, פרזול וכלי עבודה",
    prompt: "אני מתכנן להגיע לסניף התלמיד 6 (חנות התלמיד 6 )",
    badge: "אולם גבס",
  },
  {
    id: "harash",
    icon: "🏭",
    title: "איסוף מסניף החרש 4",
    subtitle: "בלות חול, סומסום, שקי מלט, בלוקים וברזל",
    prompt: "אני מתכנן להגיע לסניף החרש 4 (מגרש ראשי)",
    badge: "מגרש ראשי",
  },
  {
    id: "delivery",
    icon: "🚛",
    title: "תיאום הובלה / מנוף",
    subtitle: "משאית מנוף לקומה או חלוקה ישירה לאתר",
    prompt: "אני מעוניין לתאם הובלה ופריקה באתר",
    badge: "סידור",
  },
  {
    id: "paint",
    icon: "🎨",
    title: "גיוון צבע ממוחשב",
    subtitle: "התאמת גוונים ממניפות טמבור ונירלט וכמויות",
    prompt: "אני רוצה להתייעץ על גיוון צבע והתאמת כמויות",
  },
  {
    id: "technical",
    icon: "💡",
    title: "ייעוץ ומפרט טכני",
    subtitle: "חומרי איטום, סיקה, דבקים ושיקום בטון",
    prompt: "אני צריך ייעוץ ומפרט טכני לבחירת חומרים",
  },
];

const FALLBACK_PRODUCT: Product = {
  sku: "GENERAL",
  name: "ח. סבן - איסוף עצמי מהיר",
  category: "כללי",
  basePrice: 0,
  unitLabel: "יח׳",
  supplier: "ח. סבן חומרי בניין (1994) בע״מ",
  stockQuantity: 999,
  warehouseLocation: "סניף החרש / סניף התלמיד",
  preferredWarehouse: "סניף החרש (מחסן 4 - ראשי)",
  description: "תיאום איסוף עצמי מהיר Click & Collect",
};

export function NoaChat({ product, screenId }: { product?: Product | null; screenId?: string }) {
  const currentProduct = product ?? FALLBACK_PRODUCT;
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const stored = loadThreads();
    if (stored.length) {
      setThreads(stored);
      setActiveId(stored[0]!.id);
    } else {
      const first = newThread();
      setThreads([first]);
      setActiveId(first.id);
      saveThreads([first]);
    }
  }, []);

  const activeThread = threads.find((t) => t.id === activeId) ?? null;

  const persist = (id: string, messages: UIMessage[]) => {
    setThreads((prev) => {
      const next = prev.map((thread) =>
        thread.id === id
          ? {
              ...thread,
              messages,
              updatedAt: Date.now(),
              title:
                thread.title === "שיחה חדשה" && messages.length
                  ? messageText(messages[0]!).slice(0, 34) || thread.title
                  : thread.title,
            }
          : thread,
      );
      saveThreads(next);
      return next;
    });
  };

  const createThread = () => {
    const thread = newThread();
    setThreads((prev) => {
      const next = [thread, ...prev];
      saveThreads(next);
      return next;
    });
    setActiveId(thread.id);
    setShowThreads(false);
  };

  const removeThread = (id: string) => {
    setThreads((prev) => {
      const next = prev.filter((thread) => thread.id !== id);
      const ensured = next.length ? next : [newThread()];
      saveThreads(ensured);
      if (id === activeId) setActiveId(ensured[0]!.id);
      return ensured;
    });
  };

  return (
    <>
      {!open && (
        <div className="fixed bottom-24 left-4 z-50 flex items-end gap-2.5 sm:bottom-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="פתיחת שיחה עם נועה - נציגת דלפק ראשית"
            className="animate-noa-pulse relative flex size-16 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-2xl transition-transform active:scale-95 ring-4 ring-amber-300/60 overflow-hidden"
          >
            <img
              src="https://saban-smart-signage.vercel.app/assets/noa-avatar.png"
              alt="נועה נציגת דלפק ראשית"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
              className="size-full object-cover"
            />
            <span className="hidden size-full items-center justify-center bg-amber-400 text-slate-950 font-bold text-sm">
              <Headset className="size-7" />
            </span>
            <span className="absolute bottom-1 right-1 size-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
          </button>
          <div
            onClick={() => setOpen(true)}
            role="button"
            tabIndex={0}
            style={{ backgroundColor: "#0f172a" }}
            className="animate-noa-pop max-w-[16rem] rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-white shadow-2xl border-2 border-amber-400 cursor-pointer hover:border-amber-300 transition-all select-none"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="font-extrabold text-[13px] text-amber-300 flex items-center gap-1">
                <span>נועה ❤️</span>
                <span className="text-[11px] font-bold text-slate-200">דלפק ראשית</span>
              </span>
              <span className="rounded-md bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.5 shadow-xs">
                סבן
              </span>
            </div>
            <p className="text-slate-100 font-bold text-xs leading-normal opacity-100">
              תיאום איסוף עצמי מהיר (Click & Collect) בסניפי החרש 4 והתלמיד 6.
            </p>
          </div>
        </div>
      )}

      {open && (
        <div
          className={cn(
            "animate-noa-pop fixed z-50 flex flex-col overflow-hidden rounded-3xl border bg-card shadow-2xl transition-all duration-300",
            isExpanded
              ? "inset-2 sm:inset-6 md:inset-10 lg:inset-x-24 lg:inset-y-12"
              : "inset-x-2 bottom-2 h-[85vh] max-h-[44rem] sm:inset-x-auto sm:left-6 sm:w-[28rem]",
          )}
        >
          <header className="flex items-center gap-2 border-b bg-slate-900 px-3.5 py-2.5 text-white">
            <div className="relative flex size-10 items-center justify-center rounded-full bg-amber-400/20 ring-2 ring-amber-400 overflow-hidden shrink-0">
              <img
                src="https://saban-smart-signage.vercel.app/assets/noa-avatar.png"
                alt="נועה | נציגת דלפק ראשית"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
                className="size-full object-cover"
              />
              <span className="hidden size-full items-center justify-center bg-amber-400 text-slate-950 font-black text-sm">
                👷‍♀️
              </span>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border border-white" />
            </div>
            <div className="flex-1 leading-tight text-right">
              <p className="text-sm font-black text-white flex items-center gap-1.5">
                <span>נועה | נציגת דלפק ראשית</span>
                <span className="text-xs">❤️</span>
              </p>
              <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                מחוברת • דלפק מכירות ואיסוף עצמי (סניפי הוד השרון)
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-label={isExpanded ? "הקטנת חלון" : "הרחבת חלון צ'אט"}
              title={isExpanded ? "הקטן חלון" : "הרחב חלון צ'אט"}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowThreads((value) => !value)}
              aria-label="רשימת שיחות"
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <MessageCircle className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={createThread}
              aria-label="שיחה חדשה"
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <Plus className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="סגירה"
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <X className="size-4" />
            </Button>
          </header>

          {showThreads && (
            <div className="max-h-44 shrink-0 overflow-y-auto border-b bg-muted/60 px-2 py-2">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs",
                    thread.id === activeId ? "bg-amber-400/20 font-bold text-amber-900 dark:text-amber-300" : "hover:bg-accent",
                  )}
                >
                  <button
                    type="button"
                    className="flex-1 truncate text-right font-medium"
                    onClick={() => {
                      setActiveId(thread.id);
                      setShowThreads(false);
                    }}
                  >
                    {thread.title}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="מחיקת שיחה"
                    onClick={() => removeThread(thread.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {activeThread && (
            <NoaPane
              key={activeThread.id}
              thread={activeThread}
              product={currentProduct}
              screenId={screenId}
              onPersist={persist}
            />
          )}
        </div>
      )}
    </>
  );
}

function NoaPane({
  thread,
  product: rawProduct,
  screenId,
  onPersist,
}: {
  thread: Thread;
  product?: Product | null;
  screenId?: string;
  onPersist: (id: string, messages: UIMessage[]) => void;
}) {
  const product = rawProduct ?? FALLBACK_PRODUCT;
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { sku: product.sku } }),
    [product.sku],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: thread.id,
    messages: thread.messages,
    transport,
    onError: (err) => toast.error(err.message || "השירות אינו זמין כרגע"),
  });

  useEffect(() => {
    if (messages.length) onPersist(thread.id, messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, status, thread.id]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [status]);

  const busy = status === "submitted" || status === "streaming";
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastAssistantText = lastAssistant ? messageText(lastAssistant) : "";
  const pickupOrder = lastAssistant ? parsePickupJson(lastAssistantText) : null;
  const order = lastAssistant && !pickupOrder ? parseOrder(lastAssistantText) : null;

  const submit = async (customText?: string) => {
    const text = (customText ?? input).trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  };

  const dispatchPickup = async (pOrder: SelfPickupOrder) => {
    const isTalmid = pOrder.branch.includes("תלמיד") || pOrder.branch.includes("1");
    const branchName = isTalmid ? "סניף התלמיד (מחסן 1)" : "סניף החרש (מחסן 4)";
    const warehouse = isTalmid ? "סניף התלמיד (מחסן 1 - גבס וצבע)" : "סניף החרש (מחסן 4 - ראשי)";

    for (const item of pOrder.items) {
      dispatchToCounter({
        sku: item.sku || product.sku,
        productName: item.productName || product.name,
        quantity: item.quantity,
        unitLabel: item.unit || product.unitLabel,
        estimatedCost: item.quantity * effectivePrice(product),
        note: `איסוף עצמי (${pOrder.customerName}, ${pOrder.estimatedArrival}, ${pOrder.vehicleType}) | ${branchName}`,
        source: "self_pickup_coordinator",
        ...(screenId ? { screenId } : {}),
      });

      await dispatchDualPersistence({
        sku: item.sku || product.sku,
        productName: item.productName || product.name,
        quantity: item.quantity,
        unitLabel: item.unit || product.unitLabel,
        unitPrice: effectivePrice(product),
        estimatedCost: item.quantity * effectivePrice(product),
        warehouse,
        branchName,
        note: `תיאום איסוף עצמי מהיר Click & Collect: ${pOrder.customerName} (${pOrder.customerPhone}) | רכב: ${pOrder.vehicleType} | מועד: ${pOrder.estimatedArrival}`,
        source: "סדרן דיגיטלי חכם (Click & Collect)",
        screenId: screenId || "pwa_pickup",
      });
    }

    // Log consultation to Google Sheets
    fetch("/api/sheets-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "log_chat",
        chat: {
          sku: pOrder.items[0]?.sku || product.sku,
          productName: pOrder.items
            .map((it) => `${it.productName} (${it.quantity} ${it.unit})`)
            .join(", "),
          branch: branchName,
          question: `איסוף עצמי: ${pOrder.customerName}, ${pOrder.customerPhone}, הגעה: ${pOrder.estimatedArrival}, רכב: ${pOrder.vehicleType}`,
          answer: `סוכם כרטיס איסוף עצמי עם ${pOrder.items.length} פריטים`,
          quantity: pOrder.items.reduce((acc, cur) => acc + (cur.quantity || 1), 0),
          cost: 0,
          dispatched: true,
        },
      }),
    }).catch((err) => console.warn("Could not log chat to sheets:", err));

    playLocationChime("dispatch");
    toast.success("כרטיס האיסוף שודר בהצלחה לדלפק ולמחסנאים! 🚀", {
      description: `ההזמנה ממתינה לליקוט ב${branchName}`,
    });
  };

  const dispatch = async () => {
    if (!order) return;
    dispatchToCounter({
      sku: product.sku,
      productName: product.name,
      quantity: order.quantity,
      unitLabel: product.unitLabel,
      estimatedCost: order.cost || order.quantity * effectivePrice(product),
      note: "סוכם עם הסדרן הדיגיטלי",
      source: "noa_chat",
      ...(screenId ? { screenId } : {}),
    });

    // Dual persistence: Device memory + Google Sheets sync
    await dispatchDualPersistence({
      sku: product.sku,
      productName: product.name,
      quantity: order.quantity,
      unitLabel: product.unitLabel,
      unitPrice: effectivePrice(product),
      estimatedCost: order.cost || order.quantity * effectivePrice(product),
      warehouse: product.preferredWarehouse || "סניף החרש (מחסן 4 - ראשי)",
      branchName: "סניף החרש",
      note: "סוכם עם הסדרן הדיגיטלי 📦",
      source: "סדרן דיגיטלי חכם (PWA)",
      screenId: screenId || "pwa_noa",
    });

    // Log consultation to Google Sheets
    fetch("/api/sheets-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "log_chat",
        chat: {
          sku: product.sku,
          productName: product.name,
          branch: product.preferredWarehouse || "סניף החרש",
          question: messages
            .filter((m) => m.role === "user")
            .map((m) => messageText(m))
            .slice(-2)
            .join(" | "),
          answer: lastAssistant ? messageText(lastAssistant).slice(0, 400) : "",
          quantity: order.quantity,
          cost: order.cost,
          dispatched: true,
        },
      }),
    }).catch((err) => console.warn("Could not log chat to sheets:", err));

    playLocationChime("dispatch");
    toast.success("ההזמנה שודרה לדלפק וסונכרנה לגליון סבן");
  };

  const getWhatsappPickupMessage = (pOrder: SelfPickupOrder): string => {
    const isTalmid = pOrder.branch.includes("תלמיד") || pOrder.branch.includes("1");
    const branchLabel = isTalmid
      ? "סניף התלמיד (מחסן 1) — רחוב התלמיד 6, הוד השרון"
      : "סניף החרש (מחסן 4) — רחוב החרש 4, הוד השרון";

    const itemsText = pOrder.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.productName}${it.sku ? ` (מק״ט ${it.sku})` : ""} — כמות: ${it.quantity} ${it.unit}${
            it.requiresPalletDeposit ? " [כולל פיקדון משטח]" : ""
          }`,
      )
      .join("\n");

    const totalWeight =
      pOrder.totalWeightKg ??
      pOrder.items.reduce((acc, it) => {
        const itemWeight =
          it.unitWeightKg || (it.sku === "112260" || it.sku === "111260" ? 27 : 25);
        return acc + (it.quantity || 1) * itemWeight;
      }, 0);

    const weightStatus =
      totalWeight <= 300
        ? "מאושר לכל רכב פרטי / מסחרי קל (עד 300 ק״ג)"
        : totalWeight <= 700
          ? "מתאים לטנדר / מסחרית גדולה (300 עד 700 ק״ג)"
          : "דורש טנדר כבד, עגלה נגררת או משאית פתוחה להעמסה עם מלגזה (מעל 700 ק״ג)";

    return `📦 *הזמנה לאיסוף עצמי — ח. סבן*
*סניף יעד:* ${branchLabel}
*שם הלקוח:* ${pOrder.customerName}
*טלפון:* ${pOrder.customerPhone}
*מועד הגעה משוער:* ${pOrder.estimatedArrival} | *רכב:* ${pOrder.vehicleType}
*משקל כולל משוער:* ${totalWeight.toLocaleString()} ק״ג
*בקרת רכב והעמסה:* ${pOrder.isWeightMismatch ? "⚠️ התראת חריגת משקל לרכב המבוקש!" : "מאושר"}

📋 *פירוט הפריטים לליקוט:*
${itemsText}

⚖️ *הנחיות בטיחות רכב:* ${weightStatus}
${pOrder.isWeightMismatch ? "⚠️ יש לשים לב: משקל המטען עולה על כושר הנשיאה של הרכב. מומלץ לפצל סבבים או לתאם משאית.\n" : ""}
⚠️ *הנחיות הגעה:* הצוות יחל בליקוט המוצרים כדי שיהיו מוכנים בדלפק. עם הגעתך, יש לגשת לדלפק המכירות למסירת מספר הטלפון והסדרת תשלום/תעודה.`;
  };

  return (
    <>
      <Conversation className="flex-1 bg-slate-50/70 dark:bg-slate-950/40">
        <ConversationContent className="gap-3 px-3 py-3">
          {messages.length === 0 && (
            <div className="space-y-3">
              <div
                style={{ backgroundColor: "#0d3c84" }}
                className="rounded-2xl p-3.5 text-sm leading-relaxed border border-blue-600 shadow-md text-white"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">❤️</span>
                  <div>
                    <p
                      style={{ color: "#e9f0f9", fontWeight: "bold", fontSize: "16px" }}
                      className="leading-tight"
                    >
                      שלום! כאן נועה
                    </p>
                    <p className="text-[11px] text-blue-200 font-semibold">
                      נציגת דלפק ראשית — ח. סבן חומרי בניין (1994) בע״מ
                    </p>
                  </div>
                </div>
                <p className="text-white font-medium text-xs leading-relaxed">
                  אני כאן כדי לתאם עבורך הזמנה לאיסוף עצמי מהיר (&quot;Click & Collect&quot;) לפני
                  הגעתך למגרש, לוודא זמינות בסניפי הוד השרון ולהכין את הפריטים לליקוט.
                </p>
                {product && (
                  <div className="text-xs font-semibold text-blue-100 mt-2.5 border-t border-blue-400/30 pt-2 flex items-center justify-between gap-2">
                    <div>
                      <span>סרקת כרגע: </span>
                      <strong className="text-white font-black">{product.name}</strong> (מק״ט{" "}
                      <span className="font-mono">{product.sku}</span>)
                    </div>
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="size-12 rounded-lg object-contain bg-white/10 p-0.5 border border-white/20"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-500" />
                    <span>בחר פעולה מהירה להתחלה:</span>
                  </p>
                  <span className="text-[10px] text-muted-foreground font-semibold">לחץ לניתוב מהיר</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      disabled={busy}
                      onClick={() => void submit(action.prompt)}
                      className="group relative flex flex-col items-start rounded-xl border-2 border-border/80 bg-card p-2.5 text-right transition-all hover:border-amber-500 hover:bg-amber-50/20 active:scale-[0.98] shadow-xs"
                    >
                      {action.badge && (
                        <span className="absolute top-2 left-2 rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-black text-amber-900 dark:text-amber-300 border border-amber-400/40">
                          {action.badge}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base group-hover:scale-110 transition-transform">
                          {action.icon}
                        </span>
                        <span className="text-xs font-black text-foreground">
                          {action.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                        {action.subtitle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((message) => {
            const rawText = messageText(message);
            if (!rawText) return null;
            const text = stripJsonFromText(rawText);
            if (!text) return null;

            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={cn("flex w-full my-1.5", isUser ? "justify-start" : "justify-end")}
              >
                {isUser ? (
                  // בועת לקוח - עיצוב צהוב סבן מובטח ללא תלות ברקע כהה
                  <div
                    style={{
                      backgroundColor: "#f59e0b",
                      color: "#020617",
                    }}
                    className="max-w-[85%] rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-md border-2 border-amber-600/40 text-slate-950 font-bold text-sm leading-relaxed"
                  >
                    <p
                      className="whitespace-pre-line m-0 font-bold select-text"
                      style={{ color: "#020617" }}
                    >
                      {text}
                    </p>
                  </div>
                ) : (
                  // בועת נועה - עיצוב דלפק לבן ונקי עם פונט חד, קריא וניגודיות מלאה
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                    }}
                    className="max-w-[92%] rounded-2xl rounded-tl-xs px-4 py-3 shadow-sm border border-slate-200 text-slate-900 text-sm leading-relaxed"
                  >
                    <MessageResponse className="[&_p]:leading-relaxed [&_p]:font-medium [&_p]:text-slate-900 [&_strong]:font-black [&_strong]:text-slate-950 [&_li]:font-medium [&_li]:text-slate-900 [&_img]:rounded-xl [&_img]:border [&_img]:border-slate-200 [&_img]:shadow-md [&_img]:my-2.5 [&_img]:max-h-56 [&_img]:w-auto [&_img]:object-contain [&_img]:bg-white [&_img]:p-1.5">
                      {text}
                    </MessageResponse>
                  </div>
                )}
              </div>
            );
          })}
          {busy && (
            <Shimmer className="px-1 text-sm font-medium">
              נועה בודקת זמינות מלאי ומחשבת עבורך...
            </Shimmer>
          )}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive space-y-2">
              <p className="font-semibold">חלה שגיאה זמנית בהתחברות לסדרן הדיגיטלי.</p>
              <p className="text-[11px] text-muted-foreground">
                ניתן לשלוח הודעה נוספת או להעביר את פרטי ההזמנה ישירות לוואטסאפ של מוקד סבן.
              </p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="secondary" className="h-7 text-xs font-semibold" asChild>
                  <a
                    href={whatsappLink(
                      `שלום מוקד סבן, אני מעוניין בתיאום איסוף עצמי של ${product.name} (מק״ט ${product.sku}).`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    מעבר לוואטסאפ מוקד סבן 📲
                  </a>
                </Button>
              </div>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Pickup Order Card */}
      {pickupOrder && (
        <div className="space-y-2.5 border-t bg-accent/80 p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-amber-400 text-slate-950 px-2 py-0.5 text-[11px] font-black shadow-xs">
              📦 כרטיס איסוף עצמי מוכן
            </span>
            <span className="text-[11px] font-bold text-muted-foreground">
              {pickupOrder.status || "ממתין לליקוט"}
            </span>
          </div>

          <div className="rounded-xl border bg-card p-2.5 text-xs space-y-1.5">
            <div className="flex justify-between border-b pb-1.5 font-medium">
              <span>
                סניף:{" "}
                {pickupOrder.branch.includes("תלמיד")
                  ? "התלמיד 6 (אולם גבס)"
                  : "החרש 4 (מגרש ראשי)"}
              </span>
              <span className="text-muted-foreground font-bold">הגעה: {pickupOrder.estimatedArrival}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>
                לקוח: {pickupOrder.customerName} ({pickupOrder.customerPhone})
              </span>
              <span>רכב: {pickupOrder.vehicleType}</span>
            </div>

            {/* בקרת משקל ובטיחות רכב */}
            {(() => {
              const calcWeight =
                pickupOrder.totalWeightKg ??
                pickupOrder.items.reduce((acc, it) => {
                  const itemWeight =
                    it.unitWeightKg || (it.sku === "112260" || it.sku === "111260" ? 27 : 25);
                  return acc + (it.quantity || 1) * itemWeight;
                }, 0);
              const isMismatch =
                pickupOrder.isWeightMismatch ||
                (pickupOrder.vehicleType.includes("פרטי") && calcWeight > 300);

              return (
                <div
                  className={`rounded-lg p-2 text-[11px] border ${
                    isMismatch
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                      : "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>⚖️ משקל כולל משוער: {calcWeight.toLocaleString()} ק״ג</span>
                    <span className="text-[10px] uppercase font-mono">
                      {calcWeight <= 300
                        ? "רכב פרטי/קל"
                        : calcWeight <= 700
                          ? "טנדר/מסחרית"
                          : "משאית/מלגזה"}
                    </span>
                  </div>
                  {isMismatch && (
                    <p className="mt-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                      ⚠️ חריגת משקל לרכב הלקוח! מומלץ לפצל את האיסוף לשני סבבים או לתאם משאית.
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="pt-1 text-[11px] space-y-1">
              <p className="font-semibold text-foreground">פריטים לליקוט:</p>
              {pickupOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between pr-2 text-muted-foreground">
                  <span>• {it.productName}</span>
                  <span className="font-bold text-foreground">
                    {it.quantity} {it.unit}
                  </span>
                </div>
              ))}
            </div>

            {/* המלצות טכניות ומשלימים */}
            {pickupOrder.technicalRecommendations &&
              pickupOrder.technicalRecommendations.length > 0 && (
                <div className="rounded-lg bg-muted/60 p-2 text-[10px] space-y-0.5 border">
                  <span className="font-bold text-foreground">💡 דגשים מקצועיים:</span>
                  {pickupOrder.technicalRecommendations.map((rec, rIdx) => (
                    <p key={rIdx} className="text-muted-foreground">
                      {rec}
                    </p>
                  ))}
                </div>
              )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 font-bold text-xs bg-amber-400 hover:bg-amber-500 text-slate-950"
              onClick={() => void dispatchPickup(pickupOrder)}
            >
              שדר כרטיס לדלפק 🚀
            </Button>
            <Button size="sm" variant="secondary" className="flex-1 font-bold text-xs" asChild>
              <a
                href={whatsappLink(getWhatsappPickupMessage(pickupOrder))}
                target="_blank"
                rel="noreferrer"
              >
                שליחה בוואטסאפ 📲
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Standard single product order banner (fallback) */}
      {!pickupOrder && order && (
        <div className="space-y-2 border-t bg-accent/60 px-3 py-2">
          <p className="text-xs font-semibold">
            סיכום: {order.quantity} {product.unitLabel} · {product.name}
          </p>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={dispatch}>
              שדר לדלפק המכירות
            </Button>
            <Button size="sm" variant="secondary" className="flex-1" asChild>
              <a
                href={whatsappLink(
                  `שלום, מעוניין באיסוף עצמי של ${product.name} (מק״ט ${product.sku}) — כמות: ${order.quantity} ${product.unitLabel}.`,
                )}
                target="_blank"
                rel="noreferrer"
              >
                שליחה בוואטסאפ
              </a>
            </Button>
          </div>
        </div>
      )}

      <div className="border-t bg-card px-3 py-2">
        <PromptInput
          onSubmit={(_message, event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="רשום מוצרים, כמויות, סניף מבוקש או שעת הגעה..."
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() || busy}>
              <Send className="size-4" />
            </PromptInputSubmit>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  );
}
## פורמט פלט מובנה (Developer JSON Block)
בסוף הודעת הסיכום הסופית, הוסיפי תמיד בלוק JSON תקין במבנה הבא:
\`\`\`json
{
  "orderType": "SELF_PICKUP",
  "branch": "החרש_מחסן_4", // או "התלמיד_מחסן_1"
  "branchAddress": "רחוב החרש 4, הוד השרון",
  "customerName": "ישראל ישראלי",
  "customerPhone": "050-0000000",
  "estimatedArrival": "14:30",
  "vehicleType": "טנדר",
  "totalWeightKg": 250,
  "vehicleFeasibility": "מאושר (עד 300 ק״ג)", // או "טנדר/מסחרית (300-700 ק״ג)" או "דורש טנדר כבד/נגרר/משאית (>700 ק״ג)"
  "isWeightMismatch": false,
  "items": [
    {
      "sku": "10002",
      "productName": "מלט אפור 25 ק״ג נשר",
      "quantity": 10,
      "unit": "שק",
      "unitWeightKg": 25,
      "requiresPalletDeposit": false
    }
  ],
  "technicalRecommendations": [
    "מומלץ שימוש ב..."
  ],
  "status": "ממתין לליקוט ⏳"
}
\`\`\`

---

## קטלוג מוצרים פעיל מתוך גיליון 📦 קטלוג_מוצרים של ח. סבן:
${catalog}

${product ? `המוצר שהלקוח סרק כרגע ב-QR מתוך גיליון 📦 קטלוג_מוצרים:\n${productBrief(product)}` : "הלקוח טרם סרק מוצר ספציפי."}`;
}

const OFFICIAL_IMAGES: Record<string, { name: string; url: string }> = {
  "10701": {
    name: "סיקה טופ 107",
    url: "https://www.ramo.co.il/_next/image?url=https%3A%2F%2Ffsta9bejnq4gsbv5.public.blob.vercel-storage.com%2Fproducts%2Fimage-1780415805788-b0d4nb.png&w=1920&q=80",
  },
  "19255": {
    name: "סיקה סרם 255 סטארפלקס",
    url: "https://gilar.co.il/wp-content/uploads/2020/03/GLR_MOCKUP_SITE_PICS_013.webp",
  },
  "15181": {
    name: "טיט לריצוף 181 כרמית מיסטר פיקס",
    url: "https://www.carmit-mrfix.com/wp-content/uploads/2023/12/%D7%98%D7%99%D7%98-%D7%9C%D7%A8%D7%99%D7%A6%D7%95%D7%A3-181-724x1024.png",
  },
  "10002": {
    name: "מלט אפור 25 ק״ג נשר",
    url: "https://cdn.prod.website-files.com/64dc5ee93ec6291b90e749a1/651448e928ffb08b62e4afe4_7.webp",
  },
  "15680": {
    name: "סיקפלקס FC11 תרמיל",
    url: "https://sika.scene7.com/is/image/sikacs/au-Sikaflex-11FC-Purform-02198888:1-1?fmt=webp-alpha",
  },
  "14075": {
    name: "טיח גבס MP75 קנאוף",
    url: "https://media.knauf.com/a/5EmPWu3sHCqd9fMMW4iZ27?fit=wrap&fmt=webp&hei=400",
  },
  "15090": {
    name: "רוקבונד שפכטל אמריקאי 28 ק״ג",
    url: "https://saban-smart-signage.vercel.app/assets/product-waterproof-pail.jpg",
  },
  "112260": {
    name: "לוח גבס ירוק 260 טמבור/אורבונד",
    url: "https://b2b.tambour.co.il/sfsites/c/cms/delivery/media/MCQYV5PDLBJ5HYFCKWKDS74NZNNI",
  },
  "111260": {
    name: "לוח גבס לבן 260",
    url: "https://b2b.tambour.co.il/sfsites/c/cms/delivery/media/MCQYV5PDLBJ5HYFCKWKDS74NZNNI",
  },
  "11501": {
    name: "חול ים / טיט שק גדול",
    url: "https://saban-smart-signage.vercel.app/assets/product-adhesive-bag.jpg",
  },
  "11511": {
    name: "סומסום לריצוף שק גדול",
    url: "https://saban-smart-signage.vercel.app/assets/product-adhesive-bag.jpg",
  },
};

function getProductImageMarkdown(product?: Product, customSku?: string): string {
  const targetSku = customSku || product?.sku;
  if (targetSku && OFFICIAL_IMAGES[targetSku]) {
    const item = OFFICIAL_IMAGES[targetSku];
    return `\n![${item.name}](${item.url})\n`;
  }
  if (product?.image) {
    return `\n![${product.name}](${product.image})\n`;
  }
  return "";
}

function buildFallbackResponse(product: Product | undefined, userText: string): string {
  const t = userText.trim();
  const lower = t.toLowerCase();

  // תרחיש ב׳: התראת "ההזמנה שלך מוכנה בדלפק" (Order Ready Alert)
  const isStatusCheck =
    lower.includes("מוכנ") ||
    lower.includes("סטטוס") ||
    lower.includes("בדרך") ||
    lower.includes("מגיע") ||
    lower.includes("מחכה") ||
    lower.includes("מוכן לאיסוף");

  if (isStatusCheck) {
    const branchName =
      lower.includes("תלמיד") || lower.includes("גבס") ? "סניף התלמיד 6" : "סניף החרש 4";
    const pName = product ? product.name : "סיקה טופ 107 (ערכה 25 ק״ג)";
    const pSku = product ? product.sku : "10701";
    const imageMd = getProductImageMarkdown(product, pSku);

    return `בוקר אור! 🌞
ההזמנה שלך מוכנה וממתינה לך בדלפק ${branchName}!

📦 פירוט הפריטים שהוכנו:
- 2 יחידות ${pName} (מק״ט ${pSku})
${imageMd}
📍 הוראות הגעה:
עם כניסתך למגרש, גש ישירות לדלפק המכירות ומסור את שמך או מספר הטלפון. 
הצוות בחצר כבר ערוך להעמסה מהירה לרכב. נסיעה טובה!`;
  }

  // בדיקת כללים טכניים ייעודיים
  let technicalNote = "";
  let companionRecommendation = "";
  let calculatedCoverage = product?.coveragePerUnitM2 || 1;
  let activeSku = product?.sku || "";

  if (
    product?.sku === "10701" ||
    t.includes("10701") ||
    lower.includes("סיקה טופ") ||
    lower.includes("107")
  ) {
    activeSku = "10701";
    calculatedCoverage = 12.5;
    technicalNote =
      "💡 **דגש טכני למק״ט 10701 (סיקה טופ 107):** כושר כיסוי 12.5 מ״ר לערכה (25 ק״ג) בשתי שכבות.";
    companionRecommendation =
      "📌 **מוצרי חובה משלימים:** חובה להשתמש בסיקה לטקס SBR (מק״ט 10702) לרולקות בחיבורי רצפה-קיר ורשת שריון פיברגלס בין השכבות.";
  } else if (
    product?.sku === "15181" ||
    t.includes("15181") ||
    lower.includes("181") ||
    lower.includes("ריצופית")
  ) {
    activeSku = "15181";
    calculatedCoverage = 5.0;
    technicalNote =
      "💡 **דגש טכני למק״ט 15181 (טיט לריצוף 181 כרמית):** כושר כיסוי כ-5 מ״ר לשק (בעובי תקני 5 מ״מ).";
    companionRecommendation =
      "📌 **מוצרי חובה משלימים:** חובה להצטייד בספייסרים (מרווחונים) לפוגות תקניות וברובה גמישה לאטימת המישקים.";
  } else if (
    product?.sku === "14075" ||
    t.includes("14075") ||
    lower.includes("mp75") ||
    lower.includes("טיח גבס")
  ) {
    activeSku = "14075";
    calculatedCoverage = 2.5;
    technicalNote =
      "💡 **דגש טכני למק״ט 14075 (טיח גבס MP75 קנאוף):** כושר כיסוי 2.5 מ״ר לשק בעובי 10 מ״מ.";
    companionRecommendation =
      "📌 **הנחיית ביצוע קריטית:** חובה לוודא קיום ויישום פריימר בטונקונטקט על גבי בטון יצוק לפני יישום טיח הגבס למניעת כשלים.";
  } else if (
    product?.sku === "112260" ||
    product?.sku === "111260" ||
    t.includes("112260") ||
    t.includes("111260") ||
    lower.includes("לוח גבס")
  ) {
    activeSku = "112260";
    calculatedCoverage = 3.12;
    technicalNote =
      "💡 **דגש טכני ללוחות גבס (111260 / 112260):** שטח כל לוח הינו בדיוק 3.12 מ״ר (1.20 מ׳ × 2.60 מ׳).";
    companionRecommendation =
      "📌 **מומלץ להצטייד:** ברגי גבס 25 מ״מ שחורים (מק״ט 76206) ומסלולים/ניצבים תואמים לקונסטרוקציה.";
  }

  // בדיקת אזכור שטח מ"ר
  const matchArea = t.match(/(\d+(?:\.\d+)?)\s*(?:מ"ר|מר|מטר|מ״ר)/);
  if (matchArea && product) {
    const area = parseFloat(matchArea[1]);
    const price = effectivePrice(product);
    const requiredUnits = Math.ceil((area / calculatedCoverage) * 1.1);
    const totalCost = (requiredUnits * price).toLocaleString("he-IL");
    const isPallet = requiredUnits >= (product.unitsPerPallet || 40);
    const totalWeightKg =
      requiredUnits *
      (product.unitWeight ? parseFloat(product.unitWeight.replace(/[^\d.]/g, "")) || 25 : 25);

    let vehicleAdvice = "מאושר להעמסה בכל רכב פרטי / מסחרי קל (עד 300 ק״ג).";
    if (totalWeightKg > 700 || isPallet) {
      vehicleAdvice =
        "⚠️ **בקרת משקל:** משקל כולל מוערך כ-" +
        totalWeightKg.toLocaleString() +
        " ק״ג (מעל 700 ק״ג / משטח). דורש טנדר כבד, עגלה נגררת או משאית פתוחה להעמסה במלגזה!";
    } else if (totalWeightKg > 300) {
      vehicleAdvice =
        "⚖️ **בקרת משקל:** משקל כולל מוערך כ-" +
        totalWeightKg.toLocaleString() +
        " ק״ג. מתאים לטנדר או מסחרית גדולה (ברלינגו/טרנזיט). אינו מורשה ברכב פרטי!";
    }

    const imageMd = getProductImageMarkdown(product, activeSku);

    return `היי, נועה כאן! ❤️
עבור שטח של ${area} מ״ר (כולל 10% פחת תקני), נדרשים **${requiredUnits} ${product.unitLabel}** של ${product.name}.
עלות משוערת: ${totalCost} ₪.

${imageMd}
${technicalNote ? technicalNote + "\n" : ""}${companionRecommendation ? companionRecommendation + "\n" : ""}
${vehicleAdvice}
${isPallet ? "⚠️ שים לב: כמות זו מגיעה במשטח שלם ומחייבת פיקדון משטח סבן (מק״ט 60060).\n" : ""}
כדי שנכין עבורך את ההזמנה לאיסוף מהיר בסניף, אנא רשום לי:
1. לאיזה סניף תרצה להגיע (החרש 4 לחומרים כבדים או התלמיד 6 לגבס וצבע)?
2. שמך המלא ומספר טלפון
3. שעת הגעה משוערת וסוג רכב שברשותך (לצורך בקרת בטיחות העמסה)`;
  }

  // בדיקה אם הלקוח סיפק פרטי הגעה / טלפון
  const hasPhone = /05\d-?\d{7}/.test(t);
  const mentionsHarash = t.includes("חרש") || t.includes("4");
  const mentionsTalmid = t.includes("תלמיד") || t.includes("6");

  if (hasPhone || (t.length > 20 && (mentionsHarash || mentionsTalmid))) {
    const branchName = mentionsTalmid
      ? "סניף התלמיד 6 (אולם גבס, צבע ופרזול)"
      : "סניף החרש 4 (מגרש ראשי לחומרים כבדים)";
    const branchKey = mentionsTalmid ? "התלמיד_מחסן_1" : "החרש_מחסן_4";
    const branchAddress = mentionsTalmid ? "רחוב התלמיד 6, הוד השרון" : "רחוב החרש 4, הוד השרון";
    const pName = product ? product.name : "חומרי בניין לליקוט";
    const pSku = product ? product.sku : activeSku || "10002";
    const pUnit = product ? product.unitLabel : "שק";
    const qty = 10;
    const unitWeight = product?.sku === "112260" || product?.sku === "111260" ? 27 : 25;
    const totalWeight = qty * unitWeight;
    const vehicleText = t.includes("פרטי")
      ? "רכב פרטי"
      : t.includes("משאית")
        ? "משאית"
        : "טנדר / מסחרית";
    const isMismatch = t.includes("פרטי") && totalWeight > 300;
    const imageMd = getProductImageMarkdown(product, pSku);

    return `מעולה, כאן נועה! ההזמנה שלך נקלטה ומועברת לליקוט מהיר במגרש. הנה כרטיס האיסוף המלא שלך:

📦 *הזמנה לאיסוף עצמי — ח. סבן*
*סניף יעד:* ${branchName} (${branchAddress})
*שם הלקוח:* לקוח סבן
*טלפון:* ${t.match(/05\d-?\d{7}/)?.[0] || "נמסר בהודעה"}
*מועד הגעה משוער:* בקרוב | *רכב:* ${vehicleText}
*משקל כולל משוער:* ${totalWeight} ק״ג | *סטטוס בקרת רכב:* ${isMismatch ? "⚠️ התראת עומס יתר לרכב פרטי" : "מאושר להעמסה"}

📋 *פירוט הפריטים לליקוט:*
1. ${pName} (מק״ט ${pSku}) — כמות: ${qty} ${pUnit} (${totalWeight} ק״ג)
${imageMd}
${technicalNote ? technicalNote + "\n" : ""}${companionRecommendation ? companionRecommendation + "\n" : ""}
⚖️ *בקרת משקל ובטיחות רכב:* ${
      totalWeight <= 300
        ? "מאושר לכל רכב פרטי / מסחרי קל (עד 300 ק״ג)."
        : totalWeight <= 700
          ? "מתאים לטנדר / מסחרית גדולה (300 עד 700 ק״ג)."
          : "דורש טנדר כבד, עגלה נגררת או משאית פתוחה להעמסה עם מלגזה (מעל 700 ק״ג)."
    }
${isMismatch ? "⚠️ **אזהרת בטיחות:** משקל המטען עולה על 300 ק״ג ואינו מורשה ברכב פרטי. מומלץ לפצל את האיסוף לשני סבבים או להגיע עם טנדר.\n" : ""}
⚠️ *הנחיות הגעה:* הצוות יחל בליקוט המוצרים כדי שיהיו מוכנים בדלפק. עם הגעתך, יש לגשת לדלפק המכירות למסירת מספר הטלפון והסדרת תשלום/תעודה.

\`\`\`json
{
  "orderType": "SELF_PICKUP",
  "branch": "${branchKey}",
  "branchAddress": "${branchAddress}",
  "customerName": "לקוח סבן",
  "customerPhone": "${t.match(/05\d-?\d{7}/)?.[0] || "050-0000000"}",
  "estimatedArrival": "בתיאום",
  "vehicleType": "${vehicleText}",
  "totalWeightKg": ${totalWeight},
  "vehicleFeasibility": "${totalWeight <= 300 ? "מאושר (עד 300 ק״ג)" : totalWeight <= 700 ? "טנדר/מסחרית (300-700 ק״ג)" : "טנדר כבד/משאית (>700 ק״ג)"}",
  "isWeightMismatch": ${isMismatch},
  "items": [
    {
      "sku": "${pSku}",
      "productName": "${pName}",
      "quantity": ${qty},
      "unit": "${pUnit}",
      "unitWeightKg": ${unitWeight},
      "requiresPalletDeposit": false
    }
  ],
  "technicalRecommendations": [
    ${companionRecommendation ? `"${companionRecommendation.replace(/"/g, "'")}"` : '"הקפדה על הוראות היצרן והוראות בטיחות"'}
  ],
  "status": "ממתין לליקוט ⏳"
}
\`\`\``;
  }

  const welcomeImageMd = getProductImageMarkdown(product, activeSku || "10701");

  return `שלום! כאן נועה ❤️ | נציגת דלפק ראשית — ח. סבן חומרי בניין (1994) בע״מ 🏗️
אני כאן כדי לתאם עבורך איסוף עצמי מהיר ("Click & Collect") לפני הגעתך למגרש, לוודא זמינות מלאי ולהכין את הפריטים לאיסוף.
${welcomeImageMd}
לאיזה סניף תרצה להגיע לאיסוף?
1️⃣ **סניף החרש 4 (מגרש ראשי)** — חומרי מליטה, מלט, טיט, דבקים בשקים, חול וסומסום, בלוקים, ברזל ואיטום כבד.
2️⃣ **סניף התלמיד 6 (אולם גבס וצבע)** — מערכות גבס, פרופילים, צבעים, שפכטל, כלי עבודה, סיליקונים ופרזול.

אילו מוצרים וכמויות תרצה שנשריין עבורך?`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        let product: Product | undefined;
        let sheetCatalog: Product[] = [];
        try {
          const { getLobbyProductsCached } = await import("@/lib/lobby.server");
          const cachedPromise = getLobbyProductsCached();
          const timeoutPromise = new Promise<{ products: Product[] }>((resolve) =>
            setTimeout(() => resolve({ products: [] }), 2500),
          );
          const cached = await Promise.race([cachedPromise, timeoutPromise]);
          sheetCatalog = cached.products;
          product = findProduct(sheetCatalog, body.sku);
        } catch {
          // Ignore retrieval error
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        if (apiKey) {
          try {
            const google = createGoogleGenerativeAI({ apiKey });
            const modelMessages = await convertToModelMessages(body.messages as UIMessage[]);
            const result = streamText({
              model: google("gemini-3.6-flash"),
              system: buildSystemPrompt(product, sheetCatalog),
              messages: modelMessages,
              abortSignal: request.signal,
            });

            return result.toUIMessageStreamResponse({
              originalMessages: body.messages as UIMessage[],
              onError: (err) => {
                console.error("AI stream error:", err);
              },
            });
          } catch (aiErr) {
            console.warn(
              "Gemini streamText failed, falling back to local coordinator engine:",
              aiErr,
            );
          }
        }

        // Fallback when GEMINI_API_KEY is not configured yet
        const lastMsg = (body.messages as UIMessage[]).slice(-1)[0];
        const lastUserText =
          lastMsg?.parts
            ?.filter((p) => p.type === "text")
            .map((p) => ("text" in p ? (p.text as string) : ""))
            .join(" ") || "";

        const responseText = buildFallbackResponse(product, lastUserText);

        const stream = createUIMessageStream({
          execute: async ({ writer }) => {
            writer.write({ type: "start" });
            writer.write({ type: "text-start", id: "t1" });

            for (let i = 0; i < responseText.length; i += 12) {
              writer.write({
                type: "text-delta",
                id: "t1",
                delta: responseText.slice(i, i + 12),
              });
              await new Promise((r) => setTimeout(r, 15));
            }

            writer.write({ type: "text-end", id: "t1" });
            writer.write({ type: "finish" });
          },
        });

        return createUIMessageStreamResponse({ stream });
      },
    },
  },
});
