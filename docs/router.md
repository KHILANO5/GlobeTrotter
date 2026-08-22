# GlobeTrotter — Routers & Controllers

Maps every page in `features.md` to a frontend route and the backend controller(s) that serve it. Endpoint names here are the contract other docs (notably `apicontract.md`) should follow — if `apicontract.md` diverges, this file is the source of truth for naming, and it should be updated to match.

## 1. Naming Conventions

**Frontend routes**
- Lowercase, kebab-case path segments: `/trip-budget`, not `/tripBudget`.
- Resource-based, RESTful nesting for anything scoped to a trip: `/trips/:tripId/itinerary`.
- Dynamic segments use `:camelCaseId` (e.g. `:tripId`, `:stopId`, `:shareToken`).
- No verbs in the path except for the few genuinely action-based screens (`/trips/new`) — prefer nesting resources over verb routes.

**Backend controllers**
- PascalCase, singular domain noun + `Controller` suffix: `TripController`, `AuthController`, `BudgetController`.
- One controller per bounded domain concept (Trip, Stop, Activity, City, Budget, Share, Community, User, Auth, Admin) — not one controller per screen. Several screens can call the same controller; a few screens call more than one controller.

**Backend endpoints**
- All routes versioned and prefixed: `/api/v1/...`.
- Plural nouns for collections: `/api/v1/trips`, `/api/v1/activities`.
- Standard REST verbs (GET/POST/PUT/PATCH/DELETE) over the resource; avoid verb-in-URL except for genuinely non-CRUD actions (`/share`, `/copy`, `/reorder`, `/forgot-password`).
- Nested resources reflect ownership: `/api/v1/trips/:tripId/stops/:stopId/activities`.
- Query params for search/filter/sort/group, not separate endpoints: `/api/v1/cities?search=paris&region=europe`.

## 2. Controllers — Responsibility & Exposed Routes

### AuthController
**Responsibility:** authentication — login, signup, logout, password reset.
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

### UserController
**Responsibility:** the logged-in user's own profile, settings, and saved destinations.
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `DELETE /api/v1/users/me`
- `GET /api/v1/users/me/saved-destinations`

