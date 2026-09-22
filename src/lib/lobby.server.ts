import { type Companion, type Product } from "./products";

const SHEET_ID = "1UUnQxlLuPAc5fVfTI277w9ByxFSwrD2giYkoXIPC7sI";
const SHEET_TAB = "📦 קטלוג_מוצרים";
const CACHE_TTL_MS = 45_000;

type CacheEntry = { at: number; products: Product[]; source: "sheets" };
let cache: CacheEntry | null = null;

type GvizCell = { v?: unknown } | null;
type GvizRow = { c: GvizCell[] };
type GvizTable = { cols: { label?: string }[]; rows: GvizRow[] };

function cellText(cell: GvizCell): string {
  if (!cell || cell.v === null || cell.v === undefined) return "";
  return String(cell.v).trim();
}

function num(value: string | number | undefined): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (!value) return undefined;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function list(value: string): string[] {
  return value
    .split(/[,|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCompanions(raw: string): Companion[] {
  if (!raw) return [];
  return raw
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const match = item.match(/(.+?)(?:\s*\(מק״ט\s*([^)]+)\))?$/);
      if (match) {
        return {
          name: match[1]!.trim(),
          sku: match[2]?.trim(),
          reason: "מוצר משלים מומלץ",
        };
      }
      return {
        name: item,
        reason: "מוצר משלים",
      };
    });
}

