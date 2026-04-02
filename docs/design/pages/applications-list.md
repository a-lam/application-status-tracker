# Page: Applications List

> **Last updated:** 2026-04-01
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
| `ApplicationsListPage` | Page shell, owns fetch state, renders layout; contains the `+ Add an application` button and the page-level kebab menu |
| `ApplicationList` | Renders the ordered list of cards |
| `ApplicationCard` | Displays one application with urgency colour applied |
| `KebabMenu` | Three-dot menu on each card; exposes Update Status, Edit, Delete actions |
| `DeleteConfirmDialog` | Modal prompt shown before a delete is confirmed |
| `EmptyState` | Shown when the user has no applications |

---

## Application Status

There are exactly two statuses:

| Value | Meaning |
|-------|---------|
| `NOT_SUBMITTED` | Application has been created but not yet sent |
| `SUBMITTED` | Application has been sent to the employer |

Status is displayed inline in the job title line as plain text in parentheses — not as a badge or chip. New applications default to `NOT_SUBMITTED`.

---

## Colour Coding

The background colour of each `ApplicationCard` is determined solely by how far away the due date is from today, evaluated at page load.

| Urgency band | Condition | Background |
|---|---|---|
| Past | Today is the day after the due date or later (today > due date) | Light grey (`#f0f0f0` or similar) |
| Urgent | Due date is today or within the next 3 days (due today is not past due) | Light red (`#fde8e8` or similar) |
| Soon | Due in 4 – 7 days | Light yellow (`#fef9c3` or similar) |
| Future | Due in 8+ days | Light green (`#dcfce7` or similar) |

Exact colour values will be confirmed at implementation time. These are reference shades — light enough to keep body text readable at normal contrast ratios.

---

## User Interactions

### On page load

- The page fetches all applications for the current user
- Applications are displayed in due-date order, earliest at the top
- Each card receives its urgency colour band automatically
- The `+ Add an application` button is always visible regardless of list state
- The page-level `⋮` menu is always visible in the top-right corner

### Empty state

When the user has no applications:
- A friendly message is shown explaining the list is empty
- A call-to-action prompts the user to add their first application (same action as the `+ Add an application` button)

### Add application

- Clicking `+ Add an application` navigates to the add-application flow at `/applications/new`

### Session expiry

If the user's session expires while they are on this page, they are automatically signed out and redirected to the sign-in page. No action or page reload is required — the client polls the server periodically and acts immediately when the session is found to be invalid.

### Page menu (top-right `⋮`)

The page header contains a `⋮` (three-dot vertical) icon in the top-right corner. Clicking it opens a small dropdown with:

1. **Logout** — ends the user's session server-side and redirects to the sign-in page

### Kebab menu

Each card has a `⋮` (three-dot vertical) icon in the top-right corner. Clicking it opens a small dropdown menu with three options:

1. **Update Status — [target status]**
   - If the application is currently `NOT_SUBMITTED`, the label reads "Update Status — Submitted"
   - If the application is currently `SUBMITTED`, the label reads "Update Status — Not Submitted"
   - Clicking immediately toggles the status (no confirmation required) and closes the menu; the card title line updates in place

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

### Populated list

