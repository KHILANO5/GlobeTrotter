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
          <div className="brand-icon">GT</div>
          <div>
            <div className="brand-title">GlobeTrotter</div>
            <div className="brand-subtitle">Smart Travel Planner</div>
          </div>
        </NavLink>

        {/* Navigation */}
        <div className="sidebar-nav">
          {/* Main Hub */}
          <NavLink 
            to="/dashboard" 
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">🧭</span>
              <span>Dashboard Hub</span>
            </div>
            <span className="nav-badge" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>Hub</span>
          </NavLink>

          {/* Section: 4 Core Modules (Green in Diagram) */}
          <div className="nav-section-title">Core Modules (4 Main Pages)</div>

          <NavLink 
            to="/trips/new" 
            className={({ isActive }) => `nav-item green-module ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">✨</span>
              <span>Create Trip</span>
            </div>
            <span className="nav-badge green">Plan</span>
          </NavLink>

          <NavLink 
            to="/trips" 
            end
            className={({ isActive }) => `nav-item green-module ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">🗺️</span>
              <span>My Trips</span>
            </div>
            <span className="nav-badge green">List</span>
          </NavLink>

          <NavLink 
            to="/community" 
            className={({ isActive }) => `nav-item green-module ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">🌍</span>
              <span>Community</span>
            </div>
            <span className="nav-badge green">Explore</span>
          </NavLink>

          <NavLink 
            to="/profile" 
            className={({ isActive }) => `nav-item green-module ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">👤</span>
              <span>Profile</span>
            </div>
            <span className="nav-badge green">Account</span>
          </NavLink>

          {/* Section: Secondary Itinerary Screens */}
          <div className="nav-section-title">Itinerary Hub & Tools</div>

          <NavLink 
            to="/trips/builder" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">🔨</span>
              <span>Itinerary Builder</span>
            </div>
          </NavLink>

          <NavLink 
            to="/trips/itinerary" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon">📑</span>
              <span>Itinerary View</span>
            </div>
          </NavLink>

          {/* Section: Admin if authorized */}
          {isAdmin && (
            <>
              <div className="nav-section-title">Administration</div>
              <NavLink 
                to="/admin" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <div className="nav-item-left">
                  <span className="nav-item-icon">📊</span>
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
              🚪
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
