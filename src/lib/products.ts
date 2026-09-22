export type Companion = {
  sku?: string | undefined;
  name: string;
  reason: string;
};

export type Product = {
  sku: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  salePrice?: number | undefined;
  discountTag?: string | undefined;
  marketingPhrase: string;
  image: string;
  mediaUrl?: string | undefined;
  tdsUrl?: string | undefined;
  unitLabel: string;
  unitWeight: string;
  unitsPerPallet?: number | undefined;
  palletDeposit?: string | undefined;
  /** שטח מומלץ (מ"ר) לכל יחידה בעובי/יישום התקני */
  coveragePerUnitM2: number;
  coverageNote: string;
  openTime?: string | undefined;
  potLife?: string | undefined;
  dryingTime?: string | undefined;
  mixRatio?: string | undefined;
  applicationMethod: string;
  standard?: string | undefined;
  substrates: string[];
  companions: Companion[];
  displayDuration: number;
  preferredWarehouse?: string | undefined;
  isActive: boolean;
};

/** ניקוי וסניטיזציה מלאה של מק״ט שהתקבל מה-QR או מכתובת ה-URL */
export function normalizeSku(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  let value = String(raw);
  try {
    value = decodeURIComponent(value);
  } catch {
    // כתובת לא מקודדת — ממשיכים עם הערך המקורי
  }
  return value
    .trim()
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
    .replace(/^#+/, "")
    .replace(/^(?:sku|item|product|sika)[-_:]/i, "")
    .replace(/\s+/g, "");
}

/**
 * איתור מוצר מתוך קטלוג המוצרים של גיליון 📦 קטלוג_מוצרים
 */
export function findProduct(products: Product[], rawSku: unknown): Product | undefined {
  if (!products || products.length === 0) return undefined;
  const sku = normalizeSku(rawSku);

  if (!sku) {
    return products[0];
  }

  const lower = sku.toLowerCase();
  const digitsOnly = sku.replace(/\D/g, "");

  // 1. התאמה מדויקת של מק״ט מנורמל
  let match = products.find((p) => normalizeSku(p.sku).toLowerCase() === lower);
  if (match) return match;

  // 2. התאמה נומרית תוך הסרת אפסים מובילים ('19255' מול 19255 מול '0019255')
  match = products.find(
    (p) => normalizeSku(p.sku).replace(/^0+/, "") === sku.replace(/^0+/, "") && sku !== "",
  );
  if (match) return match;

  // 3. התאמת ספרות בלבד אם קיימות לפחות 3 ספרות
  if (digitsOnly && digitsOnly.length >= 3) {
    match = products.find((p) => {
      const pDigits = normalizeSku(p.sku).replace(/\D/g, "");
      return pDigits === digitsOnly || (pDigits.length >= 4 && digitsOnly.includes(pDigits));
    });
    if (match) return match;
  }

  // 4. התאמה לפי שם מוצר או מותג
  match = products.find(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      lower.includes(p.name.toLowerCase()) ||
      p.brand.toLowerCase() === lower,
  );
  if (match) return match;

  // 5. אם לא נמצאה התאמה מדויקת, מחזיר את המוצר הראשון מקטלוג הגיליון
  return products[0];
}

export function effectivePrice(product: Product): number {
  return product.salePrice ?? product.price;
}
