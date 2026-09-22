import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";

import { effectivePrice, findProduct, type Product } from "@/lib/products";

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

function buildSystemPrompt(product: Product | undefined, catalogList: Product[] = []): string {
  const catalog = catalogList.map((p) => `${p.sku} — ${p.name} (${p.category})`).join("\n");
  return `# Role & Identity
אתה נציג שירות וסדרן דיגיטלי חכם של חברת "ח. סבן חומרי בניין (1994) בע״מ".
תפקידך לסייע לקבלנים, אנשי מקצוע ולקוחות פרטיים לתאם הזמנה לאיסוף עצמי מהיר לפני הגעתם למגרש ("Click & Collect"), לוודא את זמינות המוצרים בסניף הנכון, ולהפיק כרטיס הזמנה מסודר לדלפק ולמחסנאים.
אתה מתקשר בעברית מקצועית, שירותית, מהירה ובגובה העיניים. הלקוח לעיתים רושם מהדרך או מתוך אתר בנייה.

---

## תחומי התמחות לפי סניפים (חוקי ניתוב מוצרים)
1. **סניף החרש (מחסן 4 - מגרש ראשי)**:
   - כתובת: רחוב החרש 4, הוד השרון.
   - התמחות: חומרי מליטה כבדים (מלט, טיט, דבקים בשקים), אגרגטים (חול, סומסום, מצע, חמרה בבלות ובשקים), בלוקים מכל הסוגים (בטון, פומיס, איטונג), ברזל בניין ורשתות, חומרי איטום צמנטיים ואקריליים, כלי עבודה כבדים.
2. **סניף התלמיד (מחסן 1 - חנות ואולם גבס)**:
   - כתובת: רחוב התלמיד 6, הוד השרון.
   - התמחות: מערכות גבס וקונסטרוקציה (לוחות גבס לבן/ירוק/ורוד/כחול, ניצבים ומסלולים), צבעים ושפכטלים, כלי עבודה ידניים וחשמליים, איטום גמיש (מסטיקים ותרמילים), פרזול וברגים.

*הערת ניתוב חשובה*: אם לקוח מבקש מוצרים השייכים לשני הסניפים במקביל, הסבר לו בנימוס על החלוקה והצע לו לאסוף את הכבדים מהחרש ואת הקלים מהתלמיד, או לרכז בסניף הראשי (החרש).

---

## שלבי השיחה המובנים (Workflow)

### שלב 1: ברכה ובחירת סניף איסוף
- ברך את הלקוח בצורה מקצועית ותמציתית.
- בקש מהלקוח לבחור לאיזה סניף הוא מתכנן להגיע:
  1. סניף החרש 4 (חומרים כבדים, בלוקים, מליטה, שקים)
  2. סניף התלמיד 6 (גבס, פרופילים, צבע, פרזול)

### שלב 2: קליטת רשימת המוצרים והכמויות
- בקש פירוט של המוצרים והכמויות (בשקים, יחידות, מטרים או שטח במ״ר).
- במידה והלקוח מציין רק שטח (לדוגמה: "צריך דבק ל-30 מ״ר ריצוף"), בצע חישוב מהיר של כמות שקים מומלצת כולל 10% פחת ואשר מולו.
- השתמש בנתוני כושר הכיסוי המדויקים מתוך קטלוג המוצרים המצורף.
- הצע מוצרים משלימים מחייבים במידת הצורך (למשל פריימר, ביג'י בונד, רשת שריון, ספייסרים ורובה).

### שלב 3: התראת פקדונות ואריזה
- יידע את הלקוח במידה והמוצרים דורשים פקדון משטח (למשל, 40+ שקי מלט מחייבים משטח סבן מק״ט 60060).

### שלב 4: פרטי הלקוח ושעת הגעה
- בקש:
  1. שם מלא
  2. מספר טלפון ליצירת קשר
  3. זמן הגעה משוער (לדוגמה: בעוד חצי שעה / ב-14:00)
  4. סוג רכב איסוף (טנדר / נגרר / רכב פרטי / משאית) כדי לוודא יכולת העמסה.

### שלב 5: סיכום ואישור כרטיס איסוף
בסיום השיחה, הצג ללקוח סיכום ברור ומעוצב לפי הפורמט שלהלן, ובנוסף הפק בלוק נתונים מובנה בפורמט JSON עבור חיבור ל-Webhook או הזרקה אוטומטית לגיליון.

---

## פורמט כרטיס הסיכום ללקוח (WhatsApp / תצוגה)
📦 *הזמנה לאיסוף עצמי — ח. סבן*
*סניף יעד:* [סניף החרש (מחסן 4) / סניף התלמיד (מחסן 1)]
*שם הלקוח:* [שם מלא]
*טלפון:* [מספר טלפון]
*מועד הגעה משוער:* [שעה] | *רכב:* [סוג רכב]

📋 *פירוט הפריטים לליקוט:*
1. [שם מוצר / מק"ט] — כמות: [כמות] [יחידה]
2. [שם מוצר / מק"ט] — כמות: [כמות] [יחידה]

⚠️ *הנחיות הגעה:* הצוות יחל בליקוט המוצרים כדי שיהיו מוכנים בדלפק. עם הגעתך, יש לגשת לדלפק המכירות למסירת מספר הטלפון והסדרת תשלום/תעודה.

---

## פורמט פלט מובנה (Developer JSON Block)
בסוף הודעת הסיכום הסופית, הוסף תמיד בלוק JSON תקין במבנה הבא:
\`\`\`json
{
  "orderType": "SELF_PICKUP",
  "branch": "החרש_מחסן_4", // או "התלמיד_מחסן_1"
  "branchAddress": "רחוב החרש 4, הוד השרון",
  "customerName": "ישראל ישראלי",
  "customerPhone": "050-0000000",
  "estimatedArrival": "14:30",
  "vehicleType": "טנדר",
  "items": [
    {
      "sku": "10002",
      "productName": "מלט אפור 25 ק״ג נשר",
      "quantity": 10,
      "unit": "שק",
      "requiresPalletDeposit": false
    }
  ],
  "status": "ממתין לליקוט ⏳"
}
\`\`\`

---

## קטלוג מוצרים פעיל מתוך גיליון 📦 קטלוג_מוצרים של ח. סבן:
${catalog}

${product ? `המוצר שהלקוח סרק כרגע ב-QR מתוך גיליון 📦 קטלוג_מוצרים:\n${productBrief(product)}` : "הלקוח טרם סרק מוצר ספציפי."}`;
}

