// ─────────────────────────────────────────────────────────────
// Code.gs — Google Apps Script for NourishSync
// This script lives inside your Google Sheet.
// It receives data from your iPhone web app and saves it
// into the correct tab in your sheet.
//
// You never need to edit this file unless you add a new tab.
//
// SECURITY: Every request must include the correct password
// defined in APP_PASSWORD below. Requests without it are
// rejected immediately. Change this to something only you know.
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────

// Your secret password — must match the one in config.js
// Change this to something personal that only you know
// e.g. your pet's name + birth year
var APP_PASSWORD = "NourishSync@123";

// Sheet name — change this if you rename your Google Sheet file
var SHEET_NAME = "NourishSync";


// ─────────────────────────────────────────────────────────────
// doPost — Main entry point for write requests
// Runs automatically when your web app sends data.
// First checks the password — rejects if wrong.
// Then calls the correct save function based on data type.
// ─────────────────────────────────────────────────────────────

function doPost(e) {

  try {

    // Parse the incoming data from the web app
    var data = JSON.parse(e.postData.contents);

    // ── PASSWORD CHECK ────────────────────────────────────────
    // Every request must include the correct password.
    // If password is missing or wrong — reject immediately.
    // This prevents anyone who finds your URL from writing
    // data to your sheet.
    if (!data.password || data.password !== APP_PASSWORD) {
      return sendResponse(false, "Unauthorised request rejected.");
    }

    // Password is correct — proceed with saving
    var type        = data.type;
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    if (type === "daily_log") {
      saveDailyLog(spreadsheet, data);

    } else if (type === "supplements") {
      saveSupplements(spreadsheet, data);

    } else if (type === "sleep") {
      saveSleep(spreadsheet, data);

    } else if (type === "blood_markers") {
      saveBloodMarkers(spreadsheet, data);

    } else if (type === "apple_health") {
      saveAppleHealth(spreadsheet, data);

    } else {
      return sendResponse(false, "Unknown data type: " + type);
    }

    return sendResponse(true, "Saved successfully");

  } catch (error) {
    return sendResponse(false, "Error: " + error.message);
  }
}


// ─────────────────────────────────────────────────────────────
// doGet — Handles read requests from the web app
// When the web app needs to READ data (weekly review,
// supplement config) it sends a GET request here.
// Also password protected.
// ─────────────────────────────────────────────────────────────

function doGet(e) {

  try {

    // ── PASSWORD CHECK ────────────────────────────────────────
    // Read requests also require the password
    // Passed as a URL parameter: ?type=config&password=xxx
    var password = e.parameter.password;

    if (!password || password !== APP_PASSWORD) {
      return sendResponse(false, "Unauthorised request rejected.");
    }

    var type        = e.parameter.type;
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    if (type === "config_supplements") {
      return getSupplementConfig(spreadsheet);

    } else if (type === "weekly_summary") {
      return getWeeklySummary(spreadsheet);

    } else {
      return sendResponse(false, "Unknown request type: " + type);
    }

  } catch (error) {
    return sendResponse(false, "Error: " + error.message);
  }
}


// ─────────────────────────────────────────────────────────────
// saveDailyLog
// Saves one row into the daily_log tab.
// If a row already exists for this date it updates it.
// If not it creates a new row.
//
// Columns saved:
// date | workout | walk | studies | difficult_day |
// outside_food | outside_food_detail | food_log | submitted_at
// ─────────────────────────────────────────────────────────────

function saveDailyLog(spreadsheet, data) {

  var sheet     = spreadsheet.getSheetByName("daily_log");
  var existingRow = findRowByDate(sheet, data.date);

  var row = [
    data.date,
    data.workout              || "No",
    data.walk                 || "No",
    data.studies              || "No",
    data.difficult_day        || "No",
    data.outside_food         || "No",
    data.outside_food_detail  || "",
    data.food_log             || "",
    new Date().toISOString()
  ];

  if (existingRow) {
    // Row exists for this date — update it
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
  } else {
    // No row yet — create a new one
    sheet.appendRow(row);
  }
}


// ─────────────────────────────────────────────────────────────
// saveSupplements
// Saves supplement yes/no entries — one row per supplement.
// Updates existing rows for this date if they exist.
// ─────────────────────────────────────────────────────────────

function saveSupplements(spreadsheet, data) {

  var sheet     = spreadsheet.getSheetByName("supplements");
  var timestamp = new Date().toISOString();

  data.supplements.forEach(function(supplement) {

    var existingRow = findRowByDateAndName(
      sheet,
      data.date,
      supplement.name
    );

    // date | supplement_name | taken | scheduled | compensated | submitted_at
    var row = [
      data.date,
      supplement.name,
      supplement.taken       || "No",
      supplement.scheduled   || "No",
      supplement.compensated || "No",
      timestamp
    ];

    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
  });
}


// ─────────────────────────────────────────────────────────────
// saveSleep
// Saves one sleep entry for the given date.
// Updates if entry already exists for that date and source.
// ─────────────────────────────────────────────────────────────

function saveSleep(spreadsheet, data) {

  var sheet       = spreadsheet.getSheetByName("sleep");
  var existingRow = findRowByDateAndSource(sheet, data.date, "manual");

  // date | bedtime | wake_time | total_hours | source | submitted_at
  var row = [
    data.date,
    data.bedtime     || "",
    data.wake_time   || "",
    data.total_hours || "",
    data.source      || "manual",
    new Date().toISOString()
  ];

  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}


