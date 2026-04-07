# Module: Add Application

> **Last updated:** 2026-04-01
> **Feature requirements:** [requirements/features/add-application.md](../../requirements/features/add-application.md)
> **Design:** [design/pages/add-application.md](../../design/pages/add-application.md)
> **Entry point:** `+ Add an application` button in `ApplicationsListPage` (see [applications-list-module.md](applications-list-module.md))

---

## Overview

The add application module provides the form through which users create a new application record. It consists of a `POST /api/applications` backend route and a multi-field frontend page. The key interactions that require specific component treatment are the calendar date picker (restricted to today and future dates) and the artifacts list builder (discrete items, not a text field).

---

## Schema Change: Artifacts

The `Application` model previously defined in the [applications list module](applications-list-module.md) used `artifactsRequired String` as a placeholder. Since artifacts are now a managed list of discrete items, this field is replaced with a related `Artifact` model.

**Updated Prisma schema** — replace `artifactsRequired String` in the `Application` model and add:

```prisma
model Application {
  id              String            @id @default(cuid())
  dueDate         DateTime
  employer        String
  jobTitle        String
  jobDescription  String?
  salaryMin       Decimal?          @db.Decimal(12, 2)
  salaryMax       Decimal?          @db.Decimal(12, 2)
  salaryCurrency  String?
  status          ApplicationStatus @default(NOT_SUBMITTED)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  userId          String
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  artifacts       Artifact[]

  @@map("applications")
}

model Artifact {
  id            String      @id @default(cuid())
  label         String
  order         Int
  createdAt     DateTime    @default(now())

  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@unique([applicationId, label])  -- enforces no duplicate labels per application
  @@map("artifacts")
}

enum ApplicationStatus {
  NOT_SUBMITTED
  SUBMITTED
}
```

**Key decisions:**
- `jobDescription` is now `String?` (nullable) — it is optional per the requirements
- `artifactsRequired String` is removed entirely; replaced by the `artifacts` relation
- `Artifact.order` preserves the user's insertion order when the list is rendered
- `@@unique([applicationId, label])` enforces the no-duplicate-artifact rule at the database level as a backstop to the client-side check
- `salaryMin` and `salaryMax` are nullable `Decimal(12,2)` — both are optional; neither implies the other
- `salaryCurrency` is a nullable `String` storing the ISO 4217 currency code (e.g. `"CAD"`); stored alongside the salary values and treated as optional if both salary fields are null

---

## Component Architecture

### Backend

```
server/src/
└── routes/
    └── applications.js     ← POST /api/applications added to existing route file
                               GET  /api/applications (already defined in list module)
```

### Frontend

```
client/src/
├── pages/
│   ├── AddApplicationPage.jsx      ← Top-level page for creating; owns form state and submit lifecycle
│   └── EditApplicationPage.jsx     ← Top-level page for editing; fetches existing record, pre-fills form
└── components/
    └── applications/
        ├── ApplicationForm.jsx      ← Form shell, field layout, validation orchestration (shared by add and edit)
        ├── DatePickerField.jsx      ← Calendar widget wrapper; disablePast=true for add, false for edit
        ├── SalaryFields.jsx         ← Currency selector + starting/max salary inputs with cross-field validation
        ├── ArtifactListInput.jsx    ← Add/remove artifact items; manages local list state
        └── ArtifactItem.jsx         ← Single artifact row with label and remove button
```

### `AddApplicationPage`

Owns the top-level form state and submission lifecycle for creating a new application. On successful `POST`, redirects to `/applications`. On cancel, navigates back to `/applications` without submitting. Renders `ApplicationForm` with handlers passed as props.

### `EditApplicationPage`

Owns the top-level form state and submission lifecycle for editing an existing application. On mount, calls `GET /api/applications/:id` to fetch the existing record and pre-fill all form fields. On successful `PATCH`, redirects to `/applications`. On cancel, navigates back to `/applications` without submitting. Renders the same `ApplicationForm` used by `AddApplicationPage`, passing `disablePast={false}` to `DatePickerField`.

### `ApplicationForm`

Lays out all fields and manages field-level validation state. Passes specialised handlers down to `DatePickerField` and `ArtifactListInput`. Does not own the submit action — calls the handler provided by `AddApplicationPage`.

