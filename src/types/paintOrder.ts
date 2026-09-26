// ============================================================================
// Types: Paint Tint Order Definitions
// ============================================================================

export interface PaintTintOrderData {
  orderNumber: string;
  dateTime?: string;
  branch: string;
  source?: string;
  customerName: string;
  customerStatus?: string;
  customerPhone: string;
  estimatedPickupTime: string;
  paintItem: {
    sku: string;
    name: string;
    colorCode: string;
    colorName: string;
    colorHex: string;
    machineBase: string;
    series: string;
    quantity: string;
  };
  companions: Array<{
    sku: string;
    name: string;
    quantity: string;
  }>;
  operatorNotes?: string[];
  status: string;
}

export const SAMPLE_ORD_889413: PaintTintOrderData = {
  orderNumber: "ORD-889413",
  dateTime: "26/09/2026 10:15",
  branch: "סניף החרש (מחסן 4)",
  source: "נועה AI (צ'אט שילוט)",
  customerName: "ראמי מסארוה",
  customerStatus: "לקוח רשום (קבלן)",
  customerPhone: "050-8860896",
  estimatedPickupTime: "11:15",
  paintItem: {
    sku: "9889488",
    name: "סופרקריל מט טמבור — 10 ליטר (חצי פח)",
    colorCode: "0524T",
    colorName: "אפור בטון עדין",
    colorHex: "#D6D5D0",
    machineBase: "בסיס P/A",
    series: "סופרקריל מט+",
    quantity: "1 חצי פח",
  },
  companions: [
    {
      sku: "554102",
      name: "רולר פרו 9 אינץ׳ מושלם עם ידית",
      quantity: "1 יח׳",
    },
    {
      sku: "663201",
      name: "סרט הדבקה מסקנטייפ שריון עמיד",
      quantity: "2 יח׳",
    },
  ],
  operatorNotes: [
    "הלקוח צובע 40 מ״ר קירות פנים.",
    "לוודא בחישה במערבל צבע וסימון מדבקת גוון 0524T על המכסה.",
  ],
  status: "ממתין להכנה בדלפק ⏳",
};
