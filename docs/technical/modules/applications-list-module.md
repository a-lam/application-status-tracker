# Module: Applications List

> **Last updated:** 2026-04-10
> **Feature requirements:** [requirements/features/applications-list.md](../../requirements/features/applications-list.md)
> **Design:** [design/pages/applications-list.md](../../design/pages/applications-list.md)

---

## Overview

The applications list module is responsible for fetching, ordering, and rendering all job applications belonging to the authenticated user. It covers read (list), status update, edit navigation, and delete — all from the same page.

---

## Component Architecture

### Backend

```
server/src/
└── routes/
    ├── applications.js        ← GET    /api/applications
    │                             PATCH  /api/applications/:id/status
    │                             PATCH  /api/applications/:id
    │                             DELETE /api/applications/:id
    └── artifacts.js           ← PATCH  /api/artifacts/:id/completed
```

### Frontend

```
client/src/
├── pages/
│   └── ApplicationsListPage.jsx   ← Top-level page, owns fetch state and mutation handlers;
│                                      renders the add-application button, the aria-live
│                                      announcement region, and the page-level kebab menu (Logout)
└── components/
    └── applications/
        ├── ApplicationCard.jsx      ← Single application container with urgency colour
        ├── ApplicationList.jsx      ← Renders the ordered list of ApplicationCards
        ├── KebabMenu.jsx            ← Three-dot dropdown per card; exposes Update Status, Edit, Delete
        ├── DeleteConfirmDialog.jsx  ← Native <dialog> modal prompt before a delete is confirmed
        ├── ArtifactsPanel.jsx       ← Collapsible panel showing per-artifact completion state; rendered inside each ApplicationCard
        └── EmptyState.jsx           ← Shown when the user has no applications
```

### `ApplicationsListPage`

Owns the data-fetching lifecycle and all mutation handlers (status update, delete). On mount, calls `GET /api/applications`. Passes the result array down to `ApplicationList`, or renders `EmptyState` if the array is empty.

Renders three fixed controls in the page header:
- **Add-application button** — a `<Link>` styled as a primary button on the left; navigates to `/applications/new`. Carries `aria-label="Add an application"` at all viewports. At viewports wider than 480 px the visible label reads `+ Add an application`; at 480 px and narrower it collapses to `+`. Both text spans are `aria-hidden`; the accessible name comes from the `aria-label` alone.
- **User email** — the authenticated user's email address, read from the `better-auth` client session (`authClient.useSession()`), displayed as plain text immediately to the left of the page-level kebab button. Hidden at viewports ≤ 480 px to prevent header crowding.
- **Page-level kebab menu** — a `⋮` button on the right that opens a dropdown with a single "Logout" action. Clicking Logout calls `authClient.signOut()` then navigates to `/login`. The menu closes when the user clicks outside it.

Also renders a visually-hidden `aria-live="polite" role="status"` region. After a successful status update, this region is populated with a confirmation string (e.g. "Software Engineer at Acme marked as Interviewing.") so screen readers can announce the outcome without requiring focus to move.

Passes `onStatusUpdate` and `onDeleteRequest` handlers down to `ApplicationCard` via `ApplicationList`.

### `ApplicationList`

Receives a pre-sorted array of application objects (sorted by the API). Maps each to an `ApplicationCard`. No internal sorting or mutation logic.

### `ApplicationCard`

Renders a single application's fields. Calls `getUrgencyBand(dueDate, status)` to determine the CSS class and `formatDueDate(dueDate)` for the date string.

**Layout:** The top row (`app-card__row1`) is a flex container with `align-items: center`. It contains two children:
- **Title group** (left, `app-card__title-group`): Job Title, Employer, and Status badge stacked vertically.
- **Actions group** (right, `app-card__actions`): Due Date and `KebabMenu` side by side, vertically centered with each other (`align-items: center`). The group as a whole aligns to the vertical midpoint of the title group.

A visual separator (subtle `border-top` or `padding-top`) divides the header block (title + employer + status badge) from the metadata block (listing link, job start, salary, description) below.

