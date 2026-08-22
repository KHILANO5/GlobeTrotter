# GlobeTrotter — API Contract

Full request/response contract for every endpoint named in `router.md`. Field names match `schema.md`. This is the source of truth for payload shapes — `router.md` owns endpoint naming/routing, this file owns the data shapes.

## 1. Versioning

All routes are prefixed `/api/v1`. Breaking changes to a payload shape require a new version prefix (`/api/v2`) rather than mutating `/v1` in place; additive, backward-compatible fields can be added to `/v1` without a version bump.

## 2. Authentication Mechanism

- **Mechanism:** JWT bearer token, sent as `Authorization: Bearer <token>`.
- Issued by `POST /api/v1/auth/login` and `POST /api/v1/auth/signup`; short-lived access token (suggested 1 hour) — refresh strategy (refresh token or re-login) is a decision left to implementation, not fixed by this contract.
- **How protected routes are marked:** every endpoint below is labeled with a **Role** — `Public`, `User` (any authenticated user), `Owner` (authenticated user who owns the resource, checked in the service layer per `backendrules.md`), or `Admin`. Any role other than `Public` requires a valid `Authorization` header; the `requireAuth` middleware rejects missing/invalid tokens with `401 UNAUTHORIZED` before the request reaches a controller.

## 3. Standard Response Envelopes

**Success envelope:**
```json
{
  "data": { },
  "meta": { }
}
```
`meta` is present only for paginated list endpoints (Section 6). Non-list endpoints return `data` only.

**Error envelope:**
```json
{
  "error": {
    "code": "TRIP_NOT_FOUND",
    "message": "Trip not found",
    "details": null
  }
}
```
`details` is populated only for validation errors (`422`), as an array of field-level issues:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request failed validation",
    "details": [
      { "field": "endDate", "message": "endDate must be on or after startDate" }
    ]
  }
}
```

## 4. HTTP Status Codes & Error Code Conventions

| Status | Meaning | Example error `code` |
|---|---|---|
| `200 OK` | Successful GET/PUT/PATCH | — |
| `201 Created` | Successful POST creating a resource | — |
| `204 No Content` | Successful DELETE | — (no body) |
| `400 Bad Request` | Malformed request (bad JSON, wrong types) | `BAD_REQUEST` |
| `401 Unauthorized` | Missing/invalid/expired token | `UNAUTHORIZED` |
| `403 Forbidden` | Valid token, but not permitted (not owner, not admin) | `FORBIDDEN` |
| `404 Not Found` | Resource doesn't exist (or isn't visible to this user) | `<DOMAIN>_NOT_FOUND` e.g. `TRIP_NOT_FOUND` |
| `409 Conflict` | Uniqueness violation (duplicate email, duplicate share) | `<DOMAIN>_CONFLICT` e.g. `EMAIL_ALREADY_EXISTS` |
| `422 Unprocessable Entity` | Passed shape validation but failed a business/schema rule | `VALIDATION_ERROR` |
| `500 Internal Server Error` | Unexpected server error | `INTERNAL_ERROR` |

**Error code convention:** `SCREAMING_SNAKE_CASE`, domain-prefixed (`TRIP_NOT_FOUND`, `AUTH_INVALID_CREDENTIALS`, `STOP_NOT_FOUND`, `SHARE_TOKEN_INVALID`). `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, and `INTERNAL_ERROR` are the only non-domain-prefixed codes, reserved for the generic cases in the table above.

## 5. Pagination, Filtering, Sorting

Applies to every collection-returning `GET` endpoint (`/trips`, `/cities`, `/activities`, `/community/trips`, `/admin/users`).

- **Pagination:** query params `page` (default `1`) and `pageSize` (default `20`, max `100`). Response `meta`:
  ```json
  { "meta": { "page": 1, "pageSize": 20, "total": 57, "totalPages": 3 } }
  ```
- **Filtering:** resource-specific query params, e.g. `?status=upcoming` (trips), `?country=Japan&region=Asia` (cities), `?category=food&maxCost=50` (activities). Multiple filters combine with AND.
- **Search:** `?search=<term>` performs a case-insensitive partial match on the resource's primary name field (trip name, city name, activity name).
- **Sorting:** `?sort=<field>:<asc|desc>`, e.g. `?sort=startDate:desc`. Default sort is documented per endpoint below.
- **Grouping** (used by the "Group by" control on several screens per `sitemap.md`): `?groupBy=<field>` (e.g. `status` for trips) — the server returns the same flat paginated list; grouping is applied client-side using the field's value. The API does not return pre-grouped/nested structures.