**Fields:**

| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Employer | `<input type="text">` | Yes | |
| Job Title | `<input type="text">` | Yes | |
| Due Date | `DatePickerField` | Yes | Calendar widget, today or future only |
| Starting Salary | `SalaryFields` (text input, numeric keyboard) | No | Must be < Maximum Salary when both are provided; validated on blur and Save |
| Maximum Salary | `SalaryFields` (text input, numeric keyboard) | No | Must be > Starting Salary when both are provided; validated on blur and Save |
| Currency | `SalaryFields` (selector) | No | Defaults to CAD; positioned to the right of the two salary inputs on wide viewports |
| Job Description | `<textarea>` | No | |
| Artifacts | `ArtifactListInput` | No | List builder, not a text field |

> **Status is not a form field.** Every new application is created with `NOT_SUBMITTED` set server-side. Status can only be changed after creation via the kebab menu on the applications list page.

### `DatePickerField`

Wraps the `DayPicker` component from `react-day-picker`. Accepts a `disablePast` boolean prop (defaults to `true`). When `disablePast` is `true` (add flow), past dates are disabled via `disabled={{ before: new Date() }}`. When `disablePast` is `false` (edit flow), no date restriction is applied and all dates — including past dates — are selectable. Emits the selected date as an ISO date string (`YYYY-MM-DD`) to the parent form.

### `SalaryFields`

Renders a grouped section containing two `<input type="text" inputMode="numeric">` fields (Starting Salary and Maximum Salary) and a currency `<select>`. Using `type="text"` preserves the raw typed value so that entries like `"100000s"` are visible to validation rather than being silently discarded by the browser. On wide viewports all three controls sit on a single row with currency to the right of the salary inputs; on narrow viewports the currency selector wraps to a second row below. Manages no internal state — all values are lifted to `ApplicationForm` via callbacks.

Behaviour:
- **Layout:** Starting Salary and Maximum Salary are on the left; Currency is to the right on the same row. When the viewport narrows and the row cannot fit all three controls, Currency wraps below the salary inputs.
- Currency selector defaults to `"CAD"` on mount; other options: USD, EUR, GBP, AUD, JPY
- Salary inputs use `type="text"` with `inputMode="numeric"` — the raw string is validated against `^\d+(\.\d+)?$`; anything that does not match (including letters, symbols, or negative signs) is treated as invalid
- **Per-field validation** runs on blur of either salary input and when the form's Save action is triggered:
  - Negative or non-numeric value → field shown in error state with inline message; form blocked from submitting
  - Empty value → no error (field is optional)
  - Valid non-negative number → field shown in valid state (error cleared)
- **Cross-field validation** runs on blur of either salary input and on form submit:
  - If both values are present and `salaryMin >= salaryMax`, an inline error is shown: _"Starting salary must be less than maximum salary"_
  - If only one value is present, no cross-field error is shown
- Emits `{ salaryMin, salaryMax, salaryCurrency }` to `ApplicationForm` whenever any value changes

### `ArtifactListInput`

Manages its own internal list state (array of strings). Exposes the current list to `ApplicationForm` via a callback whenever the list changes.

**Initial state:** the list is pre-populated with the following items (in order): CV, Cover Letter, Research Statement, Teaching Philosophy, Teaching Portfolio, Letters of Recommendation, DEI Statement, Transcript.

**Layout:** the current list of `ArtifactItem` components is rendered first; the text input and Add button row sits below the list. New artifacts are appended to the end of the list and therefore appear directly above the input row.

Internal behaviour:
- Text input + Add button (also triggered on Enter keypress) rendered below the artifact list
- On add: trims whitespace, checks for empty string, checks for duplicate (case-insensitive) against current list, appends to end of list and clears input if valid, shows inline error if invalid
- On remove: splices the item from the list by index; works identically for pre-populated and user-added items
- Renders the current list as `ArtifactItem` components above the input row

### `ArtifactItem`

Renders a single artifact label and a remove (`×`) button. Calls the remove handler provided by `ArtifactListInput` with its index.

---

## Data Flow

### Form Submission