**Fields displayed (in order):**
- Job Title — standalone, not combined with status text; `font-size: 1.0625rem–1.125rem`, `font-weight: 700`
- Employer (directly below the title — italicised, smaller font size)
- Status badge — small pill/badge below the employer line; colour reflects the application status (see [design/pages/applications-list.md — Status badge colours](../../design/pages/applications-list.md)); full status label mapping in [requirements/features/applications-list.md — AC-12-8 through AC-12-15](../../requirements/features/applications-list.md)
- Due Date + `KebabMenu` (`⋮` button) — grouped together in the top-right actions block, vertically centered with the title group; due date `font-size: 0.875rem`
- Job Listing URL — only rendered when present; displayed as a `"View Job Listing →"` anchor element that opens the URL in a new tab (`target="_blank" rel="noopener noreferrer"`); the raw URL is not shown
- Salary range — only rendered when at least one salary value is present; currency symbol precedes each amount, currency code follows at the end:
  - Both min and max: `[symbol][min]–[symbol][max] [code]` e.g. "$80,000–$120,000 CAD"
  - Min only: `[symbol][min]+ [code]` e.g. "$80,000+ CAD"
  - Max only: `up to [symbol][max] [code]` e.g. "up to $120,000 CAD"
  - Currency symbol mapping: CAD → $, USD → $, EUR → €, GBP → £, AUD → $, JPY → ¥, KRW → ₩
- "Job Description:" label followed by Job Description text (truncated to 6 lines with "show more" if content overflows)
- `ArtifactsPanel` — collapsible artifacts section, collapsed by default

**CSS contrast override:** The `.app-card` rule sets `--text-3: #4b5563` (darker than the global `#6b7280`). This ensures all elements using `var(--text-3)` within a card — employer name, description label, artifacts arrow — meet WCAG AA contrast (≥ 4.5:1) against every urgency-band background colour. Description body text uses `color: var(--text)` (full-contrast primary colour) rather than `var(--text-2)`, ensuring readability on all urgency-band backgrounds including coloured ones. Inline metadata labels (SALARY:, JOB START:) are `0.8125rem`, bold, uppercase.

**Mobile card layout:** At viewports ≤ 480 px the `.app-card__row1` wraps (`flex-wrap: wrap`) so the actions group (due date + kebab) drops below the title group when there is not enough horizontal space. Vertical centring (`align-items: center`) must be verified to look correct after the due date wraps to its own row.

### `KebabMenu`

Renders a `⋮` button. When clicked, opens a dropdown with three `role="menuitem"` entries:

1. **Update Status ▶** — opens a submenu listing only the statuses that are valid to transition to from the application's current status, as defined in `STATUS_TRANSITIONS` (see Transition Map below). For terminal states (OFFER_ACCEPTED, OFFER_DECLINED, REJECTED, WITHDRAWN) the submenu shows a single "Reset to Not Submitted" option. Selecting a status calls `onStatusUpdate(id, newStatus)` and closes both menus.
2. **Edit Application** — navigates to `/applications/:id/edit`. No confirmation required.
3. **Delete Application** — calls `onDeleteRequest(id)` to open `DeleteConfirmDialog`. Does not delete immediately.

Clicking outside the open menu closes it without any side effect.

The trigger button has a minimum hit area of 44 × 44 px (`min-width` and `min-height`) to meet mobile touch-target requirements.

### Transition Map

The allowed status transitions are defined in two mirrored files — one per package, since there is no shared workspace:

- `client/src/lib/statusTransitions.js` — exports `STATUS_TRANSITIONS` (used by `KebabMenu` to filter the submenu) and `STATUS_LABELS` (used to map enum values to display strings).
- `server/src/lib/statusTransitions.js` — exports the same `STATUS_TRANSITIONS` object (used by the `PATCH /api/applications/:id/status` route handler to enforce the rules server-side).

The client uses `STATUS_TRANSITIONS[application.status]` to derive the array of `nextStatuses` to render. For terminal states the array contains only `NOT_SUBMITTED`; `KebabMenu` renders that option with the label **"Reset to Not Submitted"** rather than "Not Submitted" to communicate that it is a corrective action.

