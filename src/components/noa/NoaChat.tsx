import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageCircle, Plus, Send, Trash2, X, Headset } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
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
  const quantity = Number(line.match(/כמות:\s*(\d+(?:\.\d+)?)/)?.[1] ?? "");
  const cost = Number(line.match(/עלות מוערכת:\s*([\d.,]+)/)?.[1]?.replace(/,/g, "") ?? "");
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
        <div className="fixed bottom-24 left-4 z-50 flex items-end gap-2 sm:bottom-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="פתיחת סדרן דיגיטלי חכם לאיסוף עצמי"
            className="animate-noa-pulse flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-counter transition-transform active:scale-95"
          >
            <Headset className="size-7" />
          </button>
          <div className="animate-noa-pop max-w-[14rem] rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-xs leading-snug text-card-foreground shadow-counter border">
            <span className="font-semibold text-primary">סדרן דיגיטלי חכם 🏗️</span>
            <p className="text-muted-foreground mt-0.5">
              תיאום איסוף עצמי מהיר (Click & Collect) בסניפי החרש 4 והתלמיד 6.
            </p>
          </div>
        </div>
      )}

      {open && (
        <div className="animate-noa-pop fixed inset-x-2 bottom-2 z-50 flex h-[85vh] max-h-[42rem] flex-col overflow-hidden rounded-3xl border bg-card shadow-counter sm:inset-x-auto sm:left-6 sm:w-[26rem]">
          <header className="flex items-center gap-2 border-b bg-signage px-3 py-2.5 text-signage-foreground">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Headset className="size-5" />
            </span>
            <div className="flex-1 leading-tight">
              <p className="text-sm font-semibold">סדרן דיגיטלי חכם 📦</p>
              <p className="text-[11px] opacity-75">Click & Collect · ח. סבן חומרי בניין</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowThreads((value) => !value)}
              aria-label="רשימת שיחות"
              className="text-signage-foreground hover:bg-signage-muted"
            >
              <MessageCircle className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={createThread}
              aria-label="שיחה חדשה"
              className="text-signage-foreground hover:bg-signage-muted"
            >
              <Plus className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="סגירה"
              className="text-signage-foreground hover:bg-signage-muted"
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
                    thread.id === activeId ? "bg-primary/25 font-semibold" : "hover:bg-accent",
                  )}
                >
                  <button
                    type="button"
                    className="flex-1 truncate text-right"
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

    return `📦 *הזמנה לאיסוף עצמי — ח. סבן*
*סניף יעד:* ${branchLabel}
*שם הלקוח:* ${pOrder.customerName}
*טלפון:* ${pOrder.customerPhone}
*מועד הגעה משוער:* ${pOrder.estimatedArrival} | *רכב:* ${pOrder.vehicleType}

📋 *פירוט הפריטים לליקוט:*
${itemsText}

⚠️ *הנחיות הגעה:* הצוות יחל בליקוט המוצרים כדי שיהיו מוכנים בדלפק. עם הגעתך, יש לגשת לדלפק המכירות למסירת מספר הטלפון והסדרת תשלום/תעודה.`;
  };

  return (
    <>
      <Conversation className="flex-1">
        <ConversationContent className="gap-3 px-3 py-3">
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-muted/80 p-3 text-sm leading-relaxed border">
                <p className="font-semibold text-primary mb-1">
                  שלום! 👋 כאן הסדרן הדיגיטלי של ח. סבן חומרי בניין
                </p>
                <p className="text-muted-foreground text-xs leading-normal">
                  אני כאן כדי לתאם עבורך הזמנה לאיסוף עצמי מהיר (&quot;Click & Collect&quot;) לפני
                  הגעתך למגרש, לוודא זמינות בסניף המתאים ולהכין את הפריטים לליקוט.
                </p>
                {product && (
                  <p className="text-xs font-medium text-foreground mt-2 border-t pt-2">
                    סרקת כרגע: <strong>{product.name}</strong> (מק״ט {product.sku})
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  לאיזה סניף תרצה להגיע לאיסוף?
                </p>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => void submit("אני מתכנן להגיע לסניף החרש 4 (מגרש ראשי)")}
                    className="flex items-center justify-between rounded-xl border bg-card p-2 text-right text-xs hover:border-primary transition-colors"
                  >
                    <span className="font-semibold text-foreground">
                      1️⃣ סניף החרש 4 (מגרש ראשי)
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      מליטה, שקים, בלוקים, איטום, ברזל
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void submit("אני מתכנן להגיע לסניף התלמיד 6 (חנות ואולם גבס)")}
                    className="flex items-center justify-between rounded-xl border bg-card p-2 text-right text-xs hover:border-primary transition-colors"
                  >
                    <span className="font-semibold text-foreground">
                      2️⃣ סניף התלמיד 6 (חנות וגבס)
                    </span>
                    <span className="text-[10px] text-muted-foreground">
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
            return (
              <Message from={message.role} key={message.id}>
                <MessageContent
                  className={cn(
                    "text-sm whitespace-pre-line leading-relaxed",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent px-0 text-foreground",
                  )}
                >
                  <MessageResponse>{text}</MessageResponse>
                </MessageContent>
              </Message>
            );
          })}
          {busy && (
            <Shimmer className="px-1 text-sm">הסדרן הדיגיטלי בודק זמינות מלאי ומחשב...</Shimmer>
          )}
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error.message}
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Pickup Order Card */}
      {pickupOrder && (
        <div className="space-y-2.5 border-t bg-accent/80 p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
              📦 כרטיס איסוף עצמי מוכן
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
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
              <span className="text-muted-foreground">הגעה: {pickupOrder.estimatedArrival}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>
                לקוח: {pickupOrder.customerName} ({pickupOrder.customerPhone})
              </span>
              <span>רכב: {pickupOrder.vehicleType}</span>
            </div>
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
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 font-bold text-xs"
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