---

## 6. Endpoints

### Auth (`AuthController`) — all `Public`

#### `POST /api/v1/auth/signup`
Creates a new user account.
**Request:**
```json
{
  "email": "jane@example.com",
  "password": "S3curePass!",
  "username": "janedoe",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+1-555-0100",
  "city": "Austin",
  "country": "USA"
}
```
**Response `201`:**
```json
{
  "data": {
    "user": { "id": "u_123", "email": "jane@example.com", "username": "janedoe", "role": "user" },
    "token": "eyJhbGciOi..."
  }
}
```
Errors: `409 EMAIL_ALREADY_EXISTS`, `409 USERNAME_ALREADY_EXISTS`, `422 VALIDATION_ERROR`.

#### `POST /api/v1/auth/login`
**Request:** `{ "email": "jane@example.com", "password": "S3curePass!" }`
**Response `200`:**
```json
{ "data": { "user": { "id": "u_123", "email": "jane@example.com", "username": "janedoe", "role": "user" }, "token": "eyJhbGciOi..." } }
```
Errors: `401 AUTH_INVALID_CREDENTIALS`.

#### `POST /api/v1/auth/logout`
**Request:** none (token identifies the session). **Response `204`.**

#### `POST /api/v1/auth/forgot-password`
**Request:** `{ "email": "jane@example.com" }`
**Response `200`:** `{ "data": { "message": "If that email exists, a reset link was sent." } }` (deliberately non-revealing of whether the email exists)

#### `POST /api/v1/auth/reset-password`
**Request:** `{ "token": "reset_tok_abc", "newPassword": "NewS3cure!" }`
**Response `200`:** `{ "data": { "message": "Password updated." } }`
Errors: `400 BAD_REQUEST` (invalid/expired token → `AUTH_RESET_TOKEN_INVALID`).

---

### User (`UserController`) — all `Owner` (self only)

#### `GET /api/v1/users/me`
**Response `200`:**
```json
{
  "data": {
    "id": "u_123", "email": "jane@example.com", "username": "janedoe",
    "firstName": "Jane", "lastName": "Doe", "photoUrl": null,
    "city": "Austin", "country": "USA", "languagePreference": "en", "role": "user"
  }
}
```

#### `PUT /api/v1/users/me`
**Request (partial update allowed):** `{ "firstName": "Jane", "photoUrl": "https://...", "languagePreference": "es" }`
**Response `200`:** updated user object, same shape as `GET`.
Errors: `422 VALIDATION_ERROR`.

#### `DELETE /api/v1/users/me`
Soft-deletes the account (`deleted_at` set per `schema.md`). **Response `204`.**

#### `GET /api/v1/users/me/saved-destinations`
**Response `200`:**
```json
{ "data": [ { "id": "sd_1", "city": { "id": "c_10", "name": "Lisbon", "country": "Portugal" } } ] }
```

---

### Trip (`TripController`)

#### `GET /api/v1/trips` — `User` (returns only the caller's trips)
Query: `?status=upcoming&search=japan&sort=startDate:asc&page=1&pageSize=20`. Default sort: `startDate:asc`.
**Response `200`:**
```json
{
  "data": [
    { "id": "t_1", "name": "Japan Loop", "startDate": "2026-10-01", "endDate": "2026-10-14", "status": "upcoming", "coverPhotoUrl": null, "destinationCount": 3 }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 4, "totalPages": 1 }
}
```

#### `POST /api/v1/trips` — `User`
**Request:**
```json
{ "name": "Japan Loop", "description": "Tokyo, Kyoto, Osaka", "startDate": "2026-10-01", "endDate": "2026-10-14", "coverPhotoUrl": null }
```
**Response `201`:** full trip object (same shape as `GET /trips/:tripId` below).
Errors: `422 VALIDATION_ERROR` (e.g. `endDate` before `startDate`).

#### `GET /api/v1/trips/:tripId` — `Owner`
**Response `200`:**
```json
{
  "data": {
    "id": "t_1", "userId": "u_123", "name": "Japan Loop", "description": "Tokyo, Kyoto, Osaka",
    "coverPhotoUrl": null, "startDate": "2026-10-01", "endDate": "2026-10-14",
    "status": "upcoming", "totalBudget": 3000.00, "isPublic": false,
    "createdAt": "2026-06-01T10:00:00Z", "updatedAt": "2026-06-01T10:00:00Z"
  }
}
```
Errors: `404 TRIP_NOT_FOUND`, `403 FORBIDDEN` (exists but not owned by caller).

