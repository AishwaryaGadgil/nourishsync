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
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// buildForm
// Main function that builds the entire daily log form.
// Called once when the page loads via window.onload below.
//
// Order of sections matches the design we agreed on:
//   1. Habits       — Workout, Walk, Studies, Difficult day
//   2. Food         — Outside food toggle + food text area
//   3. Supplements  — Iron, D3, B12, Khajur
//   4. Sleep        — Bedtime, wake time, total hours
//   5. Blood report — PDF upload (shows every day, use when needed)
//   6. Health note  — Reminder about Apple Health auto-pull
// ─────────────────────────────────────────────────────────────

function buildForm() {

  // ── Step 1: Set up the top bar ──────────────────────────────
  // Show the first letter of the user name in the avatar circle
  // USER_NAME comes from config.js
  var avatar = document.getElementById("user-avatar");
  if (avatar) {
    avatar.textContent = USER_NAME.charAt(0).toUpperCase();
  }


  // ── Step 2: Build the date picker ───────────────────────────
  // Inserts the date navigation bar above the form
  // buildDatePicker() is defined in datepicker.js
  buildDatePicker();


  // ── Step 3: Build all form sections ─────────────────────────
  // Get the form container from index.html
  var container = document.getElementById("form-container");
  if (!container) return;

  // Build each section as an HTML string and join them together
  // Each buildXxxSection() function returns an HTML string
  var formHTML = "";

  formHTML += buildHabitsSection();
  formHTML += buildFoodSection();
  formHTML += buildSupplementsSection();
  formHTML += buildSleepSection();      // defined in sleep.js
  formHTML += buildBloodReportSection();
  formHTML += buildHealthNoteSection();

  // Insert all sections into the page at once
  container.innerHTML = formHTML;


  // ── Step 4: Initialise interactive elements ─────────────────
  // Sleep dropdowns must be filled AFTER the HTML is on the page
  // because fillTimeDropdown() needs the <select> elements to exist
  initialiseSleepDropdowns();   // defined in sleep.js
}


// ─────────────────────────────────────────────────────────────
// buildHabitsSection
// Builds the Habits section — four yes/no toggles.
// Uses buildToggleRow() from toggles.js for each row.
// Returns HTML string.
// ─────────────────────────────────────────────────────────────

function buildHabitsSection() {

  // Start building the section card
  var html = '<div class="section">';
  html    += '<div class="section-label">Habits</div>';

  // Workout toggle — always shown
  html += buildToggleRow(
    "toggle-workout",          // id
    "Workout",                 // label
    "Exercise / YouTube video",// subtext
    false                      // starts as No
  );

  // Walk toggle — always shown
  // Note in subtext explains Apple Health auto-confirms this
  html += buildToggleRow(
    "toggle-walk",
    "Walk",
    "Confirm if you walked today",
    false
  );

  // Studies toggle — only shown if SHOW_STUDIES is true in config.js
  if (SHOW_STUDIES) {
    html += buildToggleRow(
      "toggle-studies",
      "Studies",
      "Reading / learning today",
      false
    );
  }

  // Difficult day toggle — always shown
  html += buildToggleRow(
    "toggle-difficult-day",
    "Difficult day",
    "Stress, arguments, emotional drain",
    false
  );

  html += '</div>';   // Close section card
  return html;
}


// ─────────────────────────────────────────────────────────────
// buildFoodSection
// Builds the Food section — outside food toggle and food text area.
// Returns HTML string.
// ─────────────────────────────────────────────────────────────

function buildFoodSection() {

  var html = '<div class="section">';
  html    += '<div class="section-label">Food</div>';

  // Outside food / eating out toggle
  // Has a special onchange handler to show/hide the detail field
  html += (
    '<div class="toggle-row">' +
      '<div>' +
        '<div class="toggle-label">Outside food / eating out</div>' +
      '</div>' +
      '<label class="toggle">' +
        '<input type="checkbox" id="toggle-outside-food" ' +
          'onchange="onOutsideFoodToggle()">' +  // defined in toggles.js
        '<span class="toggle-track"></span>' +
      '</label>' +
    '</div>'
  );

  // Detail field — hidden until toggle is turned on
  // onOutsideFoodToggle() in toggles.js shows/hides this
  html += (
    '<div class="outside-detail" id="outside-food-detail">' +
      '<input class="outside-input" type="text" ' +
        'id="outside-food-input" ' +
        'placeholder="Where or what? e.g. Pizza Hut, office lunch...">' +
    '</div>'
  );

  // Divider between the toggle and the text area
  html += '<div style="height: 12px;"></div>';

  // Food text area — write exactly as you do now
  html += '<label class="food-label" for="food-log">What did you eat today?</label>';
  html += (
    '<textarea class="food-area" id="food-log" ' +
      'placeholder="e.g. Tea, toast 2, manuka, anjeer, pumpkin seeds, ' +
      'walnut, almond, coffee, methi phulka 3, alo matar, paneer gravy...">' +
    '</textarea>'
  );

  // Hint text below the food area
  html += (
    '<div class="food-hint">' +
      'Write naturally — AI will read this and estimate your nutrients' +
    '</div>'
  );

  html += '</div>';   // Close section card
  return html;
}


