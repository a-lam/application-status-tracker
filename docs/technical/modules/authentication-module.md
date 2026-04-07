# Module: Authentication

> **Last updated:** 2026-03-29
> **Feature requirements:** [requirements/features/authentication.md](../../requirements/features/authentication.md)
> **Design:** [design/pages/login.md](../../design/pages/login.md)

---

## Overview

Authentication is handled entirely by [better-auth](https://better-auth.com) operating as a mounted Express handler at `/api/auth/*`. The module is lazy-initialized — the `betterAuth()` instance is not constructed until after startup environment validation passes, ensuring the server refuses to start rather than running with misconfigured credentials.

All session state is stored in PostgreSQL (never in process memory), making the server horizontally scalable.

---

## Component Architecture

```
server/src/
├── index.js                  ← mounts the auth handler + rate limiter
└── lib/
    ├── auth.js               ← better-auth config (lazy singleton via getAuth())
    ├── prisma.js             ← Prisma client singleton (database adapter)
    ├── resend.js             ← Resend client (lazy singleton via getResend())
    └── validateEnv.js        ← startup guard — throws on missing env vars
```

### `lib/auth.js` — `getAuth()`

The central auth configuration. Returns a singleton `betterAuth` instance configured with:

- **Database adapter:** `prismaAdapter` pointing to the shared Prisma client
- **Magic link plugin:** uses `getResend()` to send emails via Resend on demand
- **Social providers:** Google and GitHub configured from env vars (inactive until credentials are supplied)
- **Base URL:** `FRONTEND_URL` — used by better-auth to construct redirect URLs and cookie domains
- **Session lifetime:** controlled by `SESSION_EXPIRY_HOURS` env var (default `72`). Converted to seconds: `parseInt(process.env.SESSION_EXPIRY_HOURS || '72') * 60 * 60` and passed to `session.expiresIn`.

The instance is constructed lazily on first call so that `validateEnv()` in `index.js` always runs first.

### `lib/prisma.js` — Prisma singleton

A single `PrismaClient` instance shared across the application. Error and warning events are forwarded to the pino logger. Creating a new client per request would exhaust the connection pool.

### `lib/resend.js` — `getResend()`

Wraps the `Resend` SDK in a lazy singleton. The Resend constructor throws immediately if `RESEND_API_KEY` is an empty string, so initialization is deferred until after `validateEnv()` confirms the key is present.

### `lib/validateEnv.js` — `validateEnv()`

Called as the very first line of `index.js` (before any imports that might trigger third-party constructors). Iterates the list of required env var names and throws with a descriptive message listing all missing keys. The server process exits immediately on throw.

---

## Data Flows

### Magic Link Sign-In — Send

```
1. User submits email on the login page
   POST /api/auth/magic-link/send  { email }

2. better-auth
   a. Generates a signed, time-limited token
   b. Writes a Verification record to PostgreSQL
      { identifier: email, value: hashedToken, expiresAt: now + 15min }
   c. Calls sendMagicLink({ email, token, url })

3. sendMagicLink callback
   a. Calls getResend().emails.send(...)
   b. Resend delivers email containing the magic link URL

4. Server responds 200 OK (no session yet)
```

### Magic Link Sign-In — Verify

```
1. User clicks the link in their email
   GET /api/auth/magic-link/verify?token=<token>

2. better-auth
   a. Looks up Verification record by token
   b. Checks expiresAt — rejects if expired
   c. Checks token has not been used — rejects if already consumed
   d. Marks Verification record as used
   e. Upserts User record (creates on first sign-in, finds existing on return)
   f. Creates Session record in PostgreSQL
      { token: opaqueToken, expiresAt: ..., userId, ipAddress, userAgent }
   g. Sets session cookie (HttpOnly, Secure in production)
   h. Redirects browser to FRONTEND_URL

3. Subsequent requests include the session cookie
   → better-auth middleware validates the session token against the sessions table
   → Attaches user context to the request
```

### Sign-Out

```
1. Client calls POST /api/auth/sign-out

2. better-auth
   a. Reads session token from cookie
   b. Deletes the Session record from PostgreSQL
   c. Clears the session cookie

3. Server responds 200 OK
4. Client redirects to the login page
```

### Protected Route Access

```
1. Request arrives at a protected API route
2. Auth middleware reads session cookie
3. Queries sessions table for matching token
   → Found and not expired: attaches user to request context, continues
   → Not found or expired: returns HTTP 401 { "error": "Unauthorized" }
```

### Proactive Session Expiry Detection (client-side)

```
1. User is on a protected page (ProtectedRoute is mounted)
2. ProtectedRoute starts a polling interval (every 60 seconds)
   → calls authClient.getSession() — a lightweight server-side session check

3a. Session still valid:
    → No action taken; interval continues

3b. Session expired or invalidated:
    → authClient.signOut() is called to clear any local session state
    → Client navigates to /login
    → ProtectedRoute unmounts; interval is cleared

4. ProtectedRoute unmounts for any other reason (navigation away, etc.)
   → Interval is cleared via useEffect cleanup
```

> **Implementation note:** The 60-second interval means expiry is detected within one minute of the server-side token becoming invalid. This balances responsiveness against unnecessary network traffic. The interval must be started inside a `useEffect` with a cleanup function to prevent leaked timers on unmount.

---

## Database Tables Used

| Table | Role |
|-------|------|
| `users` | One record per unique email address |
| `sessions` | One record per active login session |
| `accounts` | Links a user to an auth provider (e.g. `magic-link`) |
| `verifications` | Stores pending magic link tokens until used or expired |

See [technical/architecture.md](../architecture.md#data-models) for full column definitions.

---

## API Endpoints

All endpoints are handled automatically by better-auth. They are mounted at `/api/auth/*` in `index.js`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/magic-link/send` | Request a magic link for a given email |
| `GET` | `/api/auth/magic-link/verify` | Verify a magic link token and create a session |
| `POST` | `/api/auth/sign-out` | Invalidate the current session |
| `GET` | `/api/auth/get-session` | Return the current session and user (or null) |

---

## Dependencies

| Dependency | Used by | Purpose |
|------------|---------|---------|
| `better-auth` | `lib/auth.js` | Auth framework — session management, magic link, OAuth |
| `@prisma/client` | `lib/prisma.js` | Database queries for users, sessions, accounts, verifications |
| `resend` | `lib/resend.js` | Email delivery for magic links |
| `express-rate-limit` | `index.js` | Limits magic link requests to 20/15 min per IP |
| `dotenv` | `index.js` | Loads env vars from `.env` in local development |
| `SESSION_EXPIRY_HOURS` env var | `lib/auth.js` | Configures session lifetime in hours; defaults to `72` (3 days) |

---

## Security Considerations

- **Rate limiting:** All `/api/auth/*` routes are limited to 20 requests per 15-minute window per IP (configured in `index.js`) to prevent magic link spam and brute-force attempts.
- **Token expiry:** Magic link tokens expire after 15 minutes and are single-use — consumed on first successful verification.
- **Secret strength:** `BETTER_AUTH_SECRET` must be at least 32 random characters. Generate with `openssl rand -base64 32`.
- **Cookie security:** better-auth sets `HttpOnly` and `Secure` flags on session cookies automatically in production.
- **No token exposure:** The raw session token is never returned in a JSON response body — it lives only in the HttpOnly cookie and the database.

---

## Future: OAuth Providers

The codebase already has Google and GitHub configured as social providers in `lib/auth.js`. To activate them:

1. Create OAuth app credentials (see [technical/architecture.md](../architecture.md#external-integrations))
2. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` to `.env`
3. No code changes required — better-auth will activate the providers automatically when the env vars are present
