# Feature: Share

> **Last updated:** 2026-04-09

---

## User Stories

### US-01 — Share applications with another person

> As a user, I want to share read-only access to my job applications with someone else via email so that they can follow my progress.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-01-1 | I am on the Share page | I enter a recipient email and click "Add" | A share is created, an invitation email is sent to the recipient, and the share appears in the active shares list with its expiry date |
| AC-01-2 | I enter my own email address | I click "Add" | The server rejects the request with a 400 error and the client displays "You cannot share with yourself." No share is created and no email is sent |
| AC-01-3 | I already have an active share (unexpired) for an email | I submit that email again | The existing share's expiry is extended to now + 90 days; I am informed that the share already existed and its expiry has been extended; no new record is created and no new email is sent |
| AC-01-4 | I have a previously expired share for an email | I submit that email | The expired record is deleted, a new share with a new token is created, and a fresh invitation email is sent |
| AC-01-5 | I already have 20 active shares | I try to add another | The server returns a clear error and no new share is created |

---

### US-02 — Revoke a share

> As a user, I want to remove a share at any time so that the recipient immediately loses access.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-02-1 | I have one or more active shares | I click "Remove" on a share entry | The share record is deleted immediately and the entry disappears from the list |
| AC-02-2 | A share has been revoked | The recipient visits `/shared/:token/view` | They are redirected to the verification page, which shows an error indicating the invitation is no longer valid |

---

### US-03 — Navigate to the Share page

> As a user, I want to reach the Share page from the main application menu so that I can manage who can see my applications.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-03-1 | I am on the applications list page | I open the page-level `⋮` menu | A "Share" item appears above "Logout" |
| AC-03-2 | I click "Share" in the menu | — | I am navigated to `/share` |

---

### US-04 — Receive and use a shared link

> As a recipient, I want to receive an invitation email and use it to view someone's applications so that I can follow their job search.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-04-1 | A user has shared with my email | — | I receive an email containing a link to `/shared/:token` |
| AC-04-2 | I visit a valid, unexpired shared link | — | A verification code is automatically sent to my email and a code entry form is shown with a message: "We've sent a verification code to [email]. Enter it below to view the shared applications." |
| AC-04-3 | I enter the correct code within 15 minutes | I submit | I am granted a 7-day read-only session and redirected to `/shared/:token/view` |
| AC-04-4 | I enter an incorrect code | I submit | A 401 error is shown; I can try again (subject to rate limits) |
| AC-04-5 | I wait more than 15 minutes before entering the code | I submit | A 410 response is returned and the client prompts me to request a new code |
| AC-04-6 | I visit an expired or revoked shared link | — | An error message indicates the invitation is no longer valid; no code is sent |

---

### US-05 — Resend verification code

> As a recipient, I want to be able to request another verification code if I missed or lost the first one, subject to a cooldown.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-05-1 | A code was just sent | — | A countdown timer appears immediately; the "Resend code" button is disabled until the 3-minute cooldown expires |
| AC-05-2 | I refresh the page within the 3-minute cooldown | — | The timer resumes from the remaining time; no new code is sent |
| AC-05-3 | The countdown has elapsed | I click "Resend code" | A new code is sent and the 3-minute cooldown resets |

---

### US-06 — View shared applications (read-only)

> As a recipient with a valid session, I want to view the sharer's applications in read-only mode so that I can follow their progress without being able to change anything.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-06-1 | I have a valid recipient session | I visit `/shared/:token/view` | I see all of the sharer's applications in the same layout as the authenticated list, with a "Shared by: [sharer email]" label at the top |
| AC-06-2 | I am on the shared view | — | There is no "Add application" button, no page-level kebab menu, and no per-card kebab menu |
| AC-06-3 | I am on the shared view | — | Artifact checkboxes are visible but non-interactive (display-only) |
| AC-06-4 | I navigate directly to `/shared/:token/view` with no recipient session | — | I am redirected to `/shared/:token` to begin verification |
| AC-06-5 | My 7-day recipient session has expired | I visit `/shared/:token/view` | A notice is shown prompting me to re-verify via the token link |

---

### US-07 — Isolated sessions for authenticated users

> As a recipient who is also a signed-in user, I want my regular login session to be unaffected when I access a shared view so that the two contexts remain independent.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-07-1 | I am signed in to the app and I visit a shared link | — | The verification flow runs as normal; I must still enter a code |
| AC-07-2 | I complete verification as a recipient | — | My existing user session remains active; both sessions coexist |
| AC-07-3 | I navigate away from the shared view to `/` | — | I return to my own applications as a regular authenticated user |

---

## Functional Requirements

| # | Requirement |
|---|-------------|
| FR-SHARE-01 | A user must be able to create a share for any valid email address that is not their own, up to a maximum of 20 active shares per user. |
| FR-SHARE-02 | Each share must have a unique, cryptographically random URL-safe token (32 random bytes encoded as base64url, 43 characters, 256 bits of entropy). |
| FR-SHARE-03 | A share invitation email must be sent to the recipient's email address upon creation, containing a link to `/shared/:token`. |
| FR-SHARE-04 | A share invitation expires 90 days after creation (`createdAt + 90 days`). |
| FR-SHARE-05 | Submitting the sharer's own email address must be rejected with HTTP 400. |
| FR-SHARE-06 | If a share for a given email already exists and has not expired, the server must extend the expiry to `now + 90 days` and return a distinct success message; no duplicate record is created and no new invitation email is sent. |
| FR-SHARE-07 | If a share for a given email exists but has already expired, the server must delete the expired record, create a new share with a new token, and send a fresh invitation email. |
| FR-SHARE-08 | The sharer must be able to revoke any of their active shares at any time; revocation deletes the share record and immediately invalidates access via cascaded deletion of associated recipient sessions. |
| FR-SHARE-09 | When a recipient visits a valid shared link, a 6-digit numeric verification code must be generated, its bcrypt hash stored in a `RecipientSession` record, and the code sent to the recipient's email via Resend. The code expires 15 minutes after generation. |
| FR-SHARE-10 | Requesting a new code must be rate-limited to one per token per 3 minutes (send cooldown). The response must include a `retryAfter` timestamp. The client must display a countdown timer based on this value and prevent further requests until the cooldown expires. |
| FR-SHARE-11 | After 10 failed verification attempts within a rolling 1-hour window, the token must be locked for 3 hours. During lockout, both the code-request and verification endpoints must return HTTP 429 with the lock-lift timestamp. |
| FR-SHARE-12 | Verification attempts must be capped at 5 per 15-minute window per token to prevent brute-force of the 6-digit code. |
| FR-SHARE-13 | On successful code verification, a signed recipient session token must be issued, stored in an HttpOnly `recipient-session` cookie, with `sessionExpiresAt = verifiedAt + 7 days`. |
| FR-SHARE-14 | The shared applications view must display the same application data (all fields, including artifacts) as the authenticated list, and must include the sharer's email address. |
| FR-SHARE-15 | The shared applications view must be fully read-only: no add, edit, status-change, delete, or artifact-toggle actions are available. |
| FR-SHARE-16 | The `recipient-session` cookie must be separate from the `better-auth` user session cookie. The two sessions must not interfere with each other. |
| FR-SHARE-17 | If a share is revoked while a recipient session is active, `GET /api/shared/:token/applications` must return HTTP 410. |

---

## Out of Scope

- Email notification to the recipient when a share is revoked.
- A sign-out button within the shared view.
- Display name for the sharer (only the sharer's email is shown).
- Granular field visibility controls (all fields are visible in the shared view).
