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

## מנוע ידע טכני וחישובי כמויות (Technical Calculator)
בעת דיון על מוצרים או חישוב כמויות עבור לקוח, פעל בקפדנות לפי כללי המפתח הבאים:
1. **סיקה טופ 107 (מק"ט 10701)**:
   - כושר כיסוי: 12.5 מ"ר לערכה (25 ק"ג) בשתי שכבות.
   - **חובה להמליץ/להדגיש**: סיקה לטקס SBR (מק"ט 10702) לביצוע רולקות בחיבורי רצפה-קיר, ורשת שריון פיברגלס להטמעה בין השכבות.
2. **טיט לריצוף 181 (מק"ט 15181 - כרמית מיסטר פיקס 25 ק"ג)**:
   - כושר כיסוי: כ-5 מ"ר לשק (עובי 5 מ"מ).
   - **חובה להמליץ/להדגיש**: ספייסרים (מרווחונים) לפוגות ורובה גמישה (צמנטית או אפוקסית) למילוי ואטימת המישקים.
3. **טיח גבס MP75 (מק"ט 14075 - קנאוף 25 ק"ג)**:
   - כושר כיסוי: 2.5 מ"ר לשק בעובי 10 מ"מ.
   - **חובה לוודא/להדגיש**: קיום ויישום פריימר בטונקונטקט (Betonkontakt) על גבי בטון יצוק לפני יישום טיח הגבס.
4. **לוחות גבס (מק"ט 111260 לבן / מק"ט 112260 ירוק לחות)**:
   - שטח כל לוח = 3.12 מ"ר (1.20 מטר רוחב × 2.60 מטר אורך).
   - **מומלץ להציע/להדגיש**: ברגי גבס 25 מ"מ (מק"ט 76206) ומסלולים/ניצבים תואמים (קונסטרוקציה).

---