function rowToProduct(headers: string[], row: GvizRow): Product | null {
  const get = (keyVariants: string[]) => {
    for (const key of keyVariants) {
      const index = headers.findIndex((h) => h.toLowerCase() === key.toLowerCase());
      if (index !== -1) {
        const val = cellText(row.c[index] ?? null);
        if (val) return val;
      }
    }
    return "";
  };

  const sku = get(["מק״ט SKU", "sku", "מק״ט", 'מק"ט']);
  const name = get(["שם המוצר", "name", "שם"]);
  if (!sku || !name) return null;

  const isActiveRaw = get(["פעיל בשילוט? (TRUE/FALSE)", "isActive", "פעיל"]);
  const isActive =
    isActiveRaw === ""
      ? true
      : !["false", "0", "לא", "no", "לֹא"].includes(isActiveRaw.toLowerCase());

  const rawCompanions = get(["מוצרים משלימים מחייבים", "companions", "מוצרים משלימים"]);

  return {
    sku,
    name,
    category: get(["קטגוריה", "category"]) || "כללי",
    brand: get(["מותג", "brand"]) || "ח. סבן",
    price: num(get(["מחירון (₪)", "price", "מחיר"])) ?? 0,
    salePrice: num(get(["מחיר קבלן (₪)", "salePrice", "מחיר קבלן"])),
    discountTag: get(["תגית מבצע", "discountTag", "מבצע"]) || undefined,
    marketingPhrase: get(["הערת כיסוי", "marketingPhrase", "תיאור קצר"]) || `${name} — אספקה בסבן`,
    image: (() => {
      const raw = get(["קישור לתמונה", "image", "תמונה"]);
      if (!raw) return "/assets/product-adhesive-bag.jpg";
      if (raw.includes("saban-smart-signage.vercel.app/assets/")) {
        return raw.replace(/https?:\/\/saban-smart-signage\.vercel\.app\/assets\//, "/assets/");
      }
      return raw;
    })(),
    mediaUrl:
      get(["קישור לסרטון הדרכה (YouTube)", "mediaUrl", "סרטון"]) ||
      "https://www.youtube.com/embed/ScMzIvxBSi4",
    tdsUrl: get(["קישור TDS טכני", "tdsUrl", "tds"]) || undefined,
    unitLabel: get(["יחידת אריזה", "packaging", "unitLabel"]) || "יחידה",
    unitWeight: get(["משקל יחידה", "unitWeight", "משקל"]) || "",
    unitsPerPallet: num(get(["יחידות במשטח", "unitsPerPallet"])),
    palletDeposit: get(["פקדון משטח (₪)", "palletDeposit", "פקדון משטח"]) || undefined,
    coveragePerUnitM2: num(get(["כושר כיסוי (מ״ר)", "coverageM2", "coveragePerUnitM2"])) ?? 1,
    coverageNote: get(["הערת כיסוי", "coverageNote"]) || "",
    openTime: get(["זמן פתוח / עבודה", "openTime"]) || undefined,
    dryingTime: get(["זמן ייבוש", "dryingTime"]) || undefined,
    applicationMethod: get(["שיטת יישום", "applicationMethod"]) || "",
    standard: get(["תקן רשמי", "standard"]) || undefined,
    substrates: list(get(["מצעים מאושרים", "substrates"])),
    companions: parseCompanions(rawCompanions),
    displayDuration: num(get(["displayDuration"])) ?? 25,
    preferredWarehouse: get(["מחסן / סניף מועדף", "preferredWarehouse", "סניף מועדף"]) || undefined,
    isActive,
  };
}

async function fetchFromAppsScript(): Promise<Product[] | null> {
  const webhookUrl =
    process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
    "https://script.google.com/macros/s/AKfycbxxMuFP5evxDx8vxd3BfCQgx73H88KTOB87AzbiCAEx69UVJE1qmoCMyF9KM9qljvAX/exec";
  try {
    const res = await fetch(`${webhookUrl}?action=products`, {
      redirect: "follow",
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { success?: boolean; products?: Product[] };
    if (data.success && Array.isArray(data.products) && data.products.length > 0) {
      return data.products.map((p) => {
        let image = p.image || "/assets/product-adhesive-bag.jpg";
        if (image.includes("saban-smart-signage.vercel.app/assets/")) {
          image = image.replace(
            /https?:\/\/saban-smart-signage\.vercel\.app\/assets\//,
            "/assets/",
          );
        }
        return {
          ...p,
          image,
          isActive: p.isActive !== false,
          displayDuration: p.displayDuration || 25,
          substrates: Array.isArray(p.substrates) ? p.substrates : [],
          companions: Array.isArray(p.companions) ? p.companions : [],
        };
      });
    }
  } catch (err) {
    console.warn("Could not fetch products from Apps Script:", err);
  }
  return null;
}

async function fetchFromSheets(): Promise<Product[] | null> {
  // 1. קריאה ישירה מ-Apps Script המקושר לגיליון 📦 קטלוג_מוצרים
  const fromAppsScript = await fetchFromAppsScript();
  if (fromAppsScript && fromAppsScript.length > 0) {
    return fromAppsScript;
  }

  // 2. קריאה ישירה דרך Google Visualization API מגיליון 📦 קטלוג_מוצרים
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    SHEET_TAB,
  )}`;
  try {
    const res = await fetch(url, {
      headers: { accept: "text/plain" },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const text = await res.text();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(text.slice(start, end + 1)) as { table?: GvizTable };
    const table = parsed.table;
    if (!table?.rows?.length) return null;
    const headers = table.cols.map((col) => (col.label ?? "").trim());
    const products = table.rows
      .map((row) => rowToProduct(headers, row))
      .filter((p): p is Product => p !== null);
    return products.length ? products : null;
  } catch (err) {
    console.warn("Could not fetch products from Google Sheets gviz:", err);
    return null;
  }
}

const FALLBACK_PRODUCTS: Product[] = [
  {
    sku: "10701",
    name: "סיקה טופ 107 (SikaTop Seal-107)",
    category: "איטום",
    brand: "סיקה (Sika)",
    price: 185,
    salePrice: 168,
    discountTag: "מבצע קבלנים",
    marketingPhrase: "איטום צמנטי אלסטי דו-רכיבי למאגרי מים, בריכות ומרפסות",
    image: "/assets/product-adhesive-bag.jpg",
    unitLabel: "ערכה (25 ק״ג)",
    unitWeight: "25 ק״ג",
    unitsPerPallet: 40,
    palletDeposit: "משטח סבן תקני (מק״ט 60060)",
    coveragePerUnitM2: 12.5,
    coverageNote: "12.5 מ״ר לערכה (25 ק״ג) בשתי שכבות",
    dryingTime: "24 שעות בין שכבות",
    applicationMethod: "הברשה במברשת סיד או מריחה במאלג׳",
    substrates: ["בטון", "טיח צמנטי", "בלוק בטון"],
    companions: [
      {
        name: "סיקה לטקס SBR לרולקות",
        sku: "10702",
        reason: "חובה לרולקות בחיבורי רצפה-קיר ושיפור הדבקה",
      },
      { name: "רשת שריון פיברגלס", reason: "חובה להטמעה בין השכבות במוקדי עומס" },
    ],
    displayDuration: 25,
    preferredWarehouse: "החרש 4",
    isActive: true,
  },
  {
    sku: "15181",
    name: "טיט לריצוף 181 כרמית מיסטר פיקס 25 ק״ג (ריצופית)",
    category: "מליטה וריצוף",
    brand: "מיסטר פיקס (כרמית)",
    price: 36,
    salePrice: 32,
    discountTag: "מחיר כמות",
    marketingPhrase: "טיט צמנטי משופר פולימרים להדבקה ומילוי תחת אריחי ריצוף",
    image: "/assets/product-adhesive-bag.jpg",
    unitLabel: "שק (25 ק״ג)",
    unitWeight: "25 ק״ג",
    unitsPerPallet: 48,
    palletDeposit: "משטח סבן תקני (מק״ט 60060)",
    coveragePerUnitM2: 5.0,
    coverageNote: "כ-5 מ״ר לשק (בעובי תקני 5 מ״מ)",
    dryingTime: "48 שעות לפני דריכה",
    applicationMethod: "מאלג׳ משונן 10-12 מ״מ",
    substrates: ["בטון", "תשתית חול מיוצב", "מדה מתפלסת"],
    companions: [
      { name: "ספייסרים לפוגות (מרווחונים)", reason: "חובה לשמירה על מרווח פוגה תקני בריצוף" },
      { name: "רובה גמישה", reason: "חובה לאיטום ומילוי המישקים לאחר ייבוש הטיט" },
    ],
    displayDuration: 25,
    preferredWarehouse: "החרש 4",
    isActive: true,
  },
  {
    sku: "14075",
    name: "טיח גבס MP75 שק 25 ק״ג קנאוף (Knauf MP75)",
    category: "טיח וגבס",
    brand: "קנאוף (Knauf)",
    price: 42,
    salePrice: 38,
    discountTag: "מלאי זמין",
    marketingPhrase: "טיח גבס חד-שכבתי איכותי להחלקה מושלמת של קירות פנים",
    image: "/assets/product-adhesive-bag.jpg",
    unitLabel: "שק (25 ק״ג)",
    unitWeight: "25 ק״ג",
    unitsPerPallet: 40,
    palletDeposit: "משטח סבן תקני (מק״ט 60060)",
    coveragePerUnitM2: 2.5,
    coverageNote: "2.5 מ״ר לשק בעובי 10 מ״מ",
    dryingTime: "7-14 ימים לייבוש מלא בהתאם לאוורור",
    applicationMethod: "התזה במכונה או מריחה ידנית וסרגול",
    substrates: ["בלוק שחור", "בלוק איטונג", "בטון יצוק עם בטונקונטקט"],
    companions: [
      {
        name: "פריימר בטונקונטקט (Betonkontakt)",
        reason: "חובה לוודא קיום פריימר מקשר על גבי בטון יצוק",
      },
    ],
    displayDuration: 25,
    preferredWarehouse: "החרש 4",
    isActive: true,
  },
  {
    sku: "112260",
    name: "לוח גבס ירוק 260 עמידות מוגברת בלחות (עובי 12.5 מ״מ)",
    category: "מערכות גבס",
    brand: "אורבונד / קנאוף",
    price: 48,
    salePrice: 44,
    discountTag: "עמיד לחות",
    marketingPhrase: "לוח גבס מוגן לחות למחיצות, תקרות וחיפויים בחדרים רטובים",
    image: "/assets/product-adhesive-bag.jpg",
    unitLabel: "לוח (3.12 מ״ר)",
    unitWeight: "28 ק״ג",
    unitsPerPallet: 40,
    palletDeposit: "משטח גבס תקני",
    coveragePerUnitM2: 3.12,
    coverageNote: "שטח לוח = 3.12 מ״ר (1.20 מ׳ × 2.60 מ׳)",
    applicationMethod: "הברגה ישירה לקונסטרוקציית ניצבים ומסלולים",
    substrates: ["שלד פח מגולוון 50/70", "שלד עץ"],
    companions: [
      {
        name: "ברגי גבס 25 מ״מ שחורים",
        sku: "76206",
        reason: "מומלץ להציע ברגי גבס 25 לחיבור הלוח",
      },
      { name: "מסלולים וניצבים תואמים", reason: "קונסטרוקציה תואמת להתקנת הלוחות" },
    ],
    displayDuration: 25,
    preferredWarehouse: "התלמיד 6",
    isActive: true,
  },
  {
    sku: "111260",
    name: "לוח גבס לבן סטנדרטי 260 (עובי 12.5 מ״מ)",
    category: "מערכות גבס",
    brand: "אורבונד / קנאוף",
    price: 39,
    salePrice: 35,
    discountTag: "מלאי ענק",
    marketingPhrase: "לוח גבס סטנדרטי למחיצות פנים, קירות ותקרות",
    image: "/assets/product-adhesive-bag.jpg",
    unitLabel: "לוח (3.12 מ״ר)",
    unitWeight: "26 ק״ג",
    unitsPerPallet: 40,
    palletDeposit: "משטח גבס תקני",
    coveragePerUnitM2: 3.12,
    coverageNote: "שטח לוח = 3.12 מ״ר (1.20 מ׳ × 2.60 מ׳)",
    applicationMethod: "הברגה ישירה לקונסטרוקציית ניצבים ומסלולים",
    substrates: ["שלד פח מגולוון 50/70", "שלד עץ"],
    companions: [
      {
        name: "ברגי גבס 25 מ״מ שחורים",
        sku: "76206",
        reason: "מומלץ להציע ברגי גבס 25 לחיבור הלוח",
      },
      { name: "מסלולים וניצבים תואמים", reason: "קונסטרוקציה תואמת להתקנת הלוחות" },
    ],
    displayDuration: 25,
    preferredWarehouse: "התלמיד 6",
    isActive: true,
  },
];

/**
 * רשימת מוצרים הנשלפת אך ורק מגיליון 📦 קטלוג_מוצרים (עם מטמון קצר של 45 שניות)
 */
export async function getLobbyProductsCached(): Promise<CacheEntry> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache;

  const fromSheets = await fetchFromSheets();
  const products = fromSheets && fromSheets.length > 0 ? fromSheets : FALLBACK_PRODUCTS;

  cache = {
    at: now,
    products,
    source: "sheets",
  };
  return cache;
}
