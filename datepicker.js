// ─────────────────────────────────────────────────────────────
// datepicker.js — Date Navigation
//
// This file handles everything related to the date bar:
//   - Showing today's date when the app opens
//   - Tapping the left arrow to go to the previous day
//   - Tapping the right arrow to go to the next day
//   - Tapping "Today" to jump back to today's date
//   - Preventing navigation to future dates
//
// The selected date is stored in a variable called currentDate.
// Other files (form.js, save.js) read currentDate to know
// which date the user is logging for.
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// currentDate — The date currently shown in the form
//
// Starts as today when the app loads.
// Changes when user taps the arrow buttons or "Today".
// save.js reads this when saving to know which date to log.
// ─────────────────────────────────────────────────────────────

var currentDate = new Date();


// ─────────────────────────────────────────────────────────────
// DAY AND MONTH NAMES
// Used to format the date label e.g. "Wed, 19 Aug"
// ─────────────────────────────────────────────────────────────

var DAY_NAMES = [
  "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
];

var MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];


// ─────────────────────────────────────────────────────────────
// buildDatePicker
// Creates the date navigation bar HTML and inserts it into
// the page inside the element with id="datepicker-container".
// Called once by form.js when the app loads.
// ─────────────────────────────────────────────────────────────

function buildDatePicker() {

  // Get the container element from index.html
  var container = document.getElementById("datepicker-container");

  // Build the HTML for the date bar
  // ← arrow | date label | → arrow | Today button
  container.innerHTML =
    '<div class="date-bar">' +

      // Left side — arrows and date label
      '<div class="date-nav">' +

        // Left arrow — go to previous day
        '<div class="date-btn" onclick="goToPreviousDay()">&#8249;</div>' +

        // Date label — e.g. "Wed, 19 Aug"
        // Updated by updateDateLabel() whenever date changes
        '<div class="date-label" id="date-label">...</div>' +

        // Right arrow — go to next day (disabled on today)
        '<div class="date-btn" id="next-btn" onclick="goToNextDay()">&#8250;</div>' +

      '</div>' +

      // Right side — Today shortcut button
      '<div class="today-btn" onclick="goToToday()">Today</div>' +

    '</div>';

  // Show today's date in the label straight away
  updateDateLabel();
}


// ─────────────────────────────────────────────────────────────
// updateDateLabel
// Updates the date label text to show the currentDate.
// Also disables the next-day arrow if we're already on today
// (we don't allow logging future dates).
// Called every time the date changes.
// ─────────────────────────────────────────────────────────────

function updateDateLabel() {

  var label = document.getElementById("date-label");
  var nextBtn = document.getElementById("next-btn");

  // Format the date as "Wed, 19 Aug"
  var dayName   = DAY_NAMES[currentDate.getDay()];
  var dayNum    = currentDate.getDate();
  var monthName = MONTH_NAMES[currentDate.getMonth()];

  label.textContent = dayName + ", " + dayNum + " " + monthName;

  // Check if currentDate is today
  // If yes — disable the next arrow so we can't go to future dates
  var today = new Date();
  var isToday = (
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth()    === today.getMonth()    &&
    currentDate.getDate()     === today.getDate()
  );

  if (isToday) {
    // On today — grey out the next button
    nextBtn.style.opacity = "0.3";
    nextBtn.style.pointerEvents = "none";
  } else {
    // On a past date — next button is active
    nextBtn.style.opacity = "1";
    nextBtn.style.pointerEvents = "auto";
  }
}


// ─────────────────────────────────────────────────────────────
// goToPreviousDay
// Moves currentDate back by one day.
// Called when user taps the ← arrow.
// ─────────────────────────────────────────────────────────────

function goToPreviousDay() {

  // Subtract one day from currentDate
  currentDate.setDate(currentDate.getDate() - 1);

  // Update the date label to show the new date
  updateDateLabel();
}


// ─────────────────────────────────────────────────────────────
// goToNextDay
// Moves currentDate forward by one day.
// Called when user taps the → arrow.
// Button is disabled when already on today so this won't
// allow future dates.
// ─────────────────────────────────────────────────────────────

function goToNextDay() {

  // Add one day to currentDate
  currentDate.setDate(currentDate.getDate() + 1);

  // Update the date label to show the new date
  updateDateLabel();
}


// ─────────────────────────────────────────────────────────────
// goToToday
// Jumps currentDate back to today's date.
// Called when user taps the "Today" button.
// ─────────────────────────────────────────────────────────────

function goToToday() {

  // Reset to a fresh Date object pointing to right now
  currentDate = new Date();

  // Update the label
  updateDateLabel();
}


// ─────────────────────────────────────────────────────────────
// getFormattedDate
// Returns currentDate as a string in YYYY-MM-DD format.
// e.g. "2026-08-19"
//
// This is the format used when saving to Google Sheets.
// Called by save.js when building the data to send.
// ─────────────────────────────────────────────────────────────

function getFormattedDate() {

  var year  = currentDate.getFullYear();

  // padStart ensures single-digit months/days get a leading zero
  // e.g. month 8 becomes "08" not "8"
  var month = String(currentDate.getMonth() + 1).padStart(2, "0");
  var day   = String(currentDate.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}


// ─────────────────────────────────────────────────────────────
// switchPage
// Shows the selected page and hides all others.
// Updates the bottom nav to highlight the active tab.
// Called when user taps a nav tab in index.html.
//
// pageName: "log", "review", or "health"
// ─────────────────────────────────────────────────────────────

function switchPage(pageName) {

  // List of all pages
  var pages = ["log", "review", "health"];

  pages.forEach(function(name) {

    var page   = document.getElementById("page-" + name);
    var navTab = document.getElementById("nav-" + name);

    if (name === pageName) {
      // Show this page and mark its nav tab as active
      page.classList.add("active");
      navTab.classList.add("active");

      // Update the subtitle in the top bar to match the page
      updateTopbarSub(name);

    } else {
      // Hide all other pages and deactivate their nav tabs
      page.classList.remove("active");
      navTab.classList.remove("active");
    }
  });
}


// ─────────────────────────────────────────────────────────────
// updateTopbarSub
// Updates the small subtitle text under "NourishSync"
// in the top bar to reflect which page is active.
// ─────────────────────────────────────────────────────────────

function updateTopbarSub(pageName) {

  var sub = document.getElementById("topbar-sub");

  if (pageName === "log")    sub.textContent = "Daily log";
  if (pageName === "review") sub.textContent = "Weekly review";
  if (pageName === "health") sub.textContent = "Health import";
}