```
┌────────────────────────────────────────────────────────┐
│  [+ Add an application]                         [⋮]    │
├────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐   │
│ │ bgcolor: light red                               │   │
│ │  Senior Frontend Engineer (Submitted)        [⋮] │   │
│ │  Acme Corp        Due: 3 Apr 2026 (2 days away)  │   │
│ │                                                  │   │
│ │  Job Description:                                │   │
│ │  We are looking for an experienced engineer...   │   │
│ │  [show more]  ← only shown when text > 6 lines   │   │
│ │                                                  │   │
│ │  Artifacts: CV, Cover Letter, Portfolio          │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ bgcolor: light yellow                            │   │
│ │  Product Designer (Not Submitted)            [⋮] │   │
│ │  Globex Inc       Due: 6 Apr 2026 (5 days away)  │   │
│ │                                                  │   │
│ │  Job Description:                                │   │
│ │  Designing for a platform used by millions...    │   │
│ │  [show more]  ← only shown when text > 6 lines   │   │
│ │                                                  │   │
│ │  Artifacts: CV, Portfolio, References            │   │
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
│ │  Artifacts: CV, GitHub profile                   │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ bgcolor: light grey                              │   │
│ │  Full Stack Developer (Submitted)            [⋮] │   │
│ │  Umbrella Ltd          Due: 10 Mar 2026           │   │
│ │                                                  │   │
│ │  Job Description:                                │   │
│ │  A fast-growing SaaS company...                  │   │
│ │                                                  │   │
│ │  Artifacts: CV, Cover Letter                     │   │
│ └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

> **Note:** Dates shown relative to today (1 Apr 2026) for illustration. Acme Corp (2 days away) = urgent/red. Globex Inc (5 days away) = soon/yellow. Initech (19 days away) = future/green. Umbrella Ltd (past due) = grey, no suffix.

### Kebab menu open (example: Not Submitted application)

```
│ ┌──────────────────────────────────────────────────┐   │
│ │  Product Designer (Not Submitted)        [⋮] ←  │   │
│ │  Globex Inc   Due: 6 Apr 2026 (5 days away)  │   │   │
│ │                                          ┌───────┤   │
│ │                          Update Status — │Submitted   │
│ │                          Edit Application│       │   │
│ │                          Delete Applicat.│       │   │
│ │                                          └───────┘   │
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
│  [+ Add an application]                         [⋮] ←  │
│                                                ┌──────┤ │
│                                           Logout│      │ │
│                                                └──────┘ │
└────────────────────────────────────────────────────────┘
```

### Empty state

```
┌────────────────────────────────────────────────────────┐
│  [+ Add an application]                         [⋮]    │
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
│                                                   │
│  Job Description:                                 │
│  [Description text — clamped to 6 lines]          │
│  [show more]  ← only rendered when text overflows │
│                                                   │
│  Artifacts: [Artifacts Required]                  │
└──────────────────────────────────────────────────┘
```

**Status display:**
- Rendered inline with the job title: `Job Title (Submitted)` or `Job Title (Not Submitted)`
- Plain text — no badge, chip, or colour applied to the status text itself

**Date string format:**
- Past due: `D Mon YYYY` — e.g. "10 Mar 2026"
- Due today: `D Mon YYYY (Today)` — e.g. "1 Apr 2026 (Today)"
- Future: `D Mon YYYY (N days away)` — e.g. "20 Apr 2026 (19 days away)"

**Employer typography:**
- Font size: smaller than the job title (e.g. `0.85rem` vs `1rem`)
- Font style: italic

---

## Accessibility Notes

- Each card must have a descriptive `aria-label` (e.g. "Application: Senior Frontend Engineer at Acme Corp")
- Colour alone must not be the only indicator of urgency — the days-remaining text in the due date (e.g. "(3 days away)", "(Today)") provides a secondary, non-colour cue for users with colour vision deficiency
- The `+ Add an application` button has visible text and does not require an `aria-label`
- The page-level `⋮` button must have `aria-label="Page options"` and must manage `aria-expanded` and `aria-haspopup="menu"`; clicking outside must close the menu without taking any action
- The per-card kebab `⋮` button must have an `aria-label` identifying the application (e.g. "Options for Senior Frontend Engineer at Acme Corp") and must manage `aria-expanded` and `aria-haspopup="menu"`
- Each menu item inside the kebab dropdown must be a `role="menuitem"` element; the dropdown itself must be `role="menu"`
- The delete confirmation dialog must use `role="dialog"` with `aria-modal="true"` and an `aria-labelledby` pointing to the dialog heading; focus must be trapped inside while it is open and returned to the triggering element on close
- The "show more" / "show less" description toggle must have a descriptive `aria-label` and must update `aria-expanded` accordingly
- The "show more" control must not be rendered at all when the description does not overflow 6 lines — do not render it hidden, as screen readers would still announce it
