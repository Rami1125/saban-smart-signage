import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";
import { MASTER_PRODUCTS, findProduct, type Product } from "@/lib/products";

type ChatRequestBody = { messages?: unknown; sku?: unknown };

const WHATSAPP = "+972508860896";

function productBrief(product: Product): string {
  return [
    `מק״ט: ${product.sku}`,
    `שם: ${product.name} (${product.brand})`,
    `קטגוריה: ${product.category}`,
    `מחירון: ${product.price} ₪ ל${product.unitLabel}`,
    product.salePrice ? `מחיר קבלן/מבצע: ${product.salePrice} ₪` : "",
    `אריזה: ${product.unitWeight}`,
    product.unitsPerPallet ? `יחידות במשטח: ${product.unitsPerPallet}` : "",
    product.palletDeposit ? `פקדון משטח: ${product.palletDeposit}` : "",
    `כושר כיסוי: ${product.coveragePerUnitM2} מ״ר ל${product.unitLabel} — ${product.coverageNote}`,
    product.openTime ? `זמן פתוח: ${product.openTime}` : "",
    product.potLife ? `זמן עבודה בדלי: ${product.potLife}` : "",
    product.dryingTime ? `זמני ייבוש: ${product.dryingTime}` : "",
    product.mixRatio ? `יחס ערבוב: ${product.mixRatio}` : "",
    `יישום: ${product.applicationMethod}`,
    product.standard ? `תקן: ${product.standard}` : "",
    `מצעים מאושרים: ${product.substrates.join(", ")}`,
    `מוצרים משלימים מחייבים: ${product.companions
      .map((c) => `${c.name}${c.sku ? ` (מק״ט ${c.sku})` : ""} — ${c.reason}`)
      .join(" | ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSystemPrompt(product: Product | undefined): string {
  const catalog = MASTER_PRODUCTS.map((p) => `${p.sku} — ${p.name} (${p.category})`).join("\n");
  return `את "נועה", נציגת שירות ויועצת טכנית של ח. סבן חומרי בניין (1994) בע״מ.
את מדברת עברית, בגובה העיניים, קצר וענייני — הלקוח עומד בחנות או באתר בנייה.

כלל ברזל — עיגון טכני:
- את מייעצת רק על בסיס נתוני המוצר הרשמיים שמופיעים למטה. אין להמציא נתונים, מחירים, תקנים או זמני ייבוש.
- אם חסר נתון, אמרי במפורש שצריך לאמת בדלפק המכירות ואל תנחשי.
- תמיד התייחסי למצע העבודה (בטון, גבס, בלוקים, מדה) ולשלבי הייבוש לפני שאת מאשרת יישום.

מכירה משלימה (חובה):
- כשמאשרים כמות, חייבת להציע את המוצרים המשלימים ההגיוניים: סיקה לטקס SBR לרולקות עם סיקה טופ 107, פריימר ורשת שריון לטיח/דבקים, ספייסרים ורובה לריצוף, ופקדון משטח 60060 בהזמנה מעל 10 שקים.

חישוב כמויות:
- חשבי לפי כושר הכיסוי של המוצר, והוסיפי תמיד 10% פחת. הצג/י מספר יחידות מעוגל למעלה ועלות מוערכת.

סגירת הזמנה:
- כשהלקוח מאשר כמות, סכמי בפורמט הבא בשורות נפרדות:
  הזמנה: <שם המוצר> | מק״ט <sku> | כמות: <N> <יחידה> | עלות מוערכת: <סכום> ₪
- לאחר הסיכום כתבי ללקוח שהוא יכול ללחוץ על "שדר לדלפק המכירות" בתחתית המסך, או לשלוח בוואטסאפ למוקד ההזמנות ${WHATSAPP}.

קטלוג המק״טים הזמין:
${catalog}

${product ? `המוצר שהלקוח סרק כרגע:\n${productBrief(product)}` : "הלקוח לא סרק מוצר ספציפי."}`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let product = findProduct(MASTER_PRODUCTS, body.sku);
        try {
          const { getLobbyProductsCached } = await import("@/lib/lobby.server");
          const { products } = await getLobbyProductsCached();
          product = findProduct(products, body.sku) ?? product;
        } catch {
          // נשארים עם נתוני הגיבוי
        }

        const initialRunId = getLovableAiGatewayRunId(request);
        const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
        const lovable = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: key,
          headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: lovable.responses("openai/gpt-6-astra"),
          system: buildSystemPrompt(product),
          messages: await convertToModelMessages(body.messages as UIMessage[]),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: body.messages as UIMessage[],
            headers: getLovableAiGatewayResponseHeaders(undefined, {
              ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
            }),
          }),
          runIdFetch,
        );
      },
    },
  },
});