```
1. User fills in the form on /applications/new
2. User clicks Save
3. ApplicationForm runs client-side validation
   → Missing required field: marks field as invalid, focuses first error, stops here
   → All required fields present: proceeds

4. AddApplicationPage calls POST /api/applications with body:
   {
     employer:        "Acme Corp",
     jobTitle:        "Senior Engineer",
     dueDate:         "2026-04-15",
     jobDescription:  "...",          // optional, omitted if empty
     salaryMin:       50000,          // optional, omitted if empty
     salaryMax:       80000,          // optional, omitted if empty
     salaryCurrency:  "CAD",          // optional, omitted if both salary fields are empty
     artifacts:       ["CV", "Cover Letter"]   // ordered array of strings
   }
   // status is NOT sent by the client — server always creates with NOT_SUBMITTED

5. Server — POST /api/applications handler
   a. Validates session → 401 if missing
   b. Validates required fields (employer, jobTitle, dueDate) → 422 with errors if invalid
      Validates salary: if both salaryMin and salaryMax are present, salaryMin must be < salaryMax → 422 if violated
      Validates salary values: must be non-negative numbers if provided → 422 if violated
   c. Begins a Prisma transaction:
      i.  Creates Application record with userId from session
      ii. Creates one Artifact record per item in artifacts[], with order = array index
   d. Returns 201 with the created application (including artifacts array)

6. AddApplicationPage receives 201
   → Redirects to /applications

7. ApplicationsListPage mounts, fetches GET /api/applications
   → New application appears in the list at its correct due-date position
```

### Cancel

```
1. User clicks Cancel (or navigates away)
2. No API call is made
3. Client navigates to /applications
4. Form state is discarded
```

### Validation Error (client-side)

```
1. User clicks Save with missing required fields
2. ApplicationForm marks each invalid field
3. Focus moves to the first invalid field
4. Form is not submitted — no network request made
```

### Validation Error (server-side)

```
1. POST /api/applications receives invalid or incomplete data
2. Server returns HTTP 422:
   {
     "errors": {
       "employer":  "Required",
       "dueDate":   "Required"
     }
   }
3. ApplicationForm displays server errors alongside the relevant fields
```

---

## API Endpoints

| Method | Path | Auth required | Description |
|--------|------|--------------|-------------|
| `GET` | `/api/applications/:id` | Yes | Fetch a single application by ID (used by the edit form to pre-populate fields) |
| `POST` | `/api/applications` | Yes | Create a new application for the current user |

**`GET /api/applications/:id` — responses:**

| Status | Condition |
|--------|-----------|
| `200 OK` | Application found; body contains the full application record including artifacts |
| `401 Unauthorized` | No valid session |
| `403 Forbidden` | Application exists but belongs to a different user |
| `404 Not Found` | No application with that ID |

**`POST /api/applications` — request body:**

```json
{
  "employer":        "string (required)",
  "jobTitle":        "string (required)",
  "dueDate":         "YYYY-MM-DD (required, today or future)",
  "jobDescription":  "string (optional)",
  "salaryMin":       "number (optional, non-negative)",
  "salaryMax":       "number (optional, non-negative, must be > salaryMin when both present)",
  "salaryCurrency":  "string (optional, ISO 4217 code, e.g. \"CAD\")",
  "artifacts":       ["string", "..."]
}
```

> `status` is not accepted in the request body. The server always sets it to `NOT_SUBMITTED` on creation. Any `status` value sent by the client must be ignored.

**`POST /api/applications` — responses:**

| Status | Condition |
|--------|-----------|
| `201 Created` | Application created successfully; body contains the new application with its ID and artifacts |
| `401 Unauthorized` | No valid session |
| `422 Unprocessable Entity` | Required fields missing, `dueDate` is in the past, salary values are negative, or `salaryMin >= salaryMax` when both are provided |

---

## Dependencies

| Dependency | Used by | Purpose |
|------------|---------|---------|
| `@prisma/client` | `routes/applications.js` | Create `Application` and `Artifact` records in a transaction |
| `better-auth` | `routes/applications.js` | Validate session and extract `userId` |
| `express` | `routes/applications.js` | Route handler |
| React state (`useState`) | `AddApplicationPage`, `ArtifactListInput` | Form and list state management |
| `react-day-picker` | `DatePickerField` | Calendar widget for due date selection |
