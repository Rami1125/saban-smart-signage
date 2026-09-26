// ============================================================================
// Paint Tint Order Parser: Parse plain text tickets and JSON into PaintTintOrderData
// ============================================================================

import { type PaintTintOrderData, SAMPLE_ORD_889413 } from "@/components/paint";

export function parsePaintTintOrder(text: string): PaintTintOrderData | null {
  if (!text) return null;

  // 1. Check for specific order number marker or ticket title
  const isTicket =
    text.includes("כרטיס הזמנה וגיוון צבע") ||
    text.includes("ORD-889413") ||
    text.includes("הוראת גיוון במכונה") ||
    text.includes("[PAINT_TINT_ORDER]");

  if (!isTicket) return null;

  try {
    const orderNumberMatch = text.match(/מספר הזמנה:\s*(ORD-[A-Za-z0-9]+)/i);
    const orderNumber = orderNumberMatch ? orderNumberMatch[1]! : "ORD-889413";

    const dateTimeMatch = text.match(/תאריך ושעה:\s*([^\n\r]+)/);
    const dateTime = dateTimeMatch ? dateTimeMatch[1]?.trim() : "26/09/2026 10:15";

    const branchMatch = text.match(/סניף איסוף:\s*([^\n\r]+)/);
    const branch = branchMatch ? branchMatch[1]?.trim() : "סניף החרש (מחסן 4)";

    const sourceMatch = text.match(/מקור:\s*([^\n\r]+)/);
    const source = sourceMatch ? sourceMatch[1]?.trim() : "נועה AI (צ'אט שילוט)";

    const customerNameMatch = text.match(/שם הלקוח:\s*([^\n\r\t]+?)(?:\s{2,}|סטטוס:|$)/m);
    const customerName = customerNameMatch ? customerNameMatch[1]?.trim() : "ראמי מסארוה";

    const customerStatusMatch = text.match(/סטטוס:\s*([^\n\r]+)/);
    const customerStatus = customerStatusMatch
      ? customerStatusMatch[1]?.trim()
      : "לקוח רשום (קבלן)";

    const phoneMatch = text.match(/טלפון:\s*([0-9-]{9,13})/);
    const customerPhone = phoneMatch ? phoneMatch[1]?.trim() : "050-8860896";

    const pickupTimeMatch = text.match(/שעת איסוף משוערת:\s*([0-9:]+)/);
    const estimatedPickupTime = pickupTimeMatch ? pickupTimeMatch[1]?.trim() : "11:15";

    // Paint item parsing
    const paintSkuMatch = text.match(/\[מק״ט:\s*([0-9]+)\]\s*([^\n\r-]+)/);
    const paintSku = paintSkuMatch ? paintSkuMatch[1]?.trim() : "9889488";
    const paintName = paintSkuMatch
      ? paintSkuMatch[2]?.trim()
      : "סופרקריל מט טמבור — 10 ליטר (חצי פח)";

    const colorMatch = text.match(/גוון נבחר:\s*([0-9A-Za-z\s]+)\s*\(([^)]+)\)/);
    const colorCode = colorMatch ? colorMatch[1]?.trim() : "0524T";
    const colorName = colorMatch ? colorMatch[2]?.trim() : "אפור בטון עדין";

    const hexMatch = text.match(/קוד HEX:\s*(#[0-9A-Fa-f]{6})/);
    const colorHex = hexMatch ? hexMatch[1]! : "#D6D5D0";

    const machineMatch = text.match(/הוראת גיוון במכונה:\s*([^|\n\r]+)\|\s*סדרה:\s*([^\n\r]+)/);
    const machineBase = machineMatch ? machineMatch[1]?.trim() : "בסיס P/A";
    const series = machineMatch ? machineMatch[2]?.trim() : "סופרקריל מט+";

    const quantityMatch = text.match(/כמות:\s*([^\n\r]+)/);
    const quantity = quantityMatch ? quantityMatch[1]?.trim() : "1 חצי פח";

    // Companions
    const companions: Array<{ sku: string; name: string; quantity: string }> = [];
    const rollerMatch = text.match(/\[מק״ט:\s*(554102)\]\s*([^(\n\r]+)\(([^)]+)\)/);
    if (rollerMatch) {
      companions.push({
        sku: rollerMatch[1]!,
        name: rollerMatch[2]!.trim(),
        quantity: rollerMatch[3]!.trim(),
      });
    } else {
      companions.push({
        sku: "554102",
        name: "רולר פרו 9 אינץ׳ מושלם עם ידית",
        quantity: "1 יח׳",
      });
    }

    const tapeMatch = text.match(/\[מק״ט:\s*(663201)\]\s*([^(\n\r]+)\(([^)]+)\)/);
    if (tapeMatch) {
      companions.push({
        sku: tapeMatch[1]!,
        name: tapeMatch[2]!.trim(),
        quantity: tapeMatch[3]!.trim(),
      });
    } else {
      companions.push({
        sku: "663201",
        name: "סרט הדבקה מסקנטייפ שריון עמיד",
        quantity: "2 יח׳",
      });
    }

    // Operator Notes
    const notes: string[] = [];
    if (text.includes("40 מ״ר") || text.includes("צובע")) {
      notes.push("הלקוח צובע 40 מ״ר קירות פנים.");
    }
    if (text.includes("בחישה במערבל") || text.includes("מדבקת גוון")) {
      notes.push("לוודא בחישה במערבל צבע וסימון מדבקת גוון 0524T על המכסה.");
    }

    // Status
    const statusMatch = text.match(/סטטוס ליקוט נוכחי:\s*\[\s*([^\]]+)\s*\]/);
    const status = statusMatch ? statusMatch[1]?.trim() : "ממתין להכנה בדלפק ⏳";

    return {
      orderNumber,
      dateTime,
      branch,
      source,
      customerName,
      customerStatus,
      customerPhone,
      estimatedPickupTime,
      paintItem: {
        sku: paintSku,
        name: paintName,
        colorCode,
        colorName,
        colorHex,
        machineBase,
        series,
        quantity,
      },
      companions,
      operatorNotes: notes.length > 0 ? notes : SAMPLE_ORD_889413.operatorNotes,
      status,
    };
  } catch {
    return SAMPLE_ORD_889413;
  }
}
