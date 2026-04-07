# Module: Applications List

> **Last updated:** 2026-04-07
> **Feature requirements:** [requirements/features/applications-list.md](../../requirements/features/applications-list.md)
> **Design:** [design/pages/applications-list.md](../../design/pages/applications-list.md)

---

## Overview

The applications list module is responsible for fetching, ordering, and rendering all job applications belonging to the authenticated user. It covers read (list), status toggle, edit navigation, and delete — all from the same page.

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
│                                      renders the "+ Add an application" button and the
│                                      page-level kebab menu (Logout)
└── components/
    └── applications/
        ├── ApplicationCard.jsx      ← Single application container with urgency colour
        ├── ApplicationList.jsx      ← Renders the ordered list of ApplicationCards
        ├── KebabMenu.jsx            ← Three-dot dropdown per card; exposes Update Status, Edit, Delete
        ├── DeleteConfirmDialog.jsx  ← Modal prompt before a delete is confirmed
        ├── ArtifactsPanel.jsx       ← Collapsible panel showing per-artifact completion state; rendered inside each ApplicationCard
        └── EmptyState.jsx           ← Shown when the user has no applications
```

### `ApplicationsListPage`

Owns the data-fetching lifecycle and all mutation handlers (status toggle, delete). On mount, calls `GET /api/applications`. Passes the result array down to `ApplicationList`, or renders `EmptyState` if the array is empty.

Renders three fixed controls in the page header:
- **`+ Add an application`** — a `<Link>` styled as a primary button on the left; navigates to `/applications/new`.
- **User email** — the authenticated user's email address, read from the `better-auth` client session (`authClient.useSession()` or equivalent), displayed as plain text immediately to the left of the page-level kebab button.
- **Page-level kebab menu** — a `⋮` button on the right that opens a dropdown with a single "Logout" action. Clicking Logout calls `authClient.signOut()` then navigates to `/login`. The menu closes when the user clicks outside it.

Passes `onStatusToggle` and `onDeleteRequest` handlers down to `ApplicationCard` via `ApplicationList`.

### `ApplicationList`

Receives a pre-sorted array of application objects (sorted by the API). Maps each to an `ApplicationCard`. No internal sorting or mutation logic.

### `ApplicationCard`

Renders a single application's fields. Calls `getUrgencyBand(dueDate)` to determine the CSS class and `formatDueDate(dueDate)` for the date string. Renders `KebabMenu` in the top-right of the title row.

**Fields displayed (in order):**
- Job Title with status in parentheses: `Job Title (Submitted)` or `Job Title (Not Submitted)` — plain text, no badge
- `KebabMenu` (`⋮` button) — top-right of the title row
- Employer (directly below the title row — italicised, smaller font size)
- Due Date (formatted with days-remaining suffix — see `formatDueDate` below)
- Salary range — only rendered when at least one salary value is present; currency symbol precedes each amount, currency code follows at the end:
  - Both min and max: `[symbol][min]–[symbol][max] [code]` e.g. "$80,000–$120,000 CAD"
  - Min only: `[symbol][min]+ [code]` e.g. "$80,000+ CAD"
  - Max only: `up to [symbol][max] [code]` e.g. "up to $120,000 CAD"
  - Currency symbol mapping: CAD → $, USD → $, EUR → €, GBP → £, AUD → $, JPY → ¥
- "Job Description:" label followed by Job Description text (truncated to 6 lines with "show more" if content overflows)
- `ArtifactsPanel` — collapsible artifacts section, collapsed by default

### `KebabMenu`

Renders a `⋮` button. When clicked, opens a dropdown with three `role="menuitem"` entries:

1. **Update Status — [target]** — label shows the *opposite* of the current status (`Submitted` when current is `NOT_SUBMITTED`, `Not Submitted` when current is `SUBMITTED`). Calls `onStatusToggle(id)` and closes the menu.
2. **Edit Application** — navigates to `/applications/:id/edit`. No confirmation required.
3. **Delete Application** — calls `onDeleteRequest(id)` to open `DeleteConfirmDialog`. Does not delete immediately.

Clicking outside the open menu closes it without any side effect.

### `ArtifactsPanel`

Renders the artifact completion section inside `ApplicationCard`. Collapsed by default.

**Header:** always visible, acts as the toggle trigger. Displays `▶ Artifacts (X/Y completed)` when collapsed and `▼ Artifacts (X/Y completed)` when expanded, where X is the count of artifacts whose `completed` field is `true` and Y is the total number of artifacts.

**Expanded state:** each artifact is rendered as its own row containing a `<input type="checkbox">` (checked when `artifact.completed === true`) and the artifact label. Clicking the checkbox calls `onArtifactToggle(artifactId, !artifact.completed)`.

**State:** the open/closed toggle is local component state (`useState`). The `completed` field of each artifact is lifted to `ApplicationsListPage` and updated via the `onArtifactToggle` handler — the same pattern as status toggle. The header count is derived from the current local state rather than re-fetched.

**Optimistic update:** on checkbox interaction, `ApplicationsListPage` updates the artifact's `completed` value in its local application array immediately, then calls `PATCH /api/artifacts/:id/completed`. If the server returns an error, the optimistic change is rolled back.

---

### `DeleteConfirmDialog`

A modal dialog (`role="dialog"`, `aria-modal="true"`) that appears when a delete is requested. Displays the job title and employer of the targeted application. Offers two actions: **Confirm Delete** (calls `onDeleteConfirm(id)`) and **Cancel** (calls `onDeleteCancel`). Focus is trapped inside while open; on close, focus returns to the triggering kebab button.

### `getUrgencyBand(dueDate)` — pure utility

```
Input:  ISO date string or Date object
Output: 'past' | 'urgent' | 'soon' | 'future'

