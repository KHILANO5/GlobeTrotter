import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();

  // Get active title based on path
  const getPageTitle = (path) => {
    if (path === '/dashboard') return 'Dashboard Hub';
    if (path.startsWith('/trips/new')) return 'Create Trip';
    if (path.startsWith('/trips/builder')) return 'Itinerary Builder';
    if (path.startsWith('/trips/itinerary')) return 'Itinerary View';
    if (path.startsWith('/trips/budget')) return 'Trip Budget & Breakdown';
    if (path.startsWith('/trips/calendar')) return 'Trip Calendar & Timeline';
    if (path === '/trips') return 'My Trips';
    if (path.startsWith('/community')) return 'Community Travel Plans';
    if (path.startsWith('/profile')) return 'Profile & Settings';
    if (path.startsWith('/admin')) return 'Admin & Analytics Dashboard';
    if (path.startsWith('/shared')) return 'Public Itinerary';
    return 'GlobeTrotter';
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onMenuClick}
          className="btn btn-ghost btn-sm"
          style={{ display: 'inline-flex' }}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-charcoal)' }}>
            {getPageTitle(location.pathname)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <Link to="/trips/new" className="btn btn-primary btn-sm">
          <span>+</span>
          <span>Plan a Trip</span>
        </Link>
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div 
            style={{ 
              width: '34px', 
              height: '34px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-passive)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-charcoal)'
            }}
          >
            {user?.firstName?.[0] || user?.fullName?.[0] || 'U'}
          </div>
        </Link>
      </div>
    </header>
  );
}
