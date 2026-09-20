/**
 * ==============================================================================
 * ח. סבן חומרי בניין (1994) בע״מ — Saban Smart Signage & Micro-Frontend
 * Google Apps Script (Code.js) — תשתית אוטומציה, ניהול קטלוג, הזמנות ושיחות AI
 * ==============================================================================
 *
 * הוראות התקנה:
 * 1. פתח גיליון Google Sheets חדש (או קיים).
 * 2. בתפריט העליון לחץ: תוספים (Extensions) > Apps Script.
 * 3. מחק את הקוד הקיים, הדבק קובץ זה ושמור בשם Code.js.
 * 4. בחר בפונקציה: setupSabanSmartSignageSheets ולחץ "הפעל" (Run).
 *    אשר את ההרשאות. כל הטאבים ייווצרו ויעוצבו מיידית ברמת UI/UX גבוהה!
 * 5. לפריסה כ-API: פריסה (Deploy) > פריסה חדשה (New Deployment) > יישום אינטרנט (Web app)
 *    גישה: לכולם (Anyone).
 */

// קבועי מערכת ומזהי סניפים
const CONFIG = {
  COMPANY_NAME: 'ח. סבן חומרי בניין (1994) בע״מ',
  BRANCH_HAHARASH: 'סניף החרש (מחסן 4 - ראשי)',
  BRANCH_HATALMID: 'סניף התלמיד (מחסן 1 - אולם תצוגה)',
  WHATSAPP_DISPATCH: '+972508860896',
  DEPLOYMENT_URL: 'https://script.google.com/macros/s/AKfycbxxMuFP5evxDx8vxd3BfCQgx73H88KTOB87AzbiCAEx69UVJE1qmoCMyF9KM9qljvAX/exec',
  SHEETS: {
    CATALOG: '📦 קטלוג_מוצרים',
    CHAT_LOGS: '💬 יומן_שיחות_נועה',
    ORDERS_HAHARASH: '🏗️ הזמנות_סניף_החרש',
    ORDERS_HATALMID: '🏬 הזמנות_סניף_התלמיד',
    DASHBOARD: '📊 דשבורד_בקרה',
  },
  COLORS: {
    NAVY_PRIMARY: '#0f172a',
    NAVY_SECONDARY: '#1e293b',
    WHITE: '#ffffff',
    ACCENT_BLUE: '#2563eb',
    ACCENT_GREEN: '#16a34a',
    ACCENT_ORANGE: '#ea580c',
    BG_LIGHT_GRAY: '#f8fafc',
    BORDER_LIGHT: '#e2e8f0',
    CARD_BG: '#f1f5f9',
  },
};

/**
 * פונקציית תפריט מובנה ב-Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu(' ח. סבן - שילוט חכם 🚀')
    .addItem('⚡ אתחול ועיצוב כל הגיליונות (UI/UX)', 'setupSabanSmartSignageSheets')
    .addItem('🔄 סנכרון קטלוג ברירת מחדל (6 מוצרי עוגן)', 'seedDefaultProducts')
    .addItem('📊 עדכון נוסחאות דשבורד בקרה', 'formatDashboardSheet')
    .addToUi();
}

/**
 * פונקציה ראשית: יוצרת ומעצבת את כל הטאבים לפי דרישות האפיון
 */
function setupSabanSmartSignageSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. קטלוג מוצרים
  const catalogSheet = getOrCreateSheet(ss, CONFIG.SHEETS.CATALOG, '#2563eb');
  setupCatalogSheet(catalogSheet);

  // 2. יומן שיחות נועה AI
  const chatSheet = getOrCreateSheet(ss, CONFIG.SHEETS.CHAT_LOGS, '#7c3aed');
  setupChatSheet(chatSheet);

  // 3. הזמנות סניף החרש (מחסן 4)
  const haharashSheet = getOrCreateSheet(ss, CONFIG.SHEETS.ORDERS_HAHARASH, '#ea580c');
  setupOrdersSheet(haharashSheet, CONFIG.BRANCH_HAHARASH);

  // 4. הזמנות סניף התלמיד (מחסן 1)
  const hatalmidSheet = getOrCreateSheet(ss, CONFIG.SHEETS.ORDERS_HATALMID, '#059669');
  setupOrdersSheet(hatalmidSheet, CONFIG.BRANCH_HATALMID);

  // 5. דשבורד בקרה ו-KPI
  const dashboardSheet = getOrCreateSheet(ss, CONFIG.SHEETS.DASHBOARD, '#0f172a');
  setupDashboardSheet(dashboardSheet);

  // הזנת נתוני פתיחה אם הקטלוג ריק
  if (catalogSheet.getLastRow() <= 1) {
    seedDefaultProducts();
  }

  // סידור הטאבים בסדר הנכון
  ss.setActiveSheet(dashboardSheet);
  ss.moveActiveSheet(1);

  SpreadsheetApp.getUi().alert(
    'האתחול הושלם בהצלחה! 🎉\n\n' +
    'כל הטאבים נוצרו, עוצבו והוגדרו:\n' +
    '• ' + CONFIG.SHEETS.DASHBOARD + '\n' +
    '• ' + CONFIG.SHEETS.CATALOG + '\n' +
    '• ' + CONFIG.SHEETS.ORDERS_HAHARASH + '\n' +
    '• ' + CONFIG.SHEETS.ORDERS_HATALMID + '\n' +
    '• ' + CONFIG.SHEETS.CHAT_LOGS
  );
}

/**
 * יצירת גיליון או הבאתו אם קיים, והגדרת כיוון ימין-שמאל (RTL)
 */
function getOrCreateSheet(ss, name, tabColor) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (tabColor) {
    sheet.setTabColor(tabColor);
  }
  try {
    sheet.setRightToLeft(true);
  } catch (e) {
    // במידה ולא נתמך בסביבה מסוימת
  }
  return sheet;
}

/**
 * עיצוב שורת כותרת לפי שפת המותג של ח. סבן
 */
function applyHeaderStyle(range) {
  range
    .setBackground(CONFIG.COLORS.NAVY_PRIMARY)
    .setFontColor(CONFIG.COLORS.WHITE)
    .setFontWeight('bold')
    .setFontSize(11)
    .setFontFamily('Arial')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
}

/**
 * הגדרת טאב: קטלוג מוצרים ומחירון
 */
function setupCatalogSheet(sheet) {
  sheet.clear();
  const headers = [
    'מק״ט SKU',
    'שם המוצר',
    'קטגוריה',
    'מותג',
    'מחירון (₪)',
    'מחיר קבלן (₪)',
    'תגית מבצע',
    'כושר כיסוי (מ״ר)',
    'הערת כיסוי',
    'יחידת אריזה',
    'משקל יחידה',
    'יחידות במשטח',
    'פקדון משטח (₪)',
    'זמן פתוח / עבודה',
    'זמן ייבוש',
    'שיטת יישום',
    'תקן רשמי',
    'מצעים מאושרים',
    'מוצרים משלימים מחייבים',
    'קישור לתמונה',
    'קישור לסרטון הדרכה (YouTube)',
    'קישור TDS טכני',
    'מחסן / סניף מועדף',
    'פעיל בשילוט? (TRUE/FALSE)',
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle(sheet.getRange(1, 1, 1, headers.length));
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);

  // פורמטים לעמודות
  sheet.getRange('E2:F1000').setNumberFormat('₪#,##0.00');
  sheet.getRange('H2:H1000').setNumberFormat('#,##0.0');
  sheet.getRange('L2:L1000').setNumberFormat('#,##0');

  // אימות נתונים לעמודת פעיל
  const booleanRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  sheet.getRange('X2:X1000').setDataValidation(booleanRule);

  // התאמת רוחב עמודות
  for (let col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
  }
  sheet.setColumnWidth(1, 110);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(18, 180);
  sheet.setColumnWidth(19, 220);
}

/**
 * הזנת 6 מוצרי העוגן הרשמיים של ח. סבן
 */
