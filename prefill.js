// ─────────────────────────────────────────────────────────────
// prefill.js — Load and Pre-fill Existing Entry
//
// This file has one job:
//   When the app opens, fetch any data already saved for today
//   from Google Sheets and pre-fill the form with it.
//
// This means:
//   - You save Khajur = Yes in the morning
//   - Close the app
//   - Reopen it at lunch
//   - The form shows Khajur = Yes already ticked
//   - You just add your food and save again
//
// If no entry exists yet for today — form stays blank.
// If Google Sheets can't be reached — form stays blank.
// Either way the form is always usable.
//
// Called automatically after buildForm() in form.js completes.
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// loadTodayEntry
// Fetches today's saved entry from Google Sheets.
// Calls prefillForm() if an entry is found.
//
// Uses getFormattedDate() from datepicker.js for today's date.
// Uses SHEET_URL and APP_PASSWORD from config.js.
// ─────────────────────────────────────────────────────────────

function loadTodayEntry() {

  // Show a subtle loading message while fetching
  showPrefillStatus("Loading today's entry...");

  // Build the URL to fetch today's data
  // Passes date and password as URL parameters to Code.gs
  var url = SHEET_URL +
    "?type=date_entry" +
    "&date=" + getFormattedDate() +
    "&password=" + encodeURIComponent(APP_PASSWORD);

  // Fetch existing data from Google Sheets
  fetch(url)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {

      hidePrefillStatus();

      if (data.found) {
        // Entry exists for today — pre-fill the form
        prefillForm(data);
      }
      // If not found — form stays blank, nothing to do

    })
    .catch(function(error) {

      // If fetch fails (no internet, URL issue etc.)
      // just leave the form blank — user can still fill manually
      hidePrefillStatus();
      console.log("Could not load existing entry:", error);
    });
}


// ─────────────────────────────────────────────────────────────
// prefillForm
// Takes the data returned from Code.gs getDateEntry()
// and fills each form field with the saved value.
//
// data object structure:
//   data.found       — true if an entry was found for this date
//   data.daily       — habits, food, outside food values
//   data.supplements — object like { "Iron": "Yes", "B12": "No" }
//   data.sleep       — bedtime and wake time strings
// ─────────────────────────────────────────────────────────────

function prefillForm(data) {

  // ── Pre-fill habit toggles ───────────────────────────────────
  if (data.daily) {
    setToggle("toggle-workout",       data.daily.workout);
    setToggle("toggle-walk",          data.daily.walk);
    setToggle("toggle-studies",       data.daily.studies);
    setToggle("toggle-difficult-day", data.daily.difficult_day);
    setToggle("toggle-outside-food",  data.daily.outside_food);

    // If outside food was Yes — show the detail field too
    if (data.daily.outside_food === "Yes") {
      var detailBox = document.getElementById("outside-food-detail");
      if (detailBox) detailBox.classList.add("visible");

      var detailInput = document.getElementById("outside-food-input");
      if (detailInput) {
        detailInput.value = data.daily.outside_food_detail || "";
      }
    }

    // Pre-fill the food text area with saved text
    var foodArea = document.getElementById("food-log");
    if (foodArea && data.daily.food_log) {
      foodArea.value = data.daily.food_log;
    }
  }


  // ── Pre-fill supplement toggles ──────────────────────────────
  // data.supplements is an object like:
  // { "Iron": "Yes", "Vitamin D3": "No", "B12": "Yes" }
  if (data.supplements) {

    Object.keys(data.supplements).forEach(function(suppName) {

      // Build the toggle id from the supplement name
      // Must match how toggles.js builds ids
      // e.g. "Vitamin D3" → "toggle-supp-vitamin-d3"
      var toggleId = "toggle-supp-" +
        suppName.toLowerCase().replace(/ /g, "-");

      setToggle(toggleId, data.supplements[suppName]);
    });
  }


  // ── Pre-fill sleep dropdowns ─────────────────────────────────
  if (data.sleep && data.sleep.bedtime) {

    // Convert "11:00 PM" back to "23:00" so dropdown can match it
    // Dropdown options are stored in 24-hour format by sleep.js
    var bedValue  = convertTo24Hour(data.sleep.bedtime);
    var wakeValue = convertTo24Hour(data.sleep.wake_time);

    setDropdown("sleep-bedtime",  bedValue);
    setDropdown("sleep-waketime", wakeValue);

    // Recalculate sleep total display with the pre-filled values
    onSleepChange();   // defined in sleep.js
  }
}


