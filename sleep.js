// ─────────────────────────────────────────────────────────────
// sleep.js — Sleep Time Dropdowns and Calculation
//
// This file handles everything in the Sleep section:
//   - Building the bedtime dropdown (6pm to 4am)
//   - Building the wake time dropdown (4am to 1pm)
//   - Calculating total sleep hours when either changes
//   - Colour coding the total: green / amber / red
//   - Returning sleep values for save.js to store
//
// All time settings come from SLEEP_SETTINGS in config.js
// so you can adjust the ranges there without touching this file.
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// buildSleepSection
// Creates the full sleep section HTML — two dropdowns and
// the calculated total display — and returns it as a string.
// Called by form.js when building the form.
// ─────────────────────────────────────────────────────────────

function buildSleepSection() {

  return (
    '<div class="section">' +

      // Section header
      '<div class="section-label">Sleep</div>' +

      // Two dropdowns side by side
      '<div class="sleep-row">' +

        // Bedtime dropdown — left column
        '<div class="sleep-field">' +
          '<label for="sleep-bedtime">Bedtime</label>' +
          '<select class="sleep-select" id="sleep-bedtime" ' +
            'onchange="onSleepChange()">' +
          '</select>' +
        '</div>' +

        // Wake time dropdown — right column
        '<div class="sleep-field">' +
          '<label for="sleep-waketime">Wake time</label>' +
          '<select class="sleep-select" id="sleep-waketime" ' +
            'onchange="onSleepChange()">' +
          '</select>' +
        '</div>' +

      '</div>' +

      // Sleep total display — updated automatically
      '<div class="sleep-total">' +
        '<span>&#128336;</span>' +  // Clock emoji
        '<span>Total sleep:</span>' +
        '<span class="sleep-hours" id="sleep-hours-display">—</span>' +
      '</div>' +

    '</div>'
  );
}


// ─────────────────────────────────────────────────────────────
// initialiseSleepDropdowns
// Fills both dropdowns with time options at 15-minute intervals.
// Sets sensible default times — 11pm bedtime, 6:30am wake.
// Must be called AFTER the HTML is inserted into the page
// because it needs the select elements to exist first.
// Called by form.js after building the form HTML.
// ─────────────────────────────────────────────────────────────

function initialiseSleepDropdowns() {

  // Read time range settings from config.js
  var bedStart  = SLEEP_SETTINGS.bedtime_start;   // 18 = 6pm
  var bedEnd    = SLEEP_SETTINGS.bedtime_end;      // 4  = 4am
  var wakeStart = SLEEP_SETTINGS.waketime_start;   // 4  = 4am
  var wakeEnd   = SLEEP_SETTINGS.waketime_end;     // 13 = 1pm
  var interval  = SLEEP_SETTINGS.interval_mins;    // 15 minutes

  // Default selections — 11:00 PM bedtime, 6:30 AM wake time
  var defaultBedHour  = 23;
  var defaultBedMin   = 30;
  var defaultWakeHour = 8;
  var defaultWakeMin  = 0;

  // Fill the bedtime dropdown
  fillTimeDropdown(
    "sleep-bedtime",
    bedStart, bedEnd,
    interval,
    defaultBedHour, defaultBedMin
  );

  // Fill the wake time dropdown
  fillTimeDropdown(
    "sleep-waketime",
    wakeStart, wakeEnd,
    interval,
    defaultWakeHour, defaultWakeMin
  );

  // Calculate and show the total for the default times
  onSleepChange();
}


// ─────────────────────────────────────────────────────────────
// fillTimeDropdown
// Fills a select element with time options at regular intervals.
//
// selectId:    id of the <select> element to fill
// startHour:   hour to start the list at (24-hour format)
// endHour:     hour to end the list at (wraps past midnight)
// intervalMins:how many minutes between each option (15)
// defaultHour: which hour should be pre-selected
// defaultMin:  which minute should be pre-selected
// ─────────────────────────────────────────────────────────────

function fillTimeDropdown(selectId, startHour, endHour,
                          intervalMins, defaultHour, defaultMin) {

  var select = document.getElementById(selectId);
  if (!select) return;

  // Clear any existing options first
  select.innerHTML = "";

  // Start at the given hour and minute 0
  var hour   = startHour;
  var minute = 0;

  // Keep adding options until we reach the end hour
  // maxOptions prevents infinite loop if config values are wrong
  var maxOptions = 200;
  var count = 0;

  while (count < maxOptions) {

    // Format this time as a readable label e.g. "11:00 PM"
    var label = formatTimeLabel(hour, minute);

    // Format as a storable value e.g. "23:00"
    var value = formatTimeValue(hour, minute);

    // Create the option element
    var option = document.createElement("option");
    option.value       = value;
    option.textContent = label;

    // Mark as selected if this matches the default time
    if (hour === defaultHour && minute === defaultMin) {
      option.selected = true;
    }

    select.appendChild(option);

    // Advance to the next time slot
    minute += intervalMins;

    // If minute reaches 60, roll over to next hour
    if (minute >= 60) {
      minute = minute - 60;
      hour   = hour + 1;
    }

    // Handle midnight rollover — 24 becomes 0
    if (hour >= 24) {
      hour = hour - 24;
    }

    // Stop when we reach the end hour at minute 0
    if (hour === endHour && minute === 0) break;

    count++;
  }
}


