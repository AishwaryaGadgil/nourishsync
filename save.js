// ─────────────────────────────────────────────────────────────
// save.js — Save Form Data to Google Sheets
//
// This file has one job:
//   When you tap "Save", collect every value from the form
//   and send it to Google Sheets via the Apps Script Web App
//   URL defined in config.js
//
// KEY BEHAVIOUR — partial saves and multiple saves per day:
//   You can save the form as many times as you want in a day.
//   Each save updates the existing row for that date in Sheets.
//   Nothing is duplicated. The latest values always win.
//
// SECURITY:
//   Every request includes APP_PASSWORD from config.js.
//   Code.gs rejects any request without the correct password.
//
// It sends three separate requests — one per sheet tab:
//   1. daily_log   — habits, food, outside food
//   2. supplements — one entry per supplement
//   3. sleep       — bedtime, wake time, total hours
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// saveForm
// Main function — called when user taps the Save button.
// Collects all form values and sends three requests to Sheets.
// No required fields — everything is optional.
// You can save with just one thing filled and come back later.
// ─────────────────────────────────────────────────────────────

function saveForm() {

  // ── Step 1: Get the date being logged ───────────────────────
  // getFormattedDate() is in datepicker.js — returns "2026-08-19"
  var date = getFormattedDate();


  // ── Step 2: Collect all form values ─────────────────────────
  // No validation — all fields are optional.
  // Empty food log is fine — you can add it later.

  // Read food log — empty string if nothing entered yet
  var foodEl   = document.getElementById("food-log");
  var foodText = foodEl ? foodEl.value.trim() : "";

  // Habits — read each toggle
  // getToggleValue() from toggles.js returns "Yes" or "No"
  // APP_PASSWORD included in every request for security
  var dailyLogData = {
    type:                "daily_log",
    password:            APP_PASSWORD,          // security check
    date:                date,
    workout:             getToggleValue("toggle-workout"),
    walk:                getToggleValue("toggle-walk"),
    studies:             SHOW_STUDIES
                           ? getToggleValue("toggle-studies")
                           : "Not tracked",
    difficult_day:       getToggleValue("toggle-difficult-day"),
    outside_food:        getToggleValue("toggle-outside-food"),
    outside_food_detail: getOutsideFoodDetail(),  // from toggles.js
    food_log:            foodText
  };

  // Supplements — reads all toggles and schedule info
  // getSupplementValues() from toggles.js returns an array
  var supplementData = {
    type:        "supplements",
    password:    APP_PASSWORD,                  // security check
    date:        date,
    supplements: getSupplementValues()          // from toggles.js
  };

  // Sleep — bedtime, wake time and total hours
  // getSleepValues() from sleep.js returns an object
  var sleepValues = getSleepValues();           // from sleep.js
  var sleepData = {
    type:        "sleep",
    password:    APP_PASSWORD,                  // security check
    date:        date,
    bedtime:     sleepValues.bedtime,
    wake_time:   sleepValues.wake_time,
    total_hours: sleepValues.total_hours,
    source:      "manual"
  };


  // ── Step 3: Disable save button while saving ─────────────────
  // Prevents double-tapping the save button accidentally
  var saveBtn = document.getElementById("save-btn");
  if (saveBtn) {
    saveBtn.disabled    = true;
    saveBtn.textContent = "Saving...";
  }

  // Clear any previous status message before saving
  hideStatus();


  // ── Step 4: Send all three requests to Google Sheets ─────────
  // Sent one after another using .then() chain
  // Code.gs checks the password on each request
  // If a row exists for this date it updates it — no duplicates

  sendToSheet(dailyLogData)
    .then(function() {
      // Daily log saved — now save supplements
      return sendToSheet(supplementData);
    })
    .then(function() {
      // Supplements saved — now save sleep
      return sendToSheet(sleepData);
    })
    .then(function() {

      // ── All three saved successfully ──────────────────────────
      showStatus(
        "Saved for " + formatDateForDisplay(date) +
        ". Come back anytime to add more.",
        "success"
      );

      // Re-enable the save button
      if (saveBtn) {
        saveBtn.disabled    = false;
        saveBtn.textContent = "Save";
      }
    })
    .catch(function(error) {

      // ── Something went wrong ──────────────────────────────────
      showStatus(
        "Could not save. Check your internet connection and try again.",
        "error"
      );

      // Log the actual error to browser console for debugging
      console.error("NourishSync save error:", error);

      // Re-enable the save button so user can try again
      if (saveBtn) {
        saveBtn.disabled    = false;
        saveBtn.textContent = "Save";
      }
    });
}


// ─────────────────────────────────────────────────────────────
// sendToSheet
// Sends one data object to the Google Apps Script Web App.
// Returns a Promise so we can chain multiple sends in order.
//
// The password is already inside the data object —
// Code.gs checks it before doing anything.
// ─────────────────────────────────────────────────────────────

function sendToSheet(data) {

  return new Promise(function(resolve, reject) {

    // Check SHEET_URL is configured in config.js
    if (!SHEET_URL || SHEET_URL === "PASTE_YOUR_WEB_APP_URL_HERE") {
      reject(new Error(
        "SHEET_URL is not set in config.js. " +
        "Please paste your Google Apps Script Web App URL."
      ));
      return;
    }

    // Send data as a POST request using fetch()
    // fetch() is built into all modern browsers — no extra library needed
    fetch(SHEET_URL, {
      method:  "POST",
      headers: { "Content-Type": "text/plain" },

      // Convert data object to JSON string for sending
      // Code.gs uses JSON.parse() to convert it back
      // Password is inside this JSON — checked by Code.gs
      body: JSON.stringify(data)
    })
    .then(function(response) {

      if (!response.ok) {
        throw new Error("Server returned status " + response.status);
      }

      return response.json();
    })
    .then(function(result) {

      if (result.success) {
        resolve(result);
      } else {
        // If Code.gs returns "Unauthorised" the password is wrong
        reject(new Error(result.message || "Unknown error from sheet"));
      }
    })
    .catch(function(error) {
      reject(error);
    });
  });
}


// ─────────────────────────────────────────────────────────────
// formatDateForDisplay
// Converts "2026-08-19" to a readable "19 Aug 2026"
// Used in the success message so it's easy to read.
// ─────────────────────────────────────────────────────────────

function formatDateForDisplay(dateStr) {

  var parts = dateStr.split("-");
  var year  = parts[0];
  var month = parseInt(parts[1]) - 1;
  var day   = parseInt(parts[2]);

  var monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return day + " " + monthNames[month] + " " + year;
}


// ─────────────────────────────────────────────────────────────
// showStatus
// Shows a message below the save button.
// type: "success" → green, "error" → red
// Success messages disappear after 5 seconds automatically.
// ─────────────────────────────────────────────────────────────

function showStatus(message, type) {

  var statusEl = document.getElementById("save-status");
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.classList.remove("success", "error");
  statusEl.classList.add(type);
  statusEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

  if (type === "success") {
    setTimeout(function() { hideStatus(); }, 5000);
  }
}


// ─────────────────────────────────────────────────────────────
// hideStatus
// Hides the status message — display goes to none via style.css
// ─────────────────────────────────────────────────────────────

function hideStatus() {

  var statusEl = document.getElementById("save-status");
  if (!statusEl) return;

  statusEl.classList.remove("success", "error");
  statusEl.textContent = "";
}
