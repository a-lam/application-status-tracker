# Feature: Applications List

> **Last updated:** 2026-04-07
> **Status:** Implemented
> **Default page:** This is the default destination for all signed-in users. Any unauthenticated visit to the app root redirects to the login page.

---

## User Stories

### US-10 — View all applications

> As a signed-in user, I want to see all of my tracked applications in a single list so that I can get an overview of everything I am managing.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-10-1 | I am signed in | I navigate to the applications list page | I see all applications I have created, and no applications belonging to other users |
| AC-10-2 | I have applications with different due dates | The page loads | Applications are ordered chronologically with the earliest due date at the top and the furthest in the future at the bottom |
| AC-10-3 | I have no applications yet | The page loads | I see an empty state message prompting me to add my first application |
| AC-10-4 | I am not signed in | I navigate to the applications list page | I am redirected to the sign-in page |
| AC-10-5 | I am signed in | I navigate to the app root (`/`) without specifying a page | I am taken directly to the applications list page |
| AC-10-6 | I am not signed in | I navigate to the app root (`/`) | I am redirected to the sign-in page |

---

### US-11 — Understand urgency at a glance

> As a user, I want applications colour-coded by their status and how soon they are due so that I can quickly identify what still needs my attention without reading every card.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-11-1 | An application's status is `REJECTED`, `WITHDRAWN`, or `OFFER_DECLINED` | The page renders | The application container is displayed with a light grey background, regardless of due date |
| AC-11-2 | An application's status is `NOT_SUBMITTED` and its due date is in the past (today > due date) | The page renders | The application container is displayed with a light red background (missed the window to submit) |
| AC-11-3 | An application's status is `NOT_SUBMITTED` and its due date is today or within the next 3 days (0–3 days away) | The page renders | The application container is displayed with a light yellow background (submit soon) |
| AC-11-4 | An application's status is `NOT_SUBMITTED` and its due date is 4 or more days away | The page renders | The application container is displayed with a light green background |
| AC-11-5 | An application's status is `SUBMITTED`, `INTERVIEWING`, `OFFER_RECEIVED`, or `OFFER_ACCEPTED` | The page renders | The application container is displayed with a light green background, regardless of due date |
| AC-11-6 | An application transitions from one colour band to another (e.g. a `NOT_SUBMITTED` application crosses the 3-day deadline threshold) | The page is loaded on that day | The colour updates to reflect the new band — no manual action required |
| AC-11-7 | An application's status is `OFFER_ACCEPTED` | The page renders | The application card border is rendered bold and black to visually distinguish it from all other cards |

> **Colour band rules (status takes priority over deadline):**
>
> | Status | Past (today > due date) | 0–3 days | 4+ days |
> |--------|-------------------------|----------|---------|
> | `NOT_SUBMITTED` | Light red | Light yellow | Light green |
> | `SUBMITTED` | Light green | Light green | Light green |
> | `INTERVIEWING` | Light green | Light green | Light green |
> | `OFFER_RECEIVED` | Light green | Light green | Light green |
> | `OFFER_ACCEPTED` | Light green | Light green | Light green |
> | `OFFER_DECLINED` | Light grey | Light grey | Light grey |
> | `REJECTED` | Light grey | Light grey | Light grey |
> | `WITHDRAWN` | Light grey | Light grey | Light grey |

---

### US-12 — See all key details for each application

