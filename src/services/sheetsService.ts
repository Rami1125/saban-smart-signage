// ============================================================================
// Service: Sheets Service — Write Operations via Apps Script Web App
// Version: 3.0.0
// ============================================================================

const APPS_SCRIPT_URL =
  process.env.VITE_APPS_SCRIPT_WEBAPP_URL ||
  "https://script.google.com/macros/s/AKfycbz_saban_placeholder/exec";

export interface SyncOrderPayload {
  orderId: string;
  clientNumber?: string;
  clientName: string;
  originWarehouse: string;
  destinationAddress: string;
  items: unknown[];
  bigBagDeposits?: number;
  palletDeposits?: number;
  assignedDriver?: string;
  status: string;
  wazeLink?: string;
}

export async function appendOrderToSheet(order: SyncOrderPayload): Promise<boolean> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "append_order",
        order,
      }),
    });
    const result = await response.json();
    return result.status === "success";
  } catch (err) {
    console.error("Failed to append order to Google Sheets:", err);
    return false;
  }
}

export async function updateOrderStatusInSheet(
  orderId: string,
  status: string,
  note?: string,
): Promise<boolean> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_status",
        orderId,
        status,
        note,
      }),
    });
    const result = await response.json();
    return result.status === "success";
  } catch (err) {
    console.error("Failed to update status in Google Sheets:", err);
    return false;
  }
}
