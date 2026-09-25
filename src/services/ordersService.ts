// ============================================================================
// Service: Orders Service — Direct Google Sheets CSV (GViz API) without CORS
// Version: 3.0.0
// ============================================================================

import { DeliveryOrder } from "@/types";

const SPREADSHEET_ID = "1Ie7gKql_EDdrIN9HqunJc9Ey5k0WXXfPRxs0Vp1Bs2c";

export function getSheetCsvUrl(sheetName: string): string {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName,
  )}`;
}

export function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentField += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) rows.push(currentRow);
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) rows.push(currentRow);
  }

  return rows;
}

export async function fetchSheetOrders(sheetName: string = "הזמנות"): Promise<DeliveryOrder[]> {
  const url = getSheetCsvUrl(sheetName);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch orders from sheet: ${response.statusText}`);
  }

  const csvText = await response.text();
  const rows = parseCsv(csvText);
  if (rows.length <= 1) return [];

  const orders: DeliveryOrder[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 4) continue;

    orders.push({
      orderId: row[1] || `ORD_${i}`,
      clientNumber: row[2] || "",
      clientName: row[3] || "",
      phone: row[4] || "",
      destinationAddress: row[5] || "",
      items: [],
      bigBagDeposits: Number(row[7]) || 0,
      palletDeposits: Number(row[8]) || 0,
      deliveryType: "SELF_PICKUP",
      deliverySku: "818050",
      assignedDriver: (row[9] as DeliveryOrder["assignedDriver"]) || "איסוף עצמי",
      status: (row[10] as DeliveryOrder["status"]) || "מוכן בדלפק",
      wazeLink: row[11] || "",
      createdTime: row[0] || new Date().toISOString(),
    });
  }

  return orders;
}