> As a user, I want each application card to show me the essential information so that I can assess its status without navigating away.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-12-1 | An application exists | The page renders | Each application card displays: Job Title with submission status in parentheses, Employer (below the title, italicised and smaller), Due Date, Job Listing URL link (if present), Salary (if present), Job Description, and a collapsible Artifacts panel |
| AC-12-16 | An application has a Job Listing URL | The page renders | A "View Job Listing →" link is shown on the card; clicking it opens the URL in a new browser tab |
| AC-12-17 | An application has no Job Listing URL | The page renders | No job listing link is rendered on the card |
| AC-12-2 | An application has a long job description | The page renders | The description is truncated after 6 lines with a "show more" control that reveals the full text |
| AC-12-3 | An application has a short job description that fits within 6 lines | The page renders | The full description is shown with no "show more" control visible |
| AC-12-4 | An application's due date is in the future | The page renders | The due date is displayed as `D Mon YYYY (N days away)`, e.g. "21 May 2026 (50 days away)" |
| AC-12-5 | An application's due date is today | The page renders | The due date is displayed as `D Mon YYYY (Today)`, e.g. "1 Apr 2026 (Today)" |
| AC-12-6 | An application's due date is in the past | The page renders | The due date is displayed as `D Mon YYYY` with no days calculation appended |
| AC-12-7 | An application exists | The page renders | A "Job Description:" label appears directly above the job description text |
| AC-12-8 | An application's status is `NOT_SUBMITTED` | The page renders | The job title line reads "Job Title (Not Submitted)" |
| AC-12-9 | An application's status is `SUBMITTED` | The page renders | The job title line reads "Job Title (Submitted)" |
| AC-12-10 | An application's status is `INTERVIEWING` | The page renders | The job title line reads "Job Title (Interviewing)" |
| AC-12-11 | An application's status is `OFFER_RECEIVED` | The page renders | The job title line reads "Job Title (Offer Received)" |
| AC-12-12 | An application's status is `OFFER_ACCEPTED` | The page renders | The job title line reads "Job Title (Offer Accepted)" |
| AC-12-13 | An application's status is `OFFER_DECLINED` | The page renders | The job title line reads "Job Title (Offer Declined)" |
| AC-12-14 | An application's status is `REJECTED` | The page renders | The job title line reads "Job Title (Rejected)" |
| AC-12-15 | An application's status is `WITHDRAWN` | The page renders | The job title line reads "Job Title (Withdrawn)" |
| AC-12-10 | An application has both a starting salary and a maximum salary | The page renders | The salary range is displayed as `[symbol][min]–[symbol][max] [code]`, e.g. "$80,000–$120,000 CAD" |
| AC-12-11 | An application has only a starting salary | The page renders | The salary is displayed as `[symbol][min]+ [code]`, e.g. "$80,000+ CAD" |
| AC-12-12 | An application has only a maximum salary | The page renders | The salary is displayed as `up to [symbol][max] [code]`, e.g. "up to $120,000 CAD" |
| AC-12-13 | An application has no salary values | The page renders | No salary line is shown on the card |

---

### US-13 — Add a new application

> As a user, I want a clearly visible control to add a new application so that I can begin tracking it immediately.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-13-1 | I am on the applications list page on a desktop or tablet viewport | The page loads | A `+ Add an application` button is visible in the top-left of the page header |
| AC-13-1b | I am on the applications list page on a mobile viewport (≤ 480 px wide) | The page loads | The button in the top-left of the page header collapses to a single `+` character to save space |
| AC-13-2 | I am on the applications list page | I activate the add-application button (full or compact form) | I am taken to the add application page (`/applications/new`) |

> Full add-application behaviour is documented in [requirements/features/add-application.md](add-application.md).

---

### US-14 — Update application status from the list

> As a user, I want to select a new status for an application from a submenu directly from the list so that I can record progress without leaving the page.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-14-1 | I am on the applications list page | The page renders | Each application card shows a `⋮` (kebab) menu button in its top-right corner |
| AC-14-2 | I click the `⋮` button on a card | The menu opens | I see three options: "Update Status ▶", "Edit Application", and "Delete Application" |
| AC-14-3 | The menu is open | I hover or click "Update Status ▶" | A submenu opens listing only the statuses that are valid to transition to from the application's current status (see US-ST for the full transition table) |
| AC-14-4 | The status submenu is open | I click any status option | The status is updated, both menus close, and the job title line on the card updates to reflect the new status without a full page reload |
| AC-14-5 | I click outside an open kebab menu or submenu | — | All open menus close and no action is taken |
| AC-14-6 | I select a new status | The action completes | An announcement is made to screen readers confirming the new status (e.g. "Software Engineer at Acme marked as Interviewing.") |

