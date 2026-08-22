import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onMenuClick, sidebarOpen }) {
  const { user } = useAuth();
  const location = useLocation();

  // Get active title based on path
  const getPageTitle = (path) => {
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/trips/new')) return 'Create Trip';
    if (path.startsWith('/trips/builder')) return 'Itinerary Builder';
    if (path.startsWith('/trips/itinerary')) return 'Itinerary View';
    if (path.startsWith('/trips/budget')) return 'Trip Budget & Breakdown';
    if (path.startsWith('/trips/calendar')) return 'Trip Calendar & Timeline';
    if (path === '/trips') return 'My Trips';
    if (path.startsWith('/community')) return 'Community';
    if (path.startsWith('/profile')) return 'Profile';
    if (path.startsWith('/admin')) return 'Admin Dashboard';
    if (path.startsWith('/shared')) return 'Public Itinerary';
    return 'GlobeTrotter';
  };

  const userInitial = user?.firstName?.[0] || user?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
        <button
          onClick={onMenuClick}
          className="header-toggle-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            flexShrink: 0,
            cursor: 'pointer',
            border: '1px solid var(--border-passive)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-charcoal)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
          }}
          title={sidebarOpen ? "Close side panel" : "Open side panel"}
          aria-label="Toggle side panel"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-charcoal)', whiteSpace: 'nowrap' }}>
          {getPageTitle(location.pathname)}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <Link 
          to="/profile" 
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} 
          title="Profile & Settings"
        >
          <div 
            style={{ 
              width: '36px', 
              height: '36px', 
              minWidth: '36px',
              minHeight: '36px',
              maxWidth: '36px',
              maxHeight: '36px',
              flexShrink: 0,
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-dark)', 
              color: 'var(--text-on-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: 'var(--inset-shadow-dark)'
            }}
          >
            {userInitial}
          </div>
        </Link>
      </div>
    </header>
  );
}