#### `PUT /api/v1/trips/:tripId` — `Owner`
**Request:** any subset of `name`, `description`, `coverPhotoUrl`, `startDate`, `endDate`, `totalBudget`.
**Response `200`:** updated trip object.

#### `DELETE /api/v1/trips/:tripId` — `Owner`
**Response `204`.**

---

### Itinerary (`ItineraryController`) — all `Owner`

#### `GET /api/v1/trips/:tripId/stops`
**Response `200`:**
```json
{
  "data": [
    {
      "id": "st_1", "tripId": "t_1", "cityId": "c_10", "type": "city_stop",
      "title": "Tokyo", "description": "First stop", "startDate": "2026-10-01",
      "endDate": "2026-10-05", "budget": 800.00, "sortOrder": 0
    }
  ]
}
```

#### `POST /api/v1/trips/:tripId/stops`
**Request:**
```json
{ "cityId": "c_10", "type": "city_stop", "title": "Tokyo", "description": "First stop", "startDate": "2026-10-01", "endDate": "2026-10-05", "budget": 800.00 }
```
**Response `201`:** created stop object (same shape as list item above).

#### `PUT /api/v1/trips/:tripId/stops/:stopId`
**Request:** any subset of stop fields.
**Response `200`:** updated stop object.
Errors: `404 STOP_NOT_FOUND`.

#### `DELETE /api/v1/trips/:tripId/stops/:stopId`
**Response `204`.**

#### `PATCH /api/v1/trips/:tripId/stops/reorder`
**Request:**
```json
{ "orderedStopIds": ["st_2", "st_1", "st_3"] }
```
**Response `200`:** `{ "data": { "message": "Order updated" } }`

#### `GET /api/v1/trips/:tripId/itinerary`
Assembled day-wise view combining stops + their activities, used by the Itinerary View screen.
**Response `200`:**
```json
{
  "data": {
    "tripId": "t_1",
    "days": [
      {
        "date": "2026-10-01",
        "stopId": "st_1",
        "cityName": "Tokyo",
        "activities": [
          { "id": "tsa_1", "activityId": "a_5", "name": "Senso-ji Temple", "scheduledTime": "09:00", "cost": 0 }
        ],
        "dailyCost": 45.00
      }
    ]
  }
}
```

---

### Activity (`ActivityController`)

#### `GET /api/v1/activities` — `Public` (catalog browsing doesn't require auth, but is typically called from within the app)
Query: `?cityId=c_10&category=food&maxCost=50&search=ramen&sort=estimatedCost:asc&page=1&pageSize=20`.
**Response `200`:**
```json
{
  "data": [
    { "id": "a_5", "cityId": "c_10", "name": "Senso-ji Temple", "category": "sightseeing", "estimatedCost": 0, "estimatedDurationMinutes": 90, "imageUrl": null }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 12, "totalPages": 1 }
}
```

#### `GET /api/v1/trips/:tripId/stops/:stopId/activities` — `Owner`
**Response `200`:**
```json
{ "data": [ { "id": "tsa_1", "activityId": "a_5", "name": "Senso-ji Temple", "scheduledDate": "2026-10-01", "scheduledTime": "09:00", "cost": 0 } ] }
```

#### `POST /api/v1/trips/:tripId/stops/:stopId/activities` — `Owner`
**Request:** `{ "activityId": "a_5", "scheduledDate": "2026-10-01", "scheduledTime": "09:00", "costOverride": null }`
**Response `201`:** created join-record, same shape as list item above.
Errors: `409 ACTIVITY_ALREADY_ADDED` (unique constraint on stop+activity per `schema.md`).

#### `DELETE /api/v1/trips/:tripId/stops/:stopId/activities/:activityId` — `Owner`
**Response `204`.**

---

### City (`CityController`) — all `Public`

#### `GET /api/v1/cities`
Query: `?country=Japan&region=Asia&search=tok&sort=popularityScore:desc&page=1&pageSize=20`. Default sort: `popularityScore:desc`.
**Response `200`:**
```json
{
  "data": [ { "id": "c_10", "name": "Tokyo", "country": "Japan", "region": "Asia", "costIndex": 72.5, "popularityScore": 98, "imageUrl": null } ],
  "meta": { "page": 1, "pageSize": 20, "total": 40, "totalPages": 2 }
}
```

#### `GET /api/v1/cities/:cityId`
**Response `200`:** single city object, same shape as list item above.
Errors: `404 CITY_NOT_FOUND`.

---

### Budget (`BudgetController`) — `Owner`