---

### US-ST — Guided status workflow

> As a user, I want the "Update Status" submenu to show only the statuses I can logically move to from the current state so that I am guided through the workflow and cannot make invalid transitions.

#### Status Transition Table

| Current Status   | Allowed Next Statuses                                     |
|------------------|-----------------------------------------------------------|
| NOT_SUBMITTED    | SUBMITTED, WITHDRAWN                                      |
| SUBMITTED        | INTERVIEWING, REJECTED, WITHDRAWN                         |
| INTERVIEWING     | OFFER_RECEIVED, REJECTED, WITHDRAWN                       |
| OFFER_RECEIVED   | OFFER_ACCEPTED, OFFER_DECLINED, WITHDRAWN                 |
| OFFER_ACCEPTED   | NOT_SUBMITTED _(reset only — terminal state recovery)_    |
| OFFER_DECLINED   | NOT_SUBMITTED _(reset only — terminal state recovery)_    |
| REJECTED         | NOT_SUBMITTED _(reset only — terminal state recovery)_    |
| WITHDRAWN        | NOT_SUBMITTED _(reset only — terminal state recovery)_    |

**Design rationale:**
- WITHDRAWN is available from all active (non-terminal) states because a candidate can pull out at any point.
- REJECTED is available from SUBMITTED and INTERVIEWING; it is not available from OFFER_RECEIVED (an offer implies acceptance or decline are the only logical next steps).
- Terminal states (OFFER_ACCEPTED, OFFER_DECLINED, REJECTED, WITHDRAWN) offer a single "Reset to Not Submitted" option so users can recover from mistakes without losing the application record.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-ST-01 | An application is in state S | The "Update Status ▶" submenu opens | Only the statuses listed in the transition table for S are shown |
| AC-ST-02 | An application is in a terminal state (OFFER_ACCEPTED, OFFER_DECLINED, REJECTED, or WITHDRAWN) | The "Update Status ▶" submenu opens | Only "Reset to Not Submitted" is shown |
| AC-ST-03 | An application is in state S | A `PATCH /api/applications/:id/status` request is sent with a status not in the allowed set for S | The server responds `422` with `{ "error": "Invalid status transition." }` |
| AC-ST-04 | An application is in a non-terminal state | The user selects a valid next status from the submenu | The status updates, both menus close, the card title updates in place, and the screen reader announcement fires — same behaviour as today |
| AC-ST-05 | Any application | The full workflow is exercised | All existing acceptance criteria for US-14 (AC-14-1 through AC-14-6) remain satisfied |

---

### US-15 — Edit an existing application

> As a user, I want to edit the details of an application I have already created so that I can correct mistakes or update information.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-15-1 | I open the kebab menu on a card | I click "Edit Application" | I am navigated to `/applications/:id/edit` |
| AC-15-2 | I am on the edit page | The page loads | All existing field values for that application are pre-filled in the form |
| AC-15-3 | I change one or more fields and click Save | The save succeeds | I am returned to the applications list and the card reflects the updated values |
| AC-15-4 | I click Cancel on the edit page | — | No changes are saved and I am returned to the applications list |
| AC-15-5 | I am not signed in | I navigate directly to `/applications/:id/edit` | I am redirected to the sign-in page |

---

### US-17 — Logout from the applications list

> As a signed-in user, I want to log out directly from the applications list page so that I can end my session without navigating elsewhere.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-17-1 | I am on the applications list page | The page loads | A `⋮` (kebab) menu button is visible in the top-right corner of the page header |
| AC-17-2 | I am on the applications list page on a desktop or tablet viewport | The page loads | My email address is displayed immediately to the left of the page-level `⋮` button |
| AC-17-2b | I am on the applications list page on a mobile viewport (≤ 480 px wide) | The page loads | My email address is hidden to prevent the header from becoming crowded |
| AC-17-3 | I click the page-level `⋮` button | The menu opens | I see a "Logout" option |
| AC-17-4 | I click "Logout" | — | My session is terminated server-side and I am redirected to the sign-in page |
| AC-17-5 | I have logged out | I attempt to navigate to any protected route | I am redirected to the sign-in page |
| AC-17-6 | I click outside the open page-level menu | — | The menu closes and no action is taken |

