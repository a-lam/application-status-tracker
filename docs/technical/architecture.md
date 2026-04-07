# Architecture

> **Last updated:** 2026-04-01

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                 │
│   React + Vite (port 5173 in dev / static files in prod)       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP (proxied in dev via Vite)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express Server (port 3000)                   │
│                                                                 │
│   ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐    │
│   │   helmet    │  │     cors     │  │  pino logger      │    │
│   │  (headers)  │  │ (FRONTEND_   │  │  (all requests)   │    │
│   └─────────────┘  │  URL only)   │  └───────────────────┘    │
│                    └──────────────┘                             │
│   ┌──────────────────────────────────────────────────────┐     │
│   │  express-rate-limit  (20 req / 15 min on /api/auth)  │     │
│   └──────────────────────────────────────────────────────┘     │
│                                                                 │
│   ┌─────────────────────┐   ┌─────────────────────────────┐   │
│   │  better-auth        │   │  Application Routes          │   │
│   │  /api/auth/*        │   │  GET    /health              │   │
│   │  (magic link;       │   │  GET    /api/applications    │   │
│   │  OAuth ready)       │   │  POST   /api/applications    │   │
│   └──────────┬──────────┘   │  PATCH  /api/applications/:id│   │
│              │              │  PATCH  /api/applications    │   │
│              │              │         /:id/status          │   │
│              │              │  DELETE /api/applications/:id│   │
│              │              └─────────────────────────────┘   │
│              │                                                 │
└──────────────┼──────────────────────────────────────────────────┘
               │ Prisma ORM
               ▼
┌─────────────────────────┐     ┌────────────────────────────┐
│   PostgreSQL Database   │     │   Resend (email API)       │
│                         │     │   Magic link delivery      │
│   users                 │     └────────────────────────────┘
│   sessions              │
│   accounts              │
│   verifications         │
│   applications          │
│   artifacts             │
└─────────────────────────┘
```

---

## Data Models

All models are defined in [server/prisma/schema.prisma](../../server/prisma/schema.prisma) and managed via Prisma migrations.

### `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `String` | PK, cuid | |
| `name` | `String` | NOT NULL | Set on account creation |
| `email` | `String` | NOT NULL, UNIQUE | |
| `emailVerified` | `Boolean` | NOT NULL, default `false` | Set `true` after magic link verification |
| `image` | `String?` | nullable | Reserved for future OAuth avatar URL |
| `createdAt` | `DateTime` | NOT NULL, default now | |
| `updatedAt` | `DateTime` | NOT NULL, auto-update | |

### `sessions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `String` | PK, cuid | |
| `expiresAt` | `DateTime` | NOT NULL | Managed by better-auth |
| `token` | `String` | NOT NULL, UNIQUE | Opaque session token stored in cookie |
| `createdAt` | `DateTime` | NOT NULL, default now | |
| `updatedAt` | `DateTime` | NOT NULL, auto-update | |
| `ipAddress` | `String?` | nullable | |
| `userAgent` | `String?` | nullable | |
| `userId` | `String` | FK → `users.id` CASCADE | |

### `accounts`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `String` | PK, cuid | |
| `accountId` | `String` | NOT NULL | Provider's internal user ID |
| `providerId` | `String` | NOT NULL | e.g. `magic-link`, `google`, `github` |
| `accessToken` | `String?` | nullable | |
| `refreshToken` | `String?` | nullable | |
| `idToken` | `String?` | nullable | |
| `accessTokenExpiresAt` | `DateTime?` | nullable | |
| `refreshTokenExpiresAt` | `DateTime?` | nullable | |
| `scope` | `String?` | nullable | |
| `password` | `String?` | nullable | Unused — email/password auth disabled |
| `createdAt` | `DateTime` | NOT NULL, default now | |
| `updatedAt` | `DateTime` | NOT NULL, auto-update | |
| `userId` | `String` | FK → `users.id` CASCADE | |
| — | — | UNIQUE(`accountId`, `providerId`) | One record per user per provider |

### `verifications`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `String` | PK, cuid | |
| `identifier` | `String` | NOT NULL | Email address being verified |
| `value` | `String` | NOT NULL | Hashed one-time token |
| `expiresAt` | `DateTime` | NOT NULL | 15 minutes from creation |
| `createdAt` | `DateTime` | NOT NULL, default now | |
| `updatedAt` | `DateTime` | NOT NULL, auto-update | |
| — | — | UNIQUE(`identifier`, `value`) | |

### `applications`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `String` | PK, cuid | |
| `dueDate` | `DateTime` | NOT NULL | Used for urgency band calculation and list ordering |
| `employer` | `String` | NOT NULL | |
| `jobTitle` | `String` | NOT NULL | |
| `jobDescription` | `String?` | nullable | Optional |
| `salaryMin` | `Decimal(12,2)?` | nullable | Optional starting salary |
| `salaryMax` | `Decimal(12,2)?` | nullable | Optional maximum salary; must be > `salaryMin` when both are present |
| `salaryCurrency` | `String?` | nullable | ISO 4217 currency code (e.g. `"CAD"`); stored alongside salary values |
| `status` | `ApplicationStatus` | NOT NULL, default `NOT_SUBMITTED` | `NOT_SUBMITTED` or `SUBMITTED` — changed only via the list page kebab menu |
| `createdAt` | `DateTime` | NOT NULL, default now | |
| `updatedAt` | `DateTime` | NOT NULL, auto-update | |
| `userId` | `String` | FK → `users.id` CASCADE | |

### `artifacts`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `String` | PK, cuid | |
| `label` | `String` | NOT NULL | e.g. "CV", "Cover Letter" |
| `order` | `Int` | NOT NULL | Preserves user's insertion order |
| `createdAt` | `DateTime` | NOT NULL, default now | |
| `applicationId` | `String` | FK → `applications.id` CASCADE | |
| — | — | UNIQUE(`applicationId`, `label`) | Enforces no duplicate artifact labels per application |

> Full Prisma schema including enum definitions is in [technical/modules/add-application-module.md](modules/add-application-module.md#schema-change-artifacts).

---

## External Integrations

### Resend

- **Purpose:** Transactional email delivery for magic link sign-in
- **Config required:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- **Sender address:** Set `RESEND_FROM_EMAIL` to an address on a domain verified in your Resend account (e.g. `no-reply@yourdomain.com`)
- **Integration point:** `sendMagicLink` callback in the better-auth plugin config

### Google OAuth 2.0 *(future — not active in v1)*

- **Config required:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Redirect URI to register:** `{FRONTEND_URL}/api/auth/callback/google`
- **Scopes:** `openid`, `profile`, `email`

### GitHub OAuth *(future — not active in v1)*

- **Config required:** `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- **Redirect URI to register:** `{FRONTEND_URL}/api/auth/callback/github`
- **Scopes:** `user:email`

### Railway

- **Purpose:** Cloud hosting — build, deploy, and serve the application
- **Config file:** [railway.toml](../../railway.toml)
- **Database:** Provision a PostgreSQL add-on in Railway; the connection string is injected as `DATABASE_URL`

---

## Deployment Strategy

### Environments

| Environment | Frontend URL | Backend | Database |
|-------------|-------------|---------|----------|
| Local dev | `http://localhost:5173` | `http://localhost:3000` | Docker (port 5432) |
| Production | Railway domain or custom | Same Railway service | Railway PostgreSQL add-on |

### Local Development

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Install dependencies
npm run install:all

# 3. Set up environment
cp .env.example .env
# Fill in all values in .env

# 4. Apply database migrations
npm run db:migrate:dev --prefix server

# 5. Start both servers
npm run dev
```

- **Client:** http://localhost:5173 (Vite dev server with HMR)
- **Server:** http://localhost:3000
- **Vite proxy:** all `/api` requests from the client are forwarded to the server automatically
- **Server hot reload:** `node --watch` restarts the server on file changes

### Production Deploy (Railway)

1. Push code to your connected git repository
2. Railway runs: `npm install --prefix server && npm run build --prefix client`
3. Railway starts: `npm start --prefix server`
4. Railway performs health check: `GET /health` must return HTTP 200
5. On health check failure: service restarts (max 3 retries)

**Environment variables to set in Railway:**

```
BETTER_AUTH_SECRET     # openssl rand -base64 32
SESSION_EXPIRY_HOURS   # session lifetime in whole hours; defaults to 72 (3 days) if omitted
GOOGLE_CLIENT_ID       # future — can be placeholder for now
GOOGLE_CLIENT_SECRET   # future — can be placeholder for now
GITHUB_CLIENT_ID       # future — can be placeholder for now
GITHUB_CLIENT_SECRET   # future — can be placeholder for now
RESEND_API_KEY
RESEND_FROM_EMAIL      # e.g. no-reply@yourdomain.com (must be on a Resend-verified domain)
DATABASE_URL           # from Railway PostgreSQL add-on
FRONTEND_URL           # your Railway public domain (https://...)
NODE_ENV               # production
PORT                   # set automatically by Railway
```

### Database Migrations

| Command | When to use |
|---------|-------------|
| `npm run db:migrate:dev --prefix server` | Local dev — creates migration files and applies them |
| `npm run db:migrate --prefix server` | Production / CI — applies existing migrations only |
| `npm run db:generate --prefix server` | After pulling schema changes without running migrations |
| `npm run db:studio --prefix server` | Local DB browser at http://localhost:5555 |

### CI/CD Considerations *(not yet configured)*

- Run `npm run db:migrate --prefix server` as a pre-deploy step in production
- Prisma client generation (`prisma generate`) runs automatically as a post-install hook
