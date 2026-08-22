# GlobeTrotter — Development Rules

## 1. Final Tech Stack

Neither the PDF nor the Excalidraw mockup specifies a tech stack or hosting target — everything below carries forward the defaults proposed in `frontendrules.md` and `backendrules.md`, now locked in as final for the build. Flag to the team before kickoff if a different stack is preferred.

| Layer | Choice | Justification |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript + React Router v6 | Fast dev loop for a hackathon, strong typing against the shapes in `apicontract.md`, and its component/routing model maps directly onto `router.md`'s route structure. |
| Frontend state/data | TanStack Query + React Hook Form + Zod | Removes hand-rolled loading/error/cache logic for API calls; Zod schemas double as form validation and request-shape contracts. |
| Styling | Tailwind CSS | Utility classes keep spacing/color consistent without hand-written CSS per component, fast to apply under time pressure. |
| Backend | Node.js 20 LTS + Express 4 + TypeScript | Thin, well-understood routing layer that maps 1:1 onto the controllers named in `router.md`; shares a language with the frontend, easing type reuse. |
| ORM / DB access | Prisma | Type-safe queries and migrations directly from `schema.md`'s `schema.prisma` source of truth. |
| Database | PostgreSQL | Relational database explicitly required by the PDF for modeling users/trips/stops/activities/expenses. |
| Auth | JWT (bearer token) | Simple, stateless, matches the mechanism defined in `apicontract.md`; no session-store infrastructure needed for a hackathon timeline. |
| Hosting — frontend | Vercel *(proposed default — not stated in source docs)* | Zero-config static/Vite hosting with preview deployments per PR, useful for demoing incremental progress. |
| Hosting — backend + DB | Render or Railway *(proposed default — not stated in source docs)* | One-click Node + managed PostgreSQL hosting, minimal DevOps overhead for a hackathon team. |

## 2. Repository / Project Structure

Monorepo, two top-level app folders sharing a root config layer:

```
globetrotter/
├── client/                 # Frontend (React + Vite) — see frontendrules.md for internal structure
├── server/                 # Backend (Express) — see backendrules.md for internal structure
├── docs/                   # This project's planning docs
│   ├── projectcontext.md
│   ├── features.md
│   ├── sitemap.md
│   ├── router.md
│   ├── frontendrules.md
│   ├── backendrules.md
│   ├── schema.md
│   ├── apicontract.md
│   └── developmentrules.md
├── .github/
│   └── workflows/           # CI: lint, typecheck, test on PR
├── .env.example              # Root-level example if any shared env vars exist
├── package.json               # Root workspace config (npm/yarn/pnpm workspaces)
└── README.md
```

**Rule:** `client/` and `server/` are independently runnable and independently deployable — no runtime import of one into the other. Shared types (e.g. mirrored request/response shapes from `apicontract.md`) are either duplicated deliberately in each app or extracted into a `packages/shared-types/` workspace package if duplication becomes painful — not decided upfront, revisit if it comes up.

## 3. Git Workflow

**Branch naming:** `<type>/<short-description>`, all lowercase, hyphenated.
- `feature/itinerary-builder`
- `fix/budget-rounding-error`
- `chore/setup-prisma`

Types: `feature`, `fix`, `chore`, `docs`, `refactor`.

**Commit messages:** Conventional Commits, kept short given hackathon pace:
```
<type>(<scope>): <short summary>
```
Examples: `feat(trips): add create trip endpoint`, `fix(budget): correct per-day average calc`, `docs(schema): add trip_shares table`.
Scope is the feature/controller name where applicable (matches folder names in `router.md`/`frontendrules.md`).

**PR expectations (hackathon-paced, not enterprise-paced):**
- One PR per feature-slice (a screen, an endpoint group, a schema change) — not one PR for the whole app, not one PR per file.
- PR description states what it does and links the relevant doc section (e.g. "implements `TripController` per `router.md` §Trip"), so reviewers aren't guessing at scope.
- At least one teammate review before merge where feasible; for genuinely blocking, time-critical fixes, self-merge is acceptable but must be flagged in the team channel — don't silently bypass review.
- CI (lint + typecheck + tests, see Section 4/7) must pass before merge — no merging on red CI, even under time pressure.
- Merge via squash-merge to keep `main` history readable given the volume of small hackathon commits.

