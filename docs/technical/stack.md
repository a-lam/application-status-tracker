# Tech Stack & Dependencies

> **Last updated:** 2026-03-29

---

## Monorepo Structure

```
/                          ← root (concurrently dev runner)
├── client/                ← React frontend
└── server/                ← Express backend
```

---

## Backend (`/server`)

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.21.2 | HTTP server framework |
| `better-auth` | ^1.2.7 | Authentication (OAuth + magic link) |
| `@prisma/client` | ^6.5.0 | Database ORM — generated query client |
| `prisma` | ^6.5.0 | CLI — migrations, schema management |
| `helmet` | ^8.0.0 | Secure HTTP response headers |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing middleware |
| `express-rate-limit` | ^7.5.0 | Auth endpoint rate limiting |
| `pino` | ^9.6.0 | Structured JSON logger |
| `pino-pretty` | ^13.0.0 | Human-readable log output for development |
| `resend` | ^4.1.2 | Transactional email delivery (magic links) |
| `dotenv` | ^16.4.7 | `.env` file loading for local development |

---

## Frontend (`/client`)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.0.0 | UI component library |
| `react-dom` | ^19.0.0 | DOM renderer |
| `react-router-dom` | ^7.0.0 | Client-side routing |
| `better-auth` | ^1.5.6 | Auth client — session management, magic link sign-in |
| `date-fns` | ^4.0.0 | Date formatting and calendar-day arithmetic |
| `react-day-picker` | ^9.0.0 | Calendar widget for the due date field |
| `vite` | ^6.2.0 | Build tool and dev server |
| `@vitejs/plugin-react` | ^4.3.4 | Vite plugin for JSX transform |

---

## Root

| Package | Version | Purpose |
|---------|---------|---------|
| `concurrently` | ^9.1.2 | Run client and server dev processes in parallel |

---

## Runtime Requirements

- **Node.js:** 18+ (ES modules, `--watch`, `--env-file` flags)
- **PostgreSQL:** 15+ (deployed via Railway add-on or Docker locally)
- **npm:** 9+