// ─────────────────────────────────────────────────────────────
// setToggle
// Sets a toggle checkbox to checked (Yes) or unchecked (No).
// Safely does nothing if the toggle element does not exist.
//
// toggleId: id of the checkbox e.g. "toggle-workout"
// value:    "Yes" to check, anything else to uncheck
// ─────────────────────────────────────────────────────────────

function setToggle(toggleId, value) {
  var checkbox = document.getElementById(toggleId);
  if (!checkbox) return;
  checkbox.checked = (value === "Yes");
}


// ─────────────────────────────────────────────────────────────
// setDropdown
// Sets a select dropdown to a specific value.
// Loops through all options to find and select the match.
//
// selectId: id of the select element e.g. "sleep-bedtime"
// value:    24-hour time value to select e.g. "23:00"
// ─────────────────────────────────────────────────────────────

function setDropdown(selectId, value) {
  var select = document.getElementById(selectId);
  if (!select || !value) return;

  for (var i = 0; i < select.options.length; i++) {
    if (select.options[i].value === value) {
      select.selectedIndex = i;
      break;
    }
  }
}


// ─────────────────────────────────────────────────────────────
// convertTo24Hour
// Converts a readable 12-hour time string to 24-hour HH:MM.
// e.g. "11:00 PM" → "23:00"
//      "6:30 AM"  → "06:30"
//      "12:00 AM" → "00:00"  (midnight)
//      "12:00 PM" → "12:00"  (noon)
//
// Needed because sleep dropdowns store values in 24-hour format
// but the saved text in Sheets is the readable 12-hour label.
// ─────────────────────────────────────────────────────────────

function convertTo24Hour(timeStr) {

  if (!timeStr) return "";

  // Split "11:00 PM" into ["11:00", "PM"]
  var parts  = timeStr.split(" ");
  var time   = parts[0];     // "11:00"
  var period = parts[1];     // "AM" or "PM"

  var timeParts = time.split(":");
  var hours     = parseInt(timeParts[0]);
  var minutes   = timeParts[1];   // keep as string e.g. "00"

  // Convert hours to 24-hour format
  if (period === "AM") {
    if (hours === 12) hours = 0;   // 12 AM = midnight = 0
  } else {
    if (hours !== 12) hours += 12; // PM: add 12, except 12 PM stays 12
  }

  // Pad with leading zero e.g. 6 → "06"
  var hoursStr = String(hours).padStart(2, "0");

  return hoursStr + ":" + minutes;
}


// ─────────────────────────────────────────────────────────────
// showPrefillStatus
// Shows a subtle message in the status area while loading.
// Uses the same status element as save.js to avoid adding
// new elements to the page.
// ─────────────────────────────────────────────────────────────

function showPrefillStatus(message) {
  var statusEl = document.getElementById("save-status");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.remove("error");
  statusEl.classList.add("success");
}


// ─────────────────────────────────────────────────────────────
// hidePrefillStatus
// Hides the loading message once fetch completes.
// ─────────────────────────────────────────────────────────────

function hidePrefillStatus() {
  var statusEl = document.getElementById("save-status");
  if (!statusEl) return;
  statusEl.classList.remove("success", "error");
  statusEl.textContent = "";
}


// ─────────────────────────────────────────────────────────────
// Self-initialising — runs automatically after form is built
//
// We use a small delay (300ms) to make sure form.js has
// fully finished building the form before we try to fill it.
// Without the delay, the form elements might not exist yet
// when prefill.js tries to set their values.
// ─────────────────────────────────────────────────────────────

window.addEventListener("load", function() {
  setTimeout(function() {
    loadTodayEntry();
  }, 300);
});
