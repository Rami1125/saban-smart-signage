/**
 * מנוע ידע טכני, חישובי כמויות ובקרת משקל ובטיחות רכב
 * ח. סבן חומרי בניין (1994) בע״מ
 */

export type TechnicalRule = {
  sku: string;
  name: string;
  coveragePerUnitM2: number;
  coverageDescription: string;
  unitWeightKg: number;
  mandatoryCompanions: {
    sku?: string;
    name: string;
    reason: string;
  }[];
  criticalNotes: string[];
};

export const TECHNICAL_RULES: Record<string, TechnicalRule> = {
  "10701": {
    sku: "10701",
    name: "סיקה טופ 107 (SikaTop Seal-107)",
    coveragePerUnitM2: 12.5,
    coverageDescription: "כושר כיסוי 12.5 מ״ר לערכה (25 ק״ג) בשתי שכבות",
    unitWeightKg: 25,
    mandatoryCompanions: [
      {
        sku: "10702",
        name: "סיקה לטקס SBR (SikaLatex SBR)",
        reason: "חובה לרולקות בחיבורי רצפה-קיר ושיפור הדבקה",
      },
      {
        name: "רשת שריון פיברגלס",
        reason: "חובה להטמעה בין השכבות במוקדי עומס ומפגשי רצפה-קיר",
      },
    ],
    criticalNotes: [
      "כושר כיסוי: 12.5 מ״ר לערכה (25 ק״ג) בשתי שכבות איטום תקניות.",
      "חובה ליישם רולקות עם סיקה לטקס SBR (מק״ט 10702) לפני מריחת החומר.",
      "חובה להטמיע רשת שריון פיברגלס בין שכבה ראשונה לשנייה בחיבורי רצפה-קיר.",
    ],
  },
  "15181": {
    sku: "15181",
    name: "טיט לריצוף 181 כרמית מיסטר פיקס 25 ק״ג (ריצופית)",
    coveragePerUnitM2: 5.0,
    coverageDescription: "כושר כיסוי כ-5 מ״ר לשק (עובי 5 מ״מ)",
    unitWeightKg: 25,
    mandatoryCompanions: [
      {
        name: "ספייסרים לפוגות (מרווחונים)",
        reason: "חובה לשמירה על מרווח פוגה תקני בריצוף",
      },
      {
        name: "רובה גמישה (צמנטית או אפוקסית)",
        reason: "חובה לאיטום ומילוי המישקים לאחר ייבוש הטיט",
      },
    ],
    criticalNotes: [
      "כושר כיסוי: כ-5 מ״ר לשק (עובי מומלץ 5 מ״מ).",
      "חובה להשתמש בספייסרים (מרווחונים) לפוגות תקניות לפי התקן הישראלי.",
      "חובה ליישם רובה גמישה איכותית לאטימת המישקים ומניעת חדירת מים.",
    ],
  },
  "14075": {
    sku: "14075",
    name: "טיח גבס MP75 שק 25 ק״ג קנאוף (Knauf MP75)",
    coveragePerUnitM2: 2.5,
    coverageDescription: "כושר כיסוי 2.5 מ״ר לשק בעובי 10 מ״מ",
    unitWeightKg: 25,
    mandatoryCompanions: [
      {
        name: "פריימר בטונקונטקט (Betonkontakt)",
        reason: "חובה לוודא קיום פריימר מקשר על גבי בטון יצוק לפני יישום טיח גבס",
      },
    ],
    criticalNotes: [
      "כושר כיסוי: 2.5 מ״ר לשק בעובי 10 מ״מ.",
      "חובה לוודא קיום פריימר בטונקונטקט על גבי בטון יצוק וחלק למניעת התנתקות הטיח.",
    ],
  },
  "112260": {
    sku: "112260",
    name: "לוח גבס ירוק 260 עמידות מוגברת בלחות (עובי 12.5 מ״מ)",
    coveragePerUnitM2: 3.12,
    coverageDescription: "שטח לוח = 3.12 מ״ר (1.20 מ׳ × 2.60 מ׳)",
    unitWeightKg: 28,
    mandatoryCompanions: [
      {
        sku: "76206",
        name: "ברגי גבס 25 מ״מ שחורים",
        reason: "מומלץ להציע ברגי גבס 25 לחיבור הלוח לקונסטרוקציה",
      },
      {
        name: "מסלולים וניצבים תואמים (פרופילי קונסטרוקציית גבס)",
        reason: "מומלץ להציע שלד פח מגולוון תואם להתקנה",
      },
    ],
    criticalNotes: [
      "שטח לוח: 3.12 מ״ר (אורך 2.60 מ׳, רוחב 1.20 מ׳).",
      "מומלץ להציע ברגי גבס 25 (מק״ט 76206) ומסלולים/ניצבים תואמים.",
    ],
  },
  "111260": {
    sku: "111260",
    name: "לוח גבס לבן סטנדרטי 260 (עובי 12.5 מ״מ)",
    coveragePerUnitM2: 3.12,
    coverageDescription: "שטח לוח = 3.12 מ״ר (1.20 מ׳ × 2.60 מ׳)",
    unitWeightKg: 26,
    mandatoryCompanions: [
      {
        sku: "76206",
        name: "ברגי גבס 25 מ״מ שחורים",
        reason: "מומלץ להציע ברגי גבס 25 לחיבור הלוח לקונסטרוקציה",
      },
      {
        name: "מסלולים וניצבים תואמים (פרופילי קונסטרוקציית גבס)",
        reason: "מומלץ להציע שלד פח מגולוון תואם להתקנה",
      },
    ],
    criticalNotes: [
      "שטח לוח: 3.12 מ״ר (אורך 2.60 מ׳, רוחב 1.20 מ׳).",
      "מומלץ להציע ברגי גבס 25 (מק״ט 76206) ומסלולים/ניצבים תואמים.",
    ],
  },
};