function seedDefaultProducts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CATALOG);
  if (!sheet) return;

  const defaultProducts = [
    [
      '19255',
      'סיקה סרם 255 סטארפלקס (SikaCeram-255)',
      'דבקים ואיטום',
      'Sika',
      89.0,
      74.9,
      'מבצע קבלנים',
      3.9,
      'כ-3.9 מ״ר לשק בעובי ממוצע 3 מ״מ עם מאלג׳ שיניים',
      'שק',
      '25 ק״ג',
      48,
      'משטח סבן 60060',
      'זמן פתוח כ-30 דקות',
      'דריכה קלה לאחר 24 שעות, ייבוש מלא 14 יום',
      'מריחה במאלג׳ משונן מתאים לסוג וגודל האריח',
      'ת״י 4004 / C2TE S1',
      'בטון, טיח, מדה מתפלסת, לוחות גבס',
      'סיקה לטקס SBR (מק״ט 10702) | ספייסרים לפוגה',
      'https://saban-smart-signage.vercel.app/assets/product-adhesive-bag.jpg',
      'https://www.youtube.com/embed/ScMzIvxBSi4',
      'https://isr.sika.com',
      'סניף החרש (מחסן 4)',
      true,
    ],
    [
      '10701',
      'סיקה טופ 107 (SikaTop Seal-107)',
      'חומרי איטום צמנטיים',
      'Sika',
      155.0,
      132.0,
      'מומלץ לחדרים רטובים',
      12.5,
      'כ-12.5 מ״ר לערכה (25 ק״ג) בשתי שכבות תקניות (2 מ״מ)',
      'ערכה (אבקה+נוזל)',
      '25 ק״ג',
      40,
      'משטח סבן 60060',
      'זמן עבודה בדלי כ-40 דקות',
      'בין שכבות: 4-6 שעות, הצפה לאחר 7 ימים',
      'מריחה בהברשה צולבת בשתי שכבות על מצע לח',
      'ת״י 1536 לאיטום צמנטי',
      'בטון יצוק, בלוק בטון מלא, טיח צמנטי',
      'סיקה לטקס SBR לרולקות (מק״ט 10702) | רשת אינטרגלס',
      'https://saban-smart-signage.vercel.app/assets/product-waterproof-pail.jpg',
      'https://www.youtube.com/embed/ScMzIvxBSi4',
      'https://isr.sika.com',
      'סניף החרש (מחסן 4)',
      true,
    ],
    [
      '10702',
      'סיקה לטקס SBR (SikaLatex SBR)',
      'מוספים ודבקים לטיח',
      'Sika',
      110.0,
      95.0,
      'חובה לרולקות וחיבורים',
      25.0,
      'כ-25 מ״ר כפריימר מגשר או תוסף 10%-20% ממשקל הצמנט',
      'פח',
      '5 ליטר',
      72,
      'ללא פקדון',
      'מיידי בערבוב',
      'לפי זמני הייבוש של שכבת המליטה',
      'ערבוב במי הבלילה או יישום מריחת שכבת יסוד (פריימר)',
      'תקן מוספי בטון וטיח',
      'בטון, בלוקים, טיט ומליטה צמנטית',
      'סיקה טופ 107 (מק״ט 10701) | צמנט פורטלנד',
      'https://saban-smart-signage.vercel.app/assets/product-latex-sbr.jpg',
      'https://www.youtube.com/embed/ScMzIvxBSi4',
      'https://isr.sika.com',
      'סניף התלמיד (מחסן 1)',
      true,
    ],
    [
      '20110',
      'טמבור סופרפלקס לבן (Tambour Superflex)',
      'איטום גגות וציפויים',
      'טמבור',
      249.0,
      219.0,
      'איטום גגות עמיד UV',
      15.0,
      'כ-15 מ״ר לפח בשתי שכבות מגן',
      'פח',
      '18 ק״ג',
      36,
      'משטח סבן 60060',
      'מוכן לשימוש',
      'ייבוש למגע: 3 שעות, שכבה שנייה לאחר 8 שעות',
      'יישום ברולר, מברשת או התזה על גג נקי ויבש',
      'ת״י לאיטום אקרילי אלסטומרי',
      'יריעות ביטומניות ישנות, בטון, טיח',
      'פריימר אקרילי לגגות | רשת חיזוק',
      'https://saban-smart-signage.vercel.app/assets/product-waterproof-pail.jpg',
      'https://www.youtube.com/embed/ScMzIvxBSi4',
      'https://tambour.co.il',
      'סניף התלמיד (מחסן 1)',
      true,
    ],
    [
      '30501',
      'קצף פוליאוריטן סיקה בום (Sika Boom-157)',
      'קצף ואיטום מרווחים',
      'Sika',
      38.0,
      31.5,
      'בידוד והדבקה',
      2.0,
      'נפח תפיחה חופשי כ-35-40 ליטר למכל',
      'מכל',
      '750 מ״ל',
      120,
      'ללא פקדון',
      'חיתוך לאחר 40 דקות',
      'ייבוש מלא 24 שעות',
      'ניעור היטב, התזה כשהמכל הפוך על משטח לח',
      'תקן עמידות אש B3',
      'בטון, בלוקים, עץ, אלומיניום, צנרת',
      'מנקה קצף ייעודי | כפפות עבודה',
      'https://saban-smart-signage.vercel.app/assets/product-waterproof-pail.jpg',
      'https://www.youtube.com/embed/ScMzIvxBSi4',
      'https://isr.sika.com',
      'סניף החרש (מחסן 4)',
      true,
    ],
    [
      '10020',
      'בלוק בטון חלול תקני 20 ס״מ',
      'בלוקים ומחיצות',
      'סבן ייצור ושיווק',
      7.2,
      6.4,
      'אספקה מיידית במשטח',
      0.08,
      '12.5 בלוקים לכל 1 מ״ר קיר בנוי',
      'יחידה',
      '18 ק״ג',
      72,
      'משטח סבן 60060',
      'בנייה בטיט',
      'לפי זמני התקשות המליטה',
      'בנייה בטיט מלט או דבק בלוקים, קשירה לעמודים',
      'ת״י 5 לבלוקי בטון',
      'יסודות בטון, רצפת בטון',
      'מלט פורטלנד | רשת קשירה וחיזוק',
      'https://saban-smart-signage.vercel.app/assets/product-adhesive-bag.jpg',
      'https://www.youtube.com/embed/ScMzIvxBSi4',
      'https://saban.co.il',
      'סניף החרש (מחסן 4)',
      true,
    ],
  ];

  sheet.getRange(2, 1, defaultProducts.length, defaultProducts[0].length).setValues(defaultProducts);
}

