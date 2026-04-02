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
  id             String            @id @default(cuid())
  dueDate        DateTime
  employer       String
  jobTitle       String
  jobDescription String?
  status         ApplicationStatus @default(NOT_SUBMITTED)
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  userId         String
  user           User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  artifacts      Artifact[]

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
│   └── AddApplicationPage.jsx      ← Top-level page, owns form state and submit lifecycle
└── components/
    └── applications/
        ├── ApplicationForm.jsx      ← Form shell, field layout, validation orchestration
        ├── DatePickerField.jsx      ← Calendar widget wrapper, enforces min date = today
        ├── ArtifactListInput.jsx    ← Add/remove artifact items; manages local list state
        └── ArtifactItem.jsx         ← Single artifact row with label and remove button
```

### `AddApplicationPage`

Owns the top-level form state and submission lifecycle. On successful `POST`, redirects to `/applications`. On cancel, navigates back to `/applications` without submitting. Renders `ApplicationForm` with handlers passed as props.

### `ApplicationForm`

Lays out all fields and manages field-level validation state. Passes specialised handlers down to `DatePickerField` and `ArtifactListInput`. Does not own the submit action — calls the handler provided by `AddApplicationPage`.

**Fields:**

| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Employer | `<input type="text">` | Yes | |
| Job Title | `<input type="text">` | Yes | |
| Due Date | `DatePickerField` | Yes | Calendar widget, today or future only |
| Job Description | `<textarea>` | No | |
| Artifacts | `ArtifactListInput` | No | List builder, not a text field |

> **Status is not a form field.** Every new application is created with `NOT_SUBMITTED` set server-side. Status can only be changed after creation via the kebab menu on the applications list page.

### `DatePickerField`

Wraps the `DayPicker` component from `react-day-picker`. Receives `minDate = today` as a prop and passes it to the picker via `disabled={{ before: new Date() }}` to disable past dates. Emits the selected date as an ISO date string (`YYYY-MM-DD`) to the parent form.

### `ArtifactListInput`

Manages its own internal list state (array of strings). Exposes the current list to `ApplicationForm` via a callback whenever the list changes.

Internal behaviour:
- Text input + Add button (also triggered on Enter keypress)
- On add: trims whitespace, checks for empty string, checks for duplicate (case-insensitive) against current list, appends to list and clears input if valid, shows inline error if invalid
- On remove: splices the item from the list by index
- Renders the current list as `ArtifactItem` components

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
     employer:       "Acme Corp",
     jobTitle:       "Senior Engineer",
     dueDate:        "2026-04-15",
     jobDescription: "...",          // optional, omitted if empty
     artifacts:      ["CV", "Cover Letter"]   // ordered array of strings
   }
   // status is NOT sent by the client — server always creates with NOT_SUBMITTED

5. Server — POST /api/applications handler
   a. Validates session → 401 if missing
   b. Validates required fields (employer, jobTitle, dueDate) → 422 with errors if invalid
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
| `POST` | `/api/applications` | Yes | Create a new application for the current user |

**Request body:**

```json
{
  "employer":       "string (required)",
  "jobTitle":       "string (required)",
  "dueDate":        "YYYY-MM-DD (required, today or future)",
  "jobDescription": "string (optional)",
  "artifacts":      ["string", "..."]
}
```

> `status` is not accepted in the request body. The server always sets it to `NOT_SUBMITTED` on creation. Any `status` value sent by the client must be ignored.

**Responses:**

| Status | Condition |
|--------|-----------|
| `201 Created` | Application created successfully; body contains the new application with its ID and artifacts |
| `401 Unauthorized` | No valid session |
| `422 Unprocessable Entity` | Required fields missing or `dueDate` is in the past |

---

## Dependencies

| Dependency | Used by | Purpose |
|------------|---------|---------|
| `@prisma/client` | `routes/applications.js` | Create `Application` and `Artifact` records in a transaction |
| `better-auth` | `routes/applications.js` | Validate session and extract `userId` |
| `express` | `routes/applications.js` | Route handler |
| React state (`useState`) | `AddApplicationPage`, `ArtifactListInput` | Form and list state management |
| `react-day-picker` | `DatePickerField` | Calendar widget for due date selection |
