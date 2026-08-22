# GlobeTrotter — Backend Rules

## 1. Framework & Version

**The source PDF and Excalidraw mockup do not specify a backend framework or language** — this is a default choice, not a stated constraint. Flag for team confirmation before locking in.

**Proposed default:** Node.js 20 LTS + Express 4 + TypeScript, with Prisma as the ORM/query layer over a PostgreSQL database.

**Why this default:**
- The PDF explicitly requires "proper use of relational databases" for users/trips/stops/activities/expenses — PostgreSQL + Prisma gives typed, migration-backed relational modeling out of the box.
- TypeScript on the backend lets request/response types be shared or mirrored with the frontend's types (`types/`, per `frontendrules.md`) and with `apicontract.md`, reducing drift between contract and implementation.
- Express keeps the routing layer thin and maps directly onto the controllers already named in `router.md` — no framework-specific reinterpretation needed.
- Fast to scaffold for a hackathon timeline; large middleware ecosystem for auth, validation, and logging.

If the team prefers a different stack (Django, FastAPI, NestJS, Rails, etc.), the layering, error-handling, and auth-enforcement rules below still apply — only the folder structure and syntax specifics would change.

## 2. Project / Folder Structure

```
server/
├── src/
│   ├── routes/                 # Express route definitions only — no logic
│   │   ├── auth.routes.ts
│   │   ├── trips.routes.ts
│   │   ├── itinerary.routes.ts
│   │   ├── cities.routes.ts
│   │   ├── activities.routes.ts
│   │   ├── budget.routes.ts
│   │   ├── calendar.routes.ts
│   │   ├── sharing.routes.ts
│   │   ├── community.routes.ts
│   │   ├── users.routes.ts
│   │   └── admin.routes.ts
│   ├── controllers/            # One file per controller in router.md
│   │   ├── AuthController.ts
│   │   ├── TripController.ts
│   │   ├── ItineraryController.ts
│   │   ├── ActivityController.ts
│   │   ├── CityController.ts
│   │   ├── BudgetController.ts
│   │   ├── CalendarController.ts
│   │   ├── ShareController.ts
│   │   ├── CommunityController.ts
│   │   ├── UserController.ts
│   │   └── AdminController.ts
│   ├── services/                # Business logic, one per domain concept
│   │   ├── trip.service.ts
│   │   ├── itinerary.service.ts
│   │   ├── budget.service.ts
│   │   ├── share.service.ts
│   │   └── ...
│   ├── repositories/            # Data access, wraps Prisma calls
│   │   ├── trip.repository.ts
│   │   ├── stop.repository.ts
│   │   ├── activity.repository.ts
│   │   └── ...
│   ├── middleware/               # auth, error handler, validation, logging
│   │   ├── requireAuth.ts
│   │   ├── requireAdmin.ts
│   │   ├── errorHandler.ts
│   │   └── validateRequest.ts
│   ├── schemas/                  # Zod request/response validation schemas
│   ├── config/                   # Env loading, constants
│   ├── lib/                      # DB client, external clients, shared utils
│   └── app.ts                    # Express app assembly
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
└── .env.example
```

**Rule:** file and folder names mirror the controller names in `router.md` exactly (`TripController.ts`, not `tripsController.ts` or `Trip.ts`) so the two documents never drift.

## 3. Layering Convention

**Route → Controller → Service → Repository**, strictly one direction — a layer only calls the layer directly below it, never skips or calls upward.

| Layer | Responsibility | Must NOT do |
|---|---|---|
| **Route** | Maps an HTTP verb+path to a controller method; attaches middleware (`requireAuth`, `validateRequest`). | No business logic, no direct DB access. |
| **Controller** | Parses/validates the request, calls the relevant service method(s), shapes the HTTP response (status code, JSON body). | No direct database queries, no business rules (e.g. budget math) inline. |
| **Service** | Business logic: budget calculations, itinerary assembly, share-token generation, authorization rules beyond "is logged in" (e.g. "is this the trip's owner"). | No direct HTTP request/response objects — services are framework-agnostic and testable in isolation. |
| **Repository** | All Prisma/DB queries for one domain entity. | No business logic — a repository method fetches/writes data, it doesn't decide what the data means. |

**Example flow** — `GET /api/v1/trips/:tripId/budget`:
`budget.routes.ts` → `BudgetController.getBudget()` → `budget.service.ts: calculateBudget(tripId)` → `stop.repository.ts` + `activity.repository.ts` (fetch raw cost data) → service aggregates into the breakdown shape → controller returns it as JSON.

**Rule:** if a controller method is more than ~15 lines or contains an `if` statement deciding business outcomes (not just request validation), that logic belongs in a service instead.

## 4. Error Handling & Logging

