# Page: Applications List

> **Last updated:** 2026-04-10 (responsive desktop scaling; mobile due-date position; mobile email visibility)
> **Feature requirements:** [requirements/features/applications-list.md](../../requirements/features/applications-list.md)
> **Technical module:** [technical/modules/applications-list-module.md](../../technical/modules/applications-list-module.md)

---

## Purpose

The applications list page is the main screen of the application. It gives signed-in users a complete, urgency-ranked view of every job application they are tracking. Users can update status, edit, or delete any application directly from this page.

Users land here after signing in and whenever they return to the app.

---

## Components Used

| Component | Role |
|-----------|------|
| `ApplicationsListPage` | Page shell, owns fetch state, renders layout; contains the add-application button, the authenticated user's email address, the aria-live announcement region, and the page-level kebab menu |
| `ApplicationList` | Renders the ordered list of cards |
| `ApplicationCard` | Displays one application with urgency colour applied |
| `KebabMenu` | Three-dot menu on each card; exposes Update Status, Edit, Delete actions |
| `DeleteConfirmDialog` | Native `<dialog>` modal prompt shown before a delete is confirmed |
| `ArtifactsPanel` | Collapsible artifact completion panel rendered inside each `ApplicationCard` |
| `EmptyState` | Shown when the user has no applications |

---

## Application Status

| Value | Display label | Meaning |
|-------|--------------|---------|
| `NOT_SUBMITTED` | Not Submitted | Application has been created but not yet sent |
| `SUBMITTED` | Submitted | Application has been sent to the employer |
| `INTERVIEWING` | Interviewing | Actively in the interview process |
| `OFFER_RECEIVED` | Offer Received | An offer has been received, pending decision |
| `OFFER_ACCEPTED` | Offer Accepted | The offer has been accepted |
| `OFFER_DECLINED` | Offer Declined | The offer has been declined |
| `REJECTED` | Rejected | A rejection has been received |
| `WITHDRAWN` | Withdrawn | The application has been withdrawn |

Status is displayed as a small pill/badge positioned below the employer line inside `.app-card__title-group`. It is not rendered inline with the job title. New applications default to `NOT_SUBMITTED`.

### Status badge colours

| Status | Light mode badge | Dark mode badge |
|--------|-----------------|-----------------|
| `NOT_SUBMITTED` | Grey | Grey |
| `SUBMITTED` | Blue | Blue |
| `INTERVIEWING` | Purple | Purple |
| `OFFER_RECEIVED` | Amber | Amber |
| `OFFER_ACCEPTED` | Green (bold) | Green (bold) |
| `OFFER_DECLINED` | Orange | Orange |
| `REJECTED` | Red | Red |
| `WITHDRAWN` | Grey | Grey |

Dark-mode badge colour tokens reuse and extend the existing `.urgency-badge--*` CSS classes defined in [design/dark-mode.md](../dark-mode.md).

---

## Colour Coding

The background colour of each `ApplicationCard` is determined by **status first, deadline second**, evaluated at page load.

| Status group | Deadline condition | Light bg | Dark bg |
|---|---|---|---|
| `REJECTED`, `WITHDRAWN`, `OFFER_DECLINED` | Any | Light grey (`#f0f0f0`) | `#1e2939` |
| `NOT_SUBMITTED` | Past (today > due date) | Light red (`#fde8e8`) | `#3b0f0f` |
| `NOT_SUBMITTED` | 0–3 days away | Light yellow (`#fef9c3`) | `#3b2508` |
| `NOT_SUBMITTED` | 4+ days away | Light green (`#dcfce7`) | `#052e16` |
| `SUBMITTED`, `INTERVIEWING`, `OFFER_RECEIVED`, `OFFER_ACCEPTED` | Any | Light green (`#dcfce7`) | `#052e16` |

Cards with status `OFFER_ACCEPTED` additionally render with a **bold border** to visually distinguish them from all other cards at a glance. In light mode this is `3px solid #000`; in dark mode it is `3px solid rgba(255,255,255,0.75)`.

All cards scope the CSS custom property `--text-3` to `#4b5563` (darker than the global value of `#6b7280`). This ensures secondary text elements — employer name, description label, artifacts arrow — achieve a contrast ratio of at least 4.5:1 against every light urgency-band background, meeting WCAG AA. In dark mode this scoped value is overridden to `#d1d5db`, which passes 4.5:1 on all four dark urgency band backgrounds. Description body text uses `color: var(--text)` for full primary contrast. Status is no longer rendered as `--text-3` inline text; it is now a coloured badge whose text and background are chosen to meet WCAG AA independently.

