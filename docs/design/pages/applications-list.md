# Page: Applications List

> **Last updated:** 2026-04-07
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

Status is displayed inline in the job title line as plain text in parentheses — not as a badge or chip. New applications default to `NOT_SUBMITTED`.

---

## Colour Coding

The background colour of each `ApplicationCard` is determined by **status first, deadline second**, evaluated at page load.

| Status group | Deadline condition | Background |
|---|---|---|
| `REJECTED`, `WITHDRAWN`, `OFFER_DECLINED` | Any | Light grey (`#f0f0f0`) — resolved unfavourably; no action warranted |
| `NOT_SUBMITTED` | Past (today > due date) | Light red (`#fde8e8`) — missed the window to submit |
| `NOT_SUBMITTED` | 0–3 days away | Light yellow (`#fef9c3`) — submit soon |
| `NOT_SUBMITTED` | 4+ days away | Light green (`#dcfce7`) — plenty of time |
| `SUBMITTED`, `INTERVIEWING`, `OFFER_RECEIVED`, `OFFER_ACCEPTED` | Any | Light green (`#dcfce7`) — active in the pipeline |

Cards with status `OFFER_ACCEPTED` additionally render with a **bold black border** (thicker than the default card border) to visually distinguish them from all other cards at a glance.

All cards scope the CSS custom property `--text-3` to `#4b5563` (darker than the global value of `#6b7280`). This ensures secondary text elements — employer name, description label, status text, artifacts arrow — achieve a contrast ratio of at least 4.5:1 against every urgency-band background, meeting WCAG AA.

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

The page header contains the authenticated user's email address (hidden on mobile viewports ≤ 480 px) displayed as plain text, immediately followed by a `⋮` (three-dot vertical) icon in the top-right corner. Clicking the icon opens a small dropdown with:

1. **Logout** — ends the user's session server-side and redirects to the sign-in page

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
┌────────────────────────────────────────────────────────┐
│  [+ Add an application]       user@example.com   [⋮]   │
├────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐   │
│ │ bgcolor: light red                               │   │
│ │  Senior Frontend Engineer (Not Submitted)    [⋮] │   │
│ │  Acme Corp              Due: 29 Mar 2026          │   │
│ │  View Job Listing →                              │   │
│ │  $90,000–$120,000 CAD                            │   │
│ │                                                  │   │
│ │  Job Description:                                │   │
│ │  We are looking for an experienced engineer...   │   │
│ │  [show more]  ← only shown when text > 6 lines   │   │
│ │                                                  │   │
│ │  ▶ Show artifacts (2/3 completed)               │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ bgcolor: light yellow                            │   │
│ │  Product Designer (Not Submitted)            [⋮] │   │
│ │  Globex Inc       Due: 3 Apr 2026 (2 days away)  │   │
│ │  $70,000+ CAD                                    │   │
│ │                                                  │   │
│ │  Job Description:                                │   │
│ │  Designing for a platform used by millions...    │   │
│ │  [show more]  ← only shown when text > 6 lines   │   │
│ │                                                  │   │
│ │  ▶ Show artifacts (0/3 completed)               │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ bgcolor: light green                             │   │
│ │  Backend Engineer (Not Submitted)            [⋮] │   │
│ │  Initech       Due: 20 Apr 2026 (19 days away)   │   │
│ │                                                  │   │
│ │  Job Description:                                │   │
│ │  Join our infrastructure team to build...        │   │
│ │                                                  │   │
│ │  ▶ Show artifacts (0/2 completed)               │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ bgcolor: light grey                              │   │
│ │  Full Stack Developer (Withdrawn)            [⋮] │   │
│ │  Umbrella Ltd          Due: 10 Mar 2026           │   │
│ │                                                  │   │
│ │  Job Description:                                │   │
│ │  A fast-growing SaaS company...                  │   │
│ │                                                  │   │
│ │  ▶ Show artifacts (2/2 completed)               │   │
│ └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

> **Note:** Dates shown relative to today (1 Apr 2026) for illustration. Acme Corp (Not Submitted, past due) = red — the deadline has passed and the application was never submitted. Globex Inc (Not Submitted, 2 days away) = yellow — deadline is within 3 days; submit soon. Initech (Not Submitted, 19 days away) = green — plenty of time. Umbrella Ltd (Withdrawn) = grey — resolved unfavourably; no further action warranted. Acme Corp shows a full salary range; Globex Inc shows a min-only salary; Initech and Umbrella Ltd have no salary data so no salary line is rendered.

### Populated list — mobile (≤ 480 px)