/**
 * הגדרת טאב: הזמנות מחסן / סניף
 */
function setupOrdersSheet(sheet, branchName) {
  sheet.clear();
  const headers = [
    'מזהה הזמנה #',
    'תאריך ושעה',
    'סטטוס ליקוט',
    'סניף / מחסן',
    'מק״ט',
    'שם המוצר',
    'כמות מוזמנת',
    'יחידת מידה',
    'עלות מוערכת (₪)',
    'משטחים מלאים',
    'חיוב פקדון משטח (₪)',
    'מקור הזמנה',
    'מזהה מסך / QR',
    'הערות לקבלן / מלקט',
    'טלפון / לקוח',
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle(sheet.getRange(1, 1, 1, headers.length));
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(3);

  // פורמטים
  sheet.getRange('B2:B1000').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange('G2:G1000').setNumberFormat('#,##0');
  sheet.getRange('I2:I1000').setNumberFormat('₪#,##0.00');
  sheet.getRange('K2:K1000').setNumberFormat('₪#,##0.00');

  // אימות נתונים לעמודת סטטוס ליקוט
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['ממתין לליקוט ⏳', 'בליקוט 🏃‍♂️', 'מוכן בדלפק ✅', 'נמסר ללקוח 📦', 'בוטל ❌'], true)
    .build();
  sheet.getRange('C2:C1000').setDataValidation(statusRule);

  // עיצוב מותנה (צבעים לסטטוסים)
  const range = sheet.getRange('C2:C1000');
  const rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('ממתין לליקוט ⏳')
      .setBackground('#fef9c3')
      .setFontColor('#854d0e')
      .setRanges([range])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('בליקוט 🏃‍♂️')
      .setBackground('#dbeafe')
      .setFontColor('#1e40af')
      .setRanges([range])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('מוכן בדלפק ✅')
      .setBackground('#dcfce7')
      .setFontColor('#166534')
      .setRanges([range])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('נמסר ללקוח 📦')
      .setBackground('#f1f5f9')
      .setFontColor('#475569')
      .setRanges([range])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('בוטל ❌')
      .setBackground('#fee2e2')
      .setFontColor('#991b1b')
      .setRanges([range])
      .build(),
  ];
  sheet.setConditionalFormatRules(rules);

  // הוספת שורת דוגמה
  const sample = [
    'ORD-' + Math.floor(100000 + Math.random() * 900000),
    new Date(),
    'ממתין לליקוט ⏳',
    branchName,
    '19255',
    'סיקה סרם 255 סטארפלקס',
    12,
    'שק',
    898.8,
    0,
    0,
    'סריקת QR בנייד (Lobby)',
    'מסך לובי מרכזי',
    'חישוב מחושב עבור 42 מ״ר כולל 10% פחת. דרוש דחוף לריצוף',
    '050-8860896',
  ];
  sheet.appendRow(sample);

  for (let col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
  }
}

