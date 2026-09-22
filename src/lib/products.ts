// ============================================================================
// Catalog: Saban Construction Materials Official Catalog & SKUs
// Version: 3.0.0
// ============================================================================

import { Product } from "@/types";

export const PRODUCTS_CATALOG: Product[] = [
  // אגרגטים ושקים גדולים
  {
    sku: "11501",
    name: "חול שק גדול (בלה)",
    category: "אגרגטים",
    basePrice: 120,
    unitLabel: "בלה",
    supplier: "ח. סבן מחצבות",
    stockQuantity: 450,
    warehouseLocation: "מגרש חרש 4 - עמדת בלות 1",
    preferredWarehouse: "סניף החרש (מחסן 4 - ראשי)",
    description: "חול ים שטוף תקני לבנייה וטיח",
    unitWeightKg: 800,
    requiresPalletDeposit: false
  },
  {
    sku: "11511",
    name: "סומסום שק גדול (בלה)",
    category: "אגרגטים",
    basePrice: 135,
    unitLabel: "בלה",
    supplier: "ח. סבן מחצבות",
    stockQuantity: 380,
    warehouseLocation: "מגרש חרש 4 - עמדת בלות 2",
    preferredWarehouse: "סניף החרש (מחסן 4 - ראשי)",
    description: "אגרגט סומסום נקי למצע ריצוף וניקוז",
    unitWeightKg: 850,
    requiresPalletDeposit: false
  },
  {
    sku: "11540",
    name: "מצע שק גדול (בלה)",
    category: "אגרגטים",
    basePrice: 110,
    unitLabel: "בלה",
    supplier: "ח. סבן מחצבות",
    stockQuantity: 220,
    warehouseLocation: "מגרש חרש 4 - עמדת בלות 3",
    preferredWarehouse: "סניף החרש (מחסן 4 - ראשי)",
    description: "מצע מהודק מדורג לתשתיות כבישים ומדרכות",
    unitWeightKg: 900,
    requiresPalletDeposit: false
  },
  {
    sku: "11551",
    name: "טיט שק גדול (בלה)",
    category: "אגרגטים",
    basePrice: 140,
    unitLabel: "בלה",
    supplier: "ח. סבן מחצבות",
    stockQuantity: 190,
    warehouseLocation: "מגרש חרש 4 - עמדת בלות 4",
    preferredWarehouse: "סניף החרש (מחסן 4 - ראשי)",
    description: "טיט מוכן איכותי לבנייה וחיפוי בלוקים",
    unitWeightKg: 850,
    requiresPalletDeposit: false
  },
  {
    sku: "11570",
    name: "חמרה שק גדול (בלה)",
    category: "אגרגטים",
    basePrice: 125,
    unitLabel: "בלה",
    supplier: "ח. סבן מחצבות",
    stockQuantity: 150,
    warehouseLocation: "מגרש חרש 4 - עמדת בלות 5",
    preferredWarehouse: "סניף החרש (מחסן 4 - ראשי)",
    description: "אדמת חמרה מנופה לגינון ותשתיות פיתוח",
    unitWeightKg: 750,
    requiresPalletDeposit: false
  },

  // חומרי מליטה ודבקים
  {
    sku: "10002",
    name: "מלט אפור 25 ק״ג נשר",
    category: "מליטה ודבקים",
    basePrice: 24.5,
    unitLabel: "שק",
    supplier: "נשר מפעלי מלט ישראליים",
    stockQuantity: 2800,
    warehouseLocation: "מחסן מליטה מקורה 4",
    preferredWarehouse: "סניף החרש (מחסן 4 - ראשי)",
    description: "צמנט פורטלנד איכותי CEM II/B-LL 42.5N",
    unitWeightKg: 25,
    requiresPalletDeposit: true,
    palletCapacity: 40
  },
  {
    sku: "10009",
    name: "מלט לבן 25 ק״ג",
    category: "מליטה ודבקים",
    basePrice: 42,
    unitLabel: "שק",
    supplier: "נשר",
    stockQuantity: 650,
    warehouseLocation: "מחסן מליטה מקורה 4",
    preferredWarehouse: "סניף החרש (מחסן 4 - ראשי)",
    description: "מלט לבן אסתטי לעבודות שחזור ובטון אדריכלי",
    unitWeightKg: 25,
    requiresPalletDeposit: true,
    palletCapacity: 40
  },
  {
    sku: "10011",
    name: "בטון מוכן 25 ק״ג",
    category: "מליטה ודבקים",
    basePrice: 22,
    unitLabel: "שק",
    supplier: "תרמוקיר / סבן",
    stockQuantity: 920,
    warehouseLocation: "מחסן מליטה מקורה 4",
    preferredWarehouse: "סניף החרש (מחסן 4 - ראשי)",
    description: "תערובת בטון יבשה מוכנה (רק להוסיף מים)",
    unitWeightKg: 25,
    requiresPalletDeposit: true,
    palletCapacity: 40
  },
  {
    sku: "19255",
    name: "דבק ריצוף סרם 255 (25 ק״ג)",
    category: "מליטה ודבקים",
    basePrice: 46,
    unitLabel: "שק",
    supplier: "מיסטר פיקס (כרמית)",
    stockQuantity: 740,
    warehouseLocation: "מחסן דבקים 4",
    preferredWarehouse: "סניף החרש (מחסן 4 - ראשי)",
    description: "דבק צמנטי גמיש C2TE-S1 לגרניט פורצלן וריצוף חוץ/פנים",
    unitWeightKg: 25,
    requiresPalletDeposit: true,
    palletCapacity: 40
  },
  {
    sku: "10701",
    name: "איטום צמנטי סיקה טופ 107 (ערכה 25 ק״ג)",
    category: "מליטה ודבקים",
    basePrice: 115,
    unitLabel: "ערכה",
    supplier: "גילאר סיקה ישראל",
    stockQuantity: 410,
    warehouseLocation: "מחסן איטום 4 / מדף 12",
    preferredWarehouse: "סניף החרש (מחסן 4 - ראשי)",
    description: "מערכת איטום דו-רכיבית צמנטית גמישה לבריכות, מרתפים ומקלחות",
    unitWeightKg: 25,
    requiresPalletDeposit: false
  },
  {
    sku: "10702",
    name: "מוסף הדבקה סיקה לטקס SBR (גלון 5 ק״ג)",
    category: "מליטה ודבקים",
    basePrice: 78,
    unitLabel: "גלון",
    supplier: "גילאר סיקה ישראל",
    stockQuantity: 320,
    warehouseLocation: "סניף 1 התלמיד / מדף כימיה",
    preferredWarehouse: "סניף התלמיד (מחסן 1 - גבס וצבע)",
    description: "אמולסיית לטקס לשיפור הידבקות, איטום רולקות וגמישות מליטה",
    unitWeightKg: 5,
    requiresPalletDeposit: false
  },

  // גבס ופרופילים
  {
    sku: "111260",
    name: "לוח גבס לבן 260 (120/260 12.5 מ״מ)",
    category: "גבס ופרופילים",
    basePrice: 38,
    unitLabel: "לוח",
    supplier: "אורבונד / גבס כנף",
    stockQuantity: 1200,
    warehouseLocation: "אולם גבס - סניף התלמיד 6",
    preferredWarehouse: "סניף התלמיד (מחסן 1 - גבס וצבע)",
    description: "לוח גבס סטנדרטי לקירות פנים ומחיצות",
    unitWeightKg: 27,
    requiresPalletDeposit: false
  },
  {
    sku: "112260",
    name: "לוח גבס ירוק 260 עמיד בלחות (120/260)",
    category: "גבס ופרופילים",
    basePrice: 52,
    unitLabel: "לוח",
    supplier: "אורבונד",
    stockQuantity: 850,
    warehouseLocation: "אולם גבס - סניף התלמיד 6",
    preferredWarehouse: "סניף התלמיד (מחסן 1 - גבס וצבע)",
    description: "לוח גבס עמיד רטיבות לחדרי רחצה ומטבחים",
    unitWeightKg: 28,
    requiresPalletDeposit: false
  },
  {
    sku: "9650300",
    name: "ניצב 0.6 50/300 ס״מ",
    category: "גבס ופרופילים",
    basePrice: 19.5,
    unitLabel: "יח׳",
    supplier: "פרופילי סבן",
    stockQuantity: 1800,
    warehouseLocation: "מתחם פרופילים - התלמיד 6",
    preferredWarehouse: "סניף התלמיד (מחסן 1 - גבס וצבע)",
    description: "פרופיל ניצב מגולוון 0.6 מ״מ לקונסטרוקציית גבס",
    unitWeightKg: 2.2,
    requiresPalletDeposit: false
  },
  {
    sku: "8650300",
    name: "מסלול 0.6 50/300 ס״מ",
    category: "גבס ופרופילים",
    basePrice: 18.5,
    unitLabel: "יח׳",
    supplier: "פרופילי סבן",
    stockQuantity: 1400,
    warehouseLocation: "מתחם פרופילים - התלמיד 6",
    preferredWarehouse: "סניף התלמיד (מחסן 1 - גבס וצבע)",
    description: "פרופיל מסלול רצפה/תקרה מגולוון 0.6 מ״מ",
    unitWeightKg: 2.0,
    requiresPalletDeposit: false
  },
  {
    sku: "35010",
    name: "שפכטל אמריקאי מוכן 28 ק״ג",
    category: "גבס ופרופילים",
    basePrice: 65,
    unitLabel: "פח",
    supplier: "טמבור / נירלט",
    stockQuantity: 520,
    warehouseLocation: "אולם צבעים - התלמיד 6",
    preferredWarehouse: "סניף התלמיד (מחסן 1 - גבס וצבע)",
    description: "מרק שפכטל פרימיום להחלקה מושלמת של לוחות גבס",
    unitWeightKg: 28,
    requiresPalletDeposit: false
  },
  {
    sku: "76206",
    name: "ברגי גבס 25 מ״מ שחורים (קופסה 1000 יח׳)",
    category: "גבס ופרופילים",
    basePrice: 32,
    unitLabel: "קופסה",
    supplier: "סבן פרזול",
    stockQuantity: 620,
    warehouseLocation: "מדפי פרזול התלמיד",
    preferredWarehouse: "סניף התלמיד (מחסן 1 - גבס וצבע)",
    description: "בורג מושחז תקני לחיבור לוחות גבס לקונסטרוקציה",
    unitWeightKg: 1.5,
    requiresPalletDeposit: false
  },

  // מק״טי הובלות
  {
    sku: "18050",
    name: "הובלת מנוף הוד השרון",
    category: "הובלות",
    basePrice: 350,
    unitLabel: "הובלה",
    supplier: "ח. סבן הובלות (מרצדס מנוף)",
    stockQuantity: 99,
    warehouseLocation: "מרכז תפעול החרש 10",
    preferredWarehouse: "סניף החרש 10 (מרכז לוגיסטי והובלות)",
    description: "הובלת משאית מנוף לפריקה בהוד השרון"
  },
  {
    sku: "18055",
    name: "הובלת מנוף כפר סבא - רעננה",
    category: "הובלות",
    basePrice: 420,
    unitLabel: "הובלה",
    supplier: "ח. סבן הובלות (מרצדס מנוף)",
    stockQuantity: 99,
    warehouseLocation: "מרכז תפעול החרש 10",
    preferredWarehouse: "סניף החרש 10 (מרכז לוגיסטי והובלות)",
    description: "הובלת מנוף מרכזית לאזור השרון הקרוב"
  },
  {
    sku: "818050",
    name: "הובלה ללא פריקה (הוד השרון / פלטה)",
    category: "הובלות",
    basePrice: 200,
    unitLabel: "הובלה",
    supplier: "ח. סבן הובלות (איסוזו)",
    stockQuantity: 99,
    warehouseLocation: "מרכז תפעול החרש 10",
    preferredWarehouse: "סניף החרש 10 (מרכז לוגיסטי והובלות)",
    description: "הובלת משאית חלוקה / פלטה ללא מנוף"
  }
];

export function getProductBySku(sku: string): Product | undefined {
  return PRODUCTS_CATALOG.find((p) => p.sku === sku);
}

export function searchProducts(query: string): Product[] {
  const clean = query.trim().toLowerCase();
  if (clean.length < 2) return [];
  return PRODUCTS_CATALOG.filter(
    (p) =>
      p.sku.toLowerCase().includes(clean) ||
      p.name.toLowerCase().includes(clean) ||
      p.description.toLowerCase().includes(clean)
  );
}

export function effectivePrice(p: Product): number {
  return p.basePrice;
}
