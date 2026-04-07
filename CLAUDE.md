# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
# Start both frontend and backend concurrently (from repo root)
npm run dev

# Install all dependencies (root + client + server)
npm run install:all
```

### Client (React + Vite)
```bash
npm run dev --prefix client        # Dev server on port 5173
npm run build --prefix client      # Build to client/dist/
npm run preview --prefix client    # Preview production build
```

### Server (Express)
```bash
npm run dev --prefix server        # Start with --watch (auto-reload)
npm start --prefix server          # Production start (no watch)
```

### Database (Prisma)
```bash
npm run db:migrate:dev --prefix server   # Create & apply migration (dev)
npm run db:migrate --prefix server       # Apply pending migrations (prod)
npm run db:generate --prefix server      # Regenerate Prisma client
npm run db:studio --prefix server        # Open Prisma Studio at localhost:5555
docker-compose up -d                     # Start local PostgreSQL container
```

## Architecture Overview

This is a monorepo with `client/` (React SPA) and `server/` (Express API) as separate npm workspaces. Root `package.json` has scripts that orchestrate both.

### Request Flow
- **Dev:** Vite dev server (`:5173`) proxies all `/api/*` requests to Express (`:3000`)
- **Prod:** Express serves the built React SPA from `client/dist/` and handles all API routes from the same origin

### Authentication
`better-auth` handles three methods: Google OAuth, GitHub OAuth, and passwordless magic links via email (Resend). All auth routes are under `/api/auth/*`. Every protected API endpoint uses the `requireAuth` middleware in `server/src/lib/auth.js`, which validates the HTTP-only session cookie via `better-auth.api.getSession()`. In development, magic link URLs are logged to console.

### Frontend Structure
- `client/src/App.jsx` — Router config with `<ProtectedRoute>` and `<GuestRoute>` wrappers; session polled every 60 seconds via `authClient.useSession()`
- `client/src/lib/api.js` — All API calls go through `apiFetch()` (wraps fetch with `credentials: "include"`); 401 responses auto-redirect to login
- `client/src/lib/auth.js` — better-auth client config
- `client/src/pages/` — Page-level components (Login, ApplicationsList, AddApplication, EditApplication)
- `client/src/components/applications/` — All application UI components (form, card, list, artifacts, etc.)
- No global state manager — components use `useState`/`useEffect` with local state

### Backend Structure
- `server/src/index.js` — Express app: helmet → cors → express.json → logging → rate limiting → auth routes → app routes → static serving
- `server/src/routes/applications.js` — Full CRUD; creation/updates use `prisma.$transaction()` for atomicity
- `server/src/routes/artifacts.js` — Single endpoint: `PATCH /api/artifacts/:id/completed`
- `server/src/lib/validateEnv.js` — Validates all required env vars on startup; server refuses to start if any are missing

### Database Models
- `User`, `Session`, `Account`, `Verification` — managed by better-auth
- `Application` — job application with `status: NOT_SUBMITTED | SUBMITTED`, salary range, due date, FK to User
- `Artifact` — ordered checklist items per application (unique label per application); completed status is preserved by case-insensitive label matching during updates

### Deployment (Railway)
- `railway.toml` defines build and start commands
- Build: installs deps, builds React app, generates Prisma client
- Start: runs `db:migrate` then `node src/index.js`
- Health check endpoint: `GET /health`

## Environment Variables

All required vars are validated in `server/src/lib/validateEnv.js`. See `.env.example` for annotations and credential sources.

Key variables:
- `DATABASE_URL` — PostgreSQL connection string (local: `postgresql://postgres:postgres@localhost:5432/app_db`)
- `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth credentials
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — email delivery for magic links
- `FRONTEND_URL` — used for CORS whitelist (`http://localhost:5173` in dev)
- `NODE_ENV` — controls static serving and log formatting

## Project Requirements
Full PRD including features, design decisions, and requirements: see `docs\README.md`
Read it at the start of any session before making architectural decisions.