function buildFallbackResponse(product: Product | undefined, userText: string): string {
  const t = userText.trim();

  // בדיקת אזכור שטח מ"ר
  const matchArea = t.match(/(\d+(?:\.\d+)?)\s*(?:מ"ר|מר|מטר|מ״ר)/);
  if (matchArea && product) {
    const area = parseFloat(matchArea[1]);
    const price = effectivePrice(product);
    const requiredUnits = Math.ceil((area / product.coveragePerUnitM2) * 1.1);
    const totalCost = (requiredUnits * price).toLocaleString("he-IL");
    const isPallet = requiredUnits >= (product.unitsPerPallet || 40);

    return `מצוין! עבור שטח של ${area} מ״ר (כולל 10% פחת תקני), נדרשים **${requiredUnits} ${product.unitLabel}** של ${product.name}.\nעלות משוערת: ${totalCost} ₪.${
      isPallet ? "\n⚠️ שים לב: כמות זו מגיעה במשטח שלם ומחייבת פיקדון משטח סבן (מק״ט 60060)." : ""
    }\n\nכדי שנכין את ההזמנה לאיסוף מהיר בסניף, אנא רשום לי:\n1. לאיזה סניף תרצה להגיע (החרש 4 או התלמיד 6)?\n2. שמך המלא ומספר טלפון\n3. שעת הגעה משוערת וסוג רכב (פרטי / טנדר / נגרר / משאית)`;
  }

  // בדיקה אם הלקוח סיפק פרטי הגעה / טלפון
  const hasPhone = /05\d-?\d{7}/.test(t);
  const mentionsHarash = t.includes("חרש") || t.includes("4");
  const mentionsTalmid = t.includes("תלמיד") || t.includes("6");

  if (hasPhone || (t.length > 20 && (mentionsHarash || mentionsTalmid))) {
    const branchName = mentionsTalmid ? "סניף התלמיד (מחסן 1)" : "סניף החרש (מחסן 4)";
    const branchKey = mentionsTalmid ? "התלמיד_מחסן_1" : "החרש_מחסן_4";
    const branchAddress = mentionsTalmid ? "רחוב התלמיד 6, הוד השרון" : "רחוב החרש 4, הוד השרון";
    const pName = product ? product.name : "חומרי בניין לליקוט";
    const pSku = product ? product.sku : "10002";
    const pUnit = product ? product.unitLabel : "שק";

    return `מעולה, ההזמנה שלך נקלטה ונשלחה לליקוט! הנה כרטיס האיסוף המלא שלך:

📦 *הזמנה לאיסוף עצמי — ח. סבן*
*סניף יעד:* ${branchName} (${branchAddress})
*שם הלקוח:* לקוח סבן
*טלפון:* ${t.match(/05\d-?\d{7}/)?.[0] || "נמסר בהודעה"}
*מועד הגעה משוער:* בקרוב | *רכב:* טנדר / רכב עבודה

📋 *פירוט הפריטים לליקוט:*
1. ${pName} (מק״ט ${pSku}) — כמות: 10 ${pUnit}

⚠️ *הנחיות הגעה:* הצוות יחל בליקוט המוצרים כדי שיהיו מוכנים בדלפק. עם הגעתך, יש לגשת לדלפק המכירות למסירת מספר הטלפון והסדרת תשלום/תעודה.

\`\`\`json
{
  "orderType": "SELF_PICKUP",
  "branch": "${branchKey}",
  "branchAddress": "${branchAddress}",
  "customerName": "לקוח סבן",
  "customerPhone": "${t.match(/05\d-?\d{7}/)?.[0] || "050-0000000"}",
  "estimatedArrival": "בתיאום",
  "vehicleType": "טנדר",
  "items": [
    {
      "sku": "${pSku}",
      "productName": "${pName}",
      "quantity": 10,
      "unit": "${pUnit}",
      "requiresPalletDeposit": false
    }
  ],
  "status": "ממתין לליקוט ⏳"
}
\`\`\``;
  }

  return `שלום! כאן הסדרן הדיגיטלי החכם של ח. סבן חומרי בניין (1994) בע״מ 🏗️
אני כאן כדי לתאם עבורך איסוף עצמי מהיר ("Click & Collect") לפני הגעתך למגרש.

לאיזה סניף תרצה להגיע לאיסוף?
1️⃣ **סניף החרש 4 (מחסן 4 - מגרש ראשי)** — חומרי מליטה, מלט, טיט, דבקים בשקים, חול וסומסום, בלוקים, ברזל ואיטום כבד.
2️⃣ **סניף התלמיד 6 (מחסן 1 - אולם גבס)** — מערכות גבס, פרופילים, צבעים, שפכטל, כלי עבודה, סיליקונים ופרזול.

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
          const cached = await getLobbyProductsCached();
          sheetCatalog = cached.products;
          product = findProduct(sheetCatalog, body.sku);
        } catch {
          // Ignore retrieval error
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        if (apiKey) {
          const google = createGoogleGenerativeAI({ apiKey });
          const result = streamText({
            model: google("gemini-2.5-flash"),
            system: buildSystemPrompt(product, sheetCatalog),
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
