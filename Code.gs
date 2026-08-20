// ─────────────────────────────────────────────────────────────
// Code.gs — Google Apps Script for NourishSync
//
// UPDATES IN THIS VERSION:
//   1. All timestamps saved in Pacific Time not UTC
//   2. New getDateEntry function — returns saved data for a
//      specific date so the web app can pre-fill the form
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────

var APP_PASSWORD = "NourishSync@123";
var SHEET_NAME   = "NourishSync";

// Timezone for all timestamps saved to the sheet
// Change this if you move to a different timezone
// Full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
var TIMEZONE = "America/Los_Angeles";   // Pacific Time


// ─────────────────────────────────────────────────────────────
// doPost — Main entry point for write requests
// ─────────────────────────────────────────────────────────────

function doPost(e) {

  try {

    var data = JSON.parse(e.postData.contents);

    // Password check
    if (!data.password || data.password !== APP_PASSWORD) {
      return sendResponse(false, "Unauthorised request rejected.");
    }

    var type        = data.type;
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    if      (type === "daily_log")    saveDailyLog(spreadsheet, data);
    else if (type === "supplements")  saveSupplements(spreadsheet, data);
    else if (type === "sleep")        saveSleep(spreadsheet, data);
    else if (type === "blood_markers")saveBloodMarkers(spreadsheet, data);
    else if (type === "apple_health") saveAppleHealth(spreadsheet, data);
    else return sendResponse(false, "Unknown data type: " + type);

    return sendResponse(true, "Saved successfully");

  } catch (error) {
    return sendResponse(false, "Error: " + error.message);
  }
}


// ─────────────────────────────────────────────────────────────
// doGet — Handles read requests from the web app
//
// Now handles a new request type: "date_entry"
// This is what the web app calls on load to pre-fill the form
// with whatever was already saved for today.
//
// Called with: ?type=date_entry&date=2026-08-19&password=xxx
// ─────────────────────────────────────────────────────────────

function doGet(e) {

  try {

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

    } else if (type === "date_entry") {
      // New — returns all saved data for a specific date
      // Used by form.js to pre-fill the form on app load
      var date = e.parameter.date;
      return getDateEntry(spreadsheet, date);

    } else {
      return sendResponse(false, "Unknown request type: " + type);
    }

  } catch (error) {
    return sendResponse(false, "Error: " + error.message);
  }
}


// ─────────────────────────────────────────────────────────────
// getDateEntry
// Returns all saved data for a specific date.
// Reads daily_log, supplements and sleep tabs.
// Returns a combined object the web app uses to pre-fill form.
//
// If no entry exists for that date — returns empty object
// so the form stays blank (first entry of the day).
// ─────────────────────────────────────────────────────────────

