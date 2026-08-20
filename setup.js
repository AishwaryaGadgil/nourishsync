// ─────────────────────────────────────────────────────────────
// setup.js — Credential Management
//
// This file has one job:
//   Store SHEET_URL and APP_PASSWORD securely on your iPhone
//   using localStorage — never on GitHub, never in the code.
//
// HOW IT WORKS:
//   First launch:
//     - Shows the setup page asking for URL and password
//     - You paste them in and tap "Save and open app"
//     - They are saved to localStorage on your iPhone only
//     - App opens and works normally
//
//   Every launch after that:
//     - Reads credentials from localStorage silently
//     - Sets SHEET_URL and APP_PASSWORD variables for other files
//     - Shows main app directly — setup page never shows again
//
//   Updating credentials:
//     - Tap the gear icon in the top bar
//     - Setup page appears pre-filled with current values
//     - Edit and save — new values stored immediately
//
// SECURITY:
//   localStorage is stored only on your iPhone.
//   It is never sent to GitHub or any server.
//   config.js on GitHub has empty placeholders instead.
//   The actual values only ever live on your device.
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// localStorage key names
// These are the keys used to store credentials on your iPhone.
// Changing these would require re-entering credentials.
// ─────────────────────────────────────────────────────────────

var STORAGE_KEY_URL      = "nourishsync_sheet_url";
var STORAGE_KEY_PASSWORD = "nourishsync_password";


// ─────────────────────────────────────────────────────────────
// initApp
// Runs immediately when setup.js loads.
// Checks if credentials exist in localStorage.
// Shows setup page or main app accordingly.
// ─────────────────────────────────────────────────────────────

function initApp() {

  // Try to read credentials from localStorage
  var storedUrl      = localStorage.getItem(STORAGE_KEY_URL);
  var storedPassword = localStorage.getItem(STORAGE_KEY_PASSWORD);

  if (storedUrl && storedPassword) {

    // ── Credentials found — load them into global variables ───
    // This sets SHEET_URL and APP_PASSWORD so save.js,
    // prefill.js and all other files can use them normally
    SHEET_URL    = storedUrl;
    APP_PASSWORD = storedPassword;

    // Show the main app — hide the setup page
    showMainApp();

  } else {

    // ── No credentials found — first launch ───────────────────
    // Show the setup page so user can enter their credentials
    showSetup(false);
  }
}


// ─────────────────────────────────────────────────────────────
// saveSetup
// Called when user taps "Save and open app" on setup page.
// Validates the inputs, saves to localStorage, opens main app.
// ─────────────────────────────────────────────────────────────

function saveSetup() {

  var urlInput      = document.getElementById("setup-url");
  var passwordInput = document.getElementById("setup-password");
  var errorEl       = document.getElementById("setup-error");

  var url      = urlInput      ? urlInput.value.trim()      : "";
  var password = passwordInput ? passwordInput.value.trim() : "";

  // ── Validation ────────────────────────────────────────────

  // Check URL is not empty
  if (!url) {
    showSetupError("Please enter your Google Apps Script URL.");
    urlInput.focus();
    return;
  }

  // Check URL looks correct — must contain script.google.com
  if (url.indexOf("script.google.com") === -1) {
    showSetupError(
      "That URL doesn't look right. It should start with " +
      "https://script.google.com/macros/s/..."
    );
    urlInput.focus();
    return;
  }

  // Check URL ends with /exec not /dev
  if (url.indexOf("/exec") === -1) {
    showSetupError(
      "Your URL should end with /exec — make sure you copied " +
      "the Web App URL, not the test URL."
    );
    urlInput.focus();
    return;
  }

  // Check password is not empty
  if (!password) {
    showSetupError("Please enter your app password.");
    passwordInput.focus();
    return;
  }

  // ── Save to localStorage ──────────────────────────────────
  // These values are stored only on this iPhone
  localStorage.setItem(STORAGE_KEY_URL,      url);
  localStorage.setItem(STORAGE_KEY_PASSWORD, password);

  // Update the global variables immediately
  // so the rest of the app can use them right away
  SHEET_URL    = url;
  APP_PASSWORD = password;

  // ── Open the main app ─────────────────────────────────────
  showMainApp();
}


// ─────────────────────────────────────────────────────────────
// showSetup
// Shows the setup page and hides the main app.
// Pre-fills with existing credentials if updating.
//
// isUpdate: true  = user tapped gear icon to update credentials
//           false = first launch, fields start empty
// ─────────────────────────────────────────────────────────────

function showSetup(isUpdate) {

  var setupPage = document.getElementById("setup-page");
  var mainApp   = document.getElementById("main-app");

  if (setupPage) setupPage.style.display = "block";
  if (mainApp)   mainApp.style.display   = "none";

  // If updating — pre-fill with current stored values
  // so user can see what's there and only change what they need
  if (isUpdate) {
    var storedUrl      = localStorage.getItem(STORAGE_KEY_URL)      || "";
    var storedPassword = localStorage.getItem(STORAGE_KEY_PASSWORD) || "";

    var urlInput      = document.getElementById("setup-url");
    var passwordInput = document.getElementById("setup-password");

    if (urlInput)      urlInput.value      = storedUrl;
    if (passwordInput) passwordInput.value = storedPassword;

    // Update the header text to reflect this is an update
    var title = document.querySelector(".setup-title");
    var sub   = document.querySelector(".setup-sub");
    if (title) title.textContent = "Update credentials";
    if (sub)   sub.textContent   = "Changes are saved to this device only";
  }

  // Clear any previous error message
  hideSetupError();
}


// ─────────────────────────────────────────────────────────────
// showMainApp
// Hides the setup page and shows the main app.
// Called after credentials are confirmed valid.
// ─────────────────────────────────────────────────────────────

function showMainApp() {

  var setupPage = document.getElementById("setup-page");
  var mainApp   = document.getElementById("main-app");

  if (setupPage) setupPage.style.display = "none";
  if (mainApp)   mainApp.style.display   = "flex";

  // Set the flexbox direction for the main app layout
  // (topbar + content + nav stacked vertically)
  if (mainApp) mainApp.style.flexDirection = "column";
  if (mainApp) mainApp.style.height        = "100vh";
}


// ─────────────────────────────────────────────────────────────
// showSetupError
// Shows a red error message on the setup page.
// ─────────────────────────────────────────────────────────────

function showSetupError(message) {
  var errorEl = document.getElementById("setup-error");
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.add("visible");
}


// ─────────────────────────────────────────────────────────────
// hideSetupError
// Hides the error message on the setup page.
// ─────────────────────────────────────────────────────────────

function hideSetupError() {
  var errorEl = document.getElementById("setup-error");
  if (!errorEl) return;
  errorEl.classList.remove("visible");
  errorEl.textContent = "";
}


// ─────────────────────────────────────────────────────────────
// clearCredentials
// Removes all stored credentials from localStorage.
// Could be used for troubleshooting or resetting the app.
// Not exposed in the UI by default — available in console.
// To use: open browser console and type clearCredentials()
// ─────────────────────────────────────────────────────────────

function clearCredentials() {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_PASSWORD);
  SHEET_URL    = "";
  APP_PASSWORD = "";
  showSetup(false);
  console.log("NourishSync: Credentials cleared.");
}


// ─────────────────────────────────────────────────────────────
// Run initApp immediately when this script loads
// This is the very first thing that runs in the app —
// before form.js, save.js or any other file does anything.
// ─────────────────────────────────────────────────────────────

initApp();