Dark-mode urgency band colours are defined in [design/dark-mode.md](../dark-mode.md).

---

## User Interactions

### On page load

- The page fetches all applications for the current user
- Applications are displayed in due-date order, earliest at the top
- Each card receives its urgency colour band automatically
- The add-application button is always visible regardless of list state
- The page-level `⋮` menu is always visible in the top-right corner

### Empty state

When the user has no applications:
- A friendly message is shown explaining the list is empty
- A call-to-action prompts the user to add their first application (same action as the add-application button)

### Add application

- Clicking the add-application button navigates to the add-application flow at `/applications/new`
- At viewports wider than 480 px the button reads `+ Add an application`
- At viewports 480 px wide and narrower the button collapses to `+` only

### Session expiry

If the user's session expires while they are on this page, they are automatically signed out and redirected to the sign-in page. No action or page reload is required — the client polls the server periodically and acts immediately when the session is found to be invalid.

### Page menu (top-right `⋮`)

The page header contains the authenticated user's email address displayed as plain text, immediately followed by a `⋮` (three-dot vertical) icon in the top-right corner. The email is visible at all viewport widths; on narrow mobile viewports (≤ 480 px) it is capped to the available space and truncated with an ellipsis rather than hidden. Clicking the icon opens a small dropdown with:

1. **Dark Mode / Light Mode** — toggles between light and dark mode; the label reads "Dark Mode" when the app is in light mode and "Light Mode" when in dark mode
2. **Logout** — ends the user's session server-side and redirects to the sign-in page

### Kebab menu

Each card has a `⋮` (three-dot vertical) icon in the top-right corner. Clicking it opens a small dropdown menu with three options:

1. **Update Status ▶**
   - Hovering or clicking reveals a submenu listing all 7 statuses that are not the application's current status
   - Selecting a status immediately updates the application (no confirmation required) and closes both menus; the card title line updates in place
   - A screen-reader announcement confirms the result (e.g. "Software Engineer at Acme marked as Interviewing.")

2. **Edit Application**
   - Navigates to `/applications/:id/edit`
   - The edit page is identical in layout to the add-application page, with all existing field values pre-filled
   - The user can change any field and save; on success they are returned to the list with the updated card
   - A Cancel button discards changes and returns to the list

3. **Delete Application**
   - Opens a modal confirmation dialog before any data is removed
   - The dialog explains that the action is permanent and cannot be undone
   - The dialog offers two actions: **Confirm Delete** (destructive, styled in red) and **Cancel**
   - Cancelling closes the dialog and leaves the application unchanged
   - Confirming sends the delete request; on success the card is removed from the list

Clicking outside the open menu closes it without taking any action.

---

## Wireframe Description

### Populated list — desktop

