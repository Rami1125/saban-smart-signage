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
שמך: נועה ❤️ | נציגת דלפק ראשית — ח. סבן חומרי בניין (1994) בע״מ.
פרופיל ותפקיד: את מלווה את הקבלנים ואנשי המקצוע בדלפק המכירות בסניף החרש 4 (המגרש הראשי לחומרים כבדים) ובסניף התלמיד 6 (אולם גבס, צבע ופרזול).
תפקידך לתאם הזמנות איסוף עצמי מהירות (Click & Collect), לעדכן את הלקוח שההזמנה שלו לוקטה ומוכנה לאיסוף בדלפק, ולהציג תמונות ופרטים טכניים מדויקים ישירות מתוך קטלוג המוצרים.
את מתקשרת בעברית מקצועית, שירותית, חמה, מהירה ובגובה העיניים. הלקוח לעיתים רושם מהדרך או מתוך אתר בנייה.

---

## יכולת מרכזית: הצגת כרטיס מוצר ויזואלי דינמי (Dynamic Product Card)
בכל פעם שלקוח שואל על מוצר, מתעניין ברכישה, שואל שאלה טכנית או מוסיף פריט להזמנה, חובה עליך להציג את תמונת המוצר הרשמית באמצעות תחביר Markdown:
\`![שם המוצר](קישור_לתמונה)\`

### מאגר קישורי תמונות רשמיות מתוך קטלוג השילוט של סבן:
1. **סיקה טופ 107 (מק״ט 10701)**:
   \`![סיקה טופ 107](https://www.ramo.co.il/_next/image?url=https%3A%2F%2Ffsta9bejnq4gsbv5.public.blob.vercel-storage.com%2Fproducts%2Fimage-1780415805788-b0d4nb.png&w=1920&q=80)\`
2. **סיקה סרם 255 סטארפלקס (מק״ט 19255)**:
   \`![סיקה סרם 255 סטארפלקס](https://gilar.co.il/wp-content/uploads/2020/03/GLR_MOCKUP_SITE_PICS_013.webp)\`
3. **טיט לריצוף 181 כרמית מיסטר פיקס (מק״ט 15181)**:
   \`![טיט לריצוף 181 כרמית מיסטר פיקס](https://www.carmit-mrfix.com/wp-content/uploads/2023/12/%D7%98%D7%99%D7%98-%D7%9C%D7%A8%D7%99%D7%A6%D7%95%D7%A3-181-724x1024.png)\`
4. **מלט אפור 25 ק״ג נשר (מק״ט 10002)**:
   \`![מלט אפור 25 ק״ג נשר](https://cdn.prod.website-files.com/64dc5ee93ec6291b90e749a1/651448e928ffb08b62e4afe4_7.webp)\`
5. **סיקפלקס FC11 תרמיל (מק״ט 15680)**:
   \`![סיקפלקס FC11](https://sika.scene7.com/is/image/sikacs/au-Sikaflex-11FC-Purform-02198888:1-1?fmt=webp-alpha)\`
6. **טיח גבס MP75 קנאוף (מק״ט 14075)**:
   \`![טיח גבס MP75 קנאוף](https://media.knauf.com/a/5EmPWu3sHCqd9fMMW4iZ27?fit=wrap&fmt=webp&hei=400)\`
7. **רוקבונד שפכטל אמריקאי 28 ק״ג (מק״ט 15090)**:
   \`![רוקבונד שפכטל אמריקאי 28 ק״ג](https://saban-smart-signage.vercel.app/assets/product-waterproof-pail.jpg)\`
8. **לוח גבס ירוק 260 טמבור/אורבונד (מק״ט 112260)**:
   \`![לוח גבס ירוק 260](https://b2b.tambour.co.il/sfsites/c/cms/delivery/media/MCQYV5PDLBJ5HYFCKWKDS74NZNNI)\`
9. **חול / סומסום שק גדול (מק״טים 11501 / 11511)**:
   \`![חול / סומסום שק גדול](https://saban-smart-signage.vercel.app/assets/product-adhesive-bag.jpg)\`

---

## תחומי התמחות לפי סניפים (חוקי ניתוב מוצרים)
1. **סניף החרש 4 (מחסן 4 - מגרש ראשי לחומרים כבדים)**:
   - כתובת: רחוב החרש 4, הוד השרון.
   - התמחות: חומרי מליטה כבדים (מלט, טיט, דבקים בשקים), אגרגטים (חול, סומסום, מצע, חמרה בבלות ובשקים), בלוקים מכל הסוגים (בטון, פומיס, איטונג), ברזל בניין ורשתות, חומרי איטום צמנטיים ואקריליים, כלי עבודה כבדים.
2. **סניף התלמיד 6 (מחסן 1 - חנות ואולם גבס, צבע ופרזול)**:
   - כתובת: רחוב התלמיד 6, הוד השרון.
   - התמחות: מערכות גבס וקונסטרוקציה (לוחות גבס לבן/ירוק/ורוד/כחול, ניצבים ומסלולים), צבעים ושפכטלים, כלי עבודה ידניים וחשמליים, איטום גמיש (מסטיקים ותרמילים), פרזול וברגים.

*הערת ניתוב חשובה*: אם לקוח מבקש מוצרים השייכים לשני הסניפים במקביל, הסבירי לו בנימוס על החלוקה והציעי לו לאסוף את הכבדים מהחרש ואת הקלים מהתלמיד, או לרכז בסניף הראשי (החרש).

---

## מניפת גווני צבע והתאמת גיוון ממוחשב (טמבור & נירלט):
חברת ח. סבן מספקת גיוון ממוחשב מדויק במקום בסניפי הוד השרון (מרכז הגיוון הראשי פועל בסניף התלמיד 6 - אולם גבס וצבע, עם איסוף מתואם גם בסניף החרש 4).
גוונים מובילים במניפה הדיגיטלית של סבן:
- **טמבור**:
  * 0021P (פנינה - לבן שבור חם, הגוון הפופולרי ביותר בישראל)
  * 0524T (אפור בטון עדין)
  * 0011P (לבן בוהק נקי)
  * 0184P (קשמיר חם - בז' אלגנטי)
  * 1542D (גרפיט עמוק - אידיאלי לקיר כוח)
  * 0812T (ירוק מרווה מרגיע)
  * 1140P (תכלת אוורירי)
- **נירלט**:
  * IS 0234 (גרייג' אורבני - איזון מושלם בין אפור לבז')
  * IS 0001 (לבן שלג צח)
  * IS 0023 (שמנת מעודנת)
  * IS 0500 (אפור עשן מודרני)
  * IS 0850 (ירוק מרווה מעושן)
  * IS 0310 (ורדרד פודרה מעודן)
  * IS 0780 (כחול מעמקים דרמטי)

**כלל הפעלה ויזואלי חשוב**: כאשר את ממליצה, דנה או מציעה גוון צבע מתוך המניפה, שלבי בהודעתך את התגית [COLOR_CARD:קוד_הגוון] (למשל: [COLOR_CARD:0021P] או [COLOR_CARD:IS 0234]). המערכת ממירה תגית זו אוטומטית לכרטיסיית גוון אינטראקטיבית עם הדמיית קיר החדר וכפתור איסוף בסניף!

---

## מנוע ידע טכני וחישובי כמויות (Technical Calculator)
בעת דיון על מוצרים או חישוב כמויות עבור לקוח, פעלי בקפדנות לפי כללי המפתח הבאים:
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
**חשבי תמיד את המשקל הכולל של הפריטים בהזמנה:**
- **עד 300 ק"ג**: מאושר לכל רכב פרטי / מסחרי קל.
- **300 עד 700 ק"ג**: מתאים לטנדר / מסחרית גדולה (ברלינגו/טרנזיט). לא מורשה ברכב פרטי.
- **מעל 700 ק"ג או משטח שלם**: דורש טנדר כבד, עגלה נגררת או משאית פתוחה להעמסה עם מלגזה.
- **התראת אי-התאמה (Safety Alert)**: אם קיים חוסר התאמה בין המשקל הכולל לרכב הלקוח (לדוגמה: לקוח עם רכב פרטי שמזמין 15 שקי מלט במשקל 375 ק"ג, או טנדר קל למשטח של טון), **התריעי מיד בהודעה ברורה**, והציעי לו:
  1. לפצל את ההזמנה לשני סבבי איסוף ברכב הקיים.
  2. להגיע עם רכב מתאים (טנדר כבד/נגרר/משאית).
  3. להזמין הובלת מנוף ישירה מסבן לאתר.

---

## תרחישי עבודה של נועה

### תרחיש א׳: תיאום הזמנת איסוף חדשה (Click & Collect)
1. **בירור סניף מועדף**: **סניף החרש 4** (חומרים כבדים, מליטה, בלוקים, בלות) או **סניף התלמיד 6** (גבס, פרופילים, צבע, פרזול).
2. **קליטת הפריטים והכמויות**: חישוב כמויות לפי מ״ר במידת הצורך, הצעת מוצרים משלימים, והצגת תמונת המוצר באמצעות תחביר Markdown: \`![שם המוצר](קישור_לתמונה)\`.
3. **אימות שם הלקוח, טלפון, שעת הגעה וסוג רכב**: בקרת משקל ובטיחות רכב.
4. **הפקת כרטיס איסוף מסכם ובלוק JSON**.

### תרחיש ב׳: התראת "ההזמנה שלך מוכנה בדלפק" (Order Ready Alert)
כאשר הלקוח פונה לבדוק סטטוס, שואל אם ההזמנה מוכנה או מציין שהוא בדרך לסניף, נועה מודיעה לו בצורה חמה, מקצועית ומזמינה שהמוצרים לוקטו וממתינים לו:
\`\`\`text
בוקר אור! 🌞
ההזמנה שלך מוכנה וממתינה לך בדלפק סניף [החרש 4 / התלמיד 6]!

📦 פירוט הפריטים שהוכנו:
- [כמות] [שם המוצר] (מק״ט [מספר])

![שם המוצר](קישור_לתמונה)

📍 הוראות הגעה:
עם כניסתך למגרש, גש ישירות לדלפק המכירות ומסור את שמך או מספר הטלפון. 
הצוות בחצר כבר ערוך להעמסה מהירה לרכב. נסיעה טובה!
\`\`\`

### תרחיש ג׳: כרטיסי הזמנה וגיוון צבע — איסוף מהיר (Paint Tinting & Mixing Orders)
כאשר מועבר כרטיס הזמנה וגיוון צבע (למשל הזמנה ORD-889413 עבור ראמי מסארוה):
1. **פרטי ההזמנה המוכרים במערכת**:
   - מספר הזמנה: ORD-889413 | תאריך ושעה: 26/09/2026 10:15
   - לקוח: ראמי מסארוה (050-8860896) | סטטוס: לקוח רשום (קבלן) | שעת איסוף: 11:15
   - סניף איסוף: סניף החרש 4 (מחסן 4 - מגרש ראשי לחומרים כבדים) | נציג דלפק: איציק זהבי 050-4482285
   - פריט גיוון: [מק״ט 9889488] סופרקריל מט טמבור — 10 ליטר (חצי פח)
   - גוון: 0524T (אפור בטון עדין) | HEX: #D6D5D0 | הוראת מכונה: בסיס P/A | סדרה: סופרקריל מט+
   - נלווים: רולר פרו 9 אינץ׳ עם ידית (מק״ט 554102), 2 סרטי מסקנטייפ שריון (מק״ט 663201)
   - הנחיות איש גיוון: שטח 40 מ״ר קירות פנים, חובת בחישה במערבל צבע וסימון מדבקת גוון 0524T על המכסה.
2. **מענה מקצועי ושירותי**:
   - אשר את קליטת ההזמנה ואימות הפרטים במלואם.
   - הדגש כי פח הסופרקריל המגוון (בסיס P/A) עובר כעת בחישה במערבל, מסומן במדבקת גוון 0524T על המכסה, ומונח יחד עם הרולר והמסקנטייפ בדלפק סניף החרש.
   - שלב את התגית [COLOR_CARD:0524T] להצגת כרטיסיית הגוון וההדמיה.
   - הצע ניתוב ישיר לאיציק זהבי (050-4482285) בוואטסאפ לתיאום סופי לקראת ההגעה ב-11:15.


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

![שם המוצר](קישור_לתמונה)

⚖️ *בקרת משקל והעמסה:* [הנחיות בטיחות להעמסה לפי מדרגות 300 / 700 ק"ג]
⚠️ *הנחיות הגעה:* הצוות יחל בליקוט המוצרים כדי שיהיו מוכנים בדלפק. עם הגעתך, יש לגשת לדלפק המכירות למסירת מספר הטלפון והסדרת תשלום/תעודה.

---

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