/**
 * הגדרת טאב: יומן שיחות נועה AI
 */
function setupChatSheet(sheet) {
  sheet.clear();
  const headers = [
    'מזהה שיחה',
    'תאריך ושעה',
    'מק״ט מוצר נסרק',
    'שם המוצר',
    'סניף / מחסן',
    'שאלת הלקוח',
    'תשובת נועה AI',
    'כמות שחושבה (יח׳)',
    'עלות שחושבה (₪)',
    'שודר לדלפק?',
    'זמן תגובה (ms)',
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle(sheet.getRange(1, 1, 1, headers.length));
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);

  sheet.getRange('B2:B1000').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange('H2:H1000').setNumberFormat('#,##0');
  sheet.getRange('I2:I1000').setNumberFormat('₪#,##0.00');

  // שורת דוגמה
  sheet.appendRow([
    'CHAT-' + Date.now().toString(36),
    new Date(),
    '19255',
    'סיקה סרם 255 סטארפלקס',
    CONFIG.BRANCH_HAHARASH,
    'כמה שקים אני צריך ל-35 מטר פורצלן 80 על 80?',
    'שלום! עבור 35 מ״ר כולל 10% פחת תצטרך 10 שקים. עלות מוערכת 749 ₪. מומלץ להוסיף ספייסרים.',
    10,
    749.0,
    'כן (שודר לדלפק)',
    420,
  ]);

  for (let col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
  }
}

/**
 * הגדרת טאב: דשבורד בקרה ו-KPI (Executive View)
 */
