// ─────────────────────────────────────────────────────────────
// form.js — Form Builder
//
// Builds the complete daily log form and pre-fills it
// with any data already saved for today in Google Sheets.
//
// UPDATES IN THIS VERSION:
//   - On app load, fetches today's saved entry from Sheets
//   - Pre-fills all toggles, food text and sleep dropdowns
//   - Shows a loading state while fetching
//   - If no entry exists yet — form starts blank as normal
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// buildForm
// Main function — builds the form structure first,
// then fetches and pre-fills any existing data for today.
// ─────────────────────────────────────────────────────────────

function buildForm() {

  // ── Set up top bar ──────────────────────────────────────────
  var avatar = document.getElementById("user-avatar");
  if (avatar) {
    avatar.textContent = USER_NAME.charAt(0).toUpperCase();
  }

  // ── Build date picker ───────────────────────────────────────
  buildDatePicker();

  // ── Build all form sections ─────────────────────────────────
  var container = document.getElementById("form-container");
  if (!container) return;

  var formHTML = "";
  formHTML += buildHabitsSection();
  formHTML += buildFoodSection();
  formHTML += buildSupplementsSection();
  formHTML += buildSleepSection();
  formHTML += buildBloodReportSection();
  formHTML += buildHealthNoteSection();

  container.innerHTML = formHTML;

  // ── Initialise sleep dropdowns ──────────────────────────────
  // Must run after HTML is on the page
  initialiseSleepDropdowns();

  // ── Load today's existing entry ─────────────────────────────
  // Fetches from Google Sheets and pre-fills the form
  // Shows a subtle loading indicator while fetching
  loadTodayEntry();
}


// ─────────────────────────────────────────────────────────────
// loadTodayEntry
// Fetches any existing entry for today from Google Sheets.
// If found — pre-fills the form with saved values.
// If not found — form stays blank, ready for first entry.
//
// Uses getFormattedDate() from datepicker.js for today's date.
// ─────────────────────────────────────────────────────────────

function loadTodayEntry() {

  // Show a subtle loading message in the save button area
  showLoadingIndicator();

  // Build the URL to fetch today's entry
  // Passes date and password as URL parameters
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

      hideLoadingIndicator();

      if (data.found) {
        // Entry exists for today — pre-fill the form
        prefillForm(data);
      }
      // If not found — form stays blank, nothing to do
    })
    .catch(function(error) {
      // If fetch fails (e.g. no internet) — just leave form blank
      // Don't show an error — user can still fill in manually
      hideLoadingIndicator();
      console.log("Could not load existing entry:", error);
    });
}


// ─────────────────────────────────────────────────────────────
// prefillForm
// Takes the data returned from Google Sheets and fills
// each form field with the saved value.
//
// data: the object returned by getDateEntry in Code.gs
//   data.daily       — habits and food
//   data.supplements — supplement yes/no values
//   data.sleep       — bedtime and wake time
// ─────────────────────────────────────────────────────────────

function prefillForm(data) {

  // ── Pre-fill habit toggles ───────────────────────────────────
  if (data.daily) {
    setToggle("toggle-workout",      data.daily.workout);
    setToggle("toggle-walk",         data.daily.walk);
    setToggle("toggle-studies",      data.daily.studies);
    setToggle("toggle-difficult-day",data.daily.difficult_day);
    setToggle("toggle-outside-food", data.daily.outside_food);

    // If outside food was Yes — show the detail field
    if (data.daily.outside_food === "Yes") {
      var detailBox = document.getElementById("outside-food-detail");
      if (detailBox) detailBox.classList.add("visible");

      var detailInput = document.getElementById("outside-food-input");
      if (detailInput) {
        detailInput.value = data.daily.outside_food_detail || "";
      }
    }

    // Pre-fill food log text area
    var foodArea = document.getElementById("food-log");
    if (foodArea && data.daily.food_log) {
      foodArea.value = data.daily.food_log;
    }
  }


  // ── Pre-fill supplement toggles ──────────────────────────────
  // data.supplements is an object like { "Iron": "Yes", "B12": "No" }
  if (data.supplements) {
    Object.keys(data.supplements).forEach(function(suppName) {

      // Build the toggle id from supplement name
      // e.g. "Vitamin D3" → "toggle-supp-vitamin-d3"
      var toggleId = "toggle-supp-" +
        suppName.toLowerCase().replace(/ /g, "-");

      setToggle(toggleId, data.supplements[suppName]);
    });
  }


  // ── Pre-fill sleep dropdowns ─────────────────────────────────
  if (data.sleep && data.sleep.bedtime) {

    // Convert readable time "11:00 PM" back to a 24-hour value
    // so we can select the matching option in the dropdown
    var bedValue  = convertTo24Hour(data.sleep.bedtime);
    var wakeValue = convertTo24Hour(data.sleep.wake_time);

    setDropdown("sleep-bedtime",  bedValue);
    setDropdown("sleep-waketime", wakeValue);

    // Recalculate the sleep total display with pre-filled values
    onSleepChange();
  }
}


