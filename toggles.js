// ─────────────────────────────────────────────────────────────
// toggles.js — Toggle Switch Interactions
//
// This file handles all yes/no toggle behaviour in the form:
//   - Reading toggle state (is it on or off?)
//   - Showing/hiding the outside food detail field
//   - Building toggle rows from a list of items
//   - Resetting all toggles to their default state (No)
//
// A toggle is just a styled checkbox under the hood.
// When checked = Yes, when unchecked = No.
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// buildToggleRow
// Creates one toggle row — a label on the left, switch on right.
// Returns the HTML string for that row.
//
// id:       unique id for this toggle e.g. "toggle-workout"
// label:    main text e.g. "Workout"
// subtext:  smaller text below label e.g. "Exercise / YouTube"
//           pass empty string "" if no subtext needed
// checked:  true = starts as Yes, false = starts as No (default)
// ─────────────────────────────────────────────────────────────

function buildToggleRow(id, label, subtext, checked) {

  // Build the subtext line only if subtext was provided
  var subtextHTML = "";
  if (subtext !== "") {
    subtextHTML = '<div class="toggle-sub">' + subtext + '</div>';
  }

  // checked attribute — added to checkbox if starts as Yes
  var checkedAttr = checked ? "checked" : "";

  // Return the complete HTML for one toggle row
  return (
    '<div class="toggle-row">' +

      // Left side — label and optional subtext
      '<div>' +
        '<div class="toggle-label">' + label + '</div>' +
        subtextHTML +
      '</div>' +

      // Right side — the toggle switch
      // The hidden checkbox has the id so we can read its value
      '<label class="toggle">' +
        '<input type="checkbox" id="' + id + '" ' + checkedAttr + '>' +
        '<span class="toggle-track"></span>' +
      '</label>' +

    '</div>'
  );
}


// ─────────────────────────────────────────────────────────────
// buildSupplementToggleRow
// Same as buildToggleRow but adds a coloured schedule badge
// next to the supplement name showing when it's scheduled.
//
// e.g. "Iron [Daily]" or "B12 [Wednesdays]"
//
// id:       unique id e.g. "toggle-supp-iron"
// name:     supplement name e.g. "Iron"
// notes:    hint text below name e.g. "Ferrous sulphate"
// badge:    schedule text e.g. "Daily" / "Wednesdays" / "1st & 15th"
// badgeType:"daily" for green badge, "other" for blue badge
// ─────────────────────────────────────────────────────────────

function buildSupplementToggleRow(id, name, notes, badge, badgeType) {

  // Choose badge colour class based on type
  var badgeClass = badgeType === "daily"
    ? "supp-badge supp-badge-daily"
    : "supp-badge supp-badge-other";

  // Build the notes line only if notes provided
  var notesHTML = "";
  if (notes !== "") {
    notesHTML = '<div class="toggle-sub">' + notes + '</div>';
  }

  return (
    '<div class="toggle-row">' +

      '<div>' +
        // Name + coloured schedule badge side by side
        '<div class="toggle-label">' +
          name +
          '<span class="' + badgeClass + '">' + badge + '</span>' +
        '</div>' +
        notesHTML +
      '</div>' +

      // Toggle switch — all supplements default to No (unchecked)
      '<label class="toggle">' +
        '<input type="checkbox" id="' + id + '">' +
        '<span class="toggle-track"></span>' +
      '</label>' +

    '</div>'
  );
}


// ─────────────────────────────────────────────────────────────
// getToggleValue
// Reads whether a toggle is on (Yes) or off (No).
// Returns the string "Yes" or "No".
//
// toggleId: the id of the checkbox e.g. "toggle-workout"
//
// Used by save.js when collecting all form values to save.
// ─────────────────────────────────────────────────────────────

function getToggleValue(toggleId) {

  var checkbox = document.getElementById(toggleId);

  // If the element doesn't exist return No as a safe default
  if (!checkbox) return "No";

  return checkbox.checked ? "Yes" : "No";
}


// ─────────────────────────────────────────────────────────────
// onOutsideFoodToggle
// Called automatically when the Outside food toggle changes.
// Shows the detail text field when toggled on.
// Hides it and clears its value when toggled off.
// ─────────────────────────────────────────────────────────────

function onOutsideFoodToggle() {

  var checkbox   = document.getElementById("toggle-outside-food");
  var detailBox  = document.getElementById("outside-food-detail");

  if (!checkbox || !detailBox) return;

  if (checkbox.checked) {
    // Toggle is on — show the detail text field
    detailBox.classList.add("visible");

    // Focus the input so keyboard opens automatically on iPhone
    var input = document.getElementById("outside-food-input");
    if (input) input.focus();

  } else {
    // Toggle is off — hide the detail field and clear its value
    detailBox.classList.remove("visible");

    var input = document.getElementById("outside-food-input");
    if (input) input.value = "";
  }
}


// ─────────────────────────────────────────────────────────────
// getOutsideFoodDetail
// Returns the text typed in the outside food detail field.
// Returns empty string if outside food toggle is off.
//
// Used by save.js when collecting form values.
// ─────────────────────────────────────────────────────────────

function getOutsideFoodDetail() {

  var checkbox = document.getElementById("toggle-outside-food");

  // Only return a value if the toggle is actually on
  if (!checkbox || !checkbox.checked) return "";

  var input = document.getElementById("outside-food-input");
  if (!input) return "";

  return input.value.trim();
}


