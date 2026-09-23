// ============================================================================
// Technical Rules: Engineering Coverage Rates, Weight Feasibility & Waste Margin
// Version: 3.2.0 (Safe string literals & robust multi-line parsing)
// ============================================================================

import { Product } from "@/types";

export interface TechnicalRule {
  sku: string;
  name: string;
  coveragePerUnitM2?: number;
  criticalNotes: string[];
  mandatoryCompanions: Array<{
    name: string;
    sku?: string;
    reason: string;
  }>;
}

export interface WeightFeasibilityResult {
  feasible: boolean;
  maxWeightKg: number;
  recommendedVehicle: string;
  approvedCategory?: "passenger" | "pickup_van" | "truck_trailer";
  categoryLabel?: string;
  recommendedVehicleText?: string;
  warning?: string;
  notes: string;
}

export const TECHNICAL_RULES_BY_SKU: Record<string, TechnicalRule> = {
  "10701": {
    sku: "10701",
    name: "סיקה טופ 107 (ערכה 25 ק״ג)",
    coveragePerUnitM2: 12.5,
    criticalNotes: [
      "כיסוי 12.5 מ״ר לערכה (25 ק״ג) בשתי שכבות צולבות",
      "חובת ביצוע רולקות בטון 5 ס״מ בחיבורי רצפה-קיר לפני מריחת החומר",
      "יש להרטיב את התשתית עד לרוויה לפני יישום השכבה הראשונה",
    ],
    mandatoryCompanions: [
      {
        name: "סיקה לטקס SBR",
        sku: "10702",
        reason: "חובה לשיפור אדהזיה וביצוע רולקות תקניות",
      },
      {
        name: "רשת אינטרגלס משוריינת",
        reason: "שריון שכבת האיטום במפגשי רצפה-קיר וסביב צנרת",
      },
    ],
  },
  "19255": {
    sku: "19255",
    name: "דבק קרמיקה סרם 255 (25 ק״ג)",
    coveragePerUnitM2: 3.9,
    criticalNotes: [
      "שק 25 ק״ג מכסה כ-3.9 מ״ר בעובי ממוצע עם מאלג׳ שיניים 8-10 מ״מ",
      "זמן פתוח ליישום: כ-25 דקות. אין למרוח שטח גדול מראש",
      "תקן C2TE מתאים לגרניט פורצלן וריצוף חוץ/פנים",
    ],
    mandatoryCompanions: [
      {
        name: "ספייסרים לפוגות 2-3 מ״מ",
        reason: "חובה לפוגה תקנית למניעת לחצים והתרוממות אריחים",
      },
      {
        name: "רובה צמנטית גמישה",
        reason: "איטום ומילוי המישקים לאחר ייבוש הדבק",
      },
    ],
  },
  "15181": {
    sku: "15181",
    name: "טיט לריצוף 181 (שק 25 ק״ג)",
    coveragePerUnitM2: 5.0,
    criticalNotes: [
      "כיסוי כ-5 מ״ר לשק בעובי מצע 5 מ״מ",
      "מתאים לריצוף אריחים על מצע סומסום מהודק או בטון",
    ],
    mandatoryCompanions: [
      {
        name: "ספייסרים תקניים",
        reason: "פוגות תקניות לפי תקן ישראלי 1555",
      },
      {
        name: "רובה גמישה",
        reason: "מילוי פוגות עמיד במים",
      },
    ],
  },
  "14075": {
    sku: "14075",
    name: "טיח גבס MP75 (שק 25 ק״ג)",
    coveragePerUnitM2: 2.5,
    criticalNotes: [
      "כיסוי כ-2.5 מ״ר לשק בעובי 10 מ״מ",
      "חובת מריחת פריימר בטונקונטקט על גבי קירות ותקרות בטון חלק לפני הטיח",
    ],
    mandatoryCompanions: [
      {
        name: "פריימר בטונקונטקט",
        reason: "חובה ליצירת גישור ואחיזה מכנית לבטון יצוק",
      },
      {
        name: "פינות טיח מוגנות",
        reason: "יישור וחיזוק פינות קירות ופתחים",
      },
    ],
  },
  "111260": {
    sku: "111260",
    name: "לוח גבס לבן 1.20×2.60 מ׳ (3.12 מ״ר)",
    coveragePerUnitM2: 3.12,
    criticalNotes: [
      "שטח לוח = 3.12 מ״ר (1.20 מ׳ × 2.60 מ׳)",
      "התקנה על גבי ניצבים ומסלולים במרווח מרבי של 60 ס״מ",
      "הברגה כל 20-25 ס״מ עם ברגי גבס שחורים 25 מ״מ",
    ],
    mandatoryCompanions: [
      {
        name: "ברגי גבס 25 מ״מ שחורים",
        sku: "76206",
        reason: "חיבור תקני של הלוחות לקונסטרוקציה",
      },
      {
        name: "ניצבים ומסלולים 50/300",
        sku: "9650300",
        reason: "קונסטרוקציית שלד פח מגולוון למחיצות ותקרות",
      },
      {
        name: "שפכטל אמריקאי",
        sku: "35010",
        reason: "שפכטל גמר ומרק לחיבורי לוחות וראשי ברגים",
      },
    ],
  },
  "112260": {
    sku: "112260",
    name: "לוח גבס ירוק עמיד לחות 1.20×2.60 מ׳ (3.12 מ״ר)",
    coveragePerUnitM2: 3.12,
    criticalNotes: [
      "שטח לוח = 3.12 מ״ר (1.20 מ׳ × 2.60 מ׳)",
      "מיועד לחדרים רטובים — חדרי רחצה, מטבחים ומרפסות מקורות",
      "חובת איטום מלא בסיקה טופ 107 לפני הדבקת קרמיקה על הלוח",
    ],
    mandatoryCompanions: [
      {
        name: "ברגי גבס 25 מ״מ שחורים",
        sku: "76206",
        reason: "חיבור תקני לקונסטרוקציה",
      },
      {
        name: "סרט שריון פיברגלס",
        reason: "מניעת סדקים בחיבורי לוחות באזורי לחות",
      },
      {
        name: "סיקה טופ 107",
        sku: "10701",
        reason: "חובת איטום הלוח הירוק בחדרים רטובים",
      },
    ],
  },
};

