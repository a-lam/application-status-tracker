# Project Overview

> **Last updated:** 2026-03-29

---

## Description

**Application Status Tracker** is a full-stack web application that allows authenticated users to track the status of applications — job applications, grant applications, or any multi-stage submission process. Users sign in via a passwordless magic link email, and can create, update, and monitor the lifecycle of their tracked items.

---

## Goals

- Provide a single place to track applications and their current states
- Eliminate the need for spreadsheets or manual notes
- Support multiple users with fully isolated data per account
- Be deployable in one click via Railway with zero manual server configuration

---

## Operations Requirements

These requirements apply to the platform as a whole, independent of any individual feature.

| # | Requirement |
|---|-------------|
| FR-OPS-01 | The server must expose a `GET /health` endpoint that returns HTTP 200 and a JSON body when the service is healthy. |
| FR-OPS-02 | The `/health` endpoint must report database connectivity — returning HTTP 503 if the database is unreachable. |
| FR-OPS-03 | The server must refuse to start if any required environment variable is missing or empty, logging the names of all missing variables. |
| FR-OPS-04 | All incoming HTTP requests must be logged with method, URL, and timestamp. |
| FR-OPS-05 | All unhandled errors must be caught by a global error handler and return HTTP 500 with `{ "error": "Internal server error" }` without leaking stack traces. |

---

## Constraints

- **Node.js version:** 18 or higher (required by `better-auth` and ES module syntax)
- **Database:** PostgreSQL 15 or higher
- **Email delivery:** Dependent on Resend service availability; no fallback mailer in v1
- **Resend sender domain:** A verified sender domain in Resend must be configured before magic link sign-in works in any environment

---

## Out of Scope (v1)

The following are explicitly not being built in this version:

- **Password-based authentication** — email/password login is not supported; users must sign in via magic link
- **Google OAuth** — wired in the codebase but not active in v1
- **GitHub OAuth** — wired in the codebase but not active in v1
- **Multi-tenant / team accounts** — all data is per individual user account
- **Real-time features** — no WebSockets, SSE, or live-updating dashboards
- **Mobile native apps** — web only; no React Native or Capacitor wrapper
- **Admin panel** — no built-in user management UI for administrators
- **Audit logging** — user actions are not stored in a separate audit trail
- **Two-factor authentication (2FA)** — not configured in this release
- **Self-hosted email** — email delivery is handled exclusively by Resend; no SMTP configuration
- **File uploads / attachments** — no document storage in v1
