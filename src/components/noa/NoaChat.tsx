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

function parseOrder(text: string): ParsedOrder | null {
  const line = text.split("\n").find((l) => l.includes("הזמנה:"));
  if (!line) return null;
  const quantity = Number(line.match(/כמות:\s*(\d+(?:\.\d+)?)/)?.[1] ?? "");
  const cost = Number(line.match(/עלות מוערכת:\s*([\d.,]+)/)?.[1]?.replace(/,/g, "") ?? "");
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  return { quantity, cost: Number.isFinite(cost) ? cost : 0 };
}

export function NoaChat({ product, screenId }: { product: Product; screenId?: string }) {
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
            aria-label="פתיחת צ׳אט עם נועה"
            className="animate-noa-pulse flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-counter transition-transform active:scale-95"
          >
            <Headset className="size-7" />
          </button>
          <div className="animate-noa-pop max-w-[13rem] rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-xs leading-snug text-card-foreground shadow-counter">
            <span className="font-semibold">בועה 💭 — נועה</span>
            <p className="text-muted-foreground">
              נציגת שירות ויועצת טכנית. שאל אותי על כמויות, מצעים וזמני ייבוש.
            </p>
          </div>
        </div>
      )}

      {open && (
        <div className="animate-noa-pop fixed inset-x-2 bottom-2 z-50 flex h-[85vh] max-h-[40rem] flex-col overflow-hidden rounded-3xl border bg-card shadow-counter sm:inset-x-auto sm:left-6 sm:w-[24rem]">
          <header className="flex items-center gap-2 border-b bg-signage px-3 py-2.5 text-signage-foreground">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Headset className="size-5" />
            </span>
            <div className="flex-1 leading-tight">
              <p className="text-sm font-semibold">נועה 💭</p>
              <p className="text-[11px] opacity-70">יועצת טכנית · ח. סבן חומרי בניין</p>
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
              product={product}
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
  product,
  screenId,
  onPersist,
}: {
  thread: Thread;
  product: Product;
  screenId?: string;
  onPersist: (id: string, messages: UIMessage[]) => void;
}) {
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
  const order = lastAssistant ? parseOrder(messageText(lastAssistant)) : null;

  const submit = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  };

  const dispatch = () => {
    if (!order) return;
    dispatchToCounter({
      sku: product.sku,
      productName: product.name,
      quantity: order.quantity,
      unitLabel: product.unitLabel,
      estimatedCost: order.cost || order.quantity * effectivePrice(product),
      note: "סוכם בשיחה עם נועה",
      source: "noa_chat",
      ...(screenId ? { screenId } : {}),
    });
    toast.success("ההזמנה שודרה לדלפק המכירות");
  };

  return (
    <>
      <Conversation className="flex-1">
        <ConversationContent className="gap-3 px-3 py-3">
          {messages.length === 0 && (
            <div className="rounded-2xl bg-muted px-3 py-3 text-sm leading-relaxed">
              שלום 👋 אני נועה. סרקת את <strong>{product.name}</strong> (מק״ט {product.sku}). ספר לי
              על איזה מצע אתה עובד ומה השטח במ״ר, ואני אחשב כמויות, פחת ומוצרים משלימים.
            </div>
          )}
          {messages.map((message) => {
            const text = messageText(message);
            if (!text) return null;
            return (
              <Message from={message.role} key={message.id}>
                <MessageContent
                  className={cn(
                    "text-sm",
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
          {busy && <Shimmer className="px-1 text-sm">נועה בודקת את המפרט...</Shimmer>}
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error.message}
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {order && (
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
                  `שלום, סרקתי בסניף את ${product.name} (מק״ט ${product.sku}). מעוניין ב-${order.quantity} ${product.unitLabel}.`,
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
            placeholder="למשל: 42 מ״ר פורצלן 60×60 על מדה חדשה"
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