The server imports `STATUS_TRANSITIONS`, fetches the existing application, and checks `STATUS_TRANSITIONS[existing.status].includes(requestedStatus)` before applying any update. A failing check returns HTTP 422. This makes the server the authoritative enforcer; the UI filtering is a convenience, not a guard.

### `ArtifactsPanel`

Renders the artifact completion section inside `ApplicationCard`. Collapsed by default.

**Header:** always visible, acts as the toggle trigger. Displays `▶ Show artifacts (X/Y completed)` when collapsed and `▼ Hide artifacts (X/Y completed)` when expanded, where X is the count of artifacts whose `completed` field is `true` and Y is the total number of artifacts. The "Show" / "Hide" prefix makes the button's purpose unambiguous without relying on `aria-expanded` alone.

The toggle button has a minimum height of 44 px to meet mobile touch-target requirements.

**Expanded state:** each artifact is rendered as its own row containing a `<input type="checkbox">` (checked when `artifact.completed === true`) and the artifact label. Clicking the checkbox calls `onArtifactToggle(artifactId, !artifact.completed)`.

**State:** the open/closed toggle is local component state (`useState`). The `completed` field of each artifact is lifted to `ApplicationsListPage` and updated via the `onArtifactToggle` handler — the same pattern as status toggle. The header count is derived from the current local state rather than re-fetched.

**Optimistic update:** on checkbox interaction, `ApplicationsListPage` updates the artifact's `completed` value in its local application array immediately, then calls `PATCH /api/artifacts/:id/completed`. If the server returns an error, the optimistic change is rolled back.

---

### `DeleteConfirmDialog`

A modal implemented using the native HTML `<dialog>` element with `showModal()`. Displays the job title and employer of the targeted application. Offers two actions: **Confirm Delete** (calls `onDeleteConfirm(id)`) and **Cancel** (calls `onDeleteCancel`).

Using `showModal()` gives the dialog browser-native top-layer stacking, automatic focus trapping, and Escape-key handling (via the `cancel` event). The `::backdrop` pseudo-element is styled to provide the semi-transparent overlay. On unmount, focus returns to the element that triggered the dialog.

Click-outside is detected by comparing the pointer coordinates against the dialog's bounding rect on each click event — if the click lands outside the rect, `onCancel` is called.

### `getUrgencyBand(dueDate, status)` — pure utility

```
Input:  dueDate — ISO date string or Date object
        status  — ApplicationStatus enum value
Output: 'past' | 'urgent' | 'soon' | 'future'

Logic (evaluated top to bottom):

  1. REJECTED, WITHDRAWN, OFFER_DECLINED
     → 'past'    (light grey)   — resolved unfavourably; no action warranted

  2. Any status other than NOT_SUBMITTED
     (SUBMITTED, INTERVIEWING, OFFER_RECEIVED, OFFER_ACCEPTED)
     → 'future'  (light green)  — active in the pipeline; urgency is no longer in the user's hands

  3. NOT_SUBMITTED — deadline-driven:
     delta = dueDate (start of day) − today (start of day), in whole days

     delta ≤ -1   → 'urgent'   (light red)    — past the deadline, still not submitted
     delta ≤ 3    → 'soon'     (light yellow)  — submit within 3 days
     delta ≥ 4    → 'future'   (light green)   — plenty of time
```

> **Important:** The band is computed using the **client's local date**, not UTC.
>
> **Note on CSS class names:** The return values select existing CSS classes — `'past'` → `.card--past` (grey), `'urgent'` → `.card--urgent` (red), `'soon'` → `.card--soon` (yellow), `'future'` → `.card--future` (green). Their original time-distance names no longer match their new triggers, but the colours and classes are unchanged; no new CSS is needed.

### `formatDueDate(dueDate)` — pure utility

```
Input:  ISO date string or Date object
Output: Formatted string

Logic:
  delta = dueDate (start of day) − today (start of day), in whole days

  delta < 0   → "D Mon YYYY"                          e.g. "29 Mar 2026"
  delta = 0   → "D Mon YYYY (Today)"                  e.g. "1 Apr 2026 (Today)"
  delta > 0   → "D Mon YYYY (N days away)"             e.g. "21 May 2026 (50 days away)"
```

### `ApplicationCard` — description overflow logic

