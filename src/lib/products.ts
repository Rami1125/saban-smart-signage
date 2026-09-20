import adhesiveBag from "@/assets/product-adhesive-bag.jpg";
import waterproofPail from "@/assets/product-waterproof-pail.jpg";
import latexSbr from "@/assets/product-latex-sbr.jpg";

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
  isActive: boolean;
};

/** נתוני עוגן מקומיים — משמשים כגיבוי מלא כשה-Google Sheets לא זמין */
export const MASTER_PRODUCTS: Product[] = [
  {
    sku: "19255",
    name: "סיקה סרם 255 סטארפלקס",
    category: "דבקים ואיטום",
    brand: "Sika",
    price: 89,
    salePrice: 74.9,
    discountTag: "מבצע קבלנים",
    marketingPhrase: "דבק גמיש C2TE S1 לאריחים גדולים ופורצלן",
    image: adhesiveBag,
    mediaUrl: "https://www.youtube.com/embed/ScMzIvxBSi4",
    tdsUrl: "https://isr.sika.com",
    unitLabel: "שק",
    unitWeight: "25 ק״ג",
    unitsPerPallet: 48,
    palletDeposit: "משטח סבן 60060",
    coveragePerUnitM2: 3.9,
    coverageNote: "כ-1.6 ק״ג למ״ר לכל 1 מ״מ עובי. בשכבה של 4 מ״מ — כ-3.9 מ״ר לשק.",
    openTime: "20-30 דקות",
    potLife: "כ-4 שעות בדלי",
    dryingTime: "הליכה קלה לאחר 24 שעות, רובה לאחר 24 שעות, אכלוס מלא 7 ימים",
    mixRatio: "6.5-7 ליטר מים לשק 25 ק״ג",
    applicationMethod: "ערבוב במיקסר איטי (500 סל״ד), מריחה במלג׳ משונן 10 מ״מ, כיבוד כפול לאריחים מעל 60×60",
    standard: "EN 12004 – C2TE S1",
    substrates: ["בטון", "טיח צמנטי", "מדה", "גבס ירוק", "בלוקים"],
    companions: [
      { sku: "19502", name: "סיקה לטקס SBR", reason: "חובה לרולקות והדבקה על מצע בעייתי" },
      { name: "ספייסרים 3 מ״מ", reason: "שמירת מרווח אחיד" },
      { name: "רובה תואמת", reason: "השלמת העבודה לאחר 24 שעות" },
      { name: "כפפות מוקצפות", reason: "עבודה בטוחה עם חומר צמנטי" },
    ],
    displayDuration: 25,
    isActive: true,
  },
  {
    sku: "19107",
    name: "סיקה טופ 107 איטום צמנטי",
    category: "איטום רטוב",
    brand: "Sika",
    price: 165,
    salePrice: 139,
    discountTag: "מומלץ למקלחות",
    marketingPhrase: "איטום דו-רכיבי גמיש למקלחות, מרפסות ובורות",
    image: waterproofPail,
    mediaUrl: "https://www.youtube.com/embed/ScMzIvxBSi4",
    tdsUrl: "https://isr.sika.com",
    unitLabel: "סט",
    unitWeight: "25 ק״ג (A+B)",
    unitsPerPallet: 24,
    palletDeposit: "משטח סבן 60060",
    coveragePerUnitM2: 6,
    coverageNote: "כ-2 ק״ג למ״ר לשכבה. שתי שכבות — כ-6 מ״ר לסט.",
    openTime: "יישום שכבה שנייה לאחר 4-6 שעות",
    potLife: "כ-45 דקות לאחר ערבוב",
    dryingTime: "המתנה 3 ימים לפני מילוי מים",
    mixRatio: "רכיב A לרכיב B לפי יחס היצרן, ללא תוספת מים",
    applicationMethod: "מריחה במברשת או מלג׳ חלק, 2 שכבות מוצלבות + רולקה בפינות",
    standard: "EN 1504-2",
    substrates: ["בטון", "טיח צמנטי", "בלוקים"],
    companions: [
      { sku: "19502", name: "סיקה לטקס SBR", reason: "חיוני לרולקות ולהרטבת מצע יבש" },
      { name: "רשת שריון לפינות", reason: "מונע סדיקה בחיבורי קיר-רצפה" },
      { name: "פריימר מצע", reason: "הגדלת הידבקות על מצע סופג" },
    ],
    displayDuration: 25,
    isActive: true,
  },
  {
    sku: "19502",
    name: "סיקה לטקס SBR",
    category: "תוספים ופריימרים",
    brand: "Sika",
    price: 96,
    salePrice: 84,
    marketingPhrase: "תוסף הידבקות לרולקות, טיח ומדה",
    image: latexSbr,
    tdsUrl: "https://isr.sika.com",
    unitLabel: "מכל",
    unitWeight: "5 ליטר",
    unitsPerPallet: 96,
    coveragePerUnitM2: 25,
    coverageNote: "מדולל 1:3 במים — כ-25 מ״ר למכל 5 ליטר בשכבת פריימר.",
    dryingTime: "יישום החומר הבא כשהפריימר עוד לח (20-30 דקות)",
    mixRatio: "1:3 עם מים לפריימר, 1:1 לרולקות",
    applicationMethod: "מברשת או רולר, ערבוב עם מלט ליצירת רולקה",
    substrates: ["בטון", "טיח", "מדה", "בלוקים"],
    companions: [
      { sku: "19107", name: "סיקה טופ 107", reason: "מערכת איטום שלמה" },
      { name: "מלט פורטלנד", reason: "הכנת רולקה ביחס 1:1" },
    ],
    displayDuration: 20,
    isActive: true,
  },
  {
    sku: "10001",
    name: "מלט פורטלנד CEM II 50 ק״ג",
    category: "מלט וצמנט",
    brand: "נשר",
    price: 34.5,
    salePrice: 29.9,
    discountTag: "מחיר משטח",
    marketingPhrase: "שק מלט אפור לכל עבודות הבנייה והטיח",
    image: adhesiveBag,
    unitLabel: "שק",
    unitWeight: "50 ק״ג",
    unitsPerPallet: 40,
    palletDeposit: "משטח סבן 60060",
    coveragePerUnitM2: 2.5,
    coverageNote: "טיח בעובי 2 ס״מ — כ-2.5 מ״ר לשק בתערובת 1:4.",
    dryingTime: "התקשרות ראשונית 3-4 שעות, חוזק מלא 28 ימים",
    mixRatio: "1 מלט : 4 חול + מים לפי צורך",
    applicationMethod: "ערבוב במערבל או בטונדה, יישום במאלג׳ או במכונת טיח",
    substrates: ["בלוקים", "בטון"],
    companions: [
      { name: "חול טיח", reason: "השלמת התערובת" },
      { sku: "19502", name: "סיקה לטקס SBR", reason: "הגדלת הידבקות על בטון חלק" },
    ],
    displayDuration: 20,
    isActive: true,
  },
  {
    sku: "10220",
    name: "בלוק בטון 20 ס״מ",
    category: "בלוקים ובנייה",
    brand: "איטונג/בטון",
    price: 6.4,
    salePrice: 5.8,
    marketingPhrase: "בלוק בנייה תקני לקירות חוץ ופנים",
    image: adhesiveBag,
    unitLabel: "יחידה",
    unitWeight: "כ-18 ק״ג",
    unitsPerPallet: 60,
    palletDeposit: "בלה 60002",
    coveragePerUnitM2: 0.08,
    coverageNote: "כ-12.5 בלוקים למ״ר קיר.",
    applicationMethod: "בנייה בטיט מלט או דבק בלוקים, קשירה לעמודים",
    substrates: ["בטון"],
    companions: [
      { sku: "10001", name: "מלט פורטלנד", reason: "טיט בנייה" },
      { name: "רשת קשירה", reason: "חיבור לעמודי בטון" },
    ],
    displayDuration: 20,
    isActive: true,
  },
];

/** ניקוי מק״ט שהתקבל מה-QR או מכתובת ה-URL */
export function normalizeSku(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  let value = String(raw);
  try {
    value = decodeURIComponent(value);
  } catch {
    // כתובת לא מקודדת — ממשיכים עם הערך המקורי
  }
  return value.trim().replace(/[\u200e\u200f]/g, "").replace(/\s+/g, "");
}

export function findProduct(products: Product[], rawSku: unknown): Product | undefined {
  const sku = normalizeSku(rawSku);
  if (!sku) return undefined;
  const lower = sku.toLowerCase();
  return (
    products.find((p) => normalizeSku(p.sku).toLowerCase() === lower) ??
    products.find((p) => normalizeSku(p.sku).replace(/^0+/, "") === sku.replace(/^0+/, "")) ??
    products.find((p) => p.name.toLowerCase() === lower)
  );
}

export function effectivePrice(product: Product): number {
  return product.salePrice ?? product.price;
}