### TripController
**Responsibility:** trip CRUD and trip-level listing (Dashboard's recent trips, My Trips list, Create Trip).
- `GET /api/v1/trips` (supports `?status=ongoing|upcoming|completed`, search/sort/group query params)
- `POST /api/v1/trips`
- `GET /api/v1/trips/:tripId`
- `PUT /api/v1/trips/:tripId`
- `DELETE /api/v1/trips/:tripId`

### ItineraryController
**Responsibility:** the day-wise/section-wise structure of a trip — stops, ordering, and the assembled itinerary view.
- `GET /api/v1/trips/:tripId/stops`
- `POST /api/v1/trips/:tripId/stops`
- `PUT /api/v1/trips/:tripId/stops/:stopId`
- `DELETE /api/v1/trips/:tripId/stops/:stopId`
- `PATCH /api/v1/trips/:tripId/stops/reorder`
- `GET /api/v1/trips/:tripId/itinerary` (assembled day-wise view used by Itinerary View screen)

### ActivityController
**Responsibility:** activity discovery/search, and assigning/removing activities on a stop.
- `GET /api/v1/activities` (search, filter by type/cost/duration)
- `GET /api/v1/trips/:tripId/stops/:stopId/activities`
- `POST /api/v1/trips/:tripId/stops/:stopId/activities`
- `DELETE /api/v1/trips/:tripId/stops/:stopId/activities/:activityId`

### CityController
**Responsibility:** city discovery/search for the Itinerary Builder's "Add Stop" flow.
- `GET /api/v1/cities` (search, filter by country/region)
- `GET /api/v1/cities/:cityId`

### BudgetController
**Responsibility:** cost aggregation and breakdown for a trip.
- `GET /api/v1/trips/:tripId/budget` (returns totals + breakdown by transport/stay/activities/meals, per-day average, over-budget flags)

### CalendarController
**Responsibility:** calendar/timeline-formatted view of a trip's itinerary (a display transform of the same underlying stop/activity data as `ItineraryController`).
- `GET /api/v1/trips/:tripId/calendar`

### ShareController
**Responsibility:** generating and resolving public share links, and copying a shared trip into the current user's account.
- `POST /api/v1/trips/:tripId/share` (generates/returns `shareToken`)
- `GET /api/v1/shared/:shareToken` (public, no auth — read-only itinerary)
- `POST /api/v1/shared/:shareToken/copy` (auth required — creates a new trip for the requesting user)

### CommunityController
**Responsibility:** the feed of publicly shared trips/experiences on the Community Tab.
- `GET /api/v1/community/trips` (search/filter/sort/group over public trips)

### AdminController
**Responsibility:** admin-only user management and platform analytics.
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/:userId/trips`
- `GET /api/v1/admin/analytics/popular-cities`
- `GET /api/v1/admin/analytics/popular-activities`
- `GET /api/v1/admin/analytics/engagement`

## 3. Page → Route → Controller → Endpoints

| Page (from `features.md`) | Frontend route | Backend controller(s) | Key endpoints |
|---|---|---|---|
| Login / Signup Screen | `/login` | AuthController | `POST /api/v1/auth/login` |
| Registration Screen | `/signup` | AuthController | `POST /api/v1/auth/signup` |
| Dashboard / Home Screen | `/dashboard` | TripController, CityController | `GET /api/v1/trips?status=upcoming`, `GET /api/v1/cities` (recommended destinations) |
| Create Trip Screen | `/trips/new` | TripController | `POST /api/v1/trips` |
| My Trips (Trip List) Screen | `/trips` | TripController | `GET /api/v1/trips`, `DELETE /api/v1/trips/:tripId` |
| Itinerary Builder Screen | `/trips/:tripId/builder` | ItineraryController, CityController, ActivityController | `GET/POST/PUT/DELETE /api/v1/trips/:tripId/stops`, `PATCH .../stops/reorder` |
| Itinerary View Screen | `/trips/:tripId/itinerary` | ItineraryController | `GET /api/v1/trips/:tripId/itinerary` |
| City Search | `/trips/:tripId/builder/cities` (modal/sub-route) | CityController | `GET /api/v1/cities` |
| Activity Search | `/trips/:tripId/builder/activities` (modal/sub-route) | ActivityController | `GET /api/v1/activities`, `POST .../stops/:stopId/activities` |
| Trip Budget & Cost Breakdown Screen | `/trips/:tripId/budget` | BudgetController | `GET /api/v1/trips/:tripId/budget` |
| Trip Calendar / Timeline Screen | `/trips/:tripId/calendar` | CalendarController | `GET /api/v1/trips/:tripId/calendar` |
| Shared / Public Itinerary View Screen | `/shared/:shareToken` | ShareController | `GET /api/v1/shared/:shareToken`, `POST /api/v1/shared/:shareToken/copy` |
| Community Tab Screen | `/community` | CommunityController | `GET /api/v1/community/trips` |
| User Profile / Settings Screen | `/profile` | UserController | `GET/PUT/DELETE /api/v1/users/me` |
| Admin / Analytics Dashboard (Optional) | `/admin` | AdminController | `GET /api/v1/admin/users`, `GET /api/v1/admin/analytics/*` |

## 4. Notes for `apicontract.md`

- Every endpoint above should get a full request/response schema in `apicontract.md`, keyed by the same path and verb used here.
- Auth requirement per endpoint should be stated explicitly in `apicontract.md` — only `AuthController`'s routes and `GET /api/v1/shared/:shareToken` are unauthenticated; everything else requires a valid session/token.
- `ItineraryController` and `CalendarController` intentionally read the same underlying stop/activity data — `apicontract.md` should document the shared response shape they both build on, to avoid the two views drifting out of sync.
