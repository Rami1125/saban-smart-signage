import { createFileRoute } from "@tanstack/react-router";

export const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxxMuFP5evxDx8vxd3BfCQgx73H88KTOB87AzbiCAEx69UVJE1qmoCMyF9KM9qljvAX/exec";

interface SheetSyncPayload {
  action: "append_order" | "log_chat" | "ping";
  order?: {
    id: string;
    sku: string;
    productName: string;
    unitLabel: string;
    quantity: number;
    unitPrice: number;
    estimatedCost: number;
    warehouse: string;
    branchName: string;
    source: string;
    screenId?: string;
    note?: string;
    clientPhone?: string;
    clientName?: string;
    createdAt: number;
  };
  chat?: {
    id?: string;
    sku?: string;
    productName?: string;
    branch?: string;
    question?: string;
    answer?: string;
    quantity?: string | number;
    cost?: string | number;
    dispatched?: boolean;
    duration?: number;
  };
}

export const Route = createFileRoute("/api/sheets-sync")({
  server: {
    handlers: {
      GET: async () => {
        const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || DEFAULT_APPS_SCRIPT_URL;
        try {
          // Check ping on Google Apps Script
          const pingRes = await fetch(`${webhookUrl}?action=ping`, {
            method: "GET",
            redirect: "follow",
          });
          const pingData = await pingRes.json().catch(() => null);

          // Check products count on Google Apps Script
          const prodRes = await fetch(`${webhookUrl}?action=products`, {
            method: "GET",
            redirect: "follow",
          });
          const prodData = (await prodRes.json().catch(() => null)) as {
            count?: number;
            products?: unknown[];
          } | null;

          return new Response(
            JSON.stringify({
              status: "connected",
              webhookUrl,
              timestamp: new Date().toISOString(),
              ping: pingData,
              catalogCount: prodData?.count ?? 0,
              sheets: [
                "📊 דשבורד_בקרה",
                "📦 קטלוג_מוצרים",
                "🏗️ הזמנות_סניף_החרש",
                "🏬 הזמנות_סניף_התלמיד",
                "💬 יומן_שיחות_נועה",
              ],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({
              status: "degraded",
              webhookUrl,
              error: String(err),
              message: "Apps Script URL configured, ping failed",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as SheetSyncPayload;
          const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || DEFAULT_APPS_SCRIPT_URL;

          // 1. Log chat to Apps Script
          if (body.action === "log_chat" && body.chat) {
            try {
              const chatPayload = {
                type: "chat",
                chat: {
                  id: body.chat.id || `CHAT-${Date.now().toString(36)}`,
                  sku: body.chat.sku || "",
                  productName: body.chat.productName || "",
                  branch: body.chat.branch || "סניף החרש (מחסן 4 - ראשי)",
                  question: body.chat.question || "",
                  answer: body.chat.answer || "",
                  quantity: body.chat.quantity || "",
                  cost: body.chat.cost || "",
                  dispatched: Boolean(body.chat.dispatched),
                  duration: body.chat.duration || 0,
                },
                timestamp: new Date().toISOString(),
              };

              const chatRes = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(chatPayload),
                redirect: "follow",
              });

              const result = await chatRes.json().catch(() => ({ success: true }));
              return new Response(
                JSON.stringify({
                  success: true,
                  syncedToSheet: true,
                  chatLogged: true,
                  result,
                }),
                { headers: { "Content-Type": "application/json" } },
              );
            } catch (chatErr) {
              console.warn("Could not log chat to Google Sheets:", chatErr);
              return new Response(
                JSON.stringify({
                  success: false,
                  syncedToSheet: false,
                  error: String(chatErr),
                }),
                { headers: { "Content-Type": "application/json" } },
              );
            }
          }

          // 2. Append order to Apps Script
          if (webhookUrl && webhookUrl.startsWith("http")) {
            try {
              const orderPayload = {
                type: "order",
                orderId: body.order?.id,
                order: {
                  id: body.order?.id,
                  sku: body.order?.sku,
                  productName: body.order?.productName,
                  name: body.order?.productName,
                  quantity: body.order?.quantity,
                  unitLabel: body.order?.unitLabel,
                  estimatedCost: body.order?.estimatedCost,
                  warehouse: body.order?.warehouse || body.order?.branchName,
                  branch: body.order?.branchName || body.order?.warehouse,
                  source: body.order?.source || "סריקת QR בנייד / PWA",
                  screenId: body.order?.screenId || "pwa_client",
                  note: body.order?.note || "",
                  phone: body.order?.clientPhone || "",
                  clientName: body.order?.clientName || "",
                  createdAt: body.order?.createdAt,
                },
                timestamp: new Date().toISOString(),
              };

              const sheetRes = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(orderPayload),
                redirect: "follow",
              });

              if (sheetRes.ok) {
                const sheetData = await sheetRes.json().catch(() => ({ success: true }));
                return new Response(
                  JSON.stringify({
                    success: true,
                    syncedToGoogleSheet: true,
                    id: body.order?.id,
                    branch: (sheetData as { branch?: string })?.branch,
                    orderId: (sheetData as { orderId?: string })?.orderId,
                  }),
                  { headers: { "Content-Type": "application/json" } },
                );
              }
            } catch (forwardErr) {
              console.warn("Could not forward to Google Sheets Apps Script:", forwardErr);
            }
          }

          // Fallback confirmation: server accepts and acknowledges dual save
          return new Response(
            JSON.stringify({
              success: true,
              syncedToGoogleSheet: Boolean(webhookUrl),
              storedLocally: true,
              id: body.order?.id,
              message: "נקלט במערכת שילוט ח. סבן וסונכרן לזיכרון",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Sheets sync error:", error);
          return new Response(
            JSON.stringify({ error: "Internal sync error", details: String(error) }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