```
┌────────────────────────────────┐
│  [+]                      [⋮]  │  ← email hidden; button collapses to "+"
├────────────────────────────────┤
│ ┌──────────────────────────┐   │
│ │ bgcolor: light red       │   │
│ │  Senior Frontend         │   │
│ │  Engineer (Submitted) [⋮]│   │
│ │  Acme Corp               │   │  ← employer and due date stack vertically
│ │  Due: 3 Apr 2026         │   │
│ │  (2 days away)           │   │
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
│ ┌──────────────────────────────────────────────────┐   │
│ │  Senior Frontend Engineer (Submitted)        [⋮] │   │
│ │  Acme Corp        Due: 3 Apr 2026 (2 days away)  │   │
│ │  $90,000–$120,000 CAD                            │   │
│ │                                                  │   │
│ │  Job Description:                                │   │
│ │  We are looking for an experienced engineer...   │   │
│ │  [show more]                                     │   │
│ │                                                  │   │
│ │  ▼ Hide artifacts (2/3 completed)               │   │
│ │    ☑ CV                                         │   │
│ │    ☑ Cover Letter                               │   │
│ │    ☐ Portfolio                                  │   │
│ └──────────────────────────────────────────────────┘   │
```

> Clicking the `▼ Hide artifacts (2/3 completed)` header collapses the panel and the label reverts to `▶ Show artifacts (2/3 completed)`. Clicking a checkbox immediately updates the checked state and recalculates the count in the header.

---

### Kebab menu open (example: Not Submitted application)

```
│ ┌──────────────────────────────────────────────────┐   │
│ │  Product Designer (Not Submitted)        [⋮] ←  │   │
│ │  Globex Inc   Due: 6 Apr 2026 (5 days away)  │   │   │
│ │                                    ┌────────────┤   │
│ │                      Update Status ▶            │   │
│ │                      Edit Application           │   │
│ │                      Delete Application         │   │
│ │                                    └────────────┘   │
│ └──────────────────────────────────────────────────┘   │

### Status submenu open

│ ┌──────────────────────────────────────────────────┐   │
│ │  Product Designer (Not Submitted)        [⋮] ←  │   │
│ │  Globex Inc   Due: 6 Apr 2026 (5 days away)  │   │   │
│ │                          ┌─────────────┬─────────┤   │
│ │            Update Status ▶  Submitted  │         │   │
│ │            Edit Applicati│  Interviewing         │   │
│ │            Delete Applic.│  Offer Received       │   │
│ │                          │  Offer Accepted       │   │
│ │                          │  Offer Declined       │   │
│ │                          │  Rejected             │   │
│ │                          │  Withdrawn │          │   │
│ │                          └────────────┘          │   │
│ └──────────────────────────────────────────────────┘   │
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
│                                                ┌──────┤ │
│                                           Logout│      │ │
│                                                └──────┘ │
└────────────────────────────────────────────────────────┘
```

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
┌──────────────────────────────────────────────────┐
│  [Job Title] ([Status])                      [⋮] │
│  [Employer — italic, smaller]   Due: [date str]   │
│  [View Job Listing →]  ← only rendered when present │
│  [Salary range — omitted when no salary present]  │
│                                                   │
│  Job Description:                                 │
│  [Description text — clamped to 6 lines]          │
│  [show more]  ← only rendered when text overflows │
│                                                   │
│  ▶ Show artifacts (X/Y completed)  ← collapsed    │
└──────────────────────────────────────────────────┘

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
- Rendered inline with the job title, e.g. `Job Title (Submitted)`, `Job Title (Interviewing)`, `Job Title (Rejected)`
- Plain text — no badge, chip, or colour applied to the status text itself
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

**Employer typography:**
- Font size: smaller than the job title (e.g. `0.85rem` vs `1rem`)
- Font style: italic

---

## Accessibility Notes

- Each card must have a descriptive `aria-label` (e.g. "Application: Senior Frontend Engineer at Acme Corp")
- Colour alone must not be the only indicator of urgency — the days-remaining text in the due date (e.g. "(3 days away)", "(Today)") provides a secondary, non-colour cue for users with colour vision deficiency
- The add-application button carries `aria-label="Add an application"` at all viewport widths. Both the full-text span and the compact `+` span are `aria-hidden`; the accessible name comes entirely from the `aria-label`
- The user email in the header is presentational (`aria-hidden="true"`); it must not receive keyboard focus and does not require an interactive role. It is hidden at mobile viewports (≤ 480 px) via CSS
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
- Secondary text within cards (employer name, status, description label, artifacts arrow) must achieve a contrast ratio of at least 4.5:1 against all urgency-band backgrounds. This is enforced by scoping `--text-3` to `#4b5563` within `.app-card`
