import { MASTER_PRODUCTS, type Product } from "./products";

const SHEET_ID = "1UUnQxlLuPAc5fVfTI277w9ByxFSwrD2giYkoXIPC7sI";
const SHEET_TAB = "מוצרים_לובי";
const CACHE_TTL_MS = 60_000;

type CacheEntry = { at: number; products: Product[]; source: "sheets" | "fallback" };
let cache: CacheEntry | null = null;

type GvizCell = { v?: unknown } | null;
type GvizRow = { c: GvizCell[] };
type GvizTable = { cols: { label?: string }[]; rows: GvizRow[] };

function cellText(cell: GvizCell): string {
  if (!cell || cell.v === null || cell.v === undefined) return "";
  return String(cell.v).trim();
}

function num(value: string): number | undefined {
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) && value !== "" ? parsed : undefined;
}

function list(value: string): string[] {
  return value
    .split(/[,|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function rowToProduct(headers: string[], row: GvizRow): Product | null {
  const get = (key: string) => {
    const index = headers.indexOf(key);
    return index === -1 ? "" : cellText(row.c[index] ?? null);
  };
  const sku = get("sku");
  const name = get("name");
  if (!sku || !name) return null;
  const master = MASTER_PRODUCTS.find((p) => p.sku === sku);
  const isActive = get("isActive").toLowerCase();

  return {
    ...(master ?? MASTER_PRODUCTS[0]!),
    sku,
    name,
    category: get("category") || master?.category || "כללי",
    brand: get("brand") || master?.brand || "ח. סבן",
    price: num(get("price")) ?? master?.price ?? 0,
    salePrice: num(get("salePrice")) ?? master?.salePrice,
    discountTag: get("discountTag") || master?.discountTag,
    marketingPhrase: get("marketingPhrase") || master?.marketingPhrase || "",
    mediaUrl: get("mediaUrl") || master?.mediaUrl,
    unitLabel: get("packaging") || master?.unitLabel || "יחידה",
    unitWeight: get("unitWeight") || master?.unitWeight || "",
    unitsPerPallet: num(get("unitsPerPallet")) ?? master?.unitsPerPallet,
    coveragePerUnitM2: num(get("coverageM2")) ?? master?.coveragePerUnitM2 ?? 1,
    coverageNote: get("coverageNote") || master?.coverageNote || "",
    dryingTime: get("dryingTime") || master?.dryingTime,
    applicationMethod: get("applicationMethod") || master?.applicationMethod || "",
    substrates: list(get("substrates")).length
      ? list(get("substrates"))
      : (master?.substrates ?? []),
    displayDuration: num(get("displayDuration")) ?? master?.displayDuration ?? 25,
    isActive: isActive === "" ? true : !["false", "0", "לא"].includes(isActive),
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
      return data.products;
    }
  } catch (err) {
    console.warn("Could not fetch products from Apps Script:", err);
  }
  return null;
}

async function fetchFromSheets(): Promise<Product[] | null> {
  const fromAppsScript = await fetchFromAppsScript();
  if (fromAppsScript && fromAppsScript.length > 0) {
    return fromAppsScript;
  }

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
  } catch {
    return null;
  }
}

/** רשימת מוצרי הלובי עם מטמון של 60 שניות ונתוני גיבוי מקומיים */
export async function getLobbyProductsCached(): Promise<CacheEntry> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache;

  const fromSheets = await fetchFromSheets();
  cache = fromSheets
    ? { at: now, products: fromSheets, source: "sheets" }
    : { at: now, products: MASTER_PRODUCTS, source: "fallback" };
  return cache;
}