// ─────────────────────────────────────────────────────────────
// buildSupplementsSection
// Builds the Supplements section using SUPPLEMENTS from config.js.
// Loops through each supplement and creates a toggle row for it.
// Returns HTML string.
// ─────────────────────────────────────────────────────────────

function buildSupplementsSection() {

  var html = '<div class="section">';
  html    += '<div class="section-label">Supplements</div>';

  // Loop through each supplement defined in config.js
  // This means adding a new supplement to config.js automatically
  // adds it here — no need to touch this file
  SUPPLEMENTS.forEach(function(supp) {

    // Build a unique id from the supplement name
    // e.g. "Vitamin D3" → "toggle-supp-vitamin-d3"
    var toggleId = "toggle-supp-" +
      supp.name.toLowerCase().replace(/ /g, "-");

    // Get the readable schedule badge text
    // e.g. "wednesday" → "Wednesdays"
    // getScheduleBadgeText() is defined in toggles.js
    var badgeText = getScheduleBadgeText(supp);

    // Daily supplements get green badge, others get blue
    var badgeType = supp.frequency === "daily" ? "daily" : "other";

    // Build one toggle row for this supplement
    // buildSupplementToggleRow() is defined in toggles.js
    html += buildSupplementToggleRow(
      toggleId,
      supp.name,
      supp.notes,
      badgeText,
      badgeType
    );
  });

  html += '</div>';   // Close section card
  return html;
}


// ─────────────────────────────────────────────────────────────
// buildBloodReportSection
// Builds the Blood Report section — a PDF upload area.
// Shows every day but only needs to be used when you have
// a new blood report to upload.
// Returns HTML string.
// ─────────────────────────────────────────────────────────────

function buildBloodReportSection() {

  var html = '<div class="section">';
  html    += '<div class="section-label">Blood report</div>';

  // Description — reassures user this is not a daily task
  html += (
    '<div class="section-desc">' +
      'Only when you have a new report — ignore on most days' +
    '</div>'
  );

  // Upload box — tapping this will trigger file picker
  // The actual file handling will be built in upload.js later
  html += (
    '<div class="upload-box" onclick="triggerBloodReportUpload()">' +
      '<div class="upload-icon">&#128196;</div>' +  // Document emoji
      '<div class="upload-label">' +
        'Tap to upload <span>blood report PDF</span>' +
      '</div>' +
      '<div class="upload-note">' +
        'AI will extract all markers automatically' +
      '</div>' +
    '</div>'
  );

  // Hidden file input — triggered by the upload box tap above
  html += (
    '<input type="file" id="blood-report-file" ' +
      'accept=".pdf" style="display:none;">'
  );

  html += '</div>';   // Close section card
  return html;
}


// ─────────────────────────────────────────────────────────────
// buildHealthNoteSection
// Builds the Apple Health info banner at the bottom of the form.
// Reminds the user what gets pulled automatically so they
// don't feel like they need to enter it manually.
// Returns HTML string.
// ─────────────────────────────────────────────────────────────

function buildHealthNoteSection() {

  return (
    '<div class="health-note">' +
      '<div class="health-note-icon">&#63743;</div>' +  // Apple logo
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
// Called when user taps the blood report upload box.
// Opens the iPhone file picker filtered to PDF files.
// The actual upload logic will be added in upload.js later.
// ─────────────────────────────────────────────────────────────

function triggerBloodReportUpload() {

  var fileInput = document.getElementById("blood-report-file");
  if (fileInput) {
    fileInput.click();   // Programmatically open the file picker
  }
}


// ─────────────────────────────────────────────────────────────
// window.onload
// This runs automatically when the page finishes loading.
// It is the starting point of the entire app.
//
// Order matters here:
//   1. buildForm() sets up all the HTML
//   2. initialiseSleepDropdowns() runs inside buildForm()
//      after the HTML exists
// ─────────────────────────────────────────────────────────────

window.onload = function() {
  buildForm();
};
