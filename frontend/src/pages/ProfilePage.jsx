import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/users/me');
        if (res.data) {
          setProfile(res.data);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>User Profile & Settings</h2>
          <p className="text-muted text-sm">Account settings, travel statistics, and profile information</p>
        </div>
        <button onClick={logout} className="btn btn-secondary btn-sm">
          Sign Out
        </button>
      </div>

      <div className="shell-container" style={{ textAlign: 'left', padding: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading account details...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* User Avatar & Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-passive)' }}>
              <div 
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--primary-dark)', 
                  color: 'var(--text-on-dark)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '24px', 
                  fontWeight: '600'
                }}
              >
                {profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{profile?.fullName || user?.fullName || 'Traveler'}</h3>
                <p className="text-sm text-muted" style={{ margin: '0.25rem 0 0' }}>{profile?.email || user?.email}</p>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <span className="nav-badge" style={{ textTransform: 'uppercase' }}>{profile?.role || user?.role || 'user'}</span>
                  <span className="nav-badge" style={{ backgroundColor: 'rgba(13, 92, 70, 0.1)', color: 'var(--accent-green)' }}>Verified</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-passive)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>{profile?.stats?.totalTrips || 0}</div>
                <div className="text-xs text-muted">Planned Trips</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-passive)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>{profile?.stats?.savedDestinationsCount || 0}</div>
                <div className="text-xs text-muted">Saved Destinations</div>
              </div>
            </div>

            {/* Details Table */}
            <div>
              <h4 style={{ marginBottom: '0.75rem' }}>Account Information</h4>
              <table className="db-details-table">
                <tbody>
                  <tr>
                    <td style={{ width: '180px', color: 'var(--text-muted)' }}>Account ID</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{profile?.id || user?.id}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Username</td>
                    <td>{profile?.username || '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Language Preference</td>
                    <td style={{ textTransform: 'uppercase' }}>{profile?.languagePreference || 'en'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Member Since</td>
                    <td>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
