# Module: Share

> **Last updated:** 2026-04-09
> **Feature requirements:** [requirements/features/share.md](../../requirements/features/share.md)
> **Design:** [design/pages/share.md](../../design/pages/share.md)

---

## Overview

The share module allows authenticated users to grant time-limited, read-only access to their job applications via email. It covers share management (create, list, revoke), recipient verification (code request, countdown, code submit), and the read-only shared applications view.

---

## Component Architecture

### Backend

```
server/src/
└── routes/
    ├── shares.js        ← GET    /api/shares
    │                       POST   /api/shares
    │                       DELETE /api/shares/:id
    └── shared.js        ← POST   /api/shared/:token/request-code
                            POST   /api/shared/:token/verify
                            GET    /api/shared/:token/applications
```

### Frontend

```
client/src/
├── pages/
│   ├── SharePage.jsx              ← Authenticated page at /share; lists active shares,
│   │                                 add-by-email form, revoke button per entry
│   ├── SharedVerifyPage.jsx       ← Public page at /shared/:token; handles code request,
│   │                                 countdown timer, code entry form, error states
│   └── SharedViewPage.jsx         ← Recipient-session-gated page at /shared/:token/view;
│                                     read-only applications list with "Shared by" label
└── components/
    └── shared/
        ├── SharedApplicationList.jsx   ← Renders the ordered list of read-only application cards
        └── SharedApplicationCard.jsx   ← Read-only application card; artifacts frozen
```

---

## Page Components

### `SharePage` (`/share`)

Accessible to authenticated users only (protected by `<ProtectedRoute>`). On mount, fetches `GET /api/shares` and renders the active shares list.

**Add share form:** a single email input with an "Add" button. On submit, calls `POST /api/shares`. Handles all response cases inline:
- 200 (new share created): show success message, refresh list.
- 200 with "extended" flag: show message that the share already existed and its expiry was extended, refresh list.
- 400 (self-share): display "You cannot share with yourself."
- 409 / limit error: display the server's error message.

**Active shares list:** each row shows the recipient email, date shared, expiry date, and a "Remove" button. Clicking "Remove" calls `DELETE /api/shares/:id`. On success the row is removed from local state immediately (no full refetch).

### `SharedVerifyPage` (`/shared/:token`)

Publicly accessible (no auth required). On mount:
1. Reads `localStorage` for a stored `retryAfter` timestamp keyed by token.
2. If the stored timestamp is in the future, starts the countdown timer from the remaining time without calling `POST /api/shared/:token/request-code`.
3. Otherwise, calls `POST /api/shared/:token/request-code` automatically.

**Response handling for `request-code`:**
- 200: store `retryAfter` in `localStorage`, start countdown timer, show code entry form with message "We've sent a verification code to [email]. Enter it below to view the shared applications."
- 410: show "This invitation is no longer valid."
- 429 with `lockedUntil`: show "This link is temporarily locked. Try again after [time]."
- 429 with `retryAfter` (cooldown hit on first load): read `retryAfter`, start countdown, show code entry form (code was already sent).

**Code entry form:** renders after a code has been sent. "Resend code" button is disabled until the countdown reaches zero. On expiry the button becomes active and clicking it calls `request-code` again.

On code submission, calls `POST /api/shared/:token/verify`:
- 200: navigate to `/shared/:token/view` (the server has set the `recipient-session` cookie).
- 401: show "Incorrect code. Please try again."
- 410: show "Your code has expired. Please request a new one." (with resend button active if cooldown allows).
- 429: show rate-limit or lock message.

### `SharedViewPage` (`/shared/:token/view`)

On mount, calls `GET /api/shared/:token/applications`:
- 200: render `SharedApplicationList` with the applications array; show "Shared by: [sharer email]" at the top.
- 401: redirect to `/shared/:token`.
- 410: show "This shared link is no longer valid. The invitation may have expired or been revoked." with a prompt to re-verify if appropriate.

No "Add application" button, no page-level kebab, and no per-card kebab. Artifact checkboxes rendered with `disabled` attribute and `pointer-events: none`.

### `SharedApplicationCard`

Mirrors `ApplicationCard` with all interactive controls removed:
- No `KebabMenu`.
- `ArtifactsPanel` renders with all checkboxes `disabled`. The toggle to expand/collapse still works (read-only display only).
- Urgency colour band and all field display logic are identical to `ApplicationCard`.

---

## Database Models

### `Share`

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Primary key (cuid) |
| `token` | String | Unique, base64url-encoded random token (43 chars, 256-bit entropy) |
| `userId` | String | FK → `User` (the sharer); cascade delete |
| `email` | String | Recipient email address |
| `createdAt` | DateTime | Timestamp of creation |
| `expiresAt` | DateTime | `createdAt + 90 days` |

**Relation:** `User` has many `Share`s. Deleting a `User` cascades to delete all their `Share` records. Deleting a `Share` cascades to delete all associated `RecipientSession` and `ShareRateLimit` records.