function getDateEntry(spreadsheet, date) {

  // ── Daily log ─────────────────────────────────────────────
  var dailySheet  = spreadsheet.getSheetByName("daily_log");
  var dailyRowNum = findRowByDate(dailySheet, date);
  var dailyEntry  = {};

  if (dailyRowNum) {
    // Row found — read all columns into an object
    var dailyRow = dailySheet.getRange(dailyRowNum, 1, 1, 9).getValues()[0];
    dailyEntry = {
      date:                formatDate(new Date(dailyRow[0])),
      workout:             dailyRow[1],
      walk:                dailyRow[2],
      studies:             dailyRow[3],
      difficult_day:       dailyRow[4],
      outside_food:        dailyRow[5],
      outside_food_detail: dailyRow[6],
      food_log:            dailyRow[7]
    };
  }

  // ── Supplements ───────────────────────────────────────────
  var suppSheet = spreadsheet.getSheetByName("supplements");
  var suppData  = suppSheet.getDataRange().getValues();
  var supplements = {};

  // Loop through all supplement rows and find ones for this date
  for (var i = 1; i < suppData.length; i++) {
    var rowDate = formatDate(new Date(suppData[i][0]));
    if (rowDate === date) {
      // Store as an object keyed by supplement name
      // e.g. { "Iron": "Yes", "B12": "No" }
      supplements[suppData[i][1]] = suppData[i][2];
    }
  }

  // ── Sleep ─────────────────────────────────────────────────
  var sleepSheet  = spreadsheet.getSheetByName("sleep");
  var sleepRowNum = findRowByDateAndSource(sleepSheet, date, "manual");
  var sleepEntry  = {};

  if (sleepRowNum) {
    var sleepRow = sleepSheet.getRange(sleepRowNum, 1, 1, 6).getValues()[0];
    sleepEntry = {
      bedtime:     sleepRow[1],
      wake_time:   sleepRow[2],
      total_hours: sleepRow[3]
    };
  }

  // ── Combine and return ────────────────────────────────────
  var result = {
    found:       dailyRowNum ? true : false,  // did we find anything?
    daily:       dailyEntry,
    supplements: supplements,
    sleep:       sleepEntry
  };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


// ─────────────────────────────────────────────────────────────
// saveDailyLog
// Saves one row into the daily_log tab.
// Timestamp saved in Pacific Time.
// ─────────────────────────────────────────────────────────────

function saveDailyLog(spreadsheet, data) {

  var sheet       = spreadsheet.getSheetByName("daily_log");
  var existingRow = findRowByDate(sheet, data.date);

  var row = [
    data.date,
    data.workout             || "No",
    data.walk                || "No",
    data.studies             || "No",
    data.difficult_day       || "No",
    data.outside_food        || "No",
    data.outside_food_detail || "",
    data.food_log            || "",
    getPacificTimestamp()        // Pacific Time timestamp
  ];

  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}


// ─────────────────────────────────────────────────────────────
// saveSupplements
// ─────────────────────────────────────────────────────────────

function saveSupplements(spreadsheet, data) {

  var sheet     = spreadsheet.getSheetByName("supplements");
  var timestamp = getPacificTimestamp();

  data.supplements.forEach(function(supplement) {

    var existingRow = findRowByDateAndName(
      sheet, data.date, supplement.name
    );

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
// ─────────────────────────────────────────────────────────────

function saveSleep(spreadsheet, data) {

  var sheet       = spreadsheet.getSheetByName("sleep");
  var existingRow = findRowByDateAndSource(sheet, data.date, "manual");

  var row = [
    data.date,
    data.bedtime     || "",
    data.wake_time   || "",
    data.total_hours || "",
    data.source      || "manual",
    getPacificTimestamp()
  ];

  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}


// ─────────────────────────────────────────────────────────────
// saveBloodMarkers
// ─────────────────────────────────────────────────────────────

function saveBloodMarkers(spreadsheet, data) {

  var sheet           = spreadsheet.getSheetByName("blood_markers");
  var uploadTimestamp = getPacificTimestamp();

  data.markers.forEach(function(marker) {
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
    sheet.appendRow(row);
  });
}


// ─────────────────────────────────────────────────────────────
// saveAppleHealth
// ─────────────────────────────────────────────────────────────

function saveAppleHealth(spreadsheet, data) {

  var sheet           = spreadsheet.getSheetByName("apple_health");
  var importTimestamp = getPacificTimestamp();

  data.entries.forEach(function(entry) {

    var existingRow = findRowByDateAndType(sheet, entry.date, entry.type);

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
// ─────────────────────────────────────────────────────────────

function getSupplementConfig(spreadsheet) {

  var sheet       = spreadsheet.getSheetByName("config_supplements");
  var rows        = sheet.getDataRange().getValues();
  var supplements = [];

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
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
// ─────────────────────────────────────────────────────────────

function getWeeklySummary(spreadsheet) {

  var today        = new Date();
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
// ─────────────────────────────────────────────────────────────

// getPacificTimestamp
// Returns current time as a readable string in Pacific Time.
// e.g. "2026-08-19 11:18 PM PDT"
// Used for all submitted_at and imported_at columns.
function getPacificTimestamp() {
  return Utilities.formatDate(
    new Date(),
    TIMEZONE,
    "yyyy-MM-dd hh:mm a z"
  );
}

function findRowByDate(sheet, date) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (formatDate(new Date(data[i][0])) === date) return i + 1;
  }
  return null;
}

function findRowByDateAndName(sheet, date, name) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (formatDate(new Date(data[i][0])) === date &&
        data[i][1] === name) return i + 1;
  }
  return null;
}

function findRowByDateAndSource(sheet, date, source) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (formatDate(new Date(data[i][0])) === date &&
        data[i][4] === source) return i + 1;
  }
  return null;
}

function findRowByDateAndType(sheet, date, type) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (formatDate(new Date(data[i][0])) === date &&
        data[i][1] === type) return i + 1;
  }
  return null;
}

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

function filterByDateRange(data, startDate, endDate) {
  return data.filter(function(row) {
    var rowDate = new Date(row.date);
    return rowDate >= startDate && rowDate <= endDate;
  });
}

function formatDate(date) {
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, "0");
  var d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

function sendResponse(success, message) {
  var response = { success: success, message: message };
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