// ─────────────────────────────────────────────────────────────
// setToggle
// Sets a toggle checkbox to Yes (checked) or No (unchecked).
// Safely does nothing if the toggle doesn't exist.
//
// toggleId: the checkbox element id e.g. "toggle-workout"
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
// Loops through options to find the matching one.
//
// selectId: the select element id e.g. "sleep-bedtime"
// value:    the value to select e.g. "23:00"
// ─────────────────────────────────────────────────────────────

function setDropdown(selectId, value) {
  var select = document.getElementById(selectId);
  if (!select || !value) return;

  // Loop through all options and select the matching one
  for (var i = 0; i < select.options.length; i++) {
    if (select.options[i].value === value) {
      select.selectedIndex = i;
      break;
    }
  }
}


// ─────────────────────────────────────────────────────────────
// convertTo24Hour
// Converts a readable time string back to 24-hour HH:MM format.
// e.g. "11:00 PM" → "23:00"
//      "6:30 AM"  → "06:30"
//
// Needed to match the dropdown option values which are stored
// in 24-hour format by sleep.js
// ─────────────────────────────────────────────────────────────

function convertTo24Hour(timeStr) {

  if (!timeStr) return "";

  // Parse "11:00 PM" or "6:30 AM"
  var parts  = timeStr.split(" ");
  var time   = parts[0];           // "11:00"
  var period = parts[1];           // "AM" or "PM"

  var timeParts = time.split(":");
  var hours     = parseInt(timeParts[0]);
  var minutes   = timeParts[1];    // "00" or "30"

  // Convert to 24-hour
  if (period === "AM") {
    if (hours === 12) hours = 0;   // 12 AM = midnight = 00
  } else {
    if (hours !== 12) hours += 12; // PM hours: add 12 except for 12 PM
  }

  // Pad hours with leading zero e.g. 6 → "06"
  var hoursStr = String(hours).padStart(2, "0");

  return hoursStr + ":" + minutes;
}


// ─────────────────────────────────────────────────────────────
// showLoadingIndicator
// Shows a subtle "Loading..." text in the status area
// while fetching existing entry from Google Sheets.
// ─────────────────────────────────────────────────────────────

function showLoadingIndicator() {
  var statusEl = document.getElementById("save-status");
  if (!statusEl) return;
  statusEl.textContent = "Loading today's entry...";
  statusEl.classList.remove("success", "error");
  statusEl.classList.add("success");   // use green styling for loading too
}


// ─────────────────────────────────────────────────────────────
// hideLoadingIndicator
// Hides the loading message once fetch completes.
// ─────────────────────────────────────────────────────────────

function hideLoadingIndicator() {
  var statusEl = document.getElementById("save-status");
  if (!statusEl) return;
  statusEl.classList.remove("success", "error");
  statusEl.textContent = "";
}


// ─────────────────────────────────────────────────────────────
// buildHabitsSection
// ─────────────────────────────────────────────────────────────

function buildHabitsSection() {

  var html  = '<div class="section">';
  html     += '<div class="section-label">Habits</div>';

  html += buildToggleRow(
    "toggle-workout",
    "Workout",
    "Exercise / YouTube video",
    false
  );

  html += buildToggleRow(
    "toggle-walk",
    "Walk",
    "Confirm if you walked today",
    false
  );

  if (SHOW_STUDIES) {
    html += buildToggleRow(
      "toggle-studies",
      "Studies",
      "Reading / learning today",
      false
    );
  }

  html += buildToggleRow(
    "toggle-difficult-day",
    "Difficult day",
    "Stress, arguments, emotional drain",
    false
  );

  html += '</div>';
  return html;
}


