# GlobeTrotter 🌍✈️

**GlobeTrotter** is a comprehensive, full-stack travel planning platform built for modern explorers. Whether you're planning a weekend getaway, a multi-city backpacking adventure across Europe, or a complex family vacation, GlobeTrotter acts as your centralized travel hub. 

We built GlobeTrotter to solve the chaos of travel planning—replacing scattered spreadsheets, disorganized email threads, and endless notes apps with a single, visually stunning, and highly organized dashboard. 

With GlobeTrotter, users can architect their journeys day-by-day, budget their expenses down to the cent, upload beautiful memory-evoking cover photos, and ultimately share their perfected itineraries with a global community of travelers. Need inspiration? Browse the community feed, find a public trip that matches your vibe, and instantly clone it to your own dashboard to customize it further!

## ✨ Key Features & Capabilities

- **Interactive Itinerary Builder**: Construct multi-destination trips with an intuitive drag-and-drop interface. Add cities, travel legs, or lodging sections, and assign specific sightseeing activities, food tours, or excursions to each segment.
- **Smart Budget Tracking**: Define target budgets for your overall trip and individual sections. GlobeTrotter automatically tracks estimated costs for flights, hotels, and activities to ensure you never overspend.
- **Community Sharing & Cloning**: The world is your oyster. Share your curated travel itineraries with the public, or explore the community feed. Found a trip you love? Use the "Copy Trip" feature to seamlessly duplicate the entire itinerary—including stops and activities—to your own dashboard.
- **Robust User Authentication**: Secure login, registration, and email verification powered by JWT and bcrypt to keep your personal data and private trips completely secure.
- **Rich Media & Photo Uploads**: Personalize your profile and trips with dynamic cover photos seamlessly uploaded and served via ImageKit integration.
- **Memory Preservation (Read-Only Mode)**: Once a trip is marked as 'completed', the itinerary is automatically locked down into a beautiful read-only state to safely preserve your past travel memories without risk of accidental edits.

## 🛠️ Technology Stack

**Frontend**
- React 19
- Vite
- React Router DOM
- Vanilla CSS (Glassmorphism & modern UI/UX design)

**Backend**
- Node.js & Express.js
- PostgreSQL (Database)
- Drizzle ORM
- ImageKit (Media storage)
- Nodemailer (Email services)
- JWT (JSON Web Tokens for Auth)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running locally (or a cloud instance)
- ImageKit Account (for media uploads)

### 1. Clone the repository
```bash
git clone https://github.com/KHILANO5/GlobeTrotter.git
cd GlobeTrotter
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=8000
DATABASE_URL=postgresql://user:password@localhost:5432/globetrotter
JWT_SECRET=your_jwt_secret
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint
```

Push the database schema and seed initial data:
```bash
npm run db:push
npm run db:seed
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The application will be running at `http://localhost:5173`.

## 📁 Project Structure

```text
GlobeTrotter/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route controllers (Auth, Trips, Users, etc.)
│   │   ├── db/             # Drizzle ORM schema, config, and seeders
│   │   ├── routes/         # Express API routes
│   │   └── services/       # ImageKit, Email, and utility services
│   └── .env                
└── frontend/
    ├── src/
    │   ├── components/     # Reusable UI components & modals
    │   ├── context/        # React Context (AuthContext)
    │   ├── pages/          # Full page views (Dashboard, Builder, Profile, etc.)
    │   ├── services/       # Axios API wrapper (api.js)
    │   └── index.css       # Global design tokens and styling
    └── vite.config.js      
```

## 📝 License
This project is licensed under the MIT License.
