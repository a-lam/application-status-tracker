# Page: Add Application

> **Last updated:** 2026-04-07
> **Feature requirements:** [requirements/features/add-application.md](../../requirements/features/add-application.md)
> **Technical module:** [technical/modules/add-application-module.md](../../technical/modules/add-application-module.md)

---

## Purpose

The add application page is where a user records a new job application they want to track. It is reached exclusively via the `+ Add an application` button on the applications list page. On successful save, the user returns directly to the list where the new card appears in its correct chronological position.

---

## Components Used

| Component | Role |
|-----------|------|
| `AddApplicationPage` | Page shell, owns submit lifecycle and navigation |
| `ApplicationForm` | Field layout and validation orchestration |
| `DatePickerField` | Calendar widget for due date, min date = today |
| `SalaryFields` | Currency selector + starting and maximum salary inputs with cross-field validation |
| `ArtifactListInput` | Add/remove artifact items as a managed list; shows read-only completion indicators in edit mode |
| `ArtifactItem` | Single artifact row with remove button; in edit mode also shows a read-only completion indicator and strikethrough style for completed items |

---

## User Interactions

### Normal flow

1. User clicks `+ Add an application` on the applications list page and arrives at `/applications/new`
2. The form loads with all fields empty
3. User fills in required fields (Employer, Job Title, Due Date) and any optional fields
4. User clicks Save → application is created → redirected to the list page

### Due date picker

- Clicking the Due Date field opens a calendar widget
- **When adding a new application:** dates before today are visually greyed out and cannot be clicked; today is the earliest selectable date
- **When editing an existing application:** all dates are selectable, including past dates; no dates are greyed out or disabled
- If an application's due date is already in the past when editing, the user may keep the past date or change it to any date (past or future); saving is always permitted
- Clicking a valid date selects it, closes the calendar, and shows the formatted date in the field

### Artifacts list

- The Artifacts section loads with a pre-populated list of artifacts: CV, Cover Letter, Research Statement, Teaching Philosophy, Teaching Portfolio, Letters of Recommendation, DEI Statement, Transcript
- A text input and Add button sit below the list
- Each artifact row has a `×` remove button; pre-populated items may be removed just like user-added ones
- User types an artifact name and clicks Add or presses Enter — the new artifact is appended to the bottom of the list (directly above the input row); the input clears
- Adding a duplicate (case-insensitive) shows an inline error and does not add the item
- Clicking Add on an empty input does nothing

**Edit mode only — artifact completion:**

- Each artifact row shows a read-only completion indicator to the left of the label
- The indicator reflects the artifact's current `completed` state but cannot be interacted with — completion is managed exclusively from the applications list page
- Completed artifacts are visually distinguished: the label text is shown with a strikethrough and muted colour
- The add/remove controls remain active in edit mode so artifacts can still be added or removed

### Salary section

- The Salary section appears above the Job Description field
- On wide viewports, Starting Salary and Maximum Salary are on the left and Currency is on the right, all on a single row; on narrow viewports, Currency wraps to a second row below the salary inputs
- The currency dropdown defaults to CAD
- All three controls are optional — leaving them blank is valid
- **Validation on blur and Save:** when the user leaves a salary input, or clicks Save, the field immediately shows an error state (red border + inline message) if the value is negative or non-numeric, or clears any error if the value is valid or empty; Save is blocked while any salary field is invalid
- If only one salary value is entered, no cross-field error is shown
- If both salary values are entered and Starting Salary ≥ Maximum Salary, an inline error appears on blur or on Save attempt: _"Starting salary must be less than maximum salary"_

### Job Listing URL field

- The Job Listing URL field is optional and sits between Job Title and Due Date
- On blur and on Save, if a non-empty value is present that does not begin with `http://` or `https://`, the field is shown in an error state with the message "Please enter a valid URL (must start with http:// or https://)"
- An empty value is always valid — no error is shown
- A valid URL clears any existing error state immediately on blur

### Validation

- Clicking Save with missing required fields highlights each missing field with an inline error and moves focus to the first problem
- The form is not submitted until all required fields are filled and all optional fields with values pass validation (including Job Listing URL)

### Cancel

- A Cancel button is always visible
- Clicking it discards all form state and returns to the applications list without creating a record

### Session expiry

If the user's session expires while they are filling in this form, they are automatically signed out and redirected to the sign-in page. Any unsaved form data is lost. No action or page reload is required — the client polls the server periodically and acts immediately when the session is found to be invalid.

---

## Wireframe Description

### Form (initial / empty state)

```
┌────────────────────────────────────────────────────────┐
│  ← Back to Applications                                │
│                                                        │
│  Add Application                                       │
│                                                        │
│  Employer *                                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Job Title *                                           │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Job Listing URL                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │  https://                                        │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Due Date *                                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Select a date...                       [📅]     │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Salary                                                │
│  ┌────────────────────┐  ┌────────────────┐  ┌──────┐ │
│  │  Starting Salary   │  │ Maximum Salary │  │ CAD▾ │ │
│  │  ┌──────────────┐  │  │ ┌────────────┐ │  └──────┘ │
│  │  │              │  │  │ │            │ │           │
│  │  └──────────────┘  │  │ └────────────┘ │           │
│  └────────────────────┘  └────────────────┘           │
│                                                        │
│  Job Description                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Artifacts                                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │  CV                                          [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Cover Letter                                [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Research Statement                          [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Teaching Philosophy                         [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Teaching Portfolio                          [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Letters of Recommendation                   [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  DEI Statement                               [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Transcript                                  [×] │ │
│  └──────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────┐  ┌──────────────┐  │
│  │ Add an artifact...           │  │  + Add       │  │
│  └──────────────────────────────┘  └──────────────┘  │
│                                                        │
│  ┌────────────────┐   ┌────────────────┐              │
│  │      Save      │   │     Cancel     │              │
│  └────────────────┘   └────────────────┘              │
│                                                        │
│  * Required field                                      │
└────────────────────────────────────────────────────────┘
```