> Session invalidation behaviour is governed by [requirements/features/authentication.md — US-02](authentication.md).

---

### US-18 — Track artifact completion from the list

> As a user, I want to see which artifacts I have completed for each application and mark them off directly from the list so that I can track my progress without navigating away.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-18-1 | An application exists | The page renders | The artifacts section is shown as a collapsed panel with the header "Show artifacts (X/Y completed)" |
| AC-18-2 | The page first renders a card | — | The artifacts panel is collapsed by default |
| AC-18-3 | The application has no completed artifacts | The page renders | The header reads "Show artifacts (0/N completed)" |
| AC-18-4 | All artifacts are completed | The page renders | The header reads "Show artifacts (N/N completed)" |
| AC-18-5 | I click the artifacts panel header | The panel is collapsed | The panel expands to reveal one row per artifact, each with a checkbox and label; the header now reads "Hide artifacts (X/Y completed)" |
| AC-18-6 | I click the artifacts panel header | The panel is expanded | The panel collapses and the individual artifact rows are hidden; the header reverts to "Show artifacts (X/Y completed)" |
| AC-18-7 | The panel is expanded | I check an uncompleted artifact | The artifact is marked as completed, the checkbox becomes checked, and the completed count in the header increments immediately |
| AC-18-8 | The panel is expanded | I uncheck a completed artifact | The artifact is marked as not completed, the checkbox becomes unchecked, and the completed count decrements immediately |
| AC-18-9 | The panel is expanded and I check or uncheck an artifact | The action completes | The change is persisted to the server without a full page reload |

---

### US-16 — Delete an application

> As a user, I want to delete an application I no longer need to track so that I can keep my list tidy.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-16-1 | I open the kebab menu on a card | I click "Delete Application" | A confirmation dialog appears warning me that the deletion is permanent |
| AC-16-2 | The confirmation dialog is open | I click Cancel | The dialog closes and the application remains unchanged |
| AC-16-3 | The confirmation dialog is open | I click Confirm Delete | The application is permanently deleted and removed from the list |
| AC-16-4 | The confirmation dialog is open | I click Confirm Delete | No other applications are affected |

---

## Functional Requirements

