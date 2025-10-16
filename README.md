# Student Finance Tracker

A beginner-friendly, accessible finance tracker web application for students built with vanilla HTML, CSS, and ES modules.

This README summarizes how to run the app, the main features, available keyboard shortcuts, theming behavior, and basic troubleshooting tips.

## Website and Demo Video Links

**Website**: https://nakuwa23.github.io/student_finance_tracker-nakuwa23/

**Youtube**: https://youtu.be/xJXktUqGt9E

## Quick Start (Run Locally)

The app uses ES module imports and must be served over HTTP. From the project root run one of the following in PowerShell:

```powershell
# Start a quick Python HTTP server on port 8000
py -3 -m http.server 8000

# or, if you prefer node-based tooling (install http-server globally or use npx)
npx http-server -p 8000
```

Then open http://localhost:8000 in your browser.

If you use the VS Code Live Server extension, you can set a workspace port (example `.vscode/settings.json`):

```json
{
	"liveServer.settings.port": 5501
}
```

Open http://localhost:5501 if you configured Live Server to use that port.

## Project Structure

The application is organized into the following files and directories:

**Root Files**

`index.html` contains the application shell and semantic layout.

`seed.json` provides optional example data to populate the app on first load.

`tests.html` contains lightweight in-browser tests for validators and search helpers.

**Styles Directory**

`styles/style.css` includes all styles, including the light/dark overrides.

**Scripts Directory**

`scripts/app.js` handles entry, seed loading and initialization.

`scripts/state.js` manages in-memory state and persistence bridge.

`scripts/storage.js` provides localStorage helpers (load/save/import/export).

`scripts/ui.js` handles rendering and event wiring (theme toggle, form handling, keyboard shortcuts).

`scripts/validators.js` performs field validation and normalization.

`scripts/search.js` provides safe regex compile and highlight utility.

## Features

The application supports adding, editing, and deleting transactions with date, description, amount, and category fields. All data persists via `localStorage` for both records and settings.

Search functionality uses regex-powered queries with safe compilation and highlighting. Monthly budget tracking displays a progress bar and balance indicator. A simple chart shows spending over the last seven days.

Users can import and export JSON files for backup and transfer purposes. The interface prioritizes keyboard navigation with quick shortcuts and accessible controls. A light/dark theme toggle persists across sessions.

## Theme Toggle Behavior

The theme button in the header toggles dark mode by adding or removing the `dark` class on the `<html>` element. The current theme saves to settings and persists across page reloads.

The toggle displays a moon icon when light mode is active and a sun icon when dark mode is active. The button uses `aria-pressed` for accessibility.

If the theme doesn't appear to change visually, make sure you are serving the app over HTTP (see Quick Start section) and that `styles/main.css` includes the `html.dark` overrides (it does by default in this repo).

## Keyboard Shortcuts

The following keyboard shortcuts are available throughout the application:

**Navigation Shortcuts**

Press `/` to focus the search input.

Press `n` to focus the Add Transaction form.

Press `t` to go to the Transactions list.

Press `d` to go to the Dashboard.

Press `?` to open the settings page.

Press `tab` to move focus through interactive elements.

**Form Shortcuts**

Press `Ctrl/Cmd + S` to save the Add Transaction form when focused inside it.

Refer to the Settings page inside the app for a short reference of these shortcuts.

## Troubleshooting

**Module Loading Issues**

If you encounter errors about "Cannot use import statement outside a module", make sure you open the app via HTTP (see Quick Start section) and not using the `file://` protocol.

**Theme Toggle Problems**

If the theme toggle appears unresponsive, check the browser console for errors and verify `localStorage` contains the saved settings (open DevTools, navigate to Application, then Local Storage).

**Form Update Issues**

If edit or add operations are not updating, ensure the form fields pass validation (validation messages appear under each field). If you see exceptions, open DevTools Console and paste the error text when reporting.

## Tests

Open `tests.html` in the browser (served over HTTP) to run basic validator and search tests. This page shows pass/fail results for small unit tests used during development.

## Regex Catalog

The following regular expressions are used for validation:

**Description Validation**

Pattern: `/^\S(?:.*\S)?$/`

Purpose: Ensures no leading or trailing spaces.

**Amount Validation**

Pattern: `/^(0|[1-9]\d*)(\.\d{1,2})?$/`

Purpose: Validates integer or decimal with up to 2 places.

**Date Validation**

Pattern: `/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/`

Purpose: Validates the date format.

**Category Validation**

Pattern: `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/`

Purpose: Validates category names with optional spaces or hyphens.

**Advanced Pattern**

Pattern: `/\b(\w+)\s+\1\b/`

Purpose: Detects duplicate words.

## Keyboard Navigation Map

Tab navigates through header, search, add form, and table elements in sequence.

Enter submits forms and activates buttons.

Escape closes modals (if implemented).

## Accessibility Notes

The application uses semantic landmarks including header, nav, main, and footer elements for screen reader navigation.

All interactive elements have visible focus outlines and high-contrast colors for improved visibility.

Status messages use `aria-live` regions for screen reader announcements.

## Contact Information

**Email**: [b.nakuwa@alustudent.com](b.nakuwa@alustudent.com)

**GitHub**: [github.com/nakuwa23](https://github.com/nakuwa23)

**Institution**: African Leadership University