Logic:
  delta = dueDate (start of day) − today (start of day), in whole days

  -- An application is NOT past due on its due date (delta = 0 is urgent, not past)
  -- An application becomes past due the day after its due date (delta = -1 or less)

  delta ≤ -1         → 'past'     (light grey)
  0 ≤ delta ≤ 3      → 'urgent'   (light red)   ← delta 0 = due today
  4 ≤ delta ≤ 7      → 'soon'     (light yellow)
  delta ≥ 8          → 'future'   (light green)
```

> **Important:** The band is computed using the **client's local date**, not UTC.

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

### Status Toggle

```
1. User clicks ⋮ on a card → KebabMenu opens
2. User clicks "Update Status — [target]"
3. ApplicationsListPage calls PATCH /api/applications/:id/status
   with body: { status: "SUBMITTED" | "NOT_SUBMITTED" }
4. Server validates session and ownership → 401/403 if invalid
5. Server updates the record and returns the updated application
6. ApplicationsListPage updates the application in local state
   → KebabMenu closes; card title line re-renders with new status
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
3a. User clicks Cancel → dialog closes; no request made
3b. User clicks Confirm Delete
    → ApplicationsListPage calls DELETE /api/applications/:id
    → Server validates session and ownership → 401/403 if invalid
    → Server deletes application and all related artifacts (cascade)
    → Returns 204 No Content
    → ApplicationsListPage removes the card from local state
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
Today's date (local, start of day)
        │
        ▼
  getUrgencyBand(application.dueDate)
        │
        ├── delta ≤ -1  → 'past'    → .card--past    (light grey)
        ├── delta 0–3   → 'urgent'  → .card--urgent  (light red)
        ├── delta 4–7   → 'soon'    → .card--soon    (light yellow)
        └── delta ≥ 8   → 'future'  → .card--future  (light green)
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
| `PATCH` | `/api/applications/:id/status` | Yes | Toggles the application status between `NOT_SUBMITTED` and `SUBMITTED` |
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

---

## Edit Application

The edit form reuses the same layout as the add-application form. See [add-application-module.md](add-application-module.md) for component details. The key difference is that `EditApplicationPage` pre-populates all fields from the existing application record fetched via `GET /api/applications/:id`.
