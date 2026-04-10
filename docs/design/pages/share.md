# Pages: Share

> **Last updated:** 2026-04-09
> **Feature requirements:** [requirements/features/share.md](../../requirements/features/share.md)
> **Technical module:** [technical/modules/share-module.md](../../technical/modules/share-module.md)

---

## Overview

The share feature spans three pages:

| Route | Audience | Purpose |
|-------|----------|---------|
| `/share` | Authenticated user | Manage active shares (add, list, revoke) |
| `/shared/:token` | Recipient (public) | Verify identity via emailed code |
| `/shared/:token/view` | Recipient (with valid session) | Read-only view of sharer's applications |

All three pages must use the existing CSS token system and respect the user's dark mode preference, consistent with the rest of the application.

---

## Page: Share Management (`/share`)

### Purpose

Allows the authenticated sharer to see who they have shared with, add new recipients, and revoke existing shares.

### Layout

```
┌────────────────────────────────────────────────────────┐
│  [← Back to Applications]                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Share Your Applications                               │
│                                                        │
│  ┌──────────────────────────────────────┬──────────┐   │
│  │  Enter email address                 │   Add    │   │
│  └──────────────────────────────────────┴──────────┘   │
│  [inline success / error message]                      │
│                                                        │
│  Active Shares                                         │
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  recipient@example.com                          │   │
│  │  Shared: 9 Apr 2026 · Expires: 8 Jul 2026  [Remove] │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  another@example.com                            │   │
│  │  Shared: 1 Mar 2026 · Expires: 30 May 2026 [Remove] │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Navigation Entry Point

A "Share" menu item is added to the page-level `⋮` kebab menu on the applications list page, positioned above "Logout". Clicking it navigates to `/share`.

Updated page menu:
```
┌──────────────────────┐
│  Dark Mode / Light Mode │
│  Share               │
│  Logout              │
└──────────────────────┘
```

### Inline Messages

- **Success (new share):** "Invitation sent to [email]."
- **Success (extended):** "A share already existed for [email]. Its expiry has been extended to [new expiry date]."
- **Error (self-share):** "You cannot share with yourself."
- **Error (limit reached):** "You have reached the maximum of 20 active shares."
- **Error (invalid email):** "Please enter a valid email address."

Messages are displayed inline below the form. They disappear on the next form submission.

---

## Page: Recipient Verification (`/shared/:token`)

### Purpose

Verifies the recipient's identity by sending a one-time code to the email address on the share record, and accepts the code entry before granting access.

### States

#### State 1 — Loading (initial code request in progress)

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                  Sending verification code…            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State 2 — Code entry form (code sent)

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  Verify Access                                         │
│                                                        │
│  We've sent a verification code to r***@example.com.  │
│  Enter it below to view the shared applications.       │
│                                                        │
│  ┌──────────────────────────────────────┬──────────┐   │
│  │  6-digit code                        │  Submit  │   │
│  └──────────────────────────────────────┴──────────┘   │
│  [inline error message — if last submit failed]        │
│                                                        │
│  Resend code (available in 2:47)                       │
│  ← "Resend code" is disabled and shows remaining time  │
│    until the 3-minute cooldown expires                 │
│                                                        │
└────────────────────────────────────────────────────────┘
```

The recipient email address shown in the message is partially masked (e.g. `r***@example.com`) to avoid fully exposing it in the UI.

When the countdown reaches zero, the "Resend code" button becomes active and the "(available in X:XX)" suffix is removed.

#### State 3 — Cooldown active on page refresh

Same as State 2. The timer resumes from the remaining time stored in `localStorage`. No new code is sent.

#### State 4 — Error: invalid or expired invitation

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  This invitation is no longer valid.                   │
│                                                        │
│  The link may have expired or been revoked.            │
│  Please ask the person who shared it to send           │
│  you a new invitation.                                 │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State 5 — Error: token locked

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  This link is temporarily locked.                      │
│                                                        │
│  Too many failed verification attempts have been made. │
│  Please try again after [time].                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Inline Code Submission Errors

- **401 (wrong code):** "Incorrect code. Please try again."
- **410 (code expired):** "Your code has expired. Please request a new one." (resend button becomes active if cooldown allows)
- **429 (rate limited):** "Too many attempts. Please wait before trying again."

---

## Page: Shared Applications View (`/shared/:token/view`)

### Purpose

Displays the sharer's applications in a read-only layout identical to the authenticated applications list, except all write actions are removed.

### Layout

```
┌────────────────────────────────────────────────────────┐
│  Shared by: sharer@example.com                         │
├────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐   │
│ │ bgcolor: light red                               │   │
│ │  Senior Frontend Engineer (Not Submitted)        │   │
│ │  Acme Corp              Due: 29 Mar 2026          │   │
│ │  View Job Listing →                              │   │
│ │  $90,000–$120,000 CAD                            │   │
│ │                                                  │   │
│ │  Job Description:                                │   │
│ │  We are looking for an experienced engineer...   │   │
│ │  [show more]                                     │   │
│ │                                                  │   │
│ │  ▶ Show artifacts (2/3 completed)               │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│  ... more cards ...                                    │
└────────────────────────────────────────────────────────┘
```

**Differences from the authenticated list:**

| Element | Authenticated list | Shared view |
|---------|-------------------|-------------|
| Add application button | Present | Absent |
| Page-level kebab (`⋮`) | Present | Absent |
| User email in header | Present | Replaced by "Shared by: [email]" banner |
| Per-card kebab (`⋮`) | Present | Absent |
| Artifact checkboxes | Interactive | `disabled`, non-interactive |

**Artifacts in read-only mode:** The `ArtifactsPanel` expand/collapse toggle remains functional so recipients can see artifact labels and completion states. The checkboxes are rendered with the `disabled` attribute and `pointer-events: none` to prevent interaction; their visual state (checked/unchecked) is preserved.

### State: Session Expired

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  Your access to this shared view has expired.          │
│                                                        │
│  Click the original link in your email to             │
│  re-verify and regain access.                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### State: Invitation No Longer Valid

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  This shared link is no longer valid.                  │
│                                                        │
│  The invitation may have expired or been revoked.      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Accessibility Notes

- The "Shared by" banner must use a heading element (e.g. `<h2>`) so screen readers can identify it as the page's primary contextual label.
- The "Remove" buttons on `/share` must each have a descriptive `aria-label` (e.g. "Remove share for recipient@example.com").
- The code input on the verification page must have an associated `<label>` and `inputmode="numeric"` to trigger a numeric keyboard on mobile devices. `autocomplete="one-time-code"` should be set to enable browser/OS autofill of the SMS/email OTP.
- The countdown timer must use `aria-live="polite"` so screen readers announce its updates without interrupting the user. The timer element should update no more frequently than once per second.
- Disabled artifact checkboxes must remain visible (not hidden) so recipients can read completion states; they must not receive keyboard focus.
- All interactive controls introduced by this feature (email input, Add button, Remove buttons, code input, Submit button, Resend button) must meet the 44 × 44 px minimum touch target requirement.
- All new pages must respect `prefers-reduced-motion` by wrapping any CSS transitions in the appropriate media query.
