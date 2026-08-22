# Auth Module (Node, Express, React, PostgreSQL on Render)

This is a full-stack Web Application featuring an Express backend connected to a PostgreSQL database on Render, and a Vite-React frontend.

## Project Structure
- `backend/` - Node.js + Express API server, database connection.
- `frontend/` - React frontend with Vite and Vanilla CSS.

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm (v7+ recommended)

### Installation
1. Install root dependencies and setup directories:
   ```bash
   npm install
   ```
2. Install backend and frontend dependencies:
   ```bash
   npm run install:all
   ```

### Database Connection
Configure backend environment variables in `backend/.env`. A template is available in `backend/.env.example`.

### Running the Application
To run both backend and frontend development servers concurrently:
```bash
npm run dev
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:5000](http://localhost:5000)