### Calendar widget (due date open)

```
│  Due Date *                                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │  1 Apr 2026                             [📅]     │ │
│  └──────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐ │
│  │        ◀  April 2026  ▶                          │ │
│  │   Mo  Tu  We  Th  Fr  Sa  Su                     │ │
│  │   --  --  01  02  03  04  05  ← past dates grey  │ │
│  │   06  07  08  09  10  11  12                     │ │
│  │   13  14  15  16  17  18  19                     │ │
│  │   20  21  22  23  24  25  26                     │ │
│  │   27  28  29  30                                 │ │
│  └──────────────────────────────────────────────────┘ │
```

*(Add flow: past dates shown in grey, unclickable. Today is highlighted. Future dates are fully interactive. Edit flow: no dates are disabled — all are fully interactive.)*

### Artifacts section (with items added)

```
│  Artifacts                                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │  CV                                          [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Cover Letter                                [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Research Statement                          [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Teaching Philosophy                         [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Teaching Portfolio                          [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Letters of Recommendation                   [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  DEI Statement                               [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Transcript                                  [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Writing Sample                              [×] │ │   ← user-added item appears above input
│  └──────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────┐  ┌──────────────┐  │
│  │ Add an artifact...           │  │  + Add       │  │
│  └──────────────────────────────┘  └──────────────┘  │
```

### Artifacts section in edit mode (with completion state)

```
│  Artifacts                                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │  ● ~~CV~~                                    [×] │ │  ← completed: filled indicator + strikethrough
│  ├──────────────────────────────────────────────────┤ │
│  │  ● ~~Cover Letter~~                          [×] │ │  ← completed
│  ├──────────────────────────────────────────────────┤ │
│  │  ○ Research Statement                        [×] │ │  ← not completed
│  ├──────────────────────────────────────────────────┤ │
│  │  ○ Teaching Philosophy                       [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  ○ Teaching Portfolio                        [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  ○ Letters of Recommendation                 [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  ○ DEI Statement                             [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  ○ Transcript                                [×] │ │
│  └──────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────┐  ┌──────────────┐  │
│  │ Add an artifact...           │  │  + Add       │  │
│  └──────────────────────────────┘  └──────────────┘  │
```

*(Edit flow only. ● = completed (read-only), ○ = not completed (read-only). The indicator cannot be clicked. The [×] remove button remains active on all rows.)*

### Validation state (required fields missing)

```
│  Employer *                                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│  ⚠ Employer is required                               │
│                                                        │
│  Job Title *                                           │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│  ⚠ Job title is required                              │
```

### Salary validation state (starting ≥ maximum)

```
│  Salary                                                │
│  ┌──────────────────────┐  ┌──────────────┐  ┌──────┐ │
│  │  Starting Salary     │  │ Maximum Sal. │  │ CAD▾ │ │
│  │  ┌──────────────┐    │  │ ┌──────────┐ │  └──────┘ │
│  │  │  90000    [!]│    │  │ │  80000   │ │           │
│  │  └──────────────┘    │  │ └──────────┘ │           │
│  └──────────────────────┘  └──────────────┘           │
│  ⚠ Starting salary must be less than maximum salary   │
```

### Salary blur validation state (invalid individual field)

```
│  Salary                                                │
│  ┌──────────────────────┐  ┌──────────────┐  ┌──────┐ │
│  │  Starting Salary     │  │ Maximum Sal. │  │ CAD▾ │ │
│  │  ┌──────────────┐    │  │ ┌──────────┐ │  └──────┘ │
│  │  │  -5000    [!]│    │  │ │          │ │           │
│  │  └──────────────┘    │  │ └──────────┘ │           │
│  └──────────────────────┘  └──────────────┘           │
│  ⚠ Starting salary must be a non-negative number      │
```

*(Error shown immediately on blur, before Save is clicked. The [!] icon represents the red border on the invalid input.)*

### Salary layout on narrow viewports

```
│  Salary                                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Starting Salary      Maximum Salary            │  │
│  │  ┌────────────────┐   ┌───────────────────────┐ │  │
│  │  │                │   │                       │ │  │
│  │  └────────────────┘   └───────────────────────┘ │  │
│  │                                                 │  │
│  │  Currency                                       │  │
│  │  ┌───────────────┐                              │  │
│  │  │  CAD ▾        │                              │  │
│  │  └───────────────┘                              │  │
│  └─────────────────────────────────────────────────┘  │
```

---

## Routes

| Route | Description |
|-------|-------------|
| `/applications` | Applications list — entry point via `+ Add an application` button |
| `/applications/new` | This page |
| `POST /api/applications` | Backend endpoint called on Save |

---

## Accessibility Notes

- Required fields must be marked with `aria-required="true"` in addition to the visual `*` indicator
- Error messages must be linked to their field via `aria-describedby`
- The calendar widget must be keyboard navigable (arrow keys to move between dates, Enter to select, Escape to close)
- The artifact Add button must be operable via keyboard (Enter / Space) without relying on clicking the input
- Each `ArtifactItem` remove button must have `aria-label="Remove [artifact name]"` so it is distinguishable to screen readers
- The Job Listing URL field must use `<input type="url">` with `aria-describedby` linking to its inline error message when in an error state
