# Application Status Tracker

A full-stack web application for tracking the lifecycle of applications — job applications, grants, submissions, or any multi-stage process. Sign in with Google, GitHub, or a passwordless magic link.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 6 |
| Backend | Node.js + Express 4 |
| Database | PostgreSQL + Prisma ORM |
| Auth | better-auth (Google OAuth, GitHub OAuth, magic link) |
| Email | Resend |
| Logging | pino |
| Deployment | Railway |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL)
- npm 9+

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd application-status-tracker
npm run install:all
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in all values. Every variable is required — the server will refuse to start with any value missing.

```bash
# Generate a secure auth secret
openssl rand -base64 32
```

See [.env.example](.env.example) for descriptions of each variable and where to obtain credentials.

### 3. Start the local database

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 with database `app_db`.

### 4. Apply database migrations

```bash
npm run db:migrate:dev --prefix server
```

### 5. Start the development servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:3000 |
| Health check | http://localhost:3000/health |

The Vite dev server proxies all `/api` requests to the backend automatically.

---

## Project Structure

```
/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── server/                    # Express backend
│   ├── prisma/
│   │   └── schema.prisma      # Database models
│   └── src/
│       ├── index.js           # Entry point
│       ├── lib/
│       │   ├── auth.js        # better-auth configuration
│       │   ├── logger.js      # pino logger
│       │   ├── prisma.js      # Prisma client singleton
│       │   ├── resend.js      # Resend email client
│       │   └── validateEnv.js # Startup env validation
│       └── routes/
│           └── health.js      # GET /health
│
├── docs/
│   ├── requirements.md        # User stories & requirements
│   └── technical-specs.md    # Architecture & data models
│
├── .env.example               # Required environment variables
├── docker-compose.yml         # Local PostgreSQL
└── railway.toml               # Railway deployment config
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client and server concurrently |
| `npm run install:all` | Install dependencies for root, client, and server |
| `npm run build` | Build the client for production |
| `npm run db:migrate:dev --prefix server` | Create and apply a new migration (local dev) |
| `npm run db:migrate --prefix server` | Apply pending migrations (production) |
| `npm run db:studio --prefix server` | Open Prisma Studio at http://localhost:5555 |
| `npm run db:generate --prefix server` | Regenerate Prisma client after schema changes |

---

## Deployment

This project is configured for one-click deployment to [Railway](https://railway.app).

1. Create a new Railway project and connect your repository
2. Add a PostgreSQL add-on — Railway will provide `DATABASE_URL` automatically
3. Set all remaining environment variables from `.env.example` in Railway's service settings
4. Deploy — Railway will build the client, install server dependencies, and start the server

Railway performs a health check against `GET /health` after each deploy. See [docs/technical-specs.md](docs/technical-specs.md#5-deployment-strategy) for full deployment details.

---

## Documentation

- [Requirements & User Stories](docs/requirements.md)
- [Technical Specifications](docs/technical-specs.md)
