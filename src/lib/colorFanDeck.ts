export type ColorFamily =
  "לבנים ושמנת" | "אפורים ובטון" | "בז' ומוקה" | "פסטל ורוגע" | "ירוקים וטבע" | "נועזים ועמוקים";

export type PaintBrand = "טמבור" | "נירלט";

export interface ColorShade {
  id: string;
  code: string;
  name: string;
  brand: PaintBrand;
  hex: string;
  rgb: { r: number; g: number; b: number };
  family: ColorFamily;
  finishRecommended: string[];
  similarCodes: string[];
  complementaryCode: string;
  description: string;
  coveragePerLiterM2?: number; // כושר כיסוי לליטר בשכבה
}

export const COLOR_FAN_DECK: ColorShade[] = [
  {
    id: "tambour-0021p",
    code: "0021P",
    name: "פנינה (לבן שבור)",
    brand: "טמבור",
    hex: "#F0ECE1",
    rgb: { r: 240, g: 236, b: 225 },
    family: "לבנים ושמנת",
    finishRecommended: ["סופרקריל מט+", "סופרקריל משי"],
    similarCodes: ["0011P", "0020P"],
    complementaryCode: "0524T",
    description:
      "הגוון הנמכר ביותר בישראל. לבן שבור חם ומזמין המעניק אור טבעי לחלל ללא בוהק מנוכר.",
    coveragePerLiterM2: 8,
  },
  {
    id: "tambour-0524t",
    code: "0524T",
    name: "אפור בטון עדין",
    brand: "טמבור",
    hex: "#D6D5D0",
    rgb: { r: 214, g: 213, b: 208 },
    family: "אפורים ובטון",
    finishRecommended: ["סופרקריל מט+", "סופרקריל משי"],
    similarCodes: ["0523T", "0525T"],
    complementaryCode: "0021P",
    description: "אפור מודרני בהיר עם תת-גוון ניטרלי, מתאים לקירות מרכזיים בסלון ובחללים פתוחים.",
    coveragePerLiterM2: 8,
  },
  {
    id: "tambour-0011p",
    code: "0011P",
    name: "לבן בוהק נקי",
    brand: "טמבור",
    hex: "#F8F8F6",
    rgb: { r: 248, g: 248, b: 246 },
    family: "לבנים ושמנת",
    finishRecommended: ["סופרקריל מט+"],
    similarCodes: ["0021P", "0001P"],
    complementaryCode: "1542D",
    description:
      "לבן כמעט אבסולוטי עם נגיעה מזערית של חמימות, אידיאלי לתקרות ולתחושת מרחב מקסימלית.",
    coveragePerLiterM2: 8,
  },
  {
    id: "tambour-0184p",
    code: "0184P",
    name: "קשמיר חם",
    brand: "טמבור",
    hex: "#E6DEC8",
    rgb: { r: 230, g: 222, b: 200 },
    family: "בז' ומוקה",
    finishRecommended: ["סופרקריל מט+", "סופרקריל משי"],
    similarCodes: ["0183P", "0185T"],
    complementaryCode: "0545D",
    description: "גוון בז' אלגנטי המשרה רוגע וחמימות עוטפת, מתאים במיוחד לחדרי שינה ופינות אוכל.",
    coveragePerLiterM2: 8,
  },
  {
    id: "tambour-1542d",
    code: "1542D",
    name: "גרפיט עמוק (קיר כוח)",
    brand: "טמבור",
    hex: "#3A3D40",
    rgb: { r: 58, g: 61, b: 64 },
    family: "נועזים ועמוקים",
    finishRecommended: ["סופרקריל משי"],
    similarCodes: ["1541D", "1543D"],
    complementaryCode: "0021P",
    description:
      "אפור-גרפיט עמוק ויוקרתי. אידיאלי לקיר טלוויזיה, גב מיטה או נישות מעוצבות בעלות נוכחות.",
    coveragePerLiterM2: 7.5,
  },
  {
    id: "tambour-0812t",
    code: "0812T",
    name: "ירוק מרווה מרגיע",
    brand: "טמבור",
    hex: "#B7C2B2",
    rgb: { r: 183, g: 194, b: 178 },
    family: "ירוקים וטבע",
    finishRecommended: ["סופרקריל מט+", "סופרקריל משי"],
    similarCodes: ["0811P", "0813D"],
    complementaryCode: "0021P",
    description:
      "גוון סקנדינבי שלווה מעודן, מתחבר נפלא לעץ אלון, ריצוף בהיר וחלונות בלגיים שחורים.",
    coveragePerLiterM2: 8,
  },
  {
    id: "tambour-1140p",
    code: "1140P",
    name: "תכלת אוורירי (בריזה)",
    brand: "טמבור",
    hex: "#D6E3E9",
    rgb: { r: 214, g: 227, b: 233 },
    family: "פסטל ורוגע",
    finishRecommended: ["סופרקריל מט+", "סופרקריל משי"],
    similarCodes: ["1139P", "1141T"],
    complementaryCode: "1542D",
    description: "תכלת מלטף וקליל היוצר אשליית גובה ומרחב פתוח, מושלם לחדרי ילדים ומבואות.",
    coveragePerLiterM2: 8,
  },
  {
    id: "nirlat-is-0234",
    code: "IS 0234",
    name: "גרייג' אורבני",
    brand: "נירלט",
    hex: "#DDD6CC",
    rgb: { r: 221, g: 214, b: 204 },
    family: "בז' ומוקה",
    finishRecommended: ["נירוקריל EXTRA", "אקוורל"],
    similarCodes: ["IS 0233", "IS 0235"],
    complementaryCode: "IS 0500",
    description:
      "שילוב מאוזן ומדויק בין אפור לבז'. מתאים לריצוף מודרני בהיר ומעניק חמימות אורבנית.",
    coveragePerLiterM2: 8,
  },
  {
    id: "nirlat-is-0001",
    code: "IS 0001",
    name: "לבן שלג צח",
    brand: "נירלט",
    hex: "#FAF9F6",
    rgb: { r: 250, g: 249, b: 246 },
    family: "לבנים ושמנת",
    finishRecommended: ["נירוקריל EXTRA"],
    similarCodes: ["IS 0002", "IS 0003"],
    complementaryCode: "IS 0850",
    description: "לבן נקי וטהור עם החזר אור גבוה במיוחד, מומלץ לחללים קטנים המבקשים תחושת פתיחות.",
    coveragePerLiterM2: 8.5,
  },
  {
    id: "nirlat-is-0023",
    code: "IS 0023",
    name: "שמנת מעודנת",
    brand: "נירלט",
    hex: "#F4EFEA",
    rgb: { r: 244, g: 239, b: 234 },
    family: "לבנים ושמנת",
    finishRecommended: ["נירוקריל EXTRA", "נירוקריל למטבח ולאמבט"],
    similarCodes: ["IS 0022", "IS 0024"],
    complementaryCode: "IS 0420",
    description: "גוון שמנת חם ורך שאינו מצהיב, מעניק רקע נעים ומחמיא לרהיטי עץ וריצוף טבעי.",
    coveragePerLiterM2: 8,
  },
  {
    id: "nirlat-is-0500",
    name: "אפור עשן מודרני",
    code: "IS 0500",
    brand: "נירלט",
    hex: "#A8A9A4",
    rgb: { r: 168, g: 169, b: 164 },
    family: "אפורים ובטון",
    finishRecommended: ["נירוקריל EXTRA"],
    similarCodes: ["IS 0499", "IS 0501"],
    complementaryCode: "IS 0001",
    description:
      "אפור בעל נוכחות מרשימה לקירות מוקד וקירות כוח, שילוב מושלם עם מתכת שחורה ותאורה חמה.",
    coveragePerLiterM2: 7.5,
  },
  {
    id: "nirlat-is-0850",
    code: "IS 0850",
    name: "ירוק מרווה מעושן",
    brand: "נירלט",
    hex: "#A7B3A5",
    rgb: { r: 167, g: 179, b: 165 },
    family: "ירוקים וטבע",
    finishRecommended: ["נירוקריל EXTRA", "אקוורל"],
    similarCodes: ["IS 0849", "IS 0851"],
    complementaryCode: "IS 0234",
    description:
      "ירוק טבעי עדין המשרה שלווה וחיבור לטבע. נפוץ מאוד בחדרי הורים, פינות עבודה ומבואות.",
    coveragePerLiterM2: 8,
  },
  {
    id: "nirlat-is-0310",
    code: "IS 0310",
    name: "ורדרד פודרה מעודן",
    brand: "נירלט",
    hex: "#F2E4DE",
    rgb: { r: 242, g: 228, b: 222 },
    family: "פסטל ורוגע",
    finishRecommended: ["נירוקריל EXTRA", "אקוורל"],
    similarCodes: ["IS 0308", "IS 0312"],
    complementaryCode: "IS 0500",
    description: "ורוד עדין במראה בוהו שיק רומנטי ומרגיע, אינו משתלט ומעשיר חללי שינה וחדרי ילדים.",
    coveragePerLiterM2: 8,
  },
  {
    id: "nirlat-is-0780",
    code: "IS 0780",
    name: "כחול מעמקים דרמטי",
    brand: "נירלט",
    hex: "#243342",
    rgb: { r: 36, g: 51, b: 66 },
    family: "נועזים ועמוקים",
    finishRecommended: ["נירוקריל EXTRA"],
    similarCodes: ["IS 0779", "IS 0781"],
    complementaryCode: "IS 0001",
    description:
      "כחול כהה עמוק לקיר כוח יוקרתי, משתלב בהרמוניה מוחלטת עם פרזול מוזהב ותאורת ספוטים.",
    coveragePerLiterM2: 7.5,
  },
];

export function findColorByCode(code: string): ColorShade | undefined {
  const normalized = code.trim().toUpperCase().replace(/\s+/g, " ");
  return COLOR_FAN_DECK.find(
    (c) =>
      c.code.toUpperCase().replace(/\s+/g, " ") === normalized ||
      c.code.toUpperCase().replace(/\s+/g, "") === normalized.replace(/\s+/g, "") ||
      c.id.toLowerCase() === code.toLowerCase().trim(),
  );
}

export function getSimilarShades(shade: ColorShade): ColorShade[] {
  return shade.similarCodes
    .map((code) => findColorByCode(code))
    .filter((c): c is ColorShade => c !== undefined);
}

export function getComplementaryShade(shade: ColorShade): ColorShade | undefined {
  return findColorByCode(shade.complementaryCode);
}

// בדיקת ניגודיות עבור טקסט מעל רקע צבעוני
export function isDarkColor(hex: string): boolean {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  // שקלול מקובל לבהירות נתפסת
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55;
}