### `RecipientSession`

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Primary key (cuid) |
| `shareId` | String | FK → `Share`; cascade delete |
| `codeHash` | String | Bcrypt hash of the 6-digit verification code |
| `codeExpiresAt` | DateTime | `createdAt + 15 minutes` |
| `verifiedAt` | DateTime? | Set on successful verification; null until verified |
| `sessionExpiresAt` | DateTime? | `verifiedAt + 7 days`; null until verified |
| `createdAt` | DateTime | Timestamp of creation |

Only one `RecipientSession` is active per share at a time. When a new code is requested, all existing `RecipientSession` records for the share are deleted before the new one is created.

### `ShareRateLimit`

One record per `Share`, created on first code request.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Primary key (cuid) |
| `shareId` | String | Unique FK → `Share`; cascade delete |
| `lastCodeSentAt` | DateTime? | Timestamp of last successful code send; null until first send |
| `verifyAttempts` | Int | Count of verify attempts in the current 15-minute window; default 0 |
| `verifyWindowStart` | DateTime? | Start of the current 15-minute verify window; null until first attempt |
| `failedActionCount` | Int | Count of failed verify attempts in the current 1-hour window; default 0 |
| `failedActionWindowStart` | DateTime? | Start of the current 1-hour window; null until first failed attempt |
| `lockedUntil` | DateTime? | Lock expiry; null or in the past means unlocked |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/shares` | Required | List all active shares for the current user |
| `POST` | `/api/shares` | Required | Create a share or extend an existing one; send invitation email |
| `DELETE` | `/api/shares/:id` | Required | Revoke a share immediately; must verify ownership |
| `POST` | `/api/shared/:token/request-code` | None | Validate token, apply rate limits, send verification code |
| `POST` | `/api/shared/:token/verify` | None | Submit code; issues recipient session cookie on success |
| `GET` | `/api/shared/:token/applications` | Recipient session | Return applications and sharer email for a valid recipient session |

### `GET /api/shares`

Returns an array of the authenticated user's active shares (those not deleted and with `expiresAt` in the future), ordered by `createdAt` descending.

Response shape:
```json
[
  {
    "id": "...",
    "email": "recipient@example.com",
    "createdAt": "2026-04-09T...",
    "expiresAt": "2026-07-08T..."
  }
]
```

### `POST /api/shares`

Request body: `{ "email": "recipient@example.com" }`

Logic:
1. Reject if `email` matches the authenticated user's email → 400 `{ "error": "You cannot share with yourself." }`.
2. Count active shares for the user; reject if ≥ 20 → 400 `{ "error": "Share limit reached. You can have at most 20 active shares." }`.
3. Look up any existing share for this user + email:
   - **Active (unexpired):** update `expiresAt = now + 90 days`; return 200 `{ "extended": true, "share": { ... } }`.
   - **Expired:** delete it, create a new record, send invitation email; return 201 `{ "extended": false, "share": { ... } }`.
   - **None:** create a new record, send invitation email; return 201 `{ "extended": false, "share": { ... } }`.
4. Token generation: `crypto.randomBytes(32).toString('base64url')`.

### `DELETE /api/shares/:id`

Verify the share's `userId` matches the authenticated user → 403 if not. Delete the share record (cascade deletes associated sessions and rate-limit record). Return 204.

### `POST /api/shared/:token/request-code`

No auth required. Logic (evaluated in order):

1. Look up the `Share` by `token`. Not found → 410.
2. `Share.expiresAt` in the past → 410.
3. Look up (or create) `ShareRateLimit` for this share.
4. If `lockedUntil` is set and in the future → 429 `{ "error": "...", "lockedUntil": "..." }`.
5. If `lastCodeSentAt` is set and `now - lastCodeSentAt < 3 minutes` → 429 `{ "retryAfter": "..." }`.
6. Otherwise:
   - Delete all existing `RecipientSession` records for this share.
   - Generate a 6-digit numeric code (`Math.floor(Math.random() * 1000000).toString().padStart(6, '0')`).
   - Bcrypt-hash the code (cost factor 10).
   - Create a new `RecipientSession` with `codeExpiresAt = now + 15 minutes`.
   - Set `ShareRateLimit.lastCodeSentAt = now`.
   - Send the code to `Share.email` via Resend.
   - Return 200 `{ "retryAfter": "<now + 3 minutes ISO>" }`.

### `POST /api/shared/:token/verify`

No auth required. Request body: `{ "code": "123456" }`

Logic:
1. Look up `Share` by `token`. Not found → 410.
2. `Share.expiresAt` in the past → 410.
3. Look up `ShareRateLimit`. If locked → 429.
4. **15-minute window rate limit:** if `verifyWindowStart` is set and `now - verifyWindowStart < 15 minutes`:
   - If `verifyAttempts >= 5` → 429 `{ "error": "Too many attempts. Try again later." }`.
   - Otherwise increment `verifyAttempts`.
   - If `verifyWindowStart` is null or `now - verifyWindowStart >= 15 minutes`, reset `verifyWindowStart = now`, `verifyAttempts = 1`.
5. Fetch the most recent `RecipientSession` for this share.
6. `codeExpiresAt` in the past → 410.
7. Compare submitted code against `codeHash` with `bcrypt.compare`. On mismatch:
   - Increment `failedActionCount`. If `failedActionWindowStart` is null or window has elapsed, reset to `{ failedActionWindowStart: now, failedActionCount: 1 }`.
   - If `failedActionCount >= 10` → set `lockedUntil = now + 3 hours`. Return 429 with `lockedUntil`.
   - Return 401.
8. On match: set `verifiedAt = now`, `sessionExpiresAt = now + 7 days`.
9. Sign a recipient session token (JWT or opaque token) scoped to `RecipientSession.id`.
10. Set HttpOnly `recipient-session` cookie with the signed token. Return 200.

### `GET /api/shared/:token/applications`

Auth: `recipient-session` HttpOnly cookie required.

Logic:
1. Read and verify the `recipient-session` cookie. Invalid → 401.
2. Look up `RecipientSession` by the id in the token. If not found, or `verifiedAt` is null, or `sessionExpiresAt` is in the past → 401.
3. Look up the `Share` via `RecipientSession.shareId`. If not found → 410. If `Share.expiresAt` is in the past → 410.
4. Return the sharer's applications with artifacts (same shape as `GET /api/applications`) plus the sharer's email:
```json
{
  "sharerEmail": "sharer@example.com",
  "applications": [ ... ]
}
```

---

## Data Flows

### Share Creation

```
1. User navigates to /share
2. SharePage mounts → calls GET /api/shares
3. Server returns active shares for the user
4. User enters a recipient email and clicks "Add"
5. Client calls POST /api/shares { email }
6. Server validates, creates Share, sends invitation email via Resend
7. Server returns 201 with the new share
8. Client adds the new share to local list state; shows success message
```

### Recipient Verification

```
1. Recipient clicks the invitation link → navigates to /shared/:token
2. SharedVerifyPage mounts
   a. Checks localStorage for a stored retryAfter for this token
   b. If retryAfter is in the future: start countdown from remaining time (no network call)
   c. Otherwise: call POST /api/shared/:token/request-code