```
┌────────────────────────────────────────────────────────────────┐
│  [+ Add an application]           user@example.com   [⋮]       │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ bgcolor: light red                                       │   │
│ │  Senior Frontend Engineer                                │   │
│ │                              Due: 29 Mar 2026        [⋮] │   │  ← due + kebab vertically centered with title group
│ │  Acme Corp                                               │   │
│ │  [Not Submitted]                                         │   │  ← status badge, grey pill
│ │  ─────────────────────────────────────────────────────   │   │  ← separator between header and metadata
│ │  View Job Listing →                                      │   │
│ │  $90,000–$120,000 CAD                                    │   │
│ │                                                          │   │
│ │  Job Description:                                        │   │
│ │  We are looking for an experienced engineer...           │   │
│ │  [show more]  ← only shown when text > 6 lines           │   │
│ │                                                          │   │
│ │  ▶ Show artifacts (2/3 completed)                       │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ bgcolor: light yellow                                    │   │
│ │  Product Designer                                        │   │
│ │                    Due: 3 Apr 2026 (2 days away)     [⋮] │   │  ← due + kebab vertically centered with title group
│ │  Globex Inc                                              │   │
│ │  [Not Submitted]                                         │   │  ← status badge, grey pill
│ │  ─────────────────────────────────────────────────────   │   │  ← separator
│ │  $70,000+ CAD                                            │   │
│ │                                                          │   │
│ │  Job Description:                                        │   │
│ │  Designing for a platform used by millions...            │   │
│ │  [show more]  ← only shown when text > 6 lines           │   │
│ │                                                          │   │
│ │  ▶ Show artifacts (0/3 completed)                       │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ bgcolor: light green                                     │   │
│ │  Backend Engineer                                        │   │
│ │                    Due: 20 Apr 2026 (19 days away)   [⋮] │   │  ← due + kebab vertically centered with title group
│ │  Initech                                                 │   │
│ │  [Not Submitted]                                         │   │  ← status badge, grey pill
│ │  ─────────────────────────────────────────────────────   │   │  ← separator
│ │                                                          │   │
│ │  Job Description:                                        │   │
│ │  Join our infrastructure team to build...                │   │
│ │                                                          │   │
│ │  ▶ Show artifacts (0/2 completed)                       │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ bgcolor: light grey                                      │   │
│ │  Full Stack Developer                                    │   │
│ │                              Due: 10 Mar 2026        [⋮] │   │  ← due + kebab vertically centered with title group
│ │  Umbrella Ltd                                            │   │
│ │  [Withdrawn]                                             │   │  ← status badge, grey pill
│ │  ─────────────────────────────────────────────────────   │   │  ← separator
│ │                                                          │   │
│ │  Job Description:                                        │   │
│ │  A fast-growing SaaS company...                          │   │
│ │                                                          │   │
│ │  ▶ Show artifacts (2/2 completed)                       │   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

> **Note:** Dates shown relative to today (1 Apr 2026) for illustration. Acme Corp (Not Submitted, past due) = red — the deadline has passed and the application was never submitted. Globex Inc (Not Submitted, 2 days away) = yellow — deadline is within 3 days; submit soon. Initech (Not Submitted, 19 days away) = green — plenty of time. Umbrella Ltd (Withdrawn) = grey — resolved unfavourably; no further action warranted. Acme Corp shows a full salary range; Globex Inc shows a min-only salary; Initech and Umbrella Ltd have no salary data so no salary line is rendered.

### Populated list — mobile (≤ 480 px)

```
┌────────────────────────────────┐
│  [+]      andy@example…   [⋮]  │  ← email truncated with ellipsis if too long; button collapses to "+"
├────────────────────────────────┤
│ ┌──────────────────────────┐   │
│ │ bgcolor: light red       │   │
│ │  Senior Frontend         │   │
│ │  Engineer                │   │
│ │  Acme Corp               │   │
│ │  Due: 3 Apr 2026         │   │  ← due date moves under employer; kebab stays top-right
│ │  (2 days away)           │   │
│ │  [Submitted]         [⋮] │   │  ← status badge, blue pill; kebab vertically centered in actions col
│ │  ───────────────────     │   │  ← separator
│ │  $90,000–$120,000 CAD    │   │
│ │                          │   │
│ │  Job Description:        │   │
│ │  We are looking for...   │   │
│ │  [show more]             │   │
│ │                          │   │
│ │  ▶ Show artifacts (2/3)  │   │
│ └──────────────────────────┘   │
└────────────────────────────────┘
```

### Artifacts panel — expanded state

```
│ ┌──────────────────────────────────────────────────────────┐   │
│ │  Senior Frontend Engineer                                │   │
│ │                    Due: 3 Apr 2026 (2 days away)     [⋮] │   │  ← due + kebab vertically centered with title group
│ │  Acme Corp                                               │   │
│ │  [Submitted]                                             │   │  ← status badge, blue pill
│ │  ─────────────────────────────────────────────────────   │   │  ← separator
│ │  $90,000–$120,000 CAD                                    │   │
│ │                                                  │   │
│ │  Job Description:                                        │   │
│ │  We are looking for an experienced engineer...           │   │
│ │  [show more]                                             │   │
│ │                                                          │   │
│ │  ▼ Hide artifacts (2/3 completed)                       │   │
│ │    ☑ CV                                                 │   │
│ │    ☑ Cover Letter                                       │   │
│ │    ☐ Portfolio                                          │   │
│ └──────────────────────────────────────────────────────────┘   │
```

> Clicking the `▼ Hide artifacts (2/3 completed)` header collapses the panel and the label reverts to `▶ Show artifacts (2/3 completed)`. Clicking a checkbox immediately updates the checked state and recalculates the count in the header.

---

### Kebab menu open (example: Not Submitted application)

```
│ ┌──────────────────────────────────────────────────────────┐   │
│ │  Product Designer                                        │   │
│ │          Due: 6 Apr 2026 (5 days away)           [⋮] ←  │   │  ← due + kebab vertically centered
│ │  Globex Inc                          ┌────────────┤      │   │
│ │  [Not Submitted]                                         │   │
│ │                        Update Status ▶            │      │   │
│ │                        Edit Application           │      │   │
│ │                        Delete Application         │      │   │
│ │                                      └────────────┘      │   │
│ └──────────────────────────────────────────────────────────┘   │

### Status submenu open