**Error handling:**
- All async route handlers are wrapped (e.g. via an `asyncHandler` utility) so thrown errors reach the centralized `errorHandler` middleware — no unhandled promise rejections.
- Services and repositories throw typed application errors (`NotFoundError`, `ValidationError`, `ForbiddenError`, `UnauthorizedError`), never raw strings or generic `Error`.
- The central `errorHandler` middleware maps each typed error to an HTTP status code (404, 400, 403, 401) and a consistent JSON error shape:
  ```json
  { "error": { "code": "TRIP_NOT_FOUND", "message": "Trip not found" } }
  ```
- Never leak stack traces, raw DB errors, or internal messages to the client in production responses — log them internally, return a generic safe message externally.

**Logging:**
- Structured logging (e.g. Pino) — never bare `console.log` in application code.
- Every request logs at minimum: method, path, status code, duration, and (if authenticated) user ID — no PII beyond that in access logs.
- Errors are logged with full stack trace + request context at the point they're caught by `errorHandler`, once per error (avoid duplicate logging at every layer it passes through).
- No secrets, passwords, or tokens are ever logged, even at debug level.

## 5. Authentication / Authorization Enforcement Points

- **Enforcement lives in middleware, not scattered in controllers.** `requireAuth` runs on every route except those explicitly listed as public in `router.md` (`POST /api/v1/auth/*`, `GET /api/v1/shared/:shareToken`).
- `requireAdmin` runs in addition to `requireAuth` on all `AdminController` routes.
- **Ownership checks** (e.g. "does this trip belong to the requesting user") happen in the **service layer**, not the route/controller — because the check requires business context (fetching the trip first), it's a business rule, not a request-parsing concern.
- The `ShareController`'s public `GET /api/v1/shared/:shareToken` endpoint deliberately skips `requireAuth`, but `POST /api/v1/shared/:shareToken/copy` requires it — this asymmetry must be preserved exactly as specified in `router.md`.
- Session/token validation (JWT or session cookie — to be decided) happens once, in `requireAuth`; downstream layers trust `req.user` and never re-validate the token.

## 6. Environment Variable & Config Management

- All configuration values (DB connection string, JWT secret, port, CORS origin, third-party API keys) are read from environment variables via a single typed `config/env.ts` module — no `process.env.X` scattered through the codebase.
- `.env.example` is committed with every required variable name and a placeholder value; `.env` itself is gitignored and never committed.
- The app fails fast at startup (not on first request) if a required environment variable is missing — validate the full config shape (e.g. with Zod) once, at boot.
- No secrets, API keys, or credentials are hardcoded anywhere in source, including test files or seed scripts.
- Separate `.env` values per environment (development, test, production) — never point a local dev run at a production database.

## 7. Testing Expectations (Hackathon-Scoped)

Given the hackathon timeline, testing is intentionally scoped down but not skipped entirely:

- **Services get unit tests** — the business logic layer (budget calculation, itinerary assembly, share-token generation) is the highest-value place to catch bugs, and services are designed to be framework-agnostic specifically so they're easy to test without spinning up the HTTP server.
- **At least one integration test per controller** covering the primary happy path (e.g. "create a trip → returns 201 with the trip shape") — not exhaustive edge-case coverage, just a smoke test per endpoint group.
- **Auth middleware gets explicit tests**: a protected route returns 401 with no token, and a non-owner gets 403 attempting to modify someone else's trip.
- Skip: exhaustive input-fuzzing, load/performance testing, and full end-to-end browser test suites — out of scope for the hackathon window.
- Tests run against a separate test database (or an in-memory/dockerized instance), never against the development or shared database.

## 8. Do's and Don'ts for Agents Writing Backend Code

**Do:**
- Follow the exact controller and endpoint names from `router.md` — don't invent alternate names or paths.
- Put business logic in services, not controllers or routes.
- Throw typed errors and let the central `errorHandler` translate them to HTTP responses.
- Validate every request body/query/params against a Zod schema in `schemas/` before it reaches the controller logic.
- Add `requireAuth` (and `requireAdmin` where relevant) to every route except the explicitly public ones.
- Read config only through the typed `config/env.ts` module.
- Write a unit test for any new service method containing calculation or aggregation logic (budget, itinerary assembly).

**Don't:**
- Don't query the database directly from a controller — go through a repository.
- Don't put ownership/permission checks in middleware if they require fetching domain data first — that belongs in the service layer.
- Don't log secrets, tokens, passwords, or full request bodies containing sensitive fields.
- Don't return raw Prisma errors or stack traces in an API response.
- Don't hardcode any environment-specific value (DB URL, API keys, ports) in source code.
- Don't skip validation on an endpoint because "the frontend already validates it" — the backend is the trust boundary.
- Don't introduce a new architectural layer or pattern (e.g. CQRS, event sourcing) without a documented reason — keep to route → controller → service → repository.