| # | Requirement |
|---|-------------|
| FR-APPS-01 | The system must return only the applications belonging to the currently authenticated user — never another user's data. |
| FR-APPS-09 | The application root route (`/`) must redirect signed-in users to the applications list page and redirect unauthenticated users to the sign-in page. |
| FR-APPS-02 | Applications must be returned ordered by `dueDate` ascending (earliest first). |
| FR-APPS-03 | Each application record must store: `dueDate`, `employer`, `jobTitle`, `jobDescription`, `salaryMin`, `salaryMax`, `salaryCurrency`, `artifacts`, and `status`. |
| FR-APPS-04 | The `status` field must be constrained to the following enum values: `NOT_SUBMITTED` (default), `SUBMITTED`, `INTERVIEWING`, `OFFER_RECEIVED`, `OFFER_ACCEPTED`, `OFFER_DECLINED`, `REJECTED`, `WITHDRAWN`. |
| FR-APPS-05 | The UI must derive the urgency colour band from the application's `status` and `dueDate` at render time using the client's local date — no separate field is stored for urgency. |
| FR-APPS-27 | When an application's status is `OFFER_ACCEPTED`, the application card must render with a bold, black border to visually distinguish it from all other cards. |
| FR-APPS-06 | The API endpoint for listing applications must return HTTP 401 if the request has no valid session. |
| FR-APPS-07 | An add-application button must be present in the top-left of the page header and navigate to the add-application flow when activated. On viewports wider than 480 px the button reads `+ Add an application`; on viewports 480 px wide and narrower it collapses to a single `+` character. The button must carry `aria-label="Add an application"` at all viewport widths. |
| FR-APPS-08 | When a user has no applications, the page must display an empty state rather than a blank or broken layout. |
| FR-APPS-10 | The due date display must append a days-remaining suffix for future dates (e.g. "(17 days away)"), show "(Today)" when the due date is today, and show the date alone when the due date is in the past. |
| FR-APPS-11 | The "show more" control on job descriptions must only appear when the description content actually overflows 6 lines — it must not render when the full description fits within 6 lines. |
| FR-APPS-19 | If an application has salary data, the card must display it with the currency symbol before each amount and the currency code after. The format depends on which values are present: both min and max → `[symbol][min]–[symbol][max] [code]`; min only → `[symbol][min]+ [code]`; max only → `up to [symbol][max] [code]`. If neither salary value is present, no salary line is rendered. The currency symbol must reflect the stored currency code (e.g. $ for CAD/USD, € for EUR, £ for GBP, $ for AUD, ¥ for JPY). |
| FR-APPS-12 | Each application card must expose a kebab (`⋮`) menu with three actions: Update Status, Edit Application, and Delete Application. |
| FR-APPS-13 | The "Update Status ▶" item in the kebab menu must open a submenu listing only the statuses that are valid to transition to from the application's current status (see US-ST for the full transition table). For terminal-state applications the submenu shows a single option labelled "Reset to Not Submitted". Selecting a status from the submenu must update the application immediately with no confirmation prompt, close both menus, and update the job title line in place without a full page reload. After a successful status change, an `aria-live="polite"` region must announce the result to screen readers (e.g. "Software Engineer at Acme marked as Interviewing."). The server must enforce the transition rules and return HTTP 422 with `{ "error": "Invalid status transition." }` if the requested transition is not permitted from the application's current status. |
| FR-APPS-14 | The Edit Application action must navigate to a pre-filled edit form at `/applications/:id/edit`; on save the user returns to the list with updated data. |
| FR-APPS-15 | The Delete Application action must display a confirmation dialog naming the specific application before any data is removed; cancelling must leave the application untouched. |
| FR-APPS-16 | All mutating operations (status update, edit, delete) must verify the requesting user owns the application — HTTP 403 if not. |
| FR-APPS-17 | A page-level `⋮` kebab menu must be present in the top-right of the page header; it must contain a "Logout" action that invalidates the session server-side and redirects the user to the sign-in page. |
| FR-APPS-18 | On viewports wider than 480 px, the authenticated user's email address must be displayed immediately to the left of the page-level `⋮` button. On viewports 480 px wide and narrower, the email must be hidden to prevent header crowding. The email is read from the active session and requires no separate API call. |
| FR-APPS-20 | The artifacts section on each application card must be rendered as a collapsible panel, collapsed by default. |
| FR-APPS-21 | The artifacts panel toggle must display "Show artifacts (X/Y completed)" when collapsed and "Hide artifacts (X/Y completed)" when expanded, where X is the number of completed artifacts and Y is the total. |
| FR-APPS-22 | When the artifacts panel is expanded, each artifact must appear as a separate row containing a checkbox and the artifact label. |
| FR-APPS-23 | Checking or unchecking an artifact must persist the `completed` state to the server immediately, without a full page reload. The completed count in the panel header must update to reflect the new state optimistically, without waiting for the server round-trip. |
| FR-APPS-24 | The API endpoint for toggling artifact completion must verify that the artifact's parent application belongs to the requesting user — HTTP 403 if not. |
| FR-APPS-25 | Interactive touch targets (kebab trigger buttons, artifacts panel toggle) must have a minimum hit area of 44 × 44 px to meet mobile usability standards. |
| FR-APPS-26 | All CSS transitions must be suppressed when the user's operating system has `prefers-reduced-motion` set to `reduce`. |

---

## Out of Scope for this Feature

- Creating a new application — see [add-application.md](add-application.md)
- Filtering or searching the list
- Sorting by fields other than due date
- Pagination (assumed unnecessary at v1 list sizes)
