# GlobeTrotter — Frontend Rules

## 1. Framework & Version

**The source PDF and Excalidraw mockup do not specify a frontend framework** — this is a default choice, not a stated constraint. Flag for team confirmation before locking in.

**Proposed default:** React 18 + Vite + TypeScript, React Router v6 for routing.

**Why this default:**
- Matches the route structure already defined in `router.md` (nested, resource-based paths map cleanly to React Router's nested routes).
- Fast dev/build cycle (Vite) suits a hackathon timeline.
- TypeScript catches shape mismatches against the trip/stop/activity/budget data models early, which matters given the relational data complexity called out in the PDF.
- Large ecosystem of chart libraries (for Trip Budget pie/bar charts) and calendar components (for Trip Calendar/Timeline) — both explicitly required screens.

If the team prefers Next.js, Vue, or another stack, everything below (folder structure, component rules, state rules) should be re-mapped but the same *principles* apply.

## 2. Folder / File Structure

Feature-based structure, not type-based — grouping by domain (trip, itinerary, budget, auth) rather than by file type (all components together, all hooks together) keeps each screen's code colocated.

```
src/
├── app/                      # App shell: routing, providers, layout
│   ├── routes.tsx
│   └── App.tsx
├── features/
│   ├── auth/                 # Login, Signup screens
│   │   ├── components/
│   │   ├── api/
│   │   ├── hooks/
│   │   └── types.ts
│   ├── dashboard/
│   ├── trips/                # Create Trip, My Trips
│   ├── itinerary/            # Builder, Itinerary View
│   ├── city-search/
│   ├── activity-search/
│   ├── budget/
│   ├── calendar/
│   ├── sharing/              # Shared/Public Itinerary View
│   ├── community/
│   ├── profile/
│   └── admin/
├── components/                # Shared, cross-feature UI (Button, Card, SearchBar, GroupByFilterSort)
├── hooks/                     # Shared hooks not tied to one feature (useDebounce, useAuth)
├── lib/                       # API client setup, utilities, formatters
├── store/                     # Global state (see Section 4)
├── styles/                    # Design tokens, global styles
└── types/                     # Shared/global TypeScript types (mirrors apicontract.md shapes)
```

**Rule:** if a component, hook, or util is used by exactly one feature, it lives inside that feature's folder. It only moves to the shared top-level folder once a second feature needs it.

## 3. Component Naming & Organization

- **Naming:** PascalCase for component files and exports: `TripCard.tsx`, `ItineraryBuilder.tsx`. Hooks are camelCase prefixed `use`: `useTripBudget.ts`.
- **One component per file**, file name matches the component name exactly.
- **Organization pattern:** feature-based at the top level (Section 2), atomic-inspired *within* `components/`:
  - `components/ui/` — primitives with no domain knowledge (Button, Input, Modal, Badge)
  - `components/composite/` — combinations of primitives reused across features (SearchFilterSortBar, TripCard, ActivityChip)
- A component belongs in `components/` only if it has **zero knowledge of a specific feature's data shape**. The moment a component imports a `Trip` or `Itinerary` type, it belongs in that feature's folder instead.
- Screens/pages (route targets) are named `*Page.tsx` (e.g. `DashboardPage.tsx`, `ItineraryBuilderPage.tsx`) to distinguish them from reusable components at a glance.

## 4. State Management

**Approach:** React Query (TanStack Query) for all server/API state; React's built-in `useState`/`useReducer` + Context for local and cross-component UI state. No global state library (Redux/Zustand) unless a concrete cross-cutting need emerges — avoid it by default.

**Rules for local vs. global:**
- **Local state** (`useState` inside the component): form input values, toggle states (view mode: calendar/list), which modal is open, in-progress edits before save.
- **Server state** (React Query): anything that comes from an API endpoint in `router.md`/`apicontract.md` — trip lists, itinerary data, budget breakdown, city/activity search results. Never duplicate server data into local `useState`; read it from the query cache.
- **Global/cross-feature state** (React Context, sparingly): the authenticated user session (`useAuth`), and UI-wide concerns like the active toast/notification queue. If a piece of state is only shared between a parent and its direct children, pass it as props — don't reach for Context.
- **Rule of thumb:** if the data survives a page refresh only because the server has it, it's server state (React Query). If it only matters during the current interaction, it's local state.

## 5. Styling

**Approach:** Tailwind CSS utility classes for layout/spacing/typography, plus a small shared design-token file for brand colors, spacing scale, and border radius — avoid hand-rolled CSS files per component except for rare complex animations.

**Consistency rules:**
- All colors, spacing, and font sizes come from the Tailwind config's theme extension — no arbitrary magic-number values (`px-[13px]`) except as a documented one-off exception.
- Shared visual patterns (card shadow/radius, form field styling, button variants) live in `components/ui/` — never re-implement a button's Tailwind class string inline in a feature component.
- The `GroupByFilterSort` bar used across Dashboard, My Trips, City/Activity Search, Community, and Calendar (per `sitemap.md`) is a **single shared composite component** — this pattern must not be re-built per screen.
- Responsive utility prefixes (`sm:`, `md:`, `lg:`) are required on any layout component; a component that only works at one breakpoint fails review (see Section 7).

## 6. Data Fetching

**Where API calls live:** every feature's `api/` subfolder holds its query/mutation functions, one file per controller from `router.md` (e.g. `features/trips/api/tripController.ts` wraps calls to `TripController`'s endpoints). Components never call `fetch`/`axios` directly — they call a React Query hook that wraps the feature's `api/` function.