export const TECHNICAL_RULES = Object.assign(
  {
    STANDARD_WASTE_FACTOR: 1.1, // 10% פחת קבוע
    CERAM_255_COVERAGE_M2: 3.9, // שק 25 ק"ג סרם 255 מכסה כ-3.9 מ"ר
    SIKA_107_COVERAGE_M2: 12.5, // ערכה 25 ק"ג סיקה 107 מכסה כ-12.5 מ"ר בשתי שכבות
    MAX_PRIVATE_VEHICLE_KG: 300, // כושר נשיאה תקני לרכב פרטי / מסחרי קל
    MAX_VAN_VEHICLE_KG: 700, // כושר נשיאה לטנדר / מסחרית גדולה
    PALLET_CAPACITY_CEMENT: 40, // שקי מלט למשטח
    PALLET_CAPACITY_PLASTER: 20, // שקי טיח למשטח
  },
  TECHNICAL_RULES_BY_SKU,
);

export function estimateUnitWeightKg(
  sku?: string | null,
  unitWeightOrProduct?: string | number | Product | null,
  productName?: string | null,
): number {
  if (typeof unitWeightOrProduct === "number" && Number.isFinite(unitWeightOrProduct)) {
    return unitWeightOrProduct;
  }
  if (typeof unitWeightOrProduct === "object" && unitWeightOrProduct !== null) {
    if (unitWeightOrProduct.unitWeightKg) return unitWeightOrProduct.unitWeightKg;
  }
  if (typeof unitWeightOrProduct === "string") {
    const parsed = Number(unitWeightOrProduct.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (productName) {
    if (productName.includes("בלה") || productName.includes("שק גדול")) return 800;
    if (productName.includes("לוח גבס")) return 27;
  }
  if (!sku) return 25;
  const s = sku.toString().trim();
  if (s === "11501" || s === "11511" || s === "11540" || s === "11551" || s === "11570") return 800; // בלות
  if (s === "111260" || s === "112260") return 27; // לוחות גבס 260
  if (s === "10002" || s === "10009" || s === "10011" || s === "19255" || s === "10701") return 25; // שקים
  if (s === "35010") return 28; // שפכטל אמריקאי
  if (s === "10702") return 5; // גלון לטקס
  if (s === "9650300" || s === "8650300") return 2.2; // פרופילים
  if (s === "76206") return 1.5; // קופסת ברגים
  return 25;
}

export function checkWeightFeasibility(
  weightKg: number,
  vehicleType: string = "פרטי",
  isPalletOrder: boolean = false,
): WeightFeasibilityResult {
  const v = vehicleType.toLowerCase();
  let maxWeight = TECHNICAL_RULES.MAX_PRIVATE_VEHICLE_KG;
  let recommended = `רכב פרטי / מסחרי קל`;

  if (v.includes("טנדר") || v.includes("מסחרית") || v.includes("van") || v.includes("pickup")) {
    maxWeight = TECHNICAL_RULES.MAX_VAN_VEHICLE_KG;
    recommended = `טנדר / מסחרית גדולה`;
  } else if (
    v.includes("משאית") ||
    v.includes("עגלה") ||
    v.includes("נגרר") ||
    v.includes("truck")
  ) {
    maxWeight = 5000;
    recommended = `משאית / עגלה נגררת (פריקה במלגזה)`;
  }

  const approvedCategory: "passenger" | "pickup_van" | "truck_trailer" =
    weightKg > 700 || isPalletOrder ? "truck_trailer" : weightKg > 300 ? "pickup_van" : "passenger";

  const categoryLabel =
    approvedCategory === "truck_trailer"
      ? "העמסה במלגזה / משאית"
      : approvedCategory === "pickup_van"
        ? "טנדר / מסחרית"
        : "רכב פרטי / מסחרי קל";

  const recommendedVehicleText =
    approvedCategory === "truck_trailer"
      ? "משקל כבד או משטח מלא (>700 ק״ג): מחייב העמסה במלגזה ברכב פתוח, נגרר או משאית."
      : approvedCategory === "pickup_van"
        ? "משקל בינוני (300-700 ק״ג): מתאים לטנדר או מסחרית גדולה. אינו מורשה ברכב פרטי רגיל."
        : "משקל קל (עד 300 ק״ג): מורשה ומאושר להעמסה בכל רכב פרטי או מסחרי קל.";

  const feasible = weightKg <= maxWeight && (!isPalletOrder || maxWeight >= 1500);

  return {
    feasible,
    maxWeightKg: maxWeight,
    recommendedVehicle: recommended,
    approvedCategory,
    categoryLabel,
    recommendedVehicleText,
    warning: !feasible
      ? `חריגת משקל של ${(weightKg - maxWeight).toFixed(0)} ק״ג מעבר לכושר הנשיאה המותר לרכב זה (${maxWeight} ק״ג)`
      : undefined,
    notes:
      weightKg <= TECHNICAL_RULES.MAX_PRIVATE_VEHICLE_KG
        ? `מאושר לכל רכב פרטי / מסחרי קל (עד 300 ק״ג)`
        : weightKg <= TECHNICAL_RULES.MAX_VAN_VEHICLE_KG
          ? `מתאים לטנדר / מסחרית גדולה (300 עד 700 ק״ג)`
          : `דורש טנדר כבד, עגלה נגררת או משאית פתוחה להעמסה עם מלגזה (מעל 700 ק״ג)`,
  };
}

export function calculateCeram255TileAdhesive(netAreaM2: number): CoverageCalculation {
  const grossArea = netAreaM2 * STANDARD_WASTE_FACTOR;
  const packagesRequired = Math.ceil(grossArea / TECHNICAL_RULES.CERAM_255_COVERAGE_M2);

  return {
    areaM2: netAreaM2,
    areaWithWasteM2: Number(grossArea.toFixed(1)),
    wasteFactor: STANDARD_WASTE_FACTOR,
    packagesRequired,
    packageType: `שקי 25 ק״ג סרם 255 (מק״ט 19255)`,
    crossSellRecommendations: [
      `ספייסרים לפוגות תקניות (2 מ״מ / 3 מ״מ)`,
      `רובה צמנטית גמישה אוטמת`,
      `פריימר מליטה לחיזוק התשתית לפני הריצוף`,
    ],
  };
}

export function calculateSikaTop107Waterproofing(netAreaM2: number): CoverageCalculation {
  const grossArea = netAreaM2 * STANDARD_WASTE_FACTOR;
  const packagesRequired = Math.ceil(grossArea / TECHNICAL_RULES.SIKA_107_COVERAGE_M2);

  return {
    areaM2: netAreaM2,
    areaWithWasteM2: Number(grossArea.toFixed(1)),
    wasteFactor: STANDARD_WASTE_FACTOR,
    packagesRequired,
    packageType: `ערכות 25 ק״ג סיקה טופ 107 (מק״ט 10701)`,
    crossSellRecommendations: [
      `סיקה לטקס SBR (מק״ט 10702) לביצוע רולקות ברדיוס 5 ס״מ בחיבורי רצפה-קיר`,
      `רשת אינטרגלס עמידה באלקלי לשריון שכבת האיטום`,
      `מברשת סיוד/איטום גסה למריחת שכבות שתי וערב`,
    ],
  };
}

export function calculateGypsumWall(wallLengthM: number, wallHeightM: number) {
  const netArea = wallLengthM * wallHeightM;
  const grossArea = netArea * STANDARD_WASTE_FACTOR;
  const boardArea = 1.2 * 2.6; // 3.12 מ"ר ללוח
  const boardsRequired = Math.ceil((grossArea * 2) / boardArea);
  const studsCount = Math.ceil(wallLengthM / 0.6) + 1;
  const tracksLengthM = wallLengthM * 2;
  const tracksCount = Math.ceil(tracksLengthM / 3.0);
  const screwsCount = boardsRequired * 75;

  return {
    wallAreaM2: netArea,
    boardsCount: boardsRequired,
    boardType: `לוחות גבס 260 (מק״ט 111260 לבן / 112260 ירוק)`,
    studsCount,
    studType: `ניצב 50/300 בעובי 0.6 מ״מ (מק״ט 9650300)`,
    tracksCount,
    trackType: `מסלול 50/300 בעובי 0.6 מ״מ (מק״ט 8650300)`,
    screwsBoxes: Math.ceil(screwsCount / 1000),
    screwSku: `76206`,
    crossSellRecommendations: [
      `שפכטל אמריקאי 28 ק״ג (מק״ט 35010)`,
      `סרט נייר שריון או רשת פיברגלס לחיבורים`,
      `צמר סלעים / בידוד אקוסטי לקיר`,
    ],
  };
}
