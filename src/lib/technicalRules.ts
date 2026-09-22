// ============================================================================
// Technical Rules: Engineering Coverage Rates, Weight Feasibility & Waste Margin
// Version: 3.1.0 (Added checkWeightFeasibility, estimateUnitWeightKg, TECHNICAL_RULES)
// ============================================================================

import { Product } from "@/types";

export const TECHNICAL_RULES = {
  STANDARD_WASTE_FACTOR: 1.10, // 10% פחת קבוע
  CERAM_255_COVERAGE_M2: 3.9,   // שק 25 ק"ג סרם 255 מכסה כ-3.9 מ"ר
  SIKA_107_COVERAGE_M2: 12.5,   // ערכה 25 ק"ג סיקה 107 מכסה כ-12.5 מ"ר בשתי שכבות
  MAX_PRIVATE_VEHICLE_KG: 300,  // כושר נשיאה תקני לרכב פרטי / מסחרי קל
  MAX_VAN_VEHICLE_KG: 700,      // כושר נשיאה לטנדר / מסחרית גדולה
  PALLET_CAPACITY_CEMENT: 40,   // שקי מלט למשטח
  PALLET_CAPACITY_PLASTER: 20,  // שקי טיח למשטח
};

export const STANDARD_WASTE_FACTOR = TECHNICAL_RULES.STANDARD_WASTE_FACTOR;

export interface CoverageCalculation {
  areaM2: number;
  areaWithWasteM2: number;
  wasteFactor: number;
  packagesRequired: number;
  packageType: string;
  crossSellRecommendations: string[];
}

export interface WeightFeasibilityResult {
  feasible: boolean;
  maxWeightKg: number;
  recommendedVehicle: string;
  warning?: string;
  notes: string;
}

export function estimateUnitWeightKg(sku?: string | null, product?: Product | null): number {
  if (product?.unitWeightKg) return product.unitWeightKg;
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
  vehicleType: string = "פרטי"
): WeightFeasibilityResult {
  const v = vehicleType.toLowerCase();
  let maxWeight = TECHNICAL_RULES.MAX_PRIVATE_VEHICLE_KG;
  let recommended = "רכב פרטי / מסחרי קל";

  if (v.includes("טנדר") || v.includes("מסחרית") || v.includes("van") || v.includes("pickup")) {
    maxWeight = TECHNICAL_RULES.MAX_VAN_VEHICLE_KG;
    recommended = "טנדר / מסחרית גדולה";
  } else if (v.includes("משאית") || v.includes("עגלה") || v.includes("נגרר") || v.includes("truck")) {
    maxWeight = 5000;
    recommended = "משאית / עגלה נגררת (פריקה במלגזה)";
  }

  const feasible = weightKg <= maxWeight;
  return {
    feasible,
    maxWeightKg: maxWeight,
    recommendedVehicle: recommended,
    warning: !feasible
      ? `חריגת משקל של ${(weightKg - maxWeight).toFixed(0)} ק״ג מעבר לכושר הנשיאה המותר לרכב זה (${maxWeight} ק״ג)`
      : undefined,
    notes:
      weightKg <= TECHNICAL_RULES.MAX_PRIVATE_VEHICLE_KG
        ? "מאושר לכל רכב פרטי / מסחרי קל (עד 300 ק״ג)"
        : weightKg <= TECHNICAL_RULES.MAX_VAN_VEHICLE_KG
          ? "מתאים לטנדר / מסחרית גדולה (300 עד 700 ק״ג)"
          : "דורש טנדר כבד, עגלה נגררת או משאית פתוחה להעמסה עם מלגזה (מעל 700 ק״ג)",
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
    packageType: "שקי 25 ק״ג סרם 255 (מק״ט 19255)",
    crossSellRecommendations: [
      "ספייסרים לפוגות תקניות (2 מ״מ / 3 מ״מ)",
      "רובה צמנטית גמישה אוטמת",
      "פריימר מליטה לחיזוק התשתית לפני הריצוף",
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
    packageType: "ערכות 25 ק״ג סיקה טופ 107 (מק״ט 10701)",
    crossSellRecommendations: [
      "סיקה לטקס SBR (מק״ט 10702) לביצוע רולקות ברדיוס 5 ס״מ בחיבורי רצפה-קיר",
      "רשת אינטרגלס עמידה באלקלי לשריון שכבת האיטום",
      "מברשת סיוד/איטום גסה למריחת שכבות שתי וערב",
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
    boardType: "לוחות גבס 260 (מק״ט 111260 לבן / 112260 ירוק)",
    studsCount,
    studType: "ניצב 50/300 0.6 מ״מ (מק״ט 9650300)",
    tracksCount,
    6 מ״מ (מק״ט 9650300)",
    tracksCount,
    trackType: "מסלול 50/300 0.6 מ״מ (מק״ט 8650300)",
    screwsBoxes: Math.ceil(screwsCount / 1000),
    screwSku: "76206",
    crossSellRecommendations: [
      "שפכטל אמריקאי 28 ק״ג (מק״ט 35010)",
      "סרט נייר שריון או רשת פיברגלס לחיבורים",
      "צמר סלעים / בידוד אקוסטי לקיר",
    ],
  };
}