**Pattern:**
```
features/trips/api/tripApi.ts       → raw fetch functions (getTrips, createTrip, ...)
features/trips/hooks/useTrips.ts    → useQuery/useMutation wrapping tripApi
features/trips/components/TripList.tsx → calls useTrips(), never imports tripApi directly
```

**Error & loading state convention:**
- Every data-fetching hook returns and the consuming component must handle three states explicitly: `isLoading`, `isError`, and the success data — no silent fallthrough that renders nothing or stale data.
- Loading state renders a skeleton matching the final layout's shape (not a generic spinner) for list-heavy screens (My Trips, City/Activity Search, Community).
- Error state renders an inline error message with a retry action — never a blank screen or unhandled console error.
- Mutations (create/update/delete trip, add stop, etc.) show an optimistic or pending UI state and surface failures via the shared toast/notification system, not a blocking `alert()`.

## 7. Form Handling & Validation

- Use **React Hook Form** for all forms (Login, Signup, Create Trip, Itinerary Builder's stop/activity forms, Profile edit).
- Validation schemas defined with **Zod**, colocated with the form in the feature folder (`features/auth/schemas/loginSchema.ts`), and reused for both client-side validation and to type the form's submit payload.
- **Rule:** validation rules are never duplicated by hand between the frontend schema and the backend contract — the Zod schema's shape should match the request body documented in `apicontract.md` for that endpoint.
- Every required field shows an inline error message on blur/submit, not just a disabled submit button with no explanation.
- Date-range fields (trip start/end, stop dates) validate that end ≥ start at the schema level, not just visually.

## 8. Accessibility & Responsiveness Baseline

- All interactive elements (buttons, links, form fields) are real semantic HTML elements or carry the correct ARIA role — no `<div onClick>` standing in for a button.
- Every image (city photos, activity images, cover photos) requires `alt` text; decorative images use `alt=""`.
- Color is never the only signal for state (e.g. over-budget alerts need an icon/text label, not just a red background).
- All screens must be usable via keyboard alone (tab order, focus states visible) — required minimum, not an enhancement.
- Responsive baseline: every screen must render correctly at three breakpoints — mobile (~375px), tablet (~768px), desktop (~1280px). Calendar/Timeline and Itinerary Builder (the most layout-dense screens) get explicit mobile layouts, not just a horizontally-scrolled desktop layout.
- Forms and modals trap focus appropriately and are dismissible via `Escape`.

## 9. Do's and Don'ts for Agents Writing Frontend Code

**Do:**
- Put new components in the correct feature folder per Section 2 before writing any code.
- Use the existing shared `GroupByFilterSort`, `TripCard`, and form primitives instead of creating near-duplicates.
- Wrap all API calls through React Query hooks in the feature's `api/`/`hooks/` files.
- Reference `router.md` for the exact endpoint path/verb before wiring up a new API call.
- Handle loading/error/empty states explicitly for every data-fetching component.
- Match Zod validation schemas to the request shape in `apicontract.md`.
- Write components mobile-first, then layer in `md:`/`lg:` overrides.

**Don't:**
- Don't introduce a new global state library without a documented cross-cutting reason.
- Don't call `fetch`/`axios` directly inside a component.
- Don't hardcode colors, spacing, or font sizes outside the Tailwind theme config.
- Don't duplicate server data into local `useState` "for convenience."
- Don't build a new search/filter/sort UI per screen — extend the shared component instead.
- Don't ship a form without validation, or a validation error without a visible message.
- Don't use `<div>`/`<span>` with `onClick` where a native interactive element (`button`, `a`) would do.
- Don't leave a fetched list/screen with no explicit loading or error UI.
