# Feature: Add Application

> **Last updated:** 2026-04-01
> **Status:** Requirements defined — not yet implemented
> **Entry point:** The `+ Add an application` button on the applications list page (see [US-13](applications-list.md#us-13--add-a-new-application))

---

## User Stories

### US-20 — Add a new application

> As a signed-in user, I want to fill out a form to add a new job application so that I can begin tracking it.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-20-1 | I am on the applications list page | I click `+ Add an application` | I am taken to the add application page |
| AC-20-2 | I am on the add application page | The page loads | I see input fields for: Employer, Job Title, Due Date, Job Description, Salary, and Artifacts |
| AC-20-3 | I have filled in all required fields (Employer, Job Title, Due Date) | I click Save | The application is saved and I am returned to the applications list page where the new application appears |
| AC-20-4 | I have left one or more required fields empty | I click Save | The form is not submitted, and each missing required field is highlighted with an error message |
| AC-20-5 | I have filled in only the required fields and left optional fields empty | I click Save | The application is saved successfully — optional fields are stored as empty |
| AC-20-6 | I am on the add application page | I click Cancel | No application is created and I am returned to the applications list page |
| AC-20-7 | I am not signed in | I navigate directly to the add application page URL | I am redirected to the sign-in page |

---

### US-21 — Select a due date using a calendar widget

> As a user, I want to pick the due date from a calendar so that I cannot accidentally enter an invalid or past date.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-21-1 | I am on the add application page | I interact with the Due Date field | A calendar widget opens for me to select a date |
| AC-21-2 | The calendar widget is open | I view the calendar | All dates before today are visually disabled and cannot be selected |
| AC-21-3 | The calendar widget is open | I click a disabled past date | Nothing happens — the date is not selected and the form value does not change |
| AC-21-4 | The calendar widget is open | I click a valid future date or today | The date is selected, the calendar closes, and the selected date appears in the Due Date field |
| AC-21-5 | I have selected a due date | I click Save | The saved application reflects the exact date I selected |

---

### US-23 — Enter a salary range

> As a user, I want to optionally record a starting and maximum salary for an application so that I can compare compensation across opportunities.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-23-1 | I am on the add application page | The page loads | I see a Starting Salary field, a Maximum Salary field, and a currency selector in the Salary section; the Salary section appears above the Job Description field |
| AC-23-2 | I leave both salary fields empty | I click Save | The application is saved successfully — both salary fields are stored as null |
| AC-23-3 | I enter a starting salary but leave maximum salary empty | I click Save | The application is saved successfully |
| AC-23-4 | I enter a maximum salary but leave starting salary empty | I click Save | The application is saved successfully |
| AC-23-5 | I enter a starting salary that is greater than or equal to the maximum salary | I click Save | The form is not submitted; an inline error appears indicating that starting salary must be less than maximum salary |
| AC-23-6 | I enter valid starting and maximum salary values | I click Save | The application is saved with both salary values and the selected currency |
| AC-23-7 | I have not changed the currency selector | The page loads | The currency defaults to CAD |
| AC-23-8 | I enter a value in a salary field | I tab or click away from the field | An inline indicator immediately shows whether the entered value is valid or invalid, without waiting for Save |
| AC-23-9 | A salary field contains an invalid value (negative number or non-numeric input) | I view the field | The field is visually highlighted in an error state with an inline error message |
| AC-23-10 | A salary field contains a valid value | I view the field | The field shows no error state |
| AC-23-13 | A salary field contains an invalid value and I have not clicked away | I click Save | The form is not submitted; the salary field is marked invalid and an inline error message appears — identical behaviour to blur |
| AC-23-11 | The viewport is wide enough | I view the Salary section | Starting Salary, Maximum Salary, and Currency are displayed on a single row |
| AC-23-12 | The viewport is narrow (e.g. mobile) | I view the Salary section | Starting Salary and Maximum Salary are on the first row; Currency wraps to a second row below them |

---

### US-22 — Build an artifacts list

> As a user, I want to add artifacts as individual items to a list so that each artifact is clearly separated and I can manage them one at a time.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-22-1 | I am on the add application page | I view the Artifacts section | I see a text input and an Add button, with an empty list below |
| AC-22-2 | I have typed an artifact name in the input | I click Add (or press Enter) | The artifact appears as an item in the list and the input is cleared |
| AC-22-3 | The artifacts list has one or more items | I view the list | Each item has a remove control (e.g. × button) beside it |
| AC-22-4 | The artifacts list has one or more items | I click the remove control on an item | That item is removed from the list; other items are unaffected |
| AC-22-5 | The artifact input is empty | I click Add | Nothing is added — the list is unchanged |
| AC-22-6 | I have typed an artifact that already exists in the list | I click Add | The duplicate is not added and an inline message indicates the item already exists |
| AC-22-7 | I save the application with one or more artifacts | The application appears on the list page | Each artifact is displayed as a distinct item on the application card |

---

## Functional Requirements

| # | Requirement |
|---|-------------|
| FR-ADDAPP-01 | The add application page must be accessible only to authenticated users; unauthenticated requests must redirect to the sign-in page. |
| FR-ADDAPP-02 | The form must require Employer, Job Title, and Due Date before allowing submission. All other fields are optional. |
| FR-ADDAPP-03 | The Due Date field must be presented as a calendar date picker — free-text date entry is not permitted. |
| FR-ADDAPP-04 | The calendar date picker must disable all dates before today; today itself must be selectable. |
| FR-ADDAPP-05 | Artifacts must be entered and stored as a discrete ordered list of strings, not as a single text field. |
| FR-ADDAPP-12 | The form must include an optional Salary section with a Starting Salary field, a Maximum Salary field, and a currency selector. All three are optional as a group. The Salary section must appear above the Job Description field. |
| FR-ADDAPP-13 | If both starting and maximum salary are provided, starting salary must be strictly less than maximum salary; otherwise the form must reject submission with an inline error. |
| FR-ADDAPP-14 | If only one salary value is provided (starting or maximum), no cross-field validation is performed — the single value must be accepted without error. |
| FR-ADDAPP-15 | Salary values must be stored as non-negative decimals. Non-numeric or negative inputs must be rejected with an inline error. |
| FR-ADDAPP-16 | The currency selector must offer a fixed list of common currencies (e.g. CAD, USD, EUR, GBP, AUD, JPY) and default to CAD when the page loads. The selected currency is stored alongside the salary values. |
| FR-ADDAPP-17 | Each salary input must provide immediate inline validation feedback on blur and on Save — showing an error state for invalid values (negative or non-numeric) and clearing the error for acceptable values. The form must not be submitted while any salary field contains an invalid value. |
| FR-ADDAPP-18 | On wide viewports, Starting Salary, Maximum Salary, and Currency must be laid out on a single row. On narrow viewports (mobile), the currency selector must wrap to a second row below the two salary inputs. |
| FR-ADDAPP-06 | Duplicate artifact entries (case-insensitive) must be rejected with an inline error. |
| FR-ADDAPP-07 | Every new application must be created with a status of `NOT_SUBMITTED` — the status field is not exposed on this form and must be set server-side. Status can only be changed after creation via the applications list page. |
| FR-ADDAPP-08 | On successful save, the system must persist the application to the database associated with the current user's ID and redirect the user to the applications list page. |
| FR-ADDAPP-09 | The API endpoint `POST /api/applications` must return HTTP 401 if the request has no valid session. |
| FR-ADDAPP-10 | The API endpoint must return HTTP 422 with field-level error details if required fields are missing or invalid. |
| FR-ADDAPP-11 | A Cancel control must be present on the page; activating it discards all form state and returns the user to the applications list page without creating a record. |

---

## Out of Scope for this Feature

- Editing an existing application (separate feature)
- Deleting an application (separate feature)
- Attaching files or documents as artifacts — artifacts are text labels only (e.g. "CV", "Cover Letter")
- Importing application data from external sources
- Saving a draft mid-form without submitting
