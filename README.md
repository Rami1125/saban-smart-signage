# Saban Smart Signage

מסמך איפיון ארכיטקטוני: מערכת שילוט לובי, סריקת QR ודף מוצר אינטראקטיבי

חברת: ח. סבן חומרי בניין (1994) בע״מ

1. תרשים זרימה כללי (End-to-End User Flow)

codeText

[מסך טלוויזיה בלובי/מחסן] 
       │ 
       ▼ מציג מוצר מקודם + קוד QR דינמי
[סריקת QR ע״י לקוח/קבלן בטלפון הנייד]
       │
       ▼ ניתוב ל-URL ייעודי: /product/{SKU}
[דף נחיתה אינטראקטיבי בנייד]
       ├─ מפרט טכני מלא, צריכה למ"ר, זמני ייבוש
       ├─ צפייה בסרטון יישום (YouTube / וידאו הדרכה)
       ├─ מחשבון כמויות דיגיטלי
       └─ כפתורי פעולה: "הזמן לדלפק", "שמור למועדפים", "שוחח בוואטסאפ"
       │
       ▼ שליחת בקשה לדלפק המכירות
[ממשק הדלפק / קופאי / מלקט]
       └─ קבלת פרטי המוצר, כמויות מבוקשות, פרטי קבלן והכנה מיידית

2. ארכיטקטורת הנתונים והשילוט (Signage Architecture)

א. מקור הנתונים (Single Source of Truth)

גוגל שיטס ייעודי לשילוט מוצרים: טאב מוצרים_לובי או שילוט_לובי המנוהל ישירות על ידי מנהל המכירות/המחסן.

שכבת Google Apps Script (Webhook):

נקודת קצה ?action=getLobbyProducts המחזירה JSON מובנה עם רשימת המוצרים הפעילים (isActive: true).

שדות לכל מוצר: sku, name, category, price, salePrice, discountTag, images, mediaUrl, marketingPhrase, coverageM2, dryingTime, applicationMethod, packaging, displayDuration.

שכבת שרת מקומית (/api/sheets/store-products):

מבצעת Caching (זיכרון מטמון של 60 שניות) למניעת עומס על Google Sheets ולוויסות קריאות.

כוללת Fallback מובנה (נתוני גיבוי למוצרי עוגן כמו דבקים, מלט, בלוקים) במקרה של ניתוק רשת.

ב. מנגנון תצוגת השילוט במסך (Lobby Signage Engine)

רוטציה חכמה: המסך מציג מוצרים נבחרים במחזורי זמן מוגדרים (ברירת מחדל: 20-30 שניות לשקופית).

פריסת מסך (Layout):

אזור ראשי: תמונת המוצר ברזולוציה גבוהה, תג מבצע בולט, ומחיר קטלוגי מול מחיר מבצע.

אזור טכני תמציתי: נתונים שקבלן מחפש בשנייה הראשונה (כושר כיסוי, זמן ייבוש, תקן).

אזור הנעה לפעולה (CTA & QR): בלוק מודגש עם קוד QR גדול, קריא וסריק ממרחק של 2-3 מטרים.

3. מנגנון יצירת ה-QR Code ושיטת הסריקה

א. מבנה ה-URL

ה-QR מייצר כתובת ישירה המובילה לנתיב המוצר ב-PWA:

codeText

https://[domain]/product/{sku}?source=lobby_qr&screen_id={screenId}&t={timestamp}

sku: המזהה החד-חד-ערכי של המוצר במערכת סבן (למשל 19255 לסיקה סרם 255).

source=lobby_qr: מאפשר מעקב אנליטי (כמה סריקות הגיעו ממסכי הלובי).

screen_id: זיהוי המסך הספציפי שממנו נסרק (למשל: דלפק שירות, מחסן איסוף עצמי).

ב. אלגוריתם הרינדור של ה-QR

מרונדר ישירות באמצעות ספריית qrcode.react או SVG וקטורי מובנה בקומפוננטת QRCodeView.

