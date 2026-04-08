# Page: Login

> **Last updated:** 2026-04-07
> **Feature requirements:** [requirements/features/authentication.md](../../requirements/features/authentication.md)
> **Technical module:** [technical/modules/authentication-module.md](../../technical/modules/authentication-module.md)

---

## Purpose

The login page is the single entry point for unauthenticated users. Its sole job is to collect an email address and trigger a magic link — it does not handle passwords, OAuth buttons (in v1), or account creation forms. Account creation happens automatically on first sign-in.

Users land here when:
- They visit the app for the first time
- Their session has expired
- They are redirected from a protected route

---

## Components

### `<LoginPage>`

Top-level page component. Manages the request lifecycle state (idle → loading → sent → error) and conditionally renders the form or the confirmation view. Also renders the `<ThemeToggleButton>`.

### `<ThemeToggleButton>`

An icon-only button absolutely positioned in the top-right corner of the `.login-page` container. Reads and writes the active theme via `ThemeContext`. Visible before authentication.

| Property | Value |
|----------|-------|
| `aria-label` | `"Switch to dark mode"` / `"Switch to light mode"` (dynamic) |
| `aria-pressed` | `true` when dark mode is active |
| Minimum touch target | 44 × 44 px |
| Position | `position: absolute; top: 1rem; right: 1rem` |

### `<MagicLinkForm>`

The primary interactive element. Contains:
- Email input field (`type="email"`, required, autofocused)
- Submit button ("Send sign-in link")
- Inline validation message (shown on empty or malformed email)

Calls `POST /api/auth/magic-link/send` on submit. Disables the submit button and shows a loading state while the request is in flight.

### `<ConfirmationMessage>`

Shown after a successful send. Replaces the form in the same layout region. Tells the user to check their inbox and offers a "Send again" link that returns to the form.

### `<ErrorMessage>`

Shown when the API returns an error (rate limited, server error, etc.). Displays a plain-language message and a retry action.

---

## User Interactions

### Happy path — first-time or returning user

```
1. User arrives at /login
2. Email input is auto-focused
3. User types their email address
4. User clicks "Send sign-in link" (or presses Enter)
5. Submit button becomes disabled; loading indicator appears
6. POST /api/auth/magic-link/send is called
7. On success: form is replaced by ConfirmationMessage
   "Check your inbox — we sent a link to you@example.com"
8. User opens their email and clicks the magic link
9. Browser is redirected to GET /api/auth/magic-link/verify?token=...
10. better-auth verifies the token and creates a session
11. Browser is redirected to the app dashboard
```

### Error states

| Trigger | Displayed message |
|---------|-------------------|
| Empty email submitted | "Please enter your email address." (inline, client-side) |
| Invalid email format | "Please enter a valid email address." (inline, client-side) |
| Rate limited (HTTP 429) | "Too many requests. Please wait a few minutes before trying again." |
| Server error (HTTP 5xx) | "Something went wrong. Please try again." |
| Expired magic link | "This link has expired. Request a new one." (on verify redirect) |
| Already-used magic link | "This link has already been used. Request a new one." (on verify redirect) |

### Returning to the form

- The "Send again" link in `<ConfirmationMessage>` resets state to `idle` and shows the form with the email pre-filled
- Any error message includes a "Try again" action that resets to `idle`

---

## Wireframe Description

```
┌────────────────────────────────────────────────┐
│                                           [☾]  │  ← theme toggle (top-right)
│                                                │
│              Application Status               │
│                   Tracker                     │
│                                                │
│         ┌──────────────────────────┐          │
│         │  Sign in to your account │          │
│         └──────────────────────────┘          │
│                                                │
│         ┌──────────────────────────┐          │
│         │  Email address           │          │
│         │ ┌────────────────────┐   │          │
│         │ │ you@example.com    │   │          │
│         │ └────────────────────┘   │          │
│         │                          │          │
│         │ ┌────────────────────┐   │          │
│         │ │  Send sign-in link │   │          │
│         │ └────────────────────┘   │          │
│         └──────────────────────────┘          │
│                                                │
│         No password needed. We'll email        │
│         you a one-time sign-in link.           │
│                                                │
└────────────────────────────────────────────────┘
```

**After submission (confirmation state):**

```
┌────────────────────────────────────────────────┐
│                                                │
│                                                │
│              Application Status               │
│                   Tracker                     │
│                                                │
│         ┌──────────────────────────┐          │
│         │  Check your inbox        │          │
│         │                          │          │
│         │  We sent a sign-in link  │          │
│         │  to you@example.com      │          │
│         │                          │          │
│         │  The link expires in     │          │
│         │  15 minutes.             │          │
│         │                          │          │
│         │  Didn't get it?          │          │
│         │  [Send again]            │          │
│         └──────────────────────────┘          │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Accessibility Notes

- Email input must have an associated `<label>` — not just a placeholder
- Error messages must be associated with the input via `aria-describedby`
- Loading state must be communicated to screen readers via `aria-busy` or a live region
- The confirmation view must receive focus or announce via `aria-live="polite"` when it replaces the form
- The theme toggle button must have a dynamic `aria-label` ("Switch to dark mode" / "Switch to light mode") and `aria-pressed` set to `true` when dark mode is active
- The theme toggle button must be keyboard-operable (Enter/Space) and meet the 44 × 44 px minimum touch target

---

## Routes

| Route | Description |
|-------|-------------|
| `/login` | Login page (this page) |
| `/api/auth/magic-link/send` | Backend endpoint called on form submit |
| `/api/auth/magic-link/verify` | Backend endpoint the magic link redirects to |
| `/applications` | Destination after successful sign-in |