function setupDashboardSheet(sheet) {
  sheet.clear();
  sheet.setColumnWidth(1, 30);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 160);
  sheet.setColumnWidth(4, 220);
  sheet.setColumnWidth(5, 160);
  sheet.setColumnWidth(6, 30);

  // כותרת עליונה
  sheet.getRange('B2:E2').merge();
  sheet
    .getRange('B2')
    .setValue('ח. סבן חומרי בניין (1994) בע״מ — דשבורד שילוט חכם ודלפק מכירות')
    .setBackground(CONFIG.COLORS.NAVY_PRIMARY)
    .setFontColor(CONFIG.COLORS.WHITE)
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(2, 45);

  sheet.getRange('B3:E3').merge();
  sheet
    .getRange('B3')
    .setValue('עדכון חי בזמן אמת • סניף החרש (מחסן 4) | סניף התלמיד (מחסן 1) • מוקד: ' + CONFIG.WHATSAPP_DISPATCH)
    .setBackground('#1e293b')
    .setFontColor('#94a3b8')
    .setFontSize(10)
    .setHorizontalAlignment('center');
  sheet.setRowHeight(3, 24);

  // כרטיסי KPI
  const kpiData = [
    ['סה״כ הזמנות סניף החרש (מחסן 4):', "=COUNTA('🏗️ הזמנות_סניף_החרש'!A2:A)"],
    ['סה״כ הזמנות סניף התלמיד (מחסן 1):', "=COUNTA('🏬 הזמנות_סניף_התלמיד'!A2:A)"],
    ['מחזור הזמנות משוער (לפני מע״מ):', "=SUM('🏗️ הזמנות_סניף_החרש'!I2:I) + SUM('🏬 הזמנות_סניף_התלמיד'!I2:I)"],
    ['שיחות ייעוץ עם נועה AI:', "=COUNTA('💬 יומן_שיחות_נועה'!A2:A)"],
    ['מוצרים פעילים בקטלוג השילוט:', "=COUNTIF('📦 קטלוג_מוצרים'!X2:X, TRUE)"],
    ['זמן סנכרון אחרון:', '=NOW()'],
  ];

  let startRow = 5;
  for (let i = 0; i < kpiData.length; i += 2) {
    // עמודה ראשונה
    sheet.getRange(startRow, 2).setValue(kpiData[i][0]).setFontWeight('bold').setBackground('#f8fafc');
    sheet.getRange(startRow, 3).setFormula(kpiData[i][1]).setFontSize(13).setFontWeight('bold').setHorizontalAlignment('center').setBackground('#e2e8f0');

    // עמודה שנייה
    if (kpiData[i + 1]) {
      sheet.getRange(startRow, 4).setValue(kpiData[i + 1][0]).setFontWeight('bold').setBackground('#f8fafc');
      sheet.getRange(startRow, 5).setFormula(kpiData[i + 1][1]).setFontSize(13).setFontWeight('bold').setHorizontalAlignment('center').setBackground('#e2e8f0');
    }
    sheet.setRowHeight(startRow, 36);
    startRow++;
  }

  // עיצוב מטבע ותאריך ב-KPI
  sheet.getRange('C6').setNumberFormat('₪#,##0.00');
  sheet.getRange('E7').setNumberFormat('dd/MM/yyyy HH:mm');

  // הנחיות תפעוליות
  const guideRow = startRow + 2;
  sheet.getRange(guideRow, 2, 1, 4).merge();
  sheet
    .getRange(guideRow, 2)
    .setValue('📋 הנחיות למנהל סניף ולדלפק המכירות')
    .setBackground(CONFIG.COLORS.NAVY_PRIMARY)
    .setFontColor(CONFIG.COLORS.WHITE)
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('right');
  sheet.setRowHeight(guideRow, 30);

  const guides = [
    ['1. ניתוב הזמנות אוטומטי:', 'הזמנות מסריקת QR ומשיחות נועה מנותבות אוטומטית לטאב הסניף המתאים לפי המחסן.'],
    ['2. עדכון סטטוס ליקוט:', 'בעת הכנת המוצרים במחסן, המלקט ישנה את הסטטוס ל-"בליקוט" ובהמשך ל-"מוכן בדלפק".'],
    ['3. הוספת מוצר חדש:', 'יש להוסיף שורה בטאב "📦 קטלוג_מוצרים", ולסמן וי (TRUE) בעמודה האחרונה. השילוט יתעדכן מיידית!'],
    ['4. שאלות ותמיכה טכנית:', 'מוקד הזמנות ודלפק ח. סבן: ' + CONFIG.WHATSAPP_DISPATCH],
  ];

  for (let j = 0; j < guides.length; j++) {
    const r = guideRow + 1 + j;
    sheet.getRange(r, 2).setValue(guides[j][0]).setFontWeight('bold');
    sheet.getRange(r, 3, 1, 3).merge().setValue(guides[j][1]);
    sheet.setRowHeight(r, 26);
  }
}

