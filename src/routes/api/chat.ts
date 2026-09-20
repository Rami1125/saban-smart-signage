import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";

import { MASTER_PRODUCTS, effectivePrice, findProduct, type Product } from "@/lib/products";

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

function buildFallbackResponse(product: Product | undefined, userText: string): string {
  if (!product) {
    return "שלום! כאן נועה מסבן חומרי בניין. אנא סרוק מוצר או בחר פריט מהקטלוג כדי שאוכל לחשב כמויות ולייעץ במדויק.";
  }

  const price = effectivePrice(product);
  const matchArea = userText.match(/(\d+(?:\.\d+)?)\s*(?:מ"ר|מר|מטר|מ״ר)/);
  if (matchArea) {
    const area = parseFloat(matchArea[1]);
    const requiredUnits = Math.ceil((area / product.coveragePerUnitM2) * 1.1);
    const totalCost = (requiredUnits * price).toLocaleString("he-IL");
    const companionsText = product.companions.length
      ? `\n\n💡 שים לב: מומלץ להצטייד גם ב-${product.companions.map((c) => c.name).join(", ")}.`
      : "";

    return `שלום! עבור שטח של ${area} מ״ר (כולל 10% פחת ביטחון):\n\nהזמנה: ${product.name} | מק״ט ${product.sku} | כמות: ${requiredUnits} ${product.unitLabel} | עלות מוערכת: ${totalCost} ₪${companionsText}\n\nניתן ללחוץ על "שדר לדלפק המכירות" להכנת ההזמנה במחסן, או לשלוח בוואטסאפ לדלפק בטלפון ${WHATSAPP}.`;
  }

  return `שלום! אני נועה, יועצת טכנית של ח. סבן.\nלגבי ${product.name} (מק״ט ${product.sku}):\n• כושר כיסוי: ${product.coveragePerUnitM2} מ״ר ל${product.unitLabel} (${product.coverageNote})\n• מחיר: ${price} ₪ ל${product.unitLabel}\n• יישום: ${product.applicationMethod}\n\nכתוב לי מה שטח העבודה (במ״ר) ואחשב עבורך מיד כמות מדויקת ועלות מוערכת, או אשדר לדלפק!`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        let product = findProduct(MASTER_PRODUCTS, body.sku);
        try {
          const { getLobbyProductsCached } = await import("@/lib/lobby.server");
          const { products } = await getLobbyProductsCached();
          product = findProduct(products, body.sku) ?? product;
        } catch {
          // Keep fallback catalog
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        if (apiKey) {
          const google = createGoogleGenerativeAI({ apiKey });
          const result = streamText({
            model: google("gemini-2.5-flash"),
            system: buildSystemPrompt(product),
            messages: await convertToModelMessages(body.messages as UIMessage[]),
            abortSignal: request.signal,
          });

          return result.toUIMessageStreamResponse({
            originalMessages: body.messages as UIMessage[],
          });
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