// ─────────────────────────────────────────────────────────────
// buildFoodSection
// ─────────────────────────────────────────────────────────────

function buildFoodSection() {

  var html  = '<div class="section">';
  html     += '<div class="section-label">Food</div>';

  html += (
    '<div class="toggle-row">' +
      '<div><div class="toggle-label">Outside food / eating out</div></div>' +
      '<label class="toggle">' +
        '<input type="checkbox" id="toggle-outside-food" ' +
          'onchange="onOutsideFoodToggle()">' +
        '<span class="toggle-track"></span>' +
      '</label>' +
    '</div>'
  );

  html += (
    '<div class="outside-detail" id="outside-food-detail">' +
      '<input class="outside-input" type="text" ' +
        'id="outside-food-input" ' +
        'placeholder="Where or what? e.g. Pizza Hut, office lunch...">' +
    '</div>'
  );

  html += '<div style="height: 12px;"></div>';

  html += '<label class="food-label" for="food-log">What did you eat today?</label>';
  html += (
    '<textarea class="food-area" id="food-log" ' +
      'placeholder="e.g. Tea, toast 2&#10;Manuka, anjeer, pumpkin seeds&#10;Coffee&#10;Methi phulka 3, alo matar, paneer gravy...">' +
    '</textarea>'
  );

  html += (
    '<div class="food-hint">' +
      'Write naturally — new lines or commas both work fine' +
    '</div>'
  );

  html += '</div>';
  return html;
}


// ─────────────────────────────────────────────────────────────
// buildSupplementsSection
// ─────────────────────────────────────────────────────────────

function buildSupplementsSection() {

  var html  = '<div class="section">';
  html     += '<div class="section-label">Supplements</div>';

  SUPPLEMENTS.forEach(function(supp) {

    var toggleId  = "toggle-supp-" +
      supp.name.toLowerCase().replace(/ /g, "-");
    var badgeText = getScheduleBadgeText(supp);
    var badgeType = supp.frequency === "daily" ? "daily" : "other";

    html += buildSupplementToggleRow(
      toggleId, supp.name, supp.notes, badgeText, badgeType
    );
  });

  html += '</div>';
  return html;
}


// ─────────────────────────────────────────────────────────────
// buildBloodReportSection
// ─────────────────────────────────────────────────────────────

function buildBloodReportSection() {

  var html  = '<div class="section">';
  html     += '<div class="section-label">Blood report</div>';
  html     += (
    '<div class="section-desc">' +
      'Only when you have a new report — ignore on most days' +
    '</div>'
  );
  html += (
    '<div class="upload-box" onclick="triggerBloodReportUpload()">' +
      '<div class="upload-icon">&#128196;</div>' +
      '<div class="upload-label">' +
        'Tap to upload <span>blood report PDF</span>' +
      '</div>' +
      '<div class="upload-note">' +
        'AI will extract all markers automatically' +
      '</div>' +
    '</div>'
  );
  html += (
    '<input type="file" id="blood-report-file" ' +
      'accept=".pdf" style="display:none;">'
  );

  html += '</div>';
  return html;
}


// ─────────────────────────────────────────────────────────────
// buildHealthNoteSection
// ─────────────────────────────────────────────────────────────

function buildHealthNoteSection() {

  return (
    '<div class="health-note">' +
      '<div class="health-note-icon">&#63743;</div>' +
      '<div class="health-note-text">' +
        'Weight, walk distance, activity and periods are pulled ' +
        'from Apple Health automatically every Sunday.' +
      '</div>' +
    '</div>'
  );
}


// ─────────────────────────────────────────────────────────────
// triggerBloodReportUpload
// ─────────────────────────────────────────────────────────────

function triggerBloodReportUpload() {
  var fileInput = document.getElementById("blood-report-file");
  if (fileInput) fileInput.click();
}


// ─────────────────────────────────────────────────────────────
// window.onload — Starting point of the entire app
// ─────────────────────────────────────────────────────────────

window.onload = function() {
  buildForm();
};
