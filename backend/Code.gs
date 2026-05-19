/**
 * QR Logger — Google Apps Script Backend
 * =========================================
 * Deployed as a Google Apps Script Web App.
 * Receives POST requests from the QR Generator frontend
 * and appends a new row to the active Google Sheet.
 *
 * HOW TO DEPLOY:
 *   1. Open Google Sheets → Extensions → Apps Script
 *   2. Paste this entire file into the editor
 *   3. Click Deploy → New Deployment → Web App
 *   4. Set "Execute as" = Me, "Who has access" = Anyone
 *   5. Click Deploy and copy the Web App URL
 *   6. Paste the URL into the frontend's "Google Sheets Web App URL" field
 */

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SHEET_NAME = "QR_Log";          // Name of the sheet tab to write to
const MAX_CONTENT_LENGTH = 500;       // Truncate very long content strings

// ─── SETUP: createHeaders() ───────────────────────────────────────────────────
// Run this function ONCE manually to set up the sheet with column headers.

function createHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  const headers = [
    "Row #",
    "Timestamp (ISO)",
    "Local Date",
    "Local Time",
    "Label",
    "Category",
    "Content",
    "Content Length",
    "QR Size (px)",
    "Error Correction",
    "IP / Origin",
    "Status"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Style header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#0d0d0f");
  headerRange.setFontColor("#00e5a0");
  headerRange.setFontWeight("bold");
  headerRange.setFontFamily("Courier New");

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);

  Logger.log("Headers created successfully on sheet: " + SHEET_NAME);
}


// ─── HANDLE GET (health check / CORS preflight) ───────────────────────────────

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "ok",
      message: "QR Logger Web App is running.",
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ─── HANDLE POST (main logger) ────────────────────────────────────────────────

function doPost(e) {
  try {
    // Parse incoming JSON body
    const raw = e.postData ? e.postData.contents : "{}";
    const data = JSON.parse(raw);

    // Extract fields with safe fallbacks
    const timestamp       = data.timestamp       || new Date().toISOString();
    const label           = sanitize(data.label)           || "Untitled";
    const category        = sanitize(data.category)        || "Other";
    const content         = sanitize(data.content, MAX_CONTENT_LENGTH) || "";
    const qrSize          = parseInt(data.size)            || 220;
    const errorCorrection = sanitize(data.errorCorrection) || "M";

    // Derived fields
    const dt         = new Date(timestamp);
    const localDate  = formatDate(dt);
    const localTime  = formatTime(dt);
    const contentLen = content.length;
    const origin     = e.parameter?.origin || "web";

    // Get or create the target sheet
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let sheet   = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      createHeaders(); // Auto-create headers if sheet is brand new
    }

    // Determine next row number (skip header row)
    const lastRow  = sheet.getLastRow();
    const rowNum   = lastRow; // row 1 = headers, so first data row = 2 → rowNum = lastRow

    // Build the row array
    const newRow = [
      rowNum,           // Row #
      timestamp,        // Timestamp (ISO)
      localDate,        // Local Date
      localTime,        // Local Time
      label,            // Label
      category,         // Category
      content,          // Content
      contentLen,       // Content Length
      qrSize,           // QR Size
      errorCorrection,  // Error Correction Level
      origin,           // Origin
      "SUCCESS"         // Status
    ];

    // Append to sheet
    sheet.appendRow(newRow);

    // Auto-resize columns occasionally (every 10 rows)
    if (rowNum % 10 === 0) {
      sheet.autoResizeColumns(1, newRow.length);
    }

    // Return success response
    return buildResponse({ status: "success", message: "Row logged.", row: rowNum + 1 });

  } catch (err) {
    Logger.log("Error in doPost: " + err.toString());
    return buildResponse({ status: "error", message: err.toString() }, 500);
  }
}


// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Sanitize a string value for safe sheet storage.
 * @param {any} val - Input value
 * @param {number} maxLen - Optional max length
 * @returns {string}
 */
function sanitize(val, maxLen) {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();
  // Strip potential formula injections
  if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
    str = "'" + str;
  }
  if (maxLen && str.length > maxLen) {
    str = str.substring(0, maxLen) + "...[truncated]";
  }
  return str;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(dt) {
  return dt.getFullYear()
    + "-" + pad(dt.getMonth() + 1)
    + "-" + pad(dt.getDate());
}

/**
 * Format time as HH:MM:SS
 */
function formatTime(dt) {
  return pad(dt.getHours()) + ":" + pad(dt.getMinutes()) + ":" + pad(dt.getSeconds());
}

/**
 * Zero-pad single digits
 */
function pad(n) {
  return n < 10 ? "0" + n : String(n);
}

/**
 * Build a JSON ContentService response
 */
function buildResponse(obj, code) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