רמת תיקון שגיאות (Error Correction Level): דרגה M (15%) או Q (25%) המאפשרת סריקה אופטימלית גם בתנאי תאורה משתנים או מזוויות אלכסוניות.

הבלטה גרפית: מסגרת לבנה נקייה (Quiet Zone) של לפחות 4 מודולים סביב הקוד, עם לוגו קטן או אייקון טלפון/סריקה במרכז.

4. מה מוצג בדף הנייד לאחר סריקת ה-QR?

דף הנחיתה בנייד (/product/$sku) מותאם לעבודה באתרי בנייה ולשימוש מהיר ביד אחת:

1. כותרת עליונה ותג סטטוס (Sticky Header)

לוגו ח. סבן עם חיווי "מפרט רשמי מאושר".

מק״ט המוצר וקטגוריה (לדוגמה: דבקים ואיטום).

לחצן חזרה מהיר / סגירה.

2. גלריית תמונות ווידאו הדרכה

סליידר תמונות איכותיות: אריזה קדמית, תוויות אזהרה, מרקם החומר.

במידה וקיים mediaUrl (YouTube / Shorts / Drive): נגן מובנה להדגמת אופן המריחה והיישום בשטח.

3. תמחור ותנאי רכישה

מחיר מחירון מול מחיר מבצע: הדגשת חיסכון לקבלנים.

אריזה וכמות במשטח: משקל שק/דלי, מספר יחידות במשטח שלם (להזמנות כבדות).

4. כרטיסיות מפרט טכני מהיר (Technical Highlights)

כושר כיסוי (Coverage): כמות חומר מומלצת למ״ר לפי עובי השכבה (למשל: כ-1.6 ק״ג למ״ר לכל 1 מ״מ).

זמני עבודה (Open Time & Pot Life): זמן עבודה בדלי וזמן פתוח על הקיר.

