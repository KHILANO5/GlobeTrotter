import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Guards & Layouts
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AppLayout from './components/layout/AppLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';

// Core GlobeTrotter Pages (Hub & 4 Green Modules)
import DashboardPage from './pages/DashboardPage';
import CreateTripPage from './pages/CreateTripPage';
import MyTripsPage from './pages/MyTripsPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';

// Downstream Feature Shell Pages
import ItineraryBuilderPage from './pages/ItineraryBuilderPage';
import ItineraryViewPage from './pages/ItineraryViewPage';
import TripBudgetPage from './pages/TripBudgetPage';
import TripCalendarPage from './pages/TripCalendarPage';
import PublicItineraryPage from './pages/PublicItineraryPage';
import AdminPage from './pages/AdminPage';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ================================================================= */}
          {/* Public Authentication Pages                                       */}
          {/* ================================================================= */}
          <Route
            path="/login"
            element={
              <div className="auth-wrapper">
                <Login />
              </div>
            }
          />
          <Route
            path="/register"
            element={
              <div className="auth-wrapper">
                <Register />
              </div>
            }
          />
          <Route
            path="/verify-email"
            element={
              <div className="auth-wrapper">
                <VerifyEmail />
              </div>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <div className="auth-wrapper">
                <ForgotPassword />
              </div>
            }
          />

          {/* Public Shared Trip Itinerary (Accessible with or without auth) */}
          <Route
            path="/shared/:shareToken"
            element={
              <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
                <PublicItineraryPage />
              </div>
            }
          />
          <Route
            path="/shared"
            element={
              <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
                <PublicItineraryPage />
              </div>
            }
          />

          {/* ================================================================= */}
          {/* Protected GlobeTrotter Application (Sidebar + Header + Hub)      */}
          {/* ================================================================= */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* 1. Main Dashboard Hub */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* 2. Core 4 Green Modules */}
            <Route path="/trips/new" element={<CreateTripPage />} />
            <Route path="/trips" element={<MyTripsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* 3. Downstream Itinerary & Planning Screens */}
            <Route path="/trips/:tripId/builder" element={<ItineraryBuilderPage />} />
            <Route path="/trips/builder" element={<ItineraryBuilderPage />} />

            <Route path="/trips/:tripId/itinerary" element={<ItineraryViewPage />} />
            <Route path="/trips/itinerary" element={<ItineraryViewPage />} />

            <Route path="/trips/:tripId/budget" element={<TripBudgetPage />} />
            <Route path="/trips/budget" element={<TripBudgetPage />} />

            <Route path="/trips/:tripId/calendar" element={<TripCalendarPage />} />
            <Route path="/trips/calendar" element={<TripCalendarPage />} />

            {/* 4. Admin & Analytics (Admin Only) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
          </Route>

          {/* ================================================================= */}
          {/* Catch-all & Redirection                                           */}
          {/* ================================================================= */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