The job description is clamped to 6 lines using CSS (`-webkit-line-clamp: 6`). A "show more" control is only rendered when the rendered text height exceeds the clamped container height. On activation, the clamp is removed and a "show less" control replaces it.

> **Implementation note:** Overflow detection requires a DOM measurement after render (comparing `scrollHeight` vs `clientHeight`). This should be done in a `useEffect` with a `ResizeObserver` so it remains correct if the card width changes.

---

## CSS Architecture Notes

### Reduced motion

All CSS `transition` declarations are wrapped in `@media (prefers-reduced-motion: no-preference)` blocks. When the user has requested reduced motion at the OS level, no animations or transitions are applied anywhere in the application.

### Touch targets

`.kebab-menu__trigger` and `.artifacts-panel__toggle` both carry `min-width: 44px` and `min-height: 44px` respectively, ensuring a minimum 44 × 44 px hit area on touch devices in line with WCAG 2.5.5 guidance.

### Screen-reader utility

A `.sr-only` class (position absolute, 1 × 1 px, clipped) is defined globally. It is used by the `aria-live` status region in `ApplicationsListPage`.

---

## Data Flow

### Page Load

```
1. User navigates to /applications (must be authenticated)
2. ApplicationsListPage mounts
   → calls GET /api/applications (session cookie sent automatically)

3. Server — GET /api/applications
   a. Reads session → 401 if no valid session
   b. Queries: SELECT * FROM applications WHERE userId = :userId ORDER BY dueDate ASC
      (includes related artifacts)
   c. Returns JSON array of application objects

4. ApplicationsListPage receives response
   → array is empty: renders EmptyState
   → array has items: renders ApplicationList with the array

5. ApplicationList maps array → ApplicationCard components
6. Each ApplicationCard renders with urgency colour and formatted date
7. Page is fully rendered
```

### Status Update

```
1. User clicks ⋮ on a card → KebabMenu opens
2. User hovers or clicks "Update Status ▶" → submenu opens with only the valid
   next statuses for the current status (derived from STATUS_TRANSITIONS)
3. User clicks a status option
4. ApplicationsListPage calls PATCH /api/applications/:id/status
   with body: { status: "<selected status>" }
5. Server validates session and ownership → 401/403 if invalid
6. Server checks that the transition is permitted in STATUS_TRANSITIONS →
   422 with { "error": "Invalid status transition." } if not allowed
7. Server updates the record and returns the updated application
8. ApplicationsListPage updates the application in local state
   → Both menus close; card title line re-renders with new status
   → aria-live region is populated with a confirmation string
   (no full page reload)
```

### Edit Application

```
1. User clicks "Edit Application" from KebabMenu
2. Client navigates to /applications/:id/edit
3. EditApplicationPage loads, calls GET /api/applications/:id
4. Form is rendered with all field values pre-filled
5. On save: PATCH /api/applications/:id with updated fields
6. On success: navigate to /applications
7. On cancel: navigate to /applications (no request made)
```

### Delete Application

```
1. User clicks "Delete Application" from KebabMenu
2. KebabMenu calls onDeleteRequest(id) → DeleteConfirmDialog opens
   → showModal() called on the native <dialog>; focus moves to Confirm Delete button
3a. User clicks Cancel → dialog closes; no request made; focus returns to kebab trigger
3b. User clicks Confirm Delete
    → ApplicationsListPage calls DELETE /api/applications/:id
    → Server validates session and ownership → 401/403 if invalid
    → Server deletes application and all related artifacts (cascade)
    → Returns 204 No Content
    → ApplicationsListPage removes the card from local state
    → Focus returns to kebab trigger
```

### Logout

```
1. User clicks ⋮ in the page header → page-level menu opens
2. User clicks "Logout"
3. Client calls authClient.signOut()
   → better-auth sends POST /api/auth/sign-out (session cookie included)
   → Server invalidates the session record immediately
4. Client navigates to /login
5. Subsequent requests to protected routes return HTTP 401 → redirected to /login
```

### Artifact Completion Toggle