הוראות ערבוב ויישום: יחסי מים-אבקה, מהירות ערבוב מומלצת במיקסר, וכלים מתאימים (מלג' משונן).

5. מחשבון כמויות אינטראקטיבי (Built-in Calculator)

הקבלן מזין את שטח הריצוף/החיפוי במ״ר (

).



המערכת מחשבת אוטומטית:

כמה שקים/דליים נדרשים (כולל פחת מומלץ של 10%).

עלות מוערכת לשטח המבוקש.

6. כפתורי פעולה לסגירה מהירה (Bottom Action Bar)

כפתור "הזמן לדלפק זה": משדר את המק״ט והכמות למסך הדלפק.

כפתור WhatsApp מהיר: פותח שיחה מול המוקד עם הודעה מוכנה מראש:

"שלום, אני נמצא בסניף וסרקתי את המוצר סיקה סרם 255 (מק״ט 19255). מעוניין בהצעת מחיר ל-20 שקים."

הורדת דף נתונים טכני (TDS / PDF): פתיחת מסמך התקן הרשמי בלחיצה אחת.

5. מה יוצג ללקוח ולנציג בדלפק המכירות?

ברגע שהלקוח ניגש לדלפק, המערכת מאפשרת סנכרון מהיר בין הטלפון של הלקוח לעמדת המכירה:

א. תצוגת הדלפק (מסך הנציג / POS Helper)

התראת "סריקה מהלובי" (Lobby Cart Ingestion):

במידה והלקוח לחץ "שדר לדלפק", מופיעה התראה עם שם המוצר, הכמות המבוקשת והזמן שחלף.

בדיקת מלאי בזמן אמת:

זמינות המוצר במחסן 4 (החרש) מול מחסן 1 (התלמיד).

מיקום המדף/המשטח במחסן לאיסוף עצמי מיידי.

התאמת מחירון קבלן:

הזנת מספר חשבון הלקוח במערכת סבן להצגת המחיר האישי המאושר (הנחת קבלן).

מוצרים משלימים מומלצים בדלפק:

המערכת מציגה לנציג מוצרים נלווים שהקבלן עשוי להזדקק להם (למשל: ספייסרים, כפפות מוקצפות, פריימר, רובה תואמת).

ב. מסך הפונה ללקוח בדלפק (Customer-Facing Counter Display)

אישור פריט שנבחר: תמונת המוצר, השם המלא והמק״ט כדי לוודא שאין טעות בהזמנה.

סיכום כמויות וחישוב משטחים/בלות: הצגת מספר יחידות וחיוב פקדונות משטחים (משטח סבן 60060 / בלה 60002).

סטטוס הכנת ההזמנה:

"ההזמנה נקלטה במערכת" ➔ "מועברת לליקוט במחסן 4" ➔ "מוכנה לאיסוף ברציף 2".

6. יתרונות עסקיים ותפעוליים

מדדלפני המערכתעם שילוט חכם וסריקת QRזמן המתנה בדלפק5-8 דקות של שאלות טכניות מול הנציגהלקוח מגיע לדלפק עם מק״ט מדויק וכמות מחושבת מראשחשיפה למבצעיםתלויה בשילוט נייר סטטי שנשחקעדכון מבצעים חי ומיידי מ-Google Sheetsטעויות במפרטבחירת דבק לא מתאים לסוג האריחצפייה בהוראות היישום ובמגבלות התקן בנייד לפני הרכישהמכירה צולבת (Upsell)תלויה בזיכרון של נציג הדלפקהצגת מוצרים משלימים אוטומטית בדף המוצר ובדלפק

Role & Mission:
You are the Senior Full-Stack Architect & Security Engineer for "H. Saban Building Materials (1994) Ltd." (ח. סבן חומרי בניין בע"מ).
Implement a dedicated, highly secure, standalone Micro-Frontend Product Landing Page for our Vercel deployment:
Base URL: https://tv-noa-three.vercel.app

Objective & Architectural Isolation (Zero-Leak Security):

The route '/product/[sku]' or '/product/index.html?sku=[sku]' MUST serve ONLY the isolated product inspection experience.

Strict Security Boundary: End-users scanning the QR code in the store/lobby must NEVER have access to admin dashboards, driver tracking, PTO blackbox logs, internal spreadsheets, or picker queues.

No global navigation, header links, or store internal routes can be leaked in this bundle.

QR Code Resolution & URL Canonicalization:

Fix the QR 404 / 'Product Not Found' bug permanently:

Canonical URL pattern: https://tv-noa-three.vercel.app/product/[sku]?source=lobby_qr&warehouse=auto

Sanitize incoming SKU parameters: trim whitespace, decode URI components, and handle both string and numeric matching ('19255' vs 19255).

Robust Fallback System: If the external Google Sheets API is rate-limited or unreachable, immediately hydrate with local Master Fallback Data (e.g., SikaCeram-255 StarFlex SKU 19255, SikaTop 107, etc.) so the screen never displays a 404 error.

Standalone Product Experience Requirements:

Visual Display: High-resolution packaging render, SKU tag, price vs contractor special price, coverage per m², open time, drying time, and application instructions.

Interactive m² Calculator: Allows contractors to enter project square meters and automatically outputs required bags/buckets (+10% waste buffer) and estimated cost.

Video Embed: Native responsive YouTube player for technical application tutorials.

Floating AI Chat Bubble ("בועה 💭 - נועה נציגת שירות ויועצת טכנית"):

Sticky floating circular button at the bottom-left corner with an animated greeting bubble 💭.

Clicking expands an interactive conversational chat window powered by Noa AI Persona:

Hard Technical Grounding: Advises ONLY based on the official product data, application substrates (concrete, drywall, blocks), and drying phases.

Mandatory Upsell: Enforces logical cross-sell dependencies (e.g., Sika Latex SBR for coves with Sika 107; primer and mesh with plaster/glues; 60060 deposit pallets for >10 bags).

Actionable Cart / Direct Counter Dispatch: When the client agrees on quantities, Noa formats the order and provides:
a) "שדר לדלפק המכירות" (dispatches order to the local POS counter).
b) Instant WhatsApp dispatch link to Saban Order Dispatch (+972508860896).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/104f4468-f01e-4a36-af39-cb323dd016f0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