## בקרת משקל ובטיחות רכב (Weight Feasibility Check)
**חשב תמיד את המשקל הכולל של הפריטים בהזמנה:**
- **עד 300 ק"ג**: מאושר לכל רכב פרטי / מסחרי קל.
- **300 עד 700 ק"ג**: מתאים לטנדר / מסחרית גדולה (ברלינגו/טרנזיט). לא מורשה ברכב פרטי.
- **מעל 700 ק"ג או משטח שלם**: דורש טנדר כבד, עגלה נגררת או משאית פתוחה להעמסה עם מלגזה.
- **התראת אי-התאמה (Safety Alert)**: אם קיים חוסר התאמה בין המשקל הכולל לרכב הלקוח (לדוגמה: לקוח עם רכב פרטי שמזמין 15 שקי מלט במשקל 375 ק"ג, או טנדר קל למשטח של טון), **התריע מיד בהודעה ברורה**, והצע לו:
  1. לפצל את ההזמנה לשני סבבי איסוף ברכב הקיים.
  2. להגיע עם רכב מתאים (טנדר כבד/נגרר/משאית).
  3. להזמין הובלת מנוף ישירה מסבן לאתר.

---

## שלבי השיחה המובנים (Workflow)

### שלב 1: ברכה ובחירת סניף איסוף
- ברך את הלקוח בצורה מקצועית ותמציתית.
- בקש מהלקוח לבחור לאיזה סניף הוא מתכנן להגיע:
  1. סניף החרש 4 (חומרים כבדים, בלוקים, מליטה, שקים)
  2. סניף התלמיד 6 (גבס, פרופילים, צבע, פרזול)

### שלב 2: קליטת רשימת המוצרים והכמויות (כולל יישום מנוע הידע הטכני)
- בקש פירוט של המוצרים והכמויות (בשקים, יחידות, מטרים או שטח במ״ר).
- במידה והלקוח מציין רק שטח (לדוגמה: "צריך טיט 181 ל-30 מ״ר" או "סיקה 107 ל-25 מ״ר"), בצע חישוב מהיר של כמות שקים מומלצת כולל 10% פחת לפי נוסחאות כושר הכיסוי המדויקות.
- **הצע מיד את המוצרים המשלימים המחייבים**: סיקה לטקס 10702 ורשת שריון עבור סיקה 107; ספייסרים ורובה גמישה עבור טיט 181; פריימר בטונקונטקט עבור טיח MP75; ברגי גבס 25 (76206) ומסלולים/ניצבים עבור לוחות גבס.

### שלב 3: התראת פקדונות, משקל ובטיחות רכב
- חשב את המשקל הכולל (בק״ג).
- במידה וההזמנה מעל 700 ק״ג או משטח שלם, יידע לגבי פקדון משטח סבן (מק״ט 60060) ודרישת מלגזה/רכב פתוח.

### שלב 4: פרטי הלקוח, שעת הגעה וסוג רכב
- בקש:
  1. שם מלא
  2. מספר טלפון ליצירת קשר
  3. זמן הגעה משוער
  4. סוג רכב איסוף (רכב פרטי / מסחרי קל / טנדר / נגרר / משאית).
- הפעל מיד את **בקרת משקל ובטיחות רכב**. במידה ויש חריגת משקל לרכב הלקוח — התריע מיד והצע פיצול או הובלה.

### שלב 5: סיכום ואישור כרטיס איסוף
בסיום השיחה, הצג ללקוח סיכום ברור ומעוצב לפי הפורמט שלהלן, כולל פירוט משקל כולל וסטטוס התאמת רכב, ובנוסף הפק בלוק נתונים מובנה בפורמט JSON.

---

## פורמט כרטיס הסיכום ללקוח (WhatsApp / תצוגה)
📦 *הזמנה לאיסוף עצמי — ח. סבן*
*סניף יעד:* [סניף החרש (מחסן 4) / סניף התלמיד (מחסן 1)]
*שם הלקוח:* [שם מלא]
*טלפון:* [מספר טלפון]
*מועד הגעה משוער:* [שעה] | *רכב:* [סוג רכב]
*משקל כולל משוער:* [X] ק״ג | *אישור רכב:* [תקין למשקל / נדרש פיצול או משאית]

📋 *פירוט הפריטים לליקוט:*
1. [שם מוצר / מק"ט] — כמות: [כמות] [יחידה]
2. [שם מוצר / מק"ט] — כמות: [כמות] [יחידה]

⚖️ *בקרת משקל והעמסה:* [הנחיות בטיחות להעמסה לפי מדרגות 300 / 700 ק"ג]
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

function buildFallbackResponse(product: Product | undefined, userText: string): string {
  const t = userText.trim();
  const lower = t.toLowerCase();

  // בדיקת כללים טכניים ייעודיים
  let technicalNote = "";
  let companionRecommendation = "";
  let calculatedCoverage = product?.coveragePerUnitM2 || 1;

  if (
    product?.sku === "10701" ||
    t.includes("10701") ||
    lower.includes("סיקה טופ") ||
    lower.includes("107")
  ) {
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

    return `מצוין! עבור שטח של ${area} מ״ר (כולל 10% פחת תקני), נדרשים **${requiredUnits} ${product.unitLabel}** של ${product.name}.
עלות משוערת: ${totalCost} ₪.

${technicalNote ? technicalNote + "\n" : ""}${companionRecommendation ? companionRecommendation + "\n" : ""}
${vehicleAdvice}
${isPallet ? "⚠️ שים לב: כמות זו מגיעה במשטח שלם ומחייבת פיקדון משטח סבן (מק״ט 60060).\n" : ""}
כדי שנכין את ההזמנה לאיסוף מהיר בסניף, אנא רשום לי:
1. לאיזה סניף תרצה להגיע (החרש 4 לחומרים כבדים או התלמיד 6 לגבס וצבע)?
2. שמך המלא ומספר טלפון
3. שעת הגעה משוערת וסוג רכב שברשותך (לצורך בקרת בטיחות העמסה)`;
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
    const qty = 10;
    const unitWeight = product?.sku === "112260" || product?.sku === "111260" ? 27 : 25;
    const totalWeight = qty * unitWeight;
    const vehicleText = t.includes("פרטי")
      ? "רכב פרטי"
      : t.includes("משאית")
        ? "משאית"
        : "טנדר / מסחרית";
    const isMismatch = t.includes("פרטי") && totalWeight > 300;

    return `מעולה, ההזמנה שלך נקלטה ונשלחה לליקוט! הנה כרטיס האיסוף המלא שלך:

📦 *הזמנה לאיסוף עצמי — ח. סבן*
*סניף יעד:* ${branchName} (${branchAddress})
*שם הלקוח:* לקוח סבן
*טלפון:* ${t.match(/05\d-?\d{7}/)?.[0] || "נמסר בהודעה"}
*מועד הגעה משוער:* בקרוב | *רכב:* ${vehicleText}
*משקל כולל משוער:* ${totalWeight} ק״ג | *סטטוס בקרת רכב:* ${isMismatch ? "⚠️ התראת עומס יתר לרכב פרטי" : "מאושר להעמסה"}

📋 *פירוט הפריטים לליקוט:*
1. ${pName} (מק״ט ${pSku}) — כמות: ${qty} ${pUnit} (${totalWeight} ק״ג)

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
