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
    image:
      get(["קישור לתמונה", "image", "תמונה"]) ||
      "https://saban-smart-signage.vercel.app/assets/product-adhesive-bag.jpg",
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
    const res = await fetch(`${webhookUrl}?action=products`, { redirect: "follow" });
    if (!res.ok) return null;
    const data = (await res.json()) as { success?: boolean; products?: Product[] };
    if (data.success && Array.isArray(data.products) && data.products.length > 0) {
      return data.products.map((p) => ({
        ...p,
        isActive: p.isActive !== false,
        displayDuration: p.displayDuration || 25,
        substrates: Array.isArray(p.substrates) ? p.substrates : [],
        companions: Array.isArray(p.companions) ? p.companions : [],
      }));
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
    const res = await fetch(url, { headers: { accept: "text/plain" } });
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

/**
 * רשימת מוצרים הנשלפת אך ורק מגיליון 📦 קטלוג_מוצרים (עם מטמון קצר של 45 שניות)
 */
export async function getLobbyProductsCached(): Promise<CacheEntry> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache;

  const fromSheets = await fetchFromSheets();
  cache = {
    at: now,
    products: fromSheets || [],
    source: "sheets",
  };
  return cache;
}