│ ┌──────────────────────────────────────────────────────────┐   │
│ │  Product Designer                                        │   │
│ │          Due: 6 Apr 2026 (5 days away)           [⋮] ←  │   │  ← due + kebab vertically centered
│ │  Globex Inc                ┌─────────────┬───────────────┤   │
│ │  [Not Submitted]                                         │   │
│ │            Update Status ▶  Submitted    │               │   │
│ │            Edit Applicati│  Interviewing │               │   │
│ │            Delete Applic.│  Offer Received               │   │
│ │                          │  Offer Accepted               │   │
│ │                          │  Offer Declined               │   │
│ │                          │  Rejected     │               │   │
│ │                          │  Withdrawn    │               │   │
│ │                          └───────────────┘               │   │
│ └──────────────────────────────────────────────────────────┘   │
```

### Delete confirmation dialog

```
┌─────────────────────────────────────────┐
│  Delete Application                     │
│                                         │
│  Are you sure you want to delete        │
│  "Product Designer" at Globex Inc?      │
│                                         │
│  This action cannot be undone.          │
│                                         │
│  ┌─────────────────┐  ┌──────────────┐  │
│  │  Confirm Delete │  │    Cancel    │  │
│  └─────────────────┘  └──────────────┘  │
│  (red / destructive)                    │
└─────────────────────────────────────────┘
```

### Page menu open

```
┌────────────────────────────────────────────────────────┐
│  [+ Add an application]       user@example.com   [⋮] ← │
│                                            ┌──────────┤ │
│                                  Dark Mode │           │ │
│                                     Logout │           │ │
│                                            └──────────┘ │
└────────────────────────────────────────────────────────┘
```

> The first menu item label reads "Dark Mode" when in light mode and "Light Mode" when in dark mode.

### Empty state

```
┌────────────────────────────────────────────────────────┐
│  [+ Add an application]       user@example.com   [⋮]   │
├────────────────────────────────────────────────────────┤
│                                                        │
│                                                        │
│              No applications yet.                      │
│                                                        │
│       [Add your first application]                     │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Application Card — Field Layout

Each card consistently presents fields in the same order:

```
┌────────────────────────────────────────────────────────────┐
│  [Job Title]                     Due: [date str]       [⋮] │  ← due date + kebab grouped right,
│  [Employer — italic, smaller]                              │     vertically centered with title group
│  [Status badge — pill]                                     │
│  ─────────────────────────────────────────────────────     │  ← separator between header and metadata
│  [View Job Listing →]  ← only rendered when present        │
│  [Salary range — omitted when no salary present]           │
│                                                            │
│  Job Description:                                          │
│  [Description text — clamped to 6 lines]                   │
│  [show more]  ← only rendered when text overflows          │
│                                                            │
│  ▶ Show artifacts (X/Y completed)  ← collapsed             │
└────────────────────────────────────────────────────────────┘

Expanded:

┌──────────────────────────────────────────────────┐
│  ...                                             │
│  ▼ Hide artifacts (X/Y completed)  ← expanded    │
│    ☑ [Artifact label]                            │
│    ☐ [Artifact label]                            │
│    ☐ [Artifact label]                            │
└──────────────────────────────────────────────────┘
```