## 4. Coding Standards

- **Linting:** ESLint, with the TypeScript-ESLint recommended ruleset, run in both `client/` and `server/`.
- **Formatting:** Prettier, single shared config at the repo root, applied via a pre-commit hook (e.g. Husky + lint-staged) so formatting is never a PR review topic.
- **Key rules (non-negotiable):**
  - No `any` in TypeScript without an inline comment explaining why — prefer `unknown` + narrowing.
  - No unused variables/imports (enforced by lint, not just convention).
  - Consistent import ordering (external packages, then internal absolute imports, then relative imports).
  - No commented-out dead code committed to `main` — delete it; git history retains it if needed.
  - Function and variable names in full words, no unexplained abbreviations (`tripId` not `tId`).
- Both `client/` and `server/` share the same Prettier config (indent size, quote style, trailing commas) so a file doesn't look different depending on which app it's in.

## 5. Environment Setup (New Teammate Onboarding)

1. **Clone and install:**
   ```
   git clone <repo-url>
   cd globetrotter
   npm install          # installs root + workspace deps
   ```
2. **Backend environment:**
   ```
   cd server
   cp .env.example .env
   # fill in DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN
   ```
3. **Database:**
   ```
   npx prisma migrate dev     # applies migrations from schema.md/schema.prisma
   npx prisma db seed         # loads seed data per schema.md §5
   ```
4. **Frontend environment:**
   ```
   cd ../client
   cp .env.example .env
   # fill in VITE_API_BASE_URL pointing at the local backend
   ```
5. **Run both apps (two terminals, or a root `npm run dev` if a workspace script is configured):**
   ```
   cd server && npm run dev     # starts Express on the configured PORT
   cd client && npm run dev     # starts Vite dev server
   ```
6. **Verify:** open the frontend dev server URL, confirm the Login screen loads and a signup round-trips to the backend/database without errors.
7. Consult `router.md` for the endpoint map and `apicontract.md` for exact payload shapes when wiring up a new screen or endpoint.

## 6. Definition of Done (per feature)

A feature (a screen + its backing endpoint(s)) is **not done** until all of the following are true:

- [ ] Matches the screen/endpoint spec in `features.md`, `router.md`, and `apicontract.md` — no undocumented deviation without updating those docs first.
- [ ] Frontend: loading, error, and empty states are all handled explicitly (per `frontendrules.md` §6) — not just the happy path.
- [ ] Backend: request validated against a Zod schema; errors return the standard envelope from `apicontract.md`.
- [ ] Auth/role enforcement matches the `Role` column specified for that endpoint in `apicontract.md`.
- [ ] Responsive at mobile/tablet/desktop breakpoints per `frontendrules.md` §8.
- [ ] Basic keyboard accessibility (tab order, focus visible) confirmed.
- [ ] At least the minimal test coverage specified in `backendrules.md` §7 (service unit test + one integration happy-path test) for any new backend logic.
- [ ] Lint, format, and typecheck pass with no errors.
- [ ] PR reviewed (or explicitly flagged if self-merged under time pressure) and merged via squash-merge.
- [ ] Manually verified end-to-end against a running local instance — clicked through the actual screen, not just unit tests passing.

## 7. Hackathon-Specific Constraints from the Source PDF

**The source PDF does not state any submission format, deployment requirement, demo constraints, or time limit.** These are standard hackathon concerns but were not part of the provided problem statement or Excalidraw mockup — the team should get this information from the hackathon organizers directly rather than assume any of the following:

- Submission format (GitHub repo link only? Live deployed URL required? Slide deck required?)
- Whether a live/hosted deployment is mandatory for judging, or a local demo is acceptable
- Time-boxed build window (the mockup file is named "GlobeTrotter - 8 hours," which suggests an 8-hour build window, but this is inferred from a filename, not stated as a requirement in the PDF itself — confirm before committing to a timeline)
- Team size limits, allowed tooling/AI-assistance rules, or judging rubric weightings (see also `projectcontext.md` §5, which notes no success criteria were stated)

**Action item:** treat the "8 hours" in the mockup filename as an unconfirmed signal, not a confirmed constraint, and verify actual time budget and submission requirements with the hackathon organizers before finalizing the build plan.