3. Server validates token, checks rate limits, generates + stores code hash, sends email
4. Server returns 200 { retryAfter }
5. Client stores retryAfter in localStorage, starts countdown timer, shows code form
6. Recipient enters code and submits
7. Client calls POST /api/shared/:token/verify { code }
8. Server validates code hash, sets verifiedAt + sessionExpiresAt, sets recipient-session cookie
9. Client navigates to /shared/:token/view
```

### Shared View Load

```
1. Recipient (with recipient-session cookie) navigates to /shared/:token/view
2. SharedViewPage mounts → calls GET /api/shared/:token/applications
3. Server validates recipient-session cookie → verifies RecipientSession and Share
4. Server returns { sharerEmail, applications }
5. SharedViewPage renders SharedApplicationList with sharerEmail banner at top
6. Each SharedApplicationCard renders in read-only mode (no kebab, frozen artifacts)
```

### Revoke Share

```
1. User clicks "Remove" on a share entry on /share
2. Client calls DELETE /api/shares/:id
3. Server verifies ownership, deletes share (cascades to sessions and rate-limit)
4. Server returns 204
5. Client removes the entry from local state immediately
```

---

## Rate Limiting Summary

| Limit | Scope | Behaviour on breach |
|-------|-------|---------------------|
| 1 code per 3 minutes | Per token | 429 with `retryAfter`; client shows countdown |
| 5 verify attempts per 15 minutes | Per token | 429 "Too many attempts" |
| 10 failed verifies per 1 hour → lock for 3 hours | Per token | 429 with `lockedUntil` for both endpoints |

---

## Security Notes

- The `recipient-session` cookie must be `HttpOnly`, `SameSite=Lax`, and `Secure` in production. It must not be accessible from JavaScript.
- The `recipient-session` cookie is independent of the `better-auth` session cookie. Both can be present simultaneously without conflict.
- Verification codes must be compared using the bcrypt timing-safe comparison (`bcrypt.compare`), never string equality.
- Share tokens must be generated with `crypto.randomBytes(32)` (CSPRNG), not `Math.random()`.
- All `ShareRateLimit` counter updates must use atomic database operations (transactions) to prevent race conditions under concurrent requests.

---

## Dependencies

| Dependency | Used by | Purpose |
|------------|---------|---------|
| `@prisma/client` | `routes/shares.js`, `routes/shared.js` | Query and mutate `Share`, `RecipientSession`, `ShareRateLimit` |
| `better-auth` | `routes/shares.js` | Validate user session and extract `userId`/email |
| `bcrypt` | `routes/shared.js` | Hash and compare verification codes |
| `jsonwebtoken` (or opaque token util) | `routes/shared.js` | Sign and verify recipient session tokens |
| `resend` | `routes/shares.js`, `routes/shared.js` | Send invitation and verification-code emails |
| `crypto` (Node built-in) | `routes/shares.js` | Generate cryptographically random share tokens |
| React state (`useState`, `useEffect`) | `SharePage`, `SharedVerifyPage`, `SharedViewPage` | Fetch lifecycle, countdown timer, form state |
| `localStorage` | `SharedVerifyPage` | Persist `retryAfter` across page refreshes |
