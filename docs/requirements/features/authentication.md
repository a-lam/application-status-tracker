# Feature: Authentication

> **Last updated:** 2026-03-29 (AC-01-5 revised)
> **v1 scope:** Magic link only. Google OAuth and GitHub OAuth are wired in the codebase for future activation.

---

## User Stories

### US-01 — Sign in via magic link

> As a user, I want to receive a one-time sign-in link by email so that I can access the app without creating or remembering a password.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-01-1 | I am on the sign-in page | I enter my email and submit | I receive an email containing a sign-in link within 60 seconds |
| AC-01-2 | I have received a magic link email | I click the link within 15 minutes | I am signed in and redirected to the applications list page |
| AC-01-3 | I have received a magic link email | The link has expired (>15 min) and I click it | I see a clear error message and am prompted to request a new link |
| AC-01-4 | I have already used a magic link to sign in | I click the same link again | The link is rejected as already used |
| AC-01-5a | I enter an email with no existing account | I submit the sign-in form | The form succeeds silently — no account is created yet, only a pending verification token |
| AC-01-5b | I submitted the form for an unknown email and clicked the link within 15 minutes | The link is verified for the first time | A new account is created and I am signed in |
| AC-01-5c | I submitted the form but never clicked the link (e.g. mistyped email) | The token expires after 15 minutes | No account is created — the expired verification record is discarded |
| AC-01-6 | I have an existing account and click a new magic link for the same email | The link is verified | My existing account is resumed — no duplicate account is created |

---

### US-02 — Sign out

> As a signed-in user, I want to sign out so that my session is terminated on shared or public devices.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-02-1 | I am signed in | I click "Sign out" | My session token is invalidated server-side immediately |
| AC-02-2 | I have signed out | I navigate to any protected route | I am redirected to the sign-in page |
| AC-02-3 | I have signed out | I attempt to use my old session cookie | The server returns HTTP 401 |

---

### US-03 — Automatic sign-out on session expiry

> As a signed-in user, I want to be automatically signed out and returned to the login screen when my session expires — even if I have not performed any action or reloaded the page — so that my account is not left accessible on unattended devices.

**Acceptance criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-03-1 | I am on any protected page | My session expires while the page is open | I am automatically signed out and redirected to the sign-in page without any action or page reload on my part |
| AC-03-2 | I have been signed out due to session expiry | I am on the sign-in page | I see the standard sign-in form (no special expiry error is required) |
| AC-03-3 | A session is created | — | The session expires after the duration configured in `SESSION_EXPIRY_HOURS` (default: 72 hours / 3 days) |
| AC-03-4 | `SESSION_EXPIRY_HOURS` is not set | — | The system falls back to a default of 72 hours |

---

> **Future (out of scope for v1)**
>
> - **US-04 — Sign in with Google:** OAuth 2.0 via Google. Infrastructure wired; credentials not configured.
> - **US-05 — Sign in with GitHub:** OAuth 2.0 via GitHub. Infrastructure wired; credentials not configured.

---

## Functional Requirements

| # | Requirement |
|---|-------------|
| FR-AUTH-01 | The system must support passwordless sign-in via a time-limited magic link delivered by email. |
| FR-AUTH-02 | Magic link tokens must expire after 15 minutes and be single-use. |
| FR-AUTH-03 | On successful authentication, the system must create a server-side session, return a session cookie, and redirect the user to the applications list page. |
| FR-AUTH-04 | Signing out must invalidate the server-side session record immediately. |
| FR-AUTH-05 | Protected API routes must return HTTP 401 if no valid session is present. |
| FR-AUTH-06 | A user record must be created on first magic link sign-in and reused on all subsequent sign-ins with the same email address. |
| FR-AUTH-07 | Session lifetime must be configurable via the `SESSION_EXPIRY_HOURS` environment variable (value in whole hours). If the variable is absent or empty, the system must default to 72 hours (3 days). |
| FR-AUTH-08 | While a user is on a protected page, the client must periodically check session validity server-side. If the session is found to have expired, the client must sign the user out and redirect to the sign-in page immediately — without requiring any user action or page reload. |

> **Future:** FR-AUTH-09 (Google OAuth) and FR-AUTH-10 (GitHub OAuth) will be added in a later release.

---

## Out of Scope for this Feature (v1)

- Password-based sign-in
- Account linking between providers
- Account deletion / deactivation
- Two-factor authentication
- Session management UI (view / revoke active sessions)