// ─────────────────────────────────────────────────────────────
// saveBloodMarkers
// Saves blood test results — one row per marker.
// Blood markers are never updated — each upload is a new test.
// ─────────────────────────────────────────────────────────────

function saveBloodMarkers(spreadsheet, data) {

  var sheet           = spreadsheet.getSheetByName("blood_markers");
  var uploadTimestamp = new Date().toISOString();

  data.markers.forEach(function(marker) {

    // test_date | upload_date | marker_name | value | unit |
    // reference_min | reference_max | status
    var row = [
      data.test_date,
      uploadTimestamp,
      marker.name    || "",
      marker.value   || "",
      marker.unit    || "",
      marker.ref_min || "",
      marker.ref_max || "",
      marker.status  || ""
    ];

    // Always append — never update blood marker history
    sheet.appendRow(row);
  });
}


// ─────────────────────────────────────────────────────────────
// saveAppleHealth
// Saves data pulled from Apple Health XML export.
// Updates existing entries if same date + type already exists.
// ─────────────────────────────────────────────────────────────

function saveAppleHealth(spreadsheet, data) {

  var sheet           = spreadsheet.getSheetByName("apple_health");
  var importTimestamp = new Date().toISOString();

  data.entries.forEach(function(entry) {

    var existingRow = findRowByDateAndType(
      sheet,
      entry.date,
      entry.type
    );

    // date | data_type | value | unit | source | imported_at
    var row = [
      entry.date,
      entry.type   || "",
      entry.value  || "",
      entry.unit   || "",
      entry.source || "Apple Health",
      importTimestamp
    ];

    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
  });
}


// ─────────────────────────────────────────────────────────────
// getSupplementConfig
// Returns your supplement config as JSON for the web app.
// Called on app load so the form knows which supplements to show.
// ─────────────────────────────────────────────────────────────

function getSupplementConfig(spreadsheet) {

  var sheet       = spreadsheet.getSheetByName("config_supplements");
  var rows        = sheet.getDataRange().getValues();
  var supplements = [];

  // Start from row index 1 — skip the header row at index 0
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];

    // Only return active supplements (column D = "Yes")
    if (row[3] === "Yes") {
      supplements.push({
        name:           row[0],
        frequency:      row[1],
        scheduled_days: row[2],
        active:         row[3],
        notes:          row[4]
      });
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ supplements: supplements }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ─────────────────────────────────────────────────────────────
// getWeeklySummary
// Reads last 7 days of data from all tabs.
// Returns combined summary for the weekly review page.
// Built later once you have data to show.
// ─────────────────────────────────────────────────────────────

function getWeeklySummary(spreadsheet) {

  var today       = new Date();
  var sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  var summary = {
    daily_log:    filterByDateRange(
                    getSheetData(spreadsheet, "daily_log"),
                    sevenDaysAgo, today),
    supplements:  filterByDateRange(
                    getSheetData(spreadsheet, "supplements"),
                    sevenDaysAgo, today),
    sleep:        filterByDateRange(
                    getSheetData(spreadsheet, "sleep"),
                    sevenDaysAgo, today),
    apple_health: filterByDateRange(
                    getSheetData(spreadsheet, "apple_health"),
                    sevenDaysAgo, today)
  };

  return ContentService
    .createTextOutput(JSON.stringify(summary))
    .setMimeType(ContentService.MimeType.JSON);
}


// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// Small utilities used by the main functions above.
// ─────────────────────────────────────────────────────────────


// Find a row where column A matches the given date string.
// Returns the row number (1-based) or null if not found.
function findRowByDate(sheet, date) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (formatDate(new Date(data[i][0])) === date) {
      return i + 1;
    }
  }
  return null;
}


// Find a row where column A = date AND column B = name.
// Used for supplements — date + supplement name combo.
function findRowByDateAndName(sheet, date, name) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (formatDate(new Date(data[i][0])) === date &&
        data[i][1] === name) {
      return i + 1;
    }
  }
  return null;
}


// Find a row where column A = date AND column E = source.
// Used for sleep — avoids overwriting Apple Health with manual.
function findRowByDateAndSource(sheet, date, source) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (formatDate(new Date(data[i][0])) === date &&
        data[i][4] === source) {
      return i + 1;
    }
  }
  return null;
}


// Find a row where column A = date AND column B = data type.
// Used for Apple Health — date + type like weight, steps.
function findRowByDateAndType(sheet, date, type) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (formatDate(new Date(data[i][0])) === date &&
        data[i][1] === type) {
      return i + 1;
    }
  }
  return null;
}


// Read all rows from a sheet and return as array of objects.
// First row treated as column headers.
function getSheetData(spreadsheet, sheetName) {
  var sheet   = spreadsheet.getSheetByName(sheetName);
  var rows    = sheet.getDataRange().getValues();
  var headers = rows[0];
  var result  = [];

  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = rows[i][index];
    });
    result.push(obj);
  }

  return result;
}


// Filter rows to only those within the given date range.
function filterByDateRange(data, startDate, endDate) {
  return data.filter(function(row) {
    var rowDate = new Date(row.date);
    return rowDate >= startDate && rowDate <= endDate;
  });
}


// Format a Date object as YYYY-MM-DD string.
// e.g. 2026-08-19
function formatDate(date) {
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, "0");
  var d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}


// Send a standard JSON response back to the web app.
function sendResponse(success, message) {
  var response = { success: success, message: message };
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