/**
 * הערכת משקל ליחידה של מוצר לפי מק״ט, משקל מוצהר או שם מוצר
 */
export function estimateUnitWeightKg(sku: string, unitWeightStr?: string, name?: string): number {
  const normSku = sku.replace(/\D/g, "");
  if (TECHNICAL_RULES[normSku]?.unitWeightKg) {
    return TECHNICAL_RULES[normSku].unitWeightKg;
  }
  if (unitWeightStr) {
    const parsed = Number(unitWeightStr.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      if (
        unitWeightStr.includes("גרם") ||
        unitWeightStr.includes("g") ||
        unitWeightStr.includes("ml")
      ) {
        return parsed / 1000;
      }
      return parsed;
    }
  }
  // הערכה לפי שם מוצר
  const n = (name || "").toLowerCase();
  if (n.includes("25 ק״ג") || n.includes("25 קג") || n.includes("25kg")) return 25;
  if (n.includes("20 ק״ג") || n.includes("20 קג") || n.includes("20kg")) return 20;
  if (n.includes("5 ק״ג") || n.includes("5 קג") || n.includes("5kg")) return 5;
  if (n.includes("בלוק בטון")) return 18;
  if (n.includes("לוח גבס")) return 27;
  if (n.includes("דלי") || n.includes("סופרפלקס")) return 20;
  if (n.includes("שק") || n.includes("מלט") || n.includes("טיט") || n.includes("דבק")) return 25;
  return 15;
}

export type VehicleCategory = "car" | "pickup_van" | "truck_trailer";

export type WeightFeasibility = {
  totalWeightKg: number;
  approvedCategory: VehicleCategory;
  categoryLabel: string;
  recommendedVehicleText: string;
  isMismatch: boolean;
  mismatchWarning?: string;
  splitOrDeliverySuggestion?: string;
};

/**
 * בקרת משקל ובטיחות רכב (Weight Feasibility Check)
 * - עד 300 ק"ג: מאושר לכל רכב פרטי / מסחרי קל.
 * - 300 עד 700 ק"ג: מתאים לטנדר / מסחרית גדולה (ברלינגו/טרנזיט).
 * - מעל 700 ק"ג או משטח שלם: דורש טנדר כבד, עגלה נגררת או משאית פתוחה להעמסה עם מלגזה.
 */
export function checkWeightFeasibility(
  totalWeightKg: number,
  clientVehicleName?: string,
  isPalletOrMultiplePallets: boolean = false,
): WeightFeasibility {
  const isHeavy = totalWeightKg > 700 || isPalletOrMultiplePallets;
  const isMedium = totalWeightKg > 300 && totalWeightKg <= 700 && !isPalletOrMultiplePallets;

  let approvedCategory: VehicleCategory = "car";
  let categoryLabel = "רכב פרטי / מסחרי קל";
  let recommendedVehicleText = "מאושר להעמסה בכל רכב פרטי או מסחרי קל (עד 300 ק״ג)";

  if (isHeavy) {
    approvedCategory = "truck_trailer";
    categoryLabel = "טנדר כבד / נגרר / משאית פתוחה";
    recommendedVehicleText =
      "דורש טנדר כבד, עגלה נגררת או משאית פתוחה להעמסה עם מלגזה (מעל 700 ק״ג / משטח שלם)";
  } else if (isMedium) {
    approvedCategory = "pickup_van";
    categoryLabel = "טנדר / מסחרית גדולה";
    recommendedVehicleText = "מתאים לטנדר או מסחרית גדולה כגון ברלינגו/טרנזיט (300 עד 700 ק״ג)";
  }

  // בדיקת חוסר התאמה מול סוג הרכב של הלקוח
  const v = (clientVehicleName || "").toLowerCase();
  let isMismatch = false;
  let mismatchWarning: string | undefined;
  let splitOrDeliverySuggestion: string | undefined;

  const isClientCar =
    v.includes("פרטי") ||
    v.includes("משפחתית") ||
    v.includes("קטן") ||
    v.includes("sedan") ||
    v.includes("hatchback") ||
    v.includes("car");

  const isClientVan =
    v.includes("ברלינגו") ||
    v.includes("קנגו") ||
    v.includes("טרנזיט") ||
    v.includes("מסחרי") ||
    v.includes("טנדר") ||
    v.includes("van") ||
    v.includes("pickup");

  if (isHeavy) {
    if (isClientCar || isClientVan) {
      isMismatch = true;
      mismatchWarning = `משקל המטען (${totalWeightKg.toLocaleString()} ק״ג) חורג מהמשקל המותר לרכב שנבחר (${clientVehicleName}). קיים סיכון בטיחותי ושחיקת קפיצים.`;
      splitOrDeliverySuggestion =
        "מומלץ לפצל את ההזמנה ל-2 נגלות איסוף נפרדות, או להזמין הובלת מנוף/משאית מסבן ישירות לאתר.";
    }
  } else if (isMedium) {
    if (isClientCar) {
      isMismatch = true;
      mismatchWarning = `משקל המטען (${totalWeightKg.toLocaleString()} ק״ג) עולה על 300 ק״ג ואינו מומלץ להעמסה ברכב פרטי.`;
      splitOrDeliverySuggestion =
        "המלצה: להגיע עם טנדר / מסחרית (ברלינגו/טרנזיט) או לפצל את האיסוף לשני סבבים.";
    }
  }

  return {
    totalWeightKg,
    approvedCategory,
    categoryLabel,
    recommendedVehicleText,
    isMismatch,
    mismatchWarning,
    splitOrDeliverySuggestion,
  };
}
