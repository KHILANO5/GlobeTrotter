# GlobeTrotter — Website Page Hierarchy & Navigation Map

## 1. Page Hierarchy (Tree)

```
GlobeTrotter
├── PUBLIC (no login required)
│   ├── Login Screen
│   ├── Registration Screen
│   └── Shared / Public Itinerary View   (accessed via shared link only)
│
└── AUTHENTICATED APP (requires login)
    ├── Dashboard / Home Screen                 ← default landing page after login
    │   ├── Create Trip Screen
    │   │   └── Itinerary Builder Screen
    │   │       ├── City Search
    │   │       ├── Activity Search
    │   │       └── Itinerary View Screen (with Budget section)
    │   │           ├── Trip Budget & Cost Breakdown Screen
    │   │           ├── Trip Calendar / Timeline Screen
    │   │           └── Shared / Public Itinerary View (generated from here)
    │   │
    │   ├── My Trips (Trip List) Screen
    │   │   └── Itinerary View Screen              (opens an existing trip)
    │   │
    │   ├── Community Tab Screen
    │   │   └── Shared / Public Itinerary View      (view another user's trip)
    │   │
    │   └── User Profile / Settings Screen
    │       └── My Trips (Trip List) Screen         (via "Preplanned/Previous Trips")
    │
    └── Admin / Analytics Dashboard (Optional, admin-only, separate access path)
```

## 2. Page-by-Page Connections

### Login Screen
- **Enters from:** App entry point / logged-out state, "Login" link from Registration
- **Goes to:**
  - → **Dashboard / Home** on successful login
  - → **Registration Screen** via "Signup" link
  - → Password-reset flow via "Forgot Password"

### Registration Screen
- **Enters from:** Login Screen ("Signup" link)
- **Goes to:**
  - → **Login Screen** after successful registration (or directly to Dashboard, depending on flow chosen)
  - → back to **Login Screen** via a "Already have an account?" link

### Dashboard / Home Screen
The central hub — nearly every other authenticated screen is reachable from here via a persistent nav bar.
- **Enters from:** Login (post-auth redirect), or clicking the app logo/home icon from any authenticated screen
- **Goes to:**
  - → **Create Trip Screen** via "Plan a Trip" button
  - → **My Trips Screen** via a trips list / "View all trips" link
  - → **Community Tab** via nav
  - → **User Profile / Settings** via profile icon
  - → Individual trip's **Itinerary View** by clicking a "previous trip" card
  - → **Admin Dashboard** (only visible/accessible if the logged-in user is an admin)

### Create Trip Screen
- **Enters from:** Dashboard ("Plan a Trip")
- **Goes to:**
  - → **Itinerary Builder Screen** once trip name/dates/description are saved
  - → back to **Dashboard** if cancelled

### Itinerary Builder Screen
- **Enters from:** Create Trip Screen (new trip), or My Trips / Itinerary View ("Edit itinerary" on an existing trip)
- **Goes to:**
  - → **City Search** (modal or sub-page) when the user clicks "Add Stop"
  - → **Activity Search** (modal or sub-page) when assigning activities to a stop
  - → **Itinerary View Screen** once the itinerary is built/saved
  - ↔ Cities/activities selected in City Search / Activity Search are added back into the Builder (round-trip navigation)

### City Search
- **Enters from:** Itinerary Builder ("Add Stop")
- **Goes to:**
  - → back to **Itinerary Builder** after "Add to Trip" is clicked, with the new stop populated

### Activity Search
- **Enters from:** Itinerary Builder (assigning activities to a stop)
- **Goes to:**
  - → back to **Itinerary Builder** after activities are added/removed

### Itinerary View Screen (with Budget section)
- **Enters from:** Itinerary Builder (after saving), My Trips (clicking a trip card), Dashboard (clicking a recent trip)
- **Goes to:**
  - → **Trip Budget & Cost Breakdown Screen** via a "View budget" action or embedded summary
  - → **Trip Calendar / Timeline Screen** via a view-mode toggle (list ↔ calendar)
  - → **Itinerary Builder Screen** via an "Edit" action
  - → **Shared / Public Itinerary View** via a "Share" action (generates a public link)

### Trip Budget & Cost Breakdown Screen
- **Enters from:** Itinerary View Screen
- **Goes to:**
  - → back to **Itinerary View Screen**

### Trip Calendar / Timeline Screen
- **Enters from:** Itinerary View Screen (view toggle)
- **Goes to:**
  - → back to **Itinerary View Screen** (list mode)
  - → **Itinerary Builder** for quick-editing an activity (drag-to-reorder / quick edit)

### My Trips (Trip List) Screen
- **Enters from:** Dashboard, User Profile ("Preplanned Trips" / "Previous Trips")
- **Goes to:**
  - → **Itinerary View Screen** by clicking a trip card ("view" action)
  - → **Itinerary Builder Screen** via "edit" action on a trip card
  - → Trip deletion (stays on same screen, list updates)

### Community Tab Screen
- **Enters from:** Dashboard nav
- **Goes to:**
  - → **Shared / Public Itinerary View** when a community post/trip is opened
  - → (optionally) **Create Trip Screen** via a "Copy this trip" action, pre-filled with the copied itinerary

### Shared / Public Itinerary View Screen
- **Enters from:** Itinerary View Screen ("Share"), Community Tab, or a direct public URL (no login required)
- **Goes to:**
  - → **Create Trip Screen** (pre-filled) via "Copy Trip" — logged-in users only
  - → **Login Screen** if a logged-out user tries to copy the trip
  - → back to **Community Tab** or **Dashboard** depending on entry point

### User Profile / Settings Screen
- **Enters from:** Dashboard (profile icon), accessible from any authenticated screen via persistent nav
- **Goes to:**
  - → **My Trips Screen** via "Preplanned Trips" / "Previous Trips" links
  - → Login Screen on "Delete account" or logout

### Admin / Analytics Dashboard (Optional)
- **Enters from:** Dashboard (admin users only) or a dedicated admin route
- **Goes to:**
  - → User detail / trip records (drill-down within "Manage Users")
  - → Standalone — not part of the regular user navigation flow

## 3. Navigation Patterns Summary

- **Persistent top-level nav** (present on most authenticated screens): Dashboard, My Trips, Community, Profile — plus Search/Filter/Sort/Group-by controls repeated on list-heavy screens (Dashboard, My Trips, City/Activity Search, Community, Calendar).
- **Trip creation is a linear funnel:** Create Trip → Itinerary Builder → (City/Activity Search loops) → Itinerary View → Budget/Calendar/Share.
- **Itinerary View is a hub itself:** it fans out to Budget, Calendar, Share, and back to the Builder for edits — most trip-related screens loop back through it.
- **Public vs. private boundary:** only Login, Registration, and Shared/Public Itinerary View are reachable without authentication; the Public Itinerary View is the single bridge between public visitors and the authenticated app (via "Copy Trip" prompting login).
- **Admin Dashboard is isolated:** it does not connect back into the standard user flow except via a shared top-level entry point restricted to admins.
