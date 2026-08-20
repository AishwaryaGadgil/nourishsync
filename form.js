// ─────────────────────────────────────────────────────────────
// form.js — Form Builder
//
// This file builds the complete daily log form by putting
// together all the sections defined in other files.
//
// It is the conductor — it calls the right functions from
// datepicker.js, toggles.js and sleep.js at the right time.
//
// This file also handles:
//   - Setting up the user avatar and name in the top bar
//   - Building each form section in the correct order
//   - Initialising everything when the page loads
//
// NOTE: Loading existing data for today is handled separately
// in prefill.js — keeping this file focused on building only.
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// buildForm
// Main function that builds the entire daily log form.
// Called once when the page loads via window.onload below.
// ─────────────────────────────────────────────────────────────

function buildForm() {

  // ── Step 1: Set up the top bar ──────────────────────────────
  var avatar = document.getElementById("user-avatar");
  if (avatar) {
    avatar.textContent = USER_NAME.charAt(0).toUpperCase();
  }


  // ── Step 2: Build the date picker ───────────────────────────
  buildDatePicker();


  // ── Step 3: Build all form sections ─────────────────────────
  var container = document.getElementById("form-container");
  if (!container) return;

  var formHTML = "";
  formHTML += buildHabitsSection();
  formHTML += buildFoodSection();
  formHTML += buildSupplementsSection();
  formHTML += buildSleepSection();      // defined in sleep.js
  formHTML += buildBloodReportSection();
  formHTML += buildHealthNoteSection();

  container.innerHTML = formHTML;


  // ── Step 4: Initialise sleep dropdowns ──────────────────────
  // Must run AFTER HTML is on the page
  initialiseSleepDropdowns();           // defined in sleep.js
}


// ─────────────────────────────────────────────────────────────
// buildHabitsSection
// Builds the Habits section — four yes/no toggles.
// Returns HTML string.
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

  // Studies only shown if SHOW_STUDIES is true in config.js
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
// Builds the Food section — outside food toggle and text area.
// Returns HTML string.
// ─────────────────────────────────────────────────────────────

function buildFoodSection() {

  var html  = '<div class="section">';
  html     += '<div class="section-label">Food</div>';

  // Outside food toggle
  html += (
    '<div class="toggle-row">' +
      '<div>' +
        '<div class="toggle-label">Outside food / eating out</div>' +
      '</div>' +
      '<label class="toggle">' +
        '<input type="checkbox" id="toggle-outside-food" ' +
          'onchange="onOutsideFoodToggle()">' +
        '<span class="toggle-track"></span>' +
      '</label>' +
    '</div>'
  );

  // Detail field — hidden until toggle is turned on
  html += (
    '<div class="outside-detail" id="outside-food-detail">' +
      '<input class="outside-input" type="text" ' +
        'id="outside-food-input" ' +
        'placeholder="Where or what? e.g. Pizza Hut, office lunch...">' +
    '</div>'
  );

  html += '<div style="height: 12px;"></div>';

  // Food text area — write naturally, commas or new lines both work
  html += '<label class="food-label" for="food-log">What did you eat today?</label>';
  html += (
    '<textarea class="food-area" id="food-log" ' +
      'placeholder="e.g. Tea, toast 2&#10;Manuka, anjeer, pumpkin seeds&#10;Coffee&#10;Methi phulka 3, alo matar, paneer gravy...">' +
    '</textarea>'
  );

  // Hint below text area
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
// Loops through SUPPLEMENTS from config.js and builds a toggle
// row for each one. Adding a supplement to config.js
// automatically adds it here — no need to touch this file.
// Returns HTML string.
// ─────────────────────────────────────────────────────────────

function buildSupplementsSection() {

  var html  = '<div class="section">';
  html     += '<div class="section-label">Supplements</div>';

  SUPPLEMENTS.forEach(function(supp) {

    var toggleId  = "toggle-supp-" +
      supp.name.toLowerCase().replace(/ /g, "-");
    var badgeText = getScheduleBadgeText(supp);  // from toggles.js
    var badgeType = supp.frequency === "daily" ? "daily" : "other";

    html += buildSupplementToggleRow(  // from toggles.js
      toggleId, supp.name, supp.notes, badgeText, badgeType
    );
  });

  html += '</div>';
  return html;
}


// ─────────────────────────────────────────────────────────────
// buildBloodReportSection
// PDF upload area — shown every day, only used when needed.
// Returns HTML string.
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
// Info banner reminding user what Apple Health handles.
// Returns HTML string.
// ─────────────────────────────────────────────────────────────

function buildHealthNoteSection() {

  return (
    '<div class="health-note">' +
      '<div class="health-note-icon">&#63743;</div>' +
      '<div class="health-note-text">' +
        'Weight, walk distance, activity and periods are pulled ' +
        'from Apple Health automatically every Sunday. ' +
        'You do not need to enter these manually.' +
      '</div>' +
    '</div>'
  );
}


// ─────────────────────────────────────────────────────────────
// triggerBloodReportUpload
// Opens the iPhone file picker when upload box is tapped.
// Actual upload logic will be added in upload.js later.
// ─────────────────────────────────────────────────────────────

function triggerBloodReportUpload() {
  var fileInput = document.getElementById("blood-report-file");
  if (fileInput) fileInput.click();
}


// ─────────────────────────────────────────────────────────────
// window.onload — Starting point of the entire app
// Builds the form first, then prefill.js loads existing data
// ─────────────────────────────────────────────────────────────

window.onload = function() {
  buildForm();
};
