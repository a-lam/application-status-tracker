# Non-functional Requirements

> **Last updated:** 2026-04-07

These requirements apply across the entire application and are not tied to any single feature.

---

## NFR-SEC — Security

| # | Requirement |
|---|-------------|
| NFR-SEC-01 | All HTTP responses must include security headers provided by `helmet` (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, etc.). |
| NFR-SEC-02 | CORS must be restricted to the origin defined in `FRONTEND_URL` only — wildcard origins (`*`) are not permitted. |
| NFR-SEC-03 | Auth endpoints (`/api/auth/*`) must be rate-limited to a maximum of 20 requests per 15-minute window per IP address. |
| NFR-SEC-04 | Session secrets (`BETTER_AUTH_SECRET`) must be cryptographically random strings of at least 32 characters and must never be hardcoded. |
| NFR-SEC-05 | No credentials, secrets, or API keys may appear in source code or version control at any time. |
| NFR-SEC-06 | The `.env` file must be listed in `.gitignore` and must never be committed. |
| NFR-SEC-07 | The `accounts` table must be access-controlled — no endpoint may return raw tokens or credentials to the client. |
| NFR-SEC-08 | Session lifetime must be configurable via `SESSION_EXPIRY_HOURS` (whole hours, integer); the default must be 72 hours (3 days). The value must be applied server-side — the client must not be able to extend or bypass it. |

---

## NFR-PERF — Performance

| # | Requirement |
|---|-------------|
| NFR-PERF-01 | The `/health` endpoint must respond in under 500ms under normal load. |
| NFR-PERF-02 | The magic link sign-in flow (email submission to session creation after link click) must complete in under 3 seconds of server processing time under normal load. |
| NFR-PERF-03 | The Prisma client must be instantiated as a singleton — a new connection pool must not be created per request. |

---

## NFR-OBS — Observability

| # | Requirement |
|---|-------------|
| NFR-OBS-01 | All server logs must be structured JSON in production environments. |
| NFR-OBS-02 | In development, logs must be human-readable (pretty-printed with color). |
| NFR-OBS-03 | Errors logged to pino must include the full error object under the `err` key (compatible with pino's error serializer). |

---

## NFR-DEP — Deployment & Reliability

| # | Requirement |
|---|-------------|
| NFR-DEP-01 | The application must be deployable to Railway using the configuration in `railway.toml` without manual steps. |
| NFR-DEP-02 | Railway must perform a health check against `GET /health` after each deploy; failed health checks must trigger a restart. |
| NFR-DEP-03 | The service must restart automatically on failure, with a maximum of 3 retries. |
| NFR-DEP-04 | A `docker-compose.yml` must be provided so that a local PostgreSQL instance can be started with a single command. |
| NFR-DEP-05 | Database schema changes must be applied via Prisma migrations (`prisma migrate deploy`), not ad-hoc SQL. |

---

## NFR-SCALE — Scalability

| # | Requirement |
|---|-------------|
| NFR-SCALE-01 | The server must be stateless — session state must live in the database, not in process memory, so that multiple instances can run in parallel. |
| NFR-SCALE-02 | The architecture must support horizontal scaling without code changes (add more Railway instances or increase replicas). |

---

## NFR-A11Y — Accessibility & Mobile

| # | Requirement |
|---|-------------|
| NFR-A11Y-01 | All text rendered on coloured backgrounds must meet WCAG AA contrast (minimum 4.5:1 for normal text, 3:1 for large text ≥ 18 pt or bold ≥ 14 pt). |
| NFR-A11Y-02 | All interactive touch targets must have a minimum hit area of 44 × 44 px. |
| NFR-A11Y-03 | All CSS transitions and animations must be suppressed when the user's operating system reports `prefers-reduced-motion: reduce`. |
| NFR-A11Y-04 | The UI must be fully usable on mobile viewports down to 320 px wide without horizontal scrolling or overlapping elements. |
| NFR-A11Y-05 | Status changes and other non-focus-moving feedback must be announced to screen readers via an `aria-live="polite"` region so that keyboard and AT users receive confirmation of completed actions. |
| NFR-A11Y-06 | Modal dialogs must be implemented with the native `<dialog>` element and `showModal()` to ensure browser-native focus trapping, top-layer stacking, and Escape-key handling. |
