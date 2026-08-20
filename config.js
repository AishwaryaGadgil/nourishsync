// ─────────────────────────────────────────────────────────────
// config.js — Your personal settings for NourishSync
//
// This is the ONLY file you need to edit yourself.
// Everything else in the app reads from this file.
//
// HOW TO MAKE CHANGES:
//   - Add a supplement → add a new item to the SUPPLEMENTS list
//   - Turn off Studies → set SHOW_STUDIES to false
//   - Change B12 day  → update scheduled_days for B12
//   - Change password → update APP_PASSWORD here AND in Code.gs
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// YOUR NAME
// Appears at the top of the app as your avatar initial
// ─────────────────────────────────────────────────────────────

var USER_NAME = "Priya";


// ─────────────────────────────────────────────────────────────
// YOUR WEB APP URL
// Paste your Google Apps Script Web App URL here.
// It looks like: https://script.google.com/macros/s/ABC.../exec
// ─────────────────────────────────────────────────────────────

var SHEET_URL = "PASTE_YOUR_WEB_APP_URL_HERE";


// ─────────────────────────────────────────────────────────────
// APP PASSWORD
// This password is sent with every save request.
// Code.gs checks it and rejects anything that doesn't match.
// This protects your Google Sheet from unauthorised access.
//
// IMPORTANT: This must match APP_PASSWORD in Code.gs exactly.
// If you change it here you must also change it in Code.gs.
// Choose something personal that only you know.
// ─────────────────────────────────────────────────────────────

var APP_PASSWORD = "nourishsync2026";


// ─────────────────────────────────────────────────────────────
// STUDIES TRACKING
// Set to true  → Studies toggle shows in the form
// Set to false → Studies toggle hidden (history never deleted)
// ─────────────────────────────────────────────────────────────

var SHOW_STUDIES = true;


// ─────────────────────────────────────────────────────────────
// SUPPLEMENTS
// Each supplement has these fields:
//
//   name          → What it's called in the form and sheet
//   frequency     → "daily" / "weekly" / "monthly"
//   scheduled_days→ "all"       = every day
//                   "wednesday" = every Wednesday
//                   "1,15"      = 1st and 15th of month
//   notes         → Small hint shown under the supplement name
//
// TO ADD A NEW SUPPLEMENT:
//   Copy one block below, paste before the last ] and fill in.
//   Make sure to add a comma after the } of the previous item.
//
// TO REMOVE A SUPPLEMENT:
//   Delete its block — or just stop logging it.
//   Your history in Google Sheets is never deleted.
// ─────────────────────────────────────────────────────────────

var SUPPLEMENTS = [

  {
    name:           "Iron",
    frequency:      "daily",
    scheduled_days: "all",
    notes:          "Ferrous sulphate — take on empty stomach"
  },

  {
    name:           "Vitamin D3",
    frequency:      "monthly",
    scheduled_days: "1,15",
    notes:          "Take with food — compensate if missed"
  },

  {
    name:           "B12",
    frequency:      "weekly",
    scheduled_days: "wednesday",
    notes:          "Compensate if missed"
  },

  {
    name:           "Khajur",
    frequency:      "daily",
    scheduled_days: "all",
    notes:          "Dates — daily habit"
  }

];


// ─────────────────────────────────────────────────────────────
// SLEEP DROPDOWN SETTINGS
// Controls the time range in bedtime and wake time dropdowns.
// Times are in 24-hour format (18 = 6pm, 4 = 4am).
// Interval is in minutes — 15 means every 15 minutes.
// ─────────────────────────────────────────────────────────────

var SLEEP_SETTINGS = {
  bedtime_start:  18,   // Bedtime dropdown starts at 6:00 PM
  bedtime_end:    4,    // Bedtime dropdown ends at 4:00 AM
  waketime_start: 4,    // Wake time dropdown starts at 4:00 AM
  waketime_end:   13,   // Wake time dropdown ends at 1:00 PM
  interval_mins:  15    // Every 15 minutes like Teams
};


// ─────────────────────────────────────────────────────────────
// GOOD SLEEP THRESHOLD
// How many hours counts as a good night for you.
// Green = at or above this, Amber = within 1hr below, Red = more
// ─────────────────────────────────────────────────────────────

var GOOD_SLEEP_HOURS = 7;


// ─────────────────────────────────────────────────────────────
// DO NOT EDIT BELOW THIS LINE
// These checks warn you in the browser console if something
// important has not been configured yet.
// ─────────────────────────────────────────────────────────────

if (SHEET_URL === "https://script.google.com/macros/s/AKfycby7sn6RZkqYzSZ2IDbvgyPQ5o4wJVIc0SdaKpj9MVf9gx3huIk6vcRjvM5ZZXYtcAWN/exec") {
  console.warn(
    "NourishSync: Please paste your Google Apps Script URL " +
    "into SHEET_URL in config.js"
  );
}

if (APP_PASSWORD === "NourishSync@123") {
  console.warn(
    "NourishSync: Remember to change APP_PASSWORD to something " +
    "personal in both config.js and Code.gs"
  );
}
