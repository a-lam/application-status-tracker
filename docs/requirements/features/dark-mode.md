# Feature: Dark Mode

> **Last updated:** 2026-04-07
> **Status:** Spec approved — pending implementation

---

## Overview

Add a user-controlled dark mode to the application. Users can switch between light and dark mode manually, and the chosen preference persists across sessions. When no explicit preference is saved the app defaults to the user's OS-level `prefers-color-scheme` setting.

---

## Goals

- Users can switch between light and dark mode manually
- The chosen preference persists across page reloads and browser sessions (`localStorage`)
- When no explicit preference is saved, the app defaults to the user's OS-level `prefers-color-scheme` setting
- All existing WCAG AA contrast requirements continue to be met in both modes
- No new dependencies are introduced

---

## Non-Goals

- Per-page or per-component theme overrides
- System-only dark mode with no manual toggle (user override is required)
- Animated theme transition effects

---

## User Stories

### US-DM-01 — Toggle between light and dark mode

> As a signed-in user, I want to switch the app between light and dark mode from the page menu so that I can use the theme that is most comfortable for me.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-DM-01-1 | I am on the applications list page in light mode | I open the page-level `⋮` menu | I see a "Dark Mode" option above "Logout" |
| AC-DM-01-2 | I am on the applications list page in dark mode | I open the page-level `⋮` menu | I see a "Light Mode" option above "Logout" |
| AC-DM-01-3 | I click the theme toggle menu item | — | The page immediately switches to the opposite theme with no reload |
| AC-DM-01-4 | I switch to dark mode | I reload the page | Dark mode is still active |
| AC-DM-01-5 | I switch to light mode | I reload the page | Light mode is still active |

---

### US-DM-02 — Toggle theme from the login page

> As an unauthenticated user, I want to switch the app theme before signing in so that the login page matches my preferred appearance.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-DM-02-1 | I am on the login page | The page loads | A theme toggle button is visible in the top-right corner of the page |
| AC-DM-02-2 | I click the theme toggle button | — | The page immediately switches to the opposite theme |
| AC-DM-02-3 | I toggle the theme on the login page and then sign in | — | The same theme preference is applied on the applications list page |

---

### US-DM-03 — Respect OS-level preference by default

> As a user, I want the app to match my OS appearance setting when I have not set a preference manually so that I do not have to configure the app separately from my system.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-DM-03-1 | I visit the app for the first time with my OS set to dark mode | The page loads | Dark mode is active |
| AC-DM-03-2 | I visit the app for the first time with my OS set to light mode | The page loads | Light mode is active |
| AC-DM-03-3 | I have not set a manual preference and I change my OS theme while the app is open | — | The app immediately switches to match the new OS theme |
| AC-DM-03-4 | I have set a manual preference via the toggle | I change my OS theme | The app ignores the OS change and retains my saved preference |
| AC-DM-03-5 | I have not set a preference | The page first paints | No flash of the wrong theme is visible before the correct theme is applied |

---

## Persistence & System Preference

| Scenario | Behaviour |
|----------|-----------|
| First visit, OS in dark mode | Dark mode active; no `localStorage` entry written until toggle used |
| First visit, OS in light mode | Light mode active |
| User toggles to dark | `localStorage.setItem('theme', 'dark')` |
| User toggles back to light | `localStorage.setItem('theme', 'light')` |
| User clears localStorage | Falls back to OS preference |
| OS preference changes after toggle | Saved preference wins — OS change has no effect until `localStorage` is cleared |
| OS preference changes, no saved preference | App responds immediately via `matchMedia` event listener |

---

## Functional Requirements

| # | Requirement |
|---|-------------|
| FR-DM-01 | The app must support two themes: `light` and `dark`. The active theme is stored as a `data-theme` attribute on `<html>`. |
| FR-DM-02 | On first visit with no saved preference, the active theme must be derived from `window.matchMedia('(prefers-color-scheme: dark)')`. |
| FR-DM-03 | When the user toggles the theme, the new preference must be persisted to `localStorage` under the key `theme`. |
| FR-DM-04 | The theme must be applied before the first paint — a flash of the wrong theme must not be visible on page load. |
| FR-DM-05 | When no saved preference exists and the user changes their OS theme while the app is open, the app must respond immediately without a reload. |
| FR-DM-06 | The applications list page `⋮` menu must include a theme toggle item labelled "Dark Mode" (when in light mode) or "Light Mode" (when in dark mode), positioned above the "Logout" item. |
| FR-DM-07 | The login page must include an icon-only theme toggle button positioned in the top-right corner, with a minimum touch target of 44 × 44 px. |
| FR-DM-08 | All text/background colour pairs must meet WCAG AA contrast ratios (4.5:1 for body text, 3:1 for large text) in dark mode. |
| FR-DM-09 | No new npm packages may be introduced to implement this feature. |
| FR-DM-10 | The theme toggle button on the login page must have a dynamic `aria-label` ("Switch to dark mode" / "Switch to light mode") and `aria-pressed` reflecting the current dark mode state. |
| FR-DM-11 | Native form controls (inputs, selects, textareas, scrollbars) must render in dark mode styling when dark mode is active, via the CSS `color-scheme` property. |
