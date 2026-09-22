// ============================================================================
// Technical Rules: Engineering Coverage Rates & 10% Waste Margin Logic
// Version: 3.0.0
// ============================================================================

export const STANDARD_WASTE_FACTOR = 1.10; // 10% פחת קבוע

export interface CoverageCalculation {
  areaM2: number;
  areaWithWasteM2: number;
  wasteFactor: number;
  packagesRequired: number;
  packageType: string;
  crossSellRecommendations: string[];
}

export function calculateCeram255TileAdhesive(netAreaM2: number): CoverageCalculation {
  const grossArea = netAreaM2 * STANDARD_WASTE_FACTOR;
  // שק 25 ק"ג סרם 255 מכסה כ-3.9 מ"ר
  const packagesRequired = Math.ceil(grossArea / 3.9);

  return {
    areaM2: netAreaM2,
    areaWithWasteM2: Number(grossArea.toFixed(1)),
    wasteFactor: STANDARD_WASTE_FACTOR,
    packagesRequired,
    packageType: "שקי 25 ק״ג סרם 255 (מק״ט 19255)",
    crossSellRecommendations: [
      "ספייסרים לפוגות תקניות (2 מ״מ / 3 מ״מ)",
      "רובה צמנטית גמישה אוטמת",
      "פריימר מליטה לחיזוק התשתית לפני הריצוף"
    ]
  };
}

export function calculateSikaTop107Waterproofing(netAreaM2: number): CoverageCalculation {
  const grossArea = netAreaM2 * STANDARD_WASTE_FACTOR;
  // ערכה 25 ק"ג סיקה 107 מכסה כ-12.5 מ"ר בשתי שכבות
  const packagesRequired = Math.ceil(grossArea / 12.5);

  return {
    areaM2: netAreaM2,
    areaWithWasteM2: Number(grossArea.toFixed(1)),
    wasteFactor: STANDARD_WASTE_FACTOR,
    packagesRequired,
    packageType: "ערכות 25 ק״ג סיקה טופ 107 (מק״ט 10701)",
    crossSellRecommendations: [
      "סיקה לטקס SBR (מק״ט 10702) לביצוע רולקות ברדיוס 5 ס״מ בחיבורי רצפה-קיר",
      "רשת אינטרגלס עמידה באלקלי לשריון שכבת האיטום",
      "מברשת סיוד/איטום גסה למריחת שכבות שתי וערב"
    ]
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
    trackType: "מסלול 50/300 0.6 מ״מ (מק״ט 8650300)",
    screwsBoxes: Math.ceil(screwsCount / 1000),
    screwSku: "76206",
    crossSellRecommendations: [
      "שפכטל אמריקאי 28 ק״ג (מק״ט 35010)",
      "סרט נייר שריון או רשת פיברגלס לחיבורים",
      "צמר סלעים / בידוד אקוסטי לקיר"
    ]
  };
}