```
1. User expands the ArtifactsPanel on a card
2. User checks (or unchecks) an artifact row
3. ApplicationsListPage optimistically updates artifact.completed in local state
   → ArtifactsPanel re-renders with updated checkbox and new header count
4. ApplicationsListPage calls PATCH /api/artifacts/:id/completed
   with body: { completed: true | false }
5. Server validates session and verifies that the artifact's application belongs to the user
   → 401 if no valid session; 403 if not the owner; 404 if artifact not found
6a. Server returns 200 with updated artifact → optimistic state is confirmed; no further action
6b. Server returns an error → ApplicationsListPage rolls back the optimistic update in local state
```

---

### Urgency Band Evaluation

```
application.status + today's date (local, start of day)
        │
        ▼
  getUrgencyBand(application.dueDate, application.status)
        │
        ├── REJECTED / WITHDRAWN / OFFER_DECLINED
        │       → 'past'    → .card--past    (light grey)
        │
        ├── SUBMITTED / INTERVIEWING / OFFER_RECEIVED / OFFER_ACCEPTED
        │       → 'future'  → .card--future  (light green)
        │
        └── NOT_SUBMITTED — deadline-driven:
                │
                ├── delta ≤ -1  → 'urgent'  → .card--urgent  (light red)
                ├── delta 0–3   → 'soon'    → .card--soon    (light yellow)
                └── delta ≥ 4   → 'future'  → .card--future  (light green)
```

---

## Database Model

The authoritative Prisma schema for `Application`, `Artifact`, and the `ApplicationStatus` enum is defined in [add-application-module.md — Schema Change: Artifacts](add-application-module.md#schema-change-artifacts). Column definitions are summarised in [technical/architecture.md — Data Models](../architecture.md#data-models).

**Relationship:** Many applications → one user. Deleting a user cascades to delete all their applications and artifacts.

---

## API Endpoints

| Method | Path | Auth required | Description |
|--------|------|--------------|-------------|
| `GET` | `/api/applications` | Yes | Returns all applications for the current user, ordered by `dueDate` ASC, with artifacts included |
| `PATCH` | `/api/applications/:id/status` | Yes | Sets the application status to the value provided in the request body (`{ status: ApplicationStatus }`) |
| `PATCH` | `/api/applications/:id` | Yes | Updates any editable fields of the application |
| `DELETE` | `/api/applications/:id` | Yes | Permanently deletes the application and all related artifacts |
| `PATCH` | `/api/artifacts/:id/completed` | Yes | Sets the `completed` field on a single artifact; body: `{ completed: boolean }` |

> **Additional endpoints:**
> - `POST /api/applications` — create a new application (see [add-application-module.md](add-application-module.md))
> - `GET /api/applications/:id` — fetch a single application for the edit form (see [add-application-module.md](add-application-module.md))

**Ownership check:** All endpoints that access a specific application (`/api/applications/:id*`) must verify that the application's `userId` matches the session user. Return HTTP 403 if not.

For `PATCH /api/artifacts/:id/completed`, the server must look up the artifact's parent application and verify its `userId` matches the session user. Return HTTP 403 if not, HTTP 404 if the artifact does not exist.

---

## Dependencies

| Dependency | Used by | Purpose |
|------------|---------|---------|
| `@prisma/client` | `routes/applications.js` | Query and mutate the `applications` table |
| `better-auth` | `routes/applications.js` | Validate session and extract `userId` |
| `express` | `routes/applications.js` | Route handlers |
| React state (`useState`, `useEffect`, `useRef`) | `ApplicationsListPage` | Fetch lifecycle, optimistic state management, and page-level menu |
| `better-auth` client (`authClient.useSession`) | `ApplicationsListPage` | Read the active session to display the user's email in the header |
| `better-auth` client (`authClient.signOut`) | `ApplicationsListPage` | End the user's session on logout |
| `ResizeObserver` | `ApplicationCard` | Detect description overflow after render |
| Native `<dialog>` / `showModal()` | `DeleteConfirmDialog` | Browser-native modal with top-layer stacking, focus trapping, and Escape handling |

---

## Edit Application

The edit form reuses the same layout as the add-application form. See [add-application-module.md](add-application-module.md) for component details. The key difference is that `EditApplicationPage` pre-populates all fields from the existing application record fetched via `GET /api/applications/:id`.
