// ============================================================================
// File: src/components/noa/NoaChat.tsx
// Version: 2.5.0 (SabanOS Smart Signage — High-Contrast UI & Dynamic Click & Collect)
// Maintained & Upgraded: 2026-09-22
// ============================================================================

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageCircle, Plus, Send, Trash2, X, Headset, Maximize2, Minimize2 } from "lucide-react";
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
    if (jsonMatch && jsonMatch) {
      const parsed = JSON.parse(jsonMatch);
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
                src="https://i.ibb.co/7NrGZ1rH/Gemini-Generated-Image-8d92088d92088d92.jpg"
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
                <span className="text-xs">👷‍♀️</span>
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

              <div className="space-y-1.5">
                <p className="text-xs font-bold text-foreground">לאיזה סניף תרצה להגיע לאיסוף?</p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => void submit("אני מתכנן להגיע לסניף החרש 4 (מגרש ראשי)")}
                    className="flex items-center justify-between rounded-xl border-2 border-border/80 bg-card p-2.5 text-right text-xs hover:border-amber-500 hover:bg-amber-50/20 transition-all shadow-xs"
                  >
                    <span className="font-bold text-foreground text-xs">
                      1️⃣ סניף החרש 4 (מגרש העמסות ראשי)
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      מלט, שקים, בלוקים, איטום, ברזל
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void submit("אני מתכנן להגיע לסניף התלמיד 6 (חנות התלמיד 6 )")}
                    className="flex items-center justify-between rounded-xl border-2 border-border/80 bg-card p-2.5 text-right text-xs hover:border-amber-500 hover:bg-amber-50/20 transition-all shadow-xs"
                  >
                    <span className="font-bold text-foreground text-xs">
                      2️⃣ סניף התלמיד 6 (חנות וגבס)
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      לוחות גבס, צבעים, שפכטל, פרזול
                    </span>
                  </button>
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