// ─────────────────────────────────────────────────────────────
// onSleepChange
// Called automatically whenever bedtime or wake time changes.
// Reads both selected times, calculates the difference,
// and updates the sleep total display with colour coding.
// ─────────────────────────────────────────────────────────────

function onSleepChange() {

  var bedSelect  = document.getElementById("sleep-bedtime");
  var wakeSelect = document.getElementById("sleep-waketime");
  var display    = document.getElementById("sleep-hours-display");

  if (!bedSelect || !wakeSelect || !display) return;

  // Convert selected times to total minutes since midnight
  var bedMins  = timeValueToMinutes(bedSelect.value);
  var wakeMins = timeValueToMinutes(wakeSelect.value);

  // If wake time is earlier than bedtime it means we crossed midnight
  // e.g. bed 11pm (23:00 = 1380 mins) wake 6am (360 mins)
  // Add 24 hours to wake time to get correct difference
  if (wakeMins <= bedMins) {
    wakeMins += 24 * 60;   // Add 24 hours in minutes
  }

  // Calculate total sleep in minutes
  var totalMins  = wakeMins - bedMins;

  // Convert to hours and remaining minutes
  var hours      = Math.floor(totalMins / 60);
  var mins       = totalMins % 60;

  // Build the display text e.g. "7h 30m" or "6h"
  var displayText = hours + "h";
  if (mins > 0) {
    displayText += " " + mins + "m";
  }

  // Update the display text
  display.textContent = displayText;

  // Apply colour coding based on GOOD_SLEEP_HOURS from config.js
  display.className = "sleep-hours";   // Reset classes first

  var totalHours = totalMins / 60;

  if (totalHours >= GOOD_SLEEP_HOURS) {
    // At or above target — green
    display.classList.add("sleep-good");

  } else if (totalHours >= GOOD_SLEEP_HOURS - 1) {
    // Within 1 hour below target — amber
    display.classList.add("sleep-ok");

  } else {
    // More than 1 hour below target — red
    display.classList.add("sleep-low");
  }
}


// ─────────────────────────────────────────────────────────────
// getSleepValues
// Returns the current sleep selections as an object.
// Called by save.js when collecting all form data to save.
//
// Returns:
//   bedtime:     e.g. "11:00 PM"
//   wake_time:   e.g. "6:30 AM"
//   total_hours: e.g. 7.5 (as a decimal number)
// ─────────────────────────────────────────────────────────────

function getSleepValues() {

  var bedSelect  = document.getElementById("sleep-bedtime");
  var wakeSelect = document.getElementById("sleep-waketime");

  // Return empty values if dropdowns don't exist yet
  if (!bedSelect || !wakeSelect) {
    return { bedtime: "", wake_time: "", total_hours: "" };
  }

  // Get the readable label for bedtime e.g. "11:00 PM"
  var bedLabel  = bedSelect.options[bedSelect.selectedIndex].text;
  var wakeLabel = wakeSelect.options[wakeSelect.selectedIndex].text;

  // Calculate total hours as a decimal for easy analysis
  // e.g. 7 hours 30 mins = 7.5
  var bedMins  = timeValueToMinutes(bedSelect.value);
  var wakeMins = timeValueToMinutes(wakeSelect.value);

  if (wakeMins <= bedMins) {
    wakeMins += 24 * 60;
  }

  var totalMins  = wakeMins - bedMins;
  var totalHours = Math.round((totalMins / 60) * 10) / 10; // 1 decimal place

  return {
    bedtime:     bedLabel,
    wake_time:   wakeLabel,
    total_hours: totalHours
  };
}


// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// Small utilities used by the functions above.
// ─────────────────────────────────────────────────────────────


// formatTimeLabel
// Converts 24-hour hour and minute to a 12-hour readable label.
// e.g. hour=23, minute=0  → "11:00 PM"
//      hour=6,  minute=30 → "6:30 AM"
function formatTimeLabel(hour, minute) {

  var period = (hour < 12 || hour === 24) ? "AM" : "PM";

  // Convert to 12-hour format
  var hour12 = hour % 12;
  if (hour12 === 0) hour12 = 12;   // 0 and 12 both show as 12

  // Pad minutes with leading zero e.g. 0 → "00", 5 → "05"
  var minuteStr = String(minute).padStart(2, "0");

  return hour12 + ":" + minuteStr + " " + period;
}


// formatTimeValue
// Converts hour and minute to a storable 24-hour value string.
// e.g. hour=23, minute=0  → "23:00"
//      hour=6,  minute=30 → "06:30"
function formatTimeValue(hour, minute) {
  var hourStr   = String(hour).padStart(2, "0");
  var minuteStr = String(minute).padStart(2, "0");
  return hourStr + ":" + minuteStr;
}


// timeValueToMinutes
// Converts a time value string to total minutes since midnight.
// e.g. "23:00" → 1380,  "06:30" → 390
// Used for calculating the difference between two times.
function timeValueToMinutes(timeValue) {

  // timeValue format is "HH:MM" e.g. "23:00"
  var parts   = timeValue.split(":");
  var hours   = parseInt(parts[0]);
  var minutes = parseInt(parts[1]);

  return (hours * 60) + minutes;
}
