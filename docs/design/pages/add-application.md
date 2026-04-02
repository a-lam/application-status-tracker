# Page: Add Application

> **Last updated:** 2026-04-01
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
| `ArtifactListInput` | Add/remove artifact items as a managed list |
| `ArtifactItem` | Single artifact row with remove button |

---

## User Interactions

### Normal flow

1. User clicks `+ Add an application` on the applications list page and arrives at `/applications/new`
2. The form loads with all fields empty
3. User fills in required fields (Employer, Job Title, Due Date) and any optional fields
4. User clicks Save → application is created → redirected to the list page

### Due date picker

- Clicking the Due Date field opens a calendar widget
- Dates before today are visually greyed out and cannot be clicked
- Clicking a valid date selects it, closes the calendar, and shows the formatted date in the field
- Today's date is a valid selection

### Artifacts list

- The Artifacts section shows a text input and an Add button, with an empty list area below
- User types an artifact name (e.g. "CV") and clicks Add or presses Enter
- The artifact appears as a pill or row in the list below; the input clears
- Each artifact row has a `×` remove button
- Adding a duplicate (case-insensitive) shows an inline error and does not add the item
- Clicking Add on an empty input does nothing

### Validation

- Clicking Save with missing required fields highlights each missing field with an inline error and moves focus to the first problem
- The form is not submitted until all required fields are filled

### Cancel

- A Cancel button is always visible
- Clicking it discards all form state and returns to the applications list without creating a record

### Session expiry

If the user's session expires while they are filling in this form, they are automatically signed out and redirected to the sign-in page. Any unsaved form data is lost. No action or page reload is required — the client detects expiry and acts immediately.

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
│  Due Date *                                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Select a date...                       [📅]     │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Job Description                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Artifacts                                             │
│  ┌──────────────────────────────┐  ┌──────────────┐  │
│  │ Add an artifact...           │  │  + Add       │  │
│  └──────────────────────────────┘  └──────────────┘  │
│  (no artifacts added yet)                              │
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

*(Past dates shown in grey, unclickable. Today is highlighted. Future dates are fully interactive.)*

### Artifacts section (with items added)

```
│  Artifacts                                             │
│  ┌──────────────────────────────┐  ┌──────────────┐  │
│  │ Add an artifact...           │  │  + Add       │  │
│  └──────────────────────────────┘  └──────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  CV                                          [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Cover Letter                                [×] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Portfolio                                   [×] │ │
│  └──────────────────────────────────────────────────┘ │
```

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