// ─────────────────────────────────────────────────────────────
// getSupplementValues
// Reads the yes/no state of every supplement toggle.
// Returns an array of objects — one per supplement.
//
// Each object has:
//   name:         supplement name e.g. "Iron"
//   taken:        "Yes" or "No"
//   scheduled:    "Yes" or "No" — was it scheduled for today
//   compensated:  "Yes" or "No" — taken on non-scheduled day
//
// Used by save.js when saving supplement data to Google Sheets.
// ─────────────────────────────────────────────────────────────

function getSupplementValues() {

  var results = [];
  var today   = new Date();

  // Loop through each supplement defined in config.js
  SUPPLEMENTS.forEach(function(supp) {

    // Build the toggle id from the supplement name
    // e.g. "Iron" becomes "toggle-supp-iron"
    var toggleId = "toggle-supp-" + supp.name.toLowerCase().replace(/ /g, "-");

    // Read whether it was taken today
    var taken = getToggleValue(toggleId);

    // Work out if today was a scheduled day for this supplement
    var scheduled = isScheduledToday(supp, today);

    // Work out if this is a compensation day
    // Compensation = taken Yes AND not a scheduled day
    var compensated = (taken === "Yes" && !scheduled) ? "Yes" : "No";

    results.push({
      name:        supp.name,
      taken:       taken,
      scheduled:   scheduled ? "Yes" : "No",
      compensated: compensated
    });
  });

  return results;
}


// ─────────────────────────────────────────────────────────────
// isScheduledToday
// Works out whether a supplement is scheduled for a given date.
// Returns true or false.
//
// supp: one supplement object from config.js
// date: the Date to check against
//
// Logic:
//   daily    → always scheduled (all days)
//   weekly   → scheduled if today matches the day name
//              e.g. scheduled_days = "wednesday"
//   monthly  → scheduled if today's date matches one of the
//              numbers e.g. scheduled_days = "1,15"
// ─────────────────────────────────────────────────────────────

function isScheduledToday(supp, date) {

  var frequency = supp.frequency;
  var days      = supp.scheduled_days;

  if (frequency === "daily") {
    // Daily supplements are always scheduled
    return true;
  }

  if (frequency === "weekly") {
    // Check if today's day name matches the scheduled day
    // e.g. days = "wednesday", today = Wednesday → true
    var todayDayName = DAY_NAMES[date.getDay()].toLowerCase();
    return todayDayName === days.toLowerCase();
  }

  if (frequency === "monthly") {
    // Check if today's date number is in the scheduled list
    // e.g. days = "1,15", today = 15 → true
    var todayDate       = date.getDate();
    var scheduledDates  = days.split(",").map(function(d) {
      return parseInt(d.trim());
    });
    return scheduledDates.indexOf(todayDate) !== -1;
  }

  // Unknown frequency — default to not scheduled
  return false;
}


// ─────────────────────────────────────────────────────────────
// getScheduleBadgeText
// Returns a short readable text for the supplement schedule badge.
// Shown next to the supplement name in the form.
//
// e.g. daily → "Daily"
//      wednesday → "Wednesdays"
//      1,15 → "1st & 15th"
// ─────────────────────────────────────────────────────────────

function getScheduleBadgeText(supp) {

  if (supp.frequency === "daily") {
    return "Daily";
  }

  if (supp.frequency === "weekly") {
    // Capitalise the day name and add "s" e.g. "wednesday" → "Wednesdays"
    var day = supp.scheduled_days;
    return day.charAt(0).toUpperCase() + day.slice(1) + "s";
  }

  if (supp.frequency === "monthly") {
    // Format "1,15" as "1st & 15th"
    var parts = supp.scheduled_days.split(",").map(function(d) {
      return addOrdinal(parseInt(d.trim()));
    });
    return parts.join(" & ");
  }

  return supp.scheduled_days;
}


// ─────────────────────────────────────────────────────────────
// addOrdinal
// Adds the correct suffix to a date number.
// e.g. 1 → "1st", 2 → "2nd", 3 → "3rd", 15 → "15th"
// ─────────────────────────────────────────────────────────────

function addOrdinal(n) {

  // Special cases for 11th, 12th, 13th
  if (n >= 11 && n <= 13) return n + "th";

  // All other numbers
  var lastDigit = n % 10;
  if (lastDigit === 1) return n + "st";
  if (lastDigit === 2) return n + "nd";
  if (lastDigit === 3) return n + "rd";
  return n + "th";
}


// ─────────────────────────────────────────────────────────────
// resetAllToggles
// Resets every toggle in the form back to No (unchecked).
// Could be used later when switching to a new date,
// to clear the previous day's values.
// ─────────────────────────────────────────────────────────────

function resetAllToggles() {

  // Find all checkboxes inside toggle labels and uncheck them
  var checkboxes = document.querySelectorAll(".toggle input[type=checkbox]");

  checkboxes.forEach(function(cb) {
    cb.checked = false;
  });

  // Also hide the outside food detail field and clear it
  var detailBox = document.getElementById("outside-food-detail");
  if (detailBox) detailBox.classList.remove("visible");

  var detailInput = document.getElementById("outside-food-input");
  if (detailInput) detailInput.value = "";
}