/**
 * ==============================================================================
 * Web App REST API (doGet / doPost) לחיבור חי עם ה-React Micro-Frontend
 * ==============================================================================
 */

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'products';
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'ping') {
    return jsonResponse({
      success: true,
      message: 'Saban Smart Signage API is running',
      timestamp: new Date().toISOString(),
      deploymentUrl: CONFIG.DEPLOYMENT_URL,
    });
  }

  if (action === 'seed') {
    seedDefaultProducts();
    return jsonResponse({
      success: true,
      message: 'Default products seeded into catalog sheet',
      timestamp: new Date().toISOString(),
    });
  }

  if (action === 'products') {
    const sheet = ss.getSheetByName(CONFIG.SHEETS.CATALOG);
    if (!sheet) {
      return jsonResponse({ error: 'Catalog sheet not found' }, 404);
    }
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const products = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[23] === true) {
        products.push({
          sku: String(row[0]),
          name: String(row[1] || ''),
          category: String(row[2] || ''),
          brand: String(row[3] || ''),
          price: Number(row[4] || 0),
          salePrice: row[5] ? Number(row[5]) : undefined,
          discountTag: row[6] ? String(row[6]) : undefined,
          coveragePerUnitM2: Number(row[7] || 1),
          coverageNote: String(row[8] || ''),
          unitLabel: String(row[9] || 'יח׳'),
          unitWeight: String(row[10] || ''),
          unitsPerPallet: row[11] ? Number(row[11]) : undefined,
          palletDeposit: row[12] ? String(row[12]) : undefined,
          openTime: row[13] ? String(row[13]) : undefined,
          dryingTime: row[14] ? String(row[14]) : undefined,
          applicationMethod: String(row[15] || ''),
          standard: row[16] ? String(row[16]) : undefined,
          substrates: row[17] ? String(row[17]).split(',').map((s) => s.trim()) : [],
          companions: row[18]
            ? String(row[18]).split('|').map((c) => {
                const parts = c.split('(');
                return { name: parts[0].trim(), reason: parts[1] ? parts[1].replace(')', '').trim() : 'מוצר משלים' };
              })
            : [],
          image: String(row[19] || ''),
          mediaUrl: String(row[20] || ''),
          tdsUrl: String(row[21] || ''),
          preferredWarehouse: String(row[22] || ''),
        });
      }
    }
    return jsonResponse({ success: true, count: products.length, products: products });
  }

  return jsonResponse({ success: true, message: 'Saban Smart Signage API is running', timestamp: new Date() });
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. קבלת הזמנה חדשה
    if (postData.type === 'order' || postData.order) {
      const order = postData.order || postData;
      const targetBranch = (order.branch || order.warehouse || '').includes('התלמיד')
        ? CONFIG.SHEETS.ORDERS_HATALMID
        : CONFIG.SHEETS.ORDERS_HAHARASH;

      const sheet = ss.getSheetByName(targetBranch);
      if (!sheet) return jsonResponse({ error: 'Target branch sheet not found' }, 500);

      const orderId = order.id || 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      const row = [
        orderId,
        new Date(),
        'ממתין לליקוט ⏳',
        targetBranch.includes('החרש') ? CONFIG.BRANCH_HAHARASH : CONFIG.BRANCH_HATALMID,
        order.sku || '',
        order.productName || order.name || '',
        Number(order.quantity || 1),
        order.unitLabel || 'יח׳',
        Number(order.estimatedCost || 0),
        order.pallets || 0,
        order.deposit || 0,
        order.source || 'סריקת QR בנייד',
        order.screenId || 'lobby_qr',
        order.note || '',
        order.phone || '',
      ];

      sheet.appendRow(row);
      return jsonResponse({ success: true, orderId: orderId, branch: targetBranch });
    }

    // 2. תיעוד שיחת נועה AI
    if (postData.type === 'chat' || postData.chat) {
      const chat = postData.chat || postData;
      const sheet = ss.getSheetByName(CONFIG.SHEETS.CHAT_LOGS);
      if (sheet) {
        sheet.appendRow([
          chat.id || 'CHAT-' + Date.now().toString(36),
          new Date(),
          chat.sku || '',
          chat.productName || '',
          chat.branch || CONFIG.BRANCH_HAHARASH,
          chat.question || '',
          chat.answer || '',
          chat.quantity || '',
          chat.cost || '',
          chat.dispatched ? 'כן (שודר לדלפק)' : 'לא (ייעוץ בלבד)',
          chat.duration || 0,
        ]);
        return jsonResponse({ success: true, message: 'Chat logged' });
      }
    }

    return jsonResponse({ success: false, error: 'Unknown payload type' }, 400);
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() }, 500);
  }
}

function jsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
