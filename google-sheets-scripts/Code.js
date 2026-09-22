// ============================================================================
// Google Apps Script: SabanOS Unified Gateway (Web App API)
// Version: 3.0.0
// Deploy as Web App: Execute as Me, Anyone has access (Anonymous)
// ============================================================================

const ACTIVE_SHEET_ID = "1Ie7gKql_EDdrIN9HqunJc9Ey5k0WXXfPRxs0Vp1Bs2c";

function doGet(e) {
  try {
    const action = e.parameter.action || "ping";
    if (action === "ping") {
      return jsonResponse({
        status: "success",
        message: "SabanOS Web App Gateway Active",
        timestamp: new Date().toISOString()
      });
    }
    return jsonResponse({ status: "error", message: "Unknown GET action" }, 400);
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() }, 500);
  }
}

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "Missing POST payload" }, 400);
    }
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const ss = SpreadsheetApp.openById(ACTIVE_SHEET_ID);

    if (action === "append_order") {
      return handleAppendOrder(ss, data.order);
    } else if (action === "update_status") {
      return handleUpdateStatus(ss, data.orderId, data.status, data.note);
    } else if (action === "log_chat") {
      return handleLogChat(ss, data.chat);
    } else {
      return jsonResponse({ status: "error", message: "Unsupported action: " + action }, 400);
    }
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() }, 500);
  }
}

function handleAppendOrder(ss, order) {
  const sheet = ss.getSheetByName("הזמנות") || ss.getSheetByName("🚚_הזמנות_סידור");
  if (!sheet) return jsonResponse({ status: "error", message: "Target sheet not found" }, 404);

  const rowData = [
    new Date(),
    order.orderId || Utilities.getUuid().slice(0, 8),
    order.clientNumber || "",
    order.clientName || "",
    order.originWarehouse || "סניף החרש 4",
    order.destinationAddress || "איסוף עצמי",
    JSON.stringify(order.items || []),
    order.bigBagDeposits || 0,
    order.palletDeposits || 0,
    order.assignedDriver || "איסוף עצמי",
    order.status || "ממתין לליקוט",
    order.wazeLink || ""
  ];

  sheet.appendRow(rowData);
  return jsonResponse({ status: "success", orderId: rowData[1], timestamp: new Date().toISOString() });
}

function handleUpdateStatus(ss, orderId, status, note) {
  const sheet = ss.getSheetByName("הזמנות") || ss.getSheetByName("🚚_הזמנות_סידור");
  if (!sheet) return jsonResponse({ status: "error", message: "Sheet not found" }, 404);

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(orderId)) {
      sheet.getRange(i + 1, 11).setValue(status);
      if (note) sheet.getRange(i + 1, 12).setValue(note);
      return jsonResponse({ status: "success", updatedRow: i + 1, status: status });
    }
  }
  return jsonResponse({ status: "error", message: "Order ID not found: " + orderId }, 404);
}

function handleLogChat(ss, chat) {
  let sheet = ss.getSheetByName("לוג_שיחות") || ss.getSheetByName("לוג_מערכת");
  if (!sheet) {
    sheet = ss.insertSheet("לוג_שיחות");
    sheet.appendRow(["חותמת זמן", "מק\"ט", "שם מוצר", "סניף", "שאילתת לקוח", "תשובת נועה", "כמות", "עלות", "שודר"]);
  }

  sheet.appendRow([
    new Date(),
    chat.sku || "",
    chat.productName || "",
    chat.branch || "",
    chat.question || "",
    chat.answer || "",
    chat.quantity || 0,
    chat.cost || 0,
    chat.dispatched ? "כן" : "לא"
  ]);

  return jsonResponse({ status: "success", loggedAt: new Date().toISOString() });
}

function jsonResponse(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
