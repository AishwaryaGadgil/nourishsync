// ─────────────────────────────────────────────────────────────
// config.js — Your personal settings for NourishSync
//
// SAFE TO BE PUBLIC ON GITHUB — no sensitive data here.
//
// SHEET_URL and APP_PASSWORD are intentionally left empty.
// They are stored securely on your iPhone via the setup screen
// in localStorage — never on GitHub.
//
// HOW TO MAKE CHANGES:
//   - Add a supplement → add a new item to SUPPLEMENTS list
//   - Turn off Studies → set SHOW_STUDIES to false
//   - Change B12 day  → update scheduled_days for B12
//   - Update URL or password → tap gear icon in the app
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// YOUR NAME
// Appears as your avatar initial in the top bar
// ─────────────────────────────────────────────────────────────

var USER_NAME = "Aishwarya";


// ─────────────────────────────────────────────────────────────
// CREDENTIALS — intentionally empty
// These are set at runtime by setup.js from localStorage.
// Do not paste your actual URL or password here.
// Use the setup screen in the app instead.
// ─────────────────────────────────────────────────────────────

var SHEET_URL    = "";   // set by setup.js from localStorage
var APP_PASSWORD = "";   // set by setup.js from localStorage


// ─────────────────────────────────────────────────────────────
// STUDIES TRACKING
// Set to true  → Studies toggle shows in the form
// Set to false → Studies toggle hidden (history never deleted)
// ─────────────────────────────────────────────────────────────

var SHOW_STUDIES = true;


// ─────────────────────────────────────────────────────────────
// SUPPLEMENTS
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
// ─────────────────────────────────────────────────────────────

var SLEEP_SETTINGS = {
  bedtime_start:  18,
  bedtime_end:    4,
  waketime_start: 4,
  waketime_end:   13,
  interval_mins:  15
};


// ─────────────────────────────────────────────────────────────
// GOOD SLEEP THRESHOLD
// Green = at or above, Amber = within 1hr below, Red = more
// ─────────────────────────────────────────────────────────────

var GOOD_SLEEP_HOURS = 7;
