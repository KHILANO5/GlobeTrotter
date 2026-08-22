import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <>
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 35
          }}
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <NavLink to="/dashboard" className="sidebar-brand" onClick={onClose}>
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
          <div>
            <div className="brand-title">GlobeTrotter</div>
            <div className="brand-subtitle">Travel Planner</div>
          </div>
        </NavLink>

        {/* Navigation */}
        <div className="sidebar-nav">
          {/* Main Dashboard */}
          <NavLink 
            to="/dashboard" 
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </span>
              <span>Dashboard</span>
            </div>
          </NavLink>

          {/* The 4 Core Pages (Green in diagram) */}
          <NavLink 
            to="/trips/new" 
            className={({ isActive }) => `nav-item green-module ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </span>
              <span>Create Trip</span>
            </div>
          </NavLink>

          <NavLink 
            to="/trips" 
            end
            className={({ isActive }) => `nav-item green-module ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span>
              <span>My Trips</span>
            </div>
          </NavLink>

          <NavLink 
            to="/community" 
            className={({ isActive }) => `nav-item green-module ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </span>
              <span>Community</span>
            </div>
          </NavLink>

          <NavLink 
            to="/profile" 
            className={({ isActive }) => `nav-item green-module ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <span>Profile</span>
            </div>
          </NavLink>

          {/* Secondary Pages */}
          <div style={{ margin: '0.75rem 0', borderTop: '1px solid var(--border-passive)' }}></div>

          <NavLink 
            to="/trips/builder" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon>
                  <line x1="3" y1="22" x2="21" y2="22"></line>
                </svg>
              </span>
              <span>Itinerary Builder</span>
            </div>
          </NavLink>

          <NavLink 
            to="/trips/itinerary" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
              <span>Itinerary View</span>
            </div>
          </NavLink>

          {/* Admin section only if user is admin */}
          {isAdmin && (
            <>
              <div style={{ margin: '0.75rem 0', borderTop: '1px solid var(--border-passive)' }}></div>
              <NavLink 
                to="/admin" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <div className="nav-item-left">
                  <span className="nav-item-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </span>
                  <span>Admin Dashboard</span>
                </div>
                <span className="nav-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>Admin</span>
              </NavLink>
            </>
          )}
        </div>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="user-snippet">
            <div className="user-avatar">
              {user?.firstName?.[0] || user?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.fullName || user?.firstName || 'Traveler'}</div>
              <div className="user-role-badge">{user?.role || 'User'}</div>
            </div>
            <button 
              onClick={handleLogout} 
              className="btn btn-ghost btn-sm"
              title="Sign Out"
              style={{ padding: '6px 8px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
