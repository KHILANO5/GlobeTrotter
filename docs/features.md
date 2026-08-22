# GlobeTrotter — Features & Screens Specification

*Compiled from the problem statement PDF and the Excalidraw mockup (12 screens).*

## 1. Vision

GlobeTrotter aims to be a personalized, intelligent, collaborative travel-planning platform that lets users dream, design, and organize multi-city trips end-to-end — exploring destinations, visualizing itineraries, managing budgets, and sharing plans within a community.

## 2. Mission

Build a user-centric, responsive app, backed by a well-designed relational database, that lets travelers:
- Add and manage travel stops and durations
- Explore cities and activities of interest
- Estimate trip budgets automatically
- Visualize timelines and plans
- Share trip plans with others

## 3. Core Capabilities (from Problem Statement)

- Create customized multi-city itineraries
- Assign travel dates, activities, and budgets
- Discover activities and destinations through search
- Receive cost breakdowns and visual calendars
- Share plans publicly or with friends
- Store/retrieve complex relational data (users, itineraries, stops, activities, expenses)
- Dynamic UI that adapts to each user's trip flow

---

## 4. Screens & Features

### 1. Login / Signup Screen
**Purpose:** Authenticate users to manage personal travel plans.
- Email & password fields
- Login button
- Signup link
- "Forgot Password" flow
- Basic input validation

### 2. Registration Screen
*(from mockup — detailed signup flow)*
- Username, Password fields
- Profile photo upload
- First name, Last name
- Email address, Phone number
- City, Country
- Additional information field

### 3. Dashboard / Home Screen (Main Landing Page)
**Purpose:** Navigate to trips and explore inspiration.
- Welcome message / banner image
- List of recent / previous trips
- "Plan a Trip" button
- Top regional selections / recommended destinations
- Budget highlights
- Search bar, Group by / Filter / Sort by controls

### 4. Create Trip Screen
**Purpose:** Begin the process of creating a personalized travel plan.
- Trip name
- Start date & end date
- Trip description
- Cover photo upload (optional)
- Select a place
- Suggestions for places to visit / activities to perform
- "Add another section" option
- Save button

### 5. My Trips (Trip List) Screen
**Purpose:** Easily access and manage existing or upcoming trips.
- Trip cards: name, date range, destination count
- Edit / view / delete actions
- Status grouping: Ongoing, Upcoming, Completed
- Short overview per trip
- Search / Group by / Filter / Sort by controls

### 6. Itinerary Builder Screen (Build Itinerary)
**Purpose:** Construct the full day-wise trip plan interactively.
- "Add Stop" button — select city and travel dates
- Assign activities to each stop
- Reorder cities
- Section-based structure (e.g., Section 1, 2, 3 — travel, hotel, activity)
- Per-section: description, date range, budget

### 7. Itinerary View Screen (with Budget section)
**Purpose:** Review the full plan in a structured format.
- Day-wise layout (Day 1, Day 2, ...)
- City headers, activity blocks with time and cost
- Physical activity & expense tracking per day
- View mode toggle (calendar / list)

### 8. City Search
**Purpose:** Discover and include relevant cities in the itinerary.
- Search bar
- List of cities with meta info (country, cost index, popularity)
- "Add to Trip" button
- Filter by country / region

### 9. Activity Search
**Purpose:** Enrich trips with experiences (sightseeing, food tours, adventure, etc.).
- Filters: type, cost, duration
- Add / remove buttons
- Quick view of description and images
- Results list with option details
- Group by / Filter / Sort by / Search bar

### 10. Trip Budget & Cost Breakdown Screen
**Purpose:** Help travelers stay informed and within budget.
- Cost breakdown by transport, stay, activities, meals
- Pie / bar charts
- Average cost per day
- Alerts for over-budget days

### 11. Trip Calendar / Timeline Screen
**Purpose:** Visualize the journey and daily plan flow.
- Calendar component
- Expandable day views
- Drag-to-reorder activities
- Quick editing options

### 12. Shared / Public Itinerary View Screen
**Purpose:** Allow others to view, get inspired by, or copy a trip.
- Public URL
- Itinerary summary
- "Copy Trip" button
- Social media sharing
- Read-only view

### 13. Community Tab Screen
*(from mockup)*
**Purpose:** Let users share experiences about trips or activities.
- Community feed of shared trip/activity experiences
- Search, Group by, Filter, Sort by controls

### 14. User Profile / Settings Screen
**Purpose:** Enable users to control their data, preferences, and privacy.
- Editable fields: name, photo, email
- Language preference
- Delete account option
- Saved destinations list
- Preplanned trips & previous trips display

### 15. Admin / Analytics Dashboard *(Optional)*
**Purpose:** Monitor app adoption, popular cities, and user behavior.
- Manage Users — view all trips made by a user, admin actions
- Popular Cities — based on current user trends
- Popular Activities — based on current user trend data
- User Trends & Analytics — cross-cutting usage analysis
- Tables and charts of trips created, engagement stats

---

## 5. Screen Flow Summary

| # | Screen | Type |
|---|--------|------|
| 1 | Login / Signup | Auth |
| 2 | Registration | Auth |
| 3 | Dashboard / Home | Core |
| 4 | Create Trip | Core |
| 5 | My Trips (List) | Core |
| 6 | Itinerary Builder | Core |
| 7 | Itinerary View (Budget) | Core |
| 8 | City Search | Discovery |
| 9 | Activity Search | Discovery |
| 10 | Trip Budget & Cost Breakdown | Analytics |
| 11 | Trip Calendar / Timeline | Visualization |
| 12 | Shared / Public Itinerary View | Sharing |
| 13 | Community Tab | Social |
| 14 | User Profile / Settings | Account |
| 15 | Admin / Analytics Dashboard | Admin (Optional) |

---

## 6. Key Technical Notes

- Requires a **relational database** to model users, trips, stops (cities), activities, and expenses with proper foreign-key relationships.
- UI must be **responsive** (desktop & mobile).
- Search, Group-by, Filter, and Sort-by controls are repeated patterns across most list-based screens (Dashboard, My Trips, City/Activity Search, Community, Calendar) — good candidates for a shared reusable component.
- Budget/cost logic needs to aggregate at the section, day, and trip level, with over-budget alerting.
- Public sharing requires a distinct read-only rendering path plus a "Copy Trip" duplication feature.