**Status display:**
- Rendered as a small pill/badge positioned below the employer line inside `.app-card__title-group`
- Order within title group (desktop): Job Title → Employer → Status badge
- Order within title group (mobile ≤ 480 px): Job Title → Employer → Due date → Status badge (due date moves here from the actions column so the title is not squeezed)
- Badge colour reflects the application status — see [Status badge colours](#status-badge-colours) above
- Full enum-to-label mapping: see [Application Status](#application-status) table above

**Date string format:**
- Past due: `D Mon YYYY` — e.g. "10 Mar 2026"
- Due today: `D Mon YYYY (Today)` — e.g. "1 Apr 2026 (Today)"
- Future: `D Mon YYYY (N days away)` — e.g. "20 Apr 2026 (19 days away)"

**Job Listing URL display:**
- When present: rendered as a `"View Job Listing →"` link directly below the due date line, above the salary line; opens in a new browser tab
- When absent: the link is not rendered at all

**Salary display:**
- Currency symbol precedes each amount; currency code follows at the end
- Both min and max present: `$80,000–$120,000 CAD`
- Min only: `$80,000+ CAD`
- Max only: `up to $120,000 CAD`
- Neither present: salary line is not rendered at all
- Currency symbol mapping: CAD → $, USD → $, EUR → €, GBP → £, AUD → $, JPY → ¥, KRW → ₩

**Typography:**
- Job title: `1.0625rem–1.125rem`, `font-weight: 700` — larger than body text to anchor each card visually
- Employer: `0.85rem`, italic — smaller than the job title
- Due date: `0.875rem` — slightly larger than its previous `0.8125rem` to increase prominence
- Inline metadata labels (SALARY:, JOB START:): `0.8125rem`, bold, uppercase — raised from `0.75rem` for legibility
- Description body text: `color: var(--text)` — full-contrast primary text colour, not `var(--text-2)`, to ensure readability against all urgency-band backgrounds

**Responsive scaling (≥ 900 px):**

At viewports 900 px wide and wider the card container expands from 760 px to 900 px and all card text scales up by ~1.18×:

| Element | Default | ≥ 900 px |
|---|---|---|
| Page / section heading | `1.5rem` | `1.75rem` |
| Card padding | `1.1rem 1.25rem` | `1.3rem 1.5rem` |
| Job title | `1.0625rem` | `1.25rem` |
| Employer / due / job-start / listing link / salary / description | `0.875rem` | `1.025rem` |
| Description label / inline metadata labels | `0.75rem` | `0.875rem` |
| Card list gap | `0.875rem` | `1rem` |

---

## Accessibility Notes

- Each card must have a descriptive `aria-label` (e.g. "Application: Senior Frontend Engineer at Acme Corp")
- Colour alone must not be the only indicator of urgency — the days-remaining text in the due date (e.g. "(3 days away)", "(Today)") provides a secondary, non-colour cue for users with colour vision deficiency
- The add-application button carries `aria-label="Add an application"` at all viewport widths. Both the full-text span and the compact `+` span are `aria-hidden`; the accessible name comes entirely from the `aria-label`
- The user email in the header is presentational (`aria-hidden="true"`); it must not receive keyboard focus and does not require an interactive role. It is visible at all viewport widths; on ≤ 480 px it truncates with an ellipsis rather than disappearing
- The page-level `⋮` button must have `aria-label="Page options"` and must manage `aria-expanded` and `aria-haspopup="menu"`; clicking outside must close the menu without taking any action
- The per-card kebab `⋮` button must have an `aria-label` identifying the application (e.g. "Options for Senior Frontend Engineer at Acme Corp") and must manage `aria-expanded` and `aria-haspopup="menu"`
- Each menu item inside the kebab dropdown must be a `role="menuitem"` element; the dropdown itself must be `role="menu"`
- After a successful status update, a visually-hidden `aria-live="polite" role="status"` region is updated with a confirmation string (e.g. "Software Engineer at Acme marked as Interviewing.") so screen readers announce the outcome without moving focus
- The delete confirmation dialog is implemented using a native `<dialog>` element with `showModal()`. The browser provides top-layer stacking, automatic focus trapping, and Escape-key handling. The dialog carries `aria-labelledby` pointing to its heading. On close, focus returns to the element that triggered the dialog
- The "show more" / "show less" description toggle must have a descriptive `aria-label` and must update `aria-expanded` accordingly
- The "show more" control must not be rendered at all when the description does not overflow 6 lines — do not render it hidden, as screen readers would still announce it
- The artifacts panel toggle must use a `<button>` element with `aria-expanded` set to `"true"` or `"false"` reflecting the current panel state, and `aria-controls` pointing to the panel's content element. The button label reads "Show artifacts (X/Y completed)" when collapsed and "Hide artifacts (X/Y completed)" when expanded, making the action explicit without relying on `aria-expanded` alone
- Each artifact checkbox must have an accessible label (a wrapping `<label>` element) containing the artifact's label text
- The artifact list container must have `role="list"` and each row must be `role="listitem"` so screen readers announce the structure correctly
- All interactive controls (kebab trigger buttons, artifacts panel toggle, add-application button) must have a minimum touch target size of 44 × 44 px
- All CSS transitions must be disabled when `prefers-reduced-motion: reduce` is set at the OS level
- The "View Job Listing →" link must include `rel="noopener noreferrer"` when `target="_blank"` is set, and must have a visually-hidden screen-reader supplement if the link text alone is not sufficiently descriptive in context (e.g. `<span class="sr-only"> for [Job Title] at [Employer]</span>`)
- Secondary text within cards (employer name, description label, artifacts arrow) must achieve a contrast ratio of at least 4.5:1 against all urgency-band backgrounds. This is enforced by scoping `--text-3` to `#4b5563` within `.app-card`. Description body text uses `color: var(--text)` (full primary contrast) rather than `var(--text-2)`. Status badge colours must also achieve ≥ 4.5:1 contrast against their badge background in both light and dark modes