#### `GET /api/v1/trips/:tripId/budget`
**Response `200`:**
```json
{
  "data": {
    "tripId": "t_1",
    "totalEstimatedCost": 2450.00,
    "totalBudget": 3000.00,
    "breakdown": { "transport": 900.00, "stay": 800.00, "activities": 500.00, "meals": 250.00 },
    "averageCostPerDay": 175.00,
    "overBudgetDays": ["2026-10-03"]
  }
}
```

---

### Calendar (`CalendarController`) — `Owner`

#### `GET /api/v1/trips/:tripId/calendar`
**Response `200`:**
```json
{
  "data": {
    "tripId": "t_1",
    "days": [
      { "date": "2026-10-01", "stopTitle": "Tokyo", "items": [ { "type": "activity", "id": "tsa_1", "title": "Senso-ji Temple", "time": "09:00" } ] }
    ]
  }
}
```

---

### Share (`ShareController`)

#### `POST /api/v1/trips/:tripId/share` — `Owner`
**Request:** none. **Response `201`:**
```json
{ "data": { "shareToken": "shr_9f8a2c", "shareUrl": "https://globetrotter.app/shared/shr_9f8a2c", "createdAt": "2026-08-22T10:00:00Z" } }
```

#### `GET /api/v1/shared/:shareToken` — `Public`
**Response `200`:**
```json
{
  "data": {
    "tripName": "Japan Loop", "startDate": "2026-10-01", "endDate": "2026-10-14",
    "ownerDisplayName": "Jane D.",
    "days": [ { "date": "2026-10-01", "stopTitle": "Tokyo", "activities": ["Senso-ji Temple"] } ]
  }
}
```
Errors: `404 SHARE_TOKEN_INVALID` (unknown or revoked token).

#### `POST /api/v1/shared/:shareToken/copy` — `User`
**Request:** none. **Response `201`:** newly created trip object (same shape as `POST /trips`), owned by the caller.
Errors: `404 SHARE_TOKEN_INVALID`.

---

### Community (`CommunityController`) — `Public`

#### `GET /api/v1/community/trips`
Query: `?search=japan&sort=createdAt:desc&page=1&pageSize=20`. Default sort: `createdAt:desc`. Returns only trips where `isPublic = true`.
**Response `200`:**
```json
{
  "data": [ { "id": "t_1", "name": "Japan Loop", "ownerDisplayName": "Jane D.", "startDate": "2026-10-01", "endDate": "2026-10-14", "shareToken": "shr_9f8a2c" } ],
  "meta": { "page": 1, "pageSize": 20, "total": 15, "totalPages": 1 }
}
```

---

### Admin (`AdminController`) — all `Admin`

#### `GET /api/v1/admin/users`
Query: `?search=jane&sort=createdAt:desc&page=1&pageSize=20`.
**Response `200`:**
```json
{ "data": [ { "id": "u_123", "email": "jane@example.com", "username": "janedoe", "role": "user", "tripCount": 4, "createdAt": "2026-01-10T00:00:00Z" } ], "meta": { "page": 1, "pageSize": 20, "total": 200, "totalPages": 10 } }
```

#### `GET /api/v1/admin/users/:userId/trips`
**Response `200`:** list of trips, same shape as `GET /trips` items, for the specified user.

#### `GET /api/v1/admin/analytics/popular-cities`
**Response `200`:** `{ "data": [ { "cityId": "c_10", "name": "Tokyo", "tripCount": 58 } ] }`

#### `GET /api/v1/admin/analytics/popular-activities`
**Response `200`:** `{ "data": [ { "activityId": "a_5", "name": "Senso-ji Temple", "addCount": 40 } ] }`

#### `GET /api/v1/admin/analytics/engagement`
**Response `200`:** `{ "data": { "totalUsers": 200, "totalTrips": 480, "activeUsersLast30Days": 76 } }`

---

## 7. Cross-Reference Notes

- Endpoint paths and controller ownership must always match `router.md` exactly — if one changes, update the other in the same commit.
- Field names in every payload above match `schema.md` column names converted to camelCase (`start_date` → `startDate`); no endpoint should introduce a field name that doesn't trace back to a schema column or an explicitly derived/aggregated value (e.g. `destinationCount`, `dailyCost`).
- `ItineraryController`'s `/itinerary` and `CalendarController`'s `/calendar` endpoints intentionally return similarly-shaped day-grouped data from the same underlying stops/activities — this contract keeps their `days[]` structures close in shape so the frontend can share formatting logic between Itinerary View and Calendar/Timeline screens.
