import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function UserDashboard() {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get('/user/profile');
        setProfileData(data.user);
      } catch (err) {
        setError(err.message || 'Could not load profile details');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '650px', margin: '0 auto' }}>
      <div className="dashboard-card" style={{ textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1rem' }}>
          <div>
            <h2>User Dashboard</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Welcome, {user?.fullName}!</p>
          </div>
          <button className="btn btn-secondary" onClick={logout} style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            Sign Out
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Retrieving account profile details...
          </div>
        ) : error ? (
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '12px', color: 'var(--error)' }}>
            Error: {error}
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '1.5rem' }}>
              You are successfully authenticated as a <strong>{profileData?.role}</strong>. Here are your account database parameters:
            </p>

            <table className="db-details-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Database ID</td>
                  <td style={{ fontFamily: 'monospace' }}>{profileData?.id}</td>
                </tr>
                <tr>
                  <td>Full Name</td>
                  <td>{profileData?.fullName}</td>
                </tr>
                <tr>
                  <td>Email Address</td>
                  <td>{profileData?.email}</td>
                </tr>
                <tr>
                  <td>Assigned Role</td>
                  <td style={{ fontWeight: '600' }}>{profileData?.role}</td>
                </tr>
                <tr>
                  <td>Registered On</td>
                  <td>{new Date(profileData?.createdAt).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(28, 28, 28, 0.02)', border: '1px solid var(--border-passive)', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Authorized Access</h3>
              <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-muted)' }}>
                You have standard USER authorization levels. Admin tools and backend panels are restricted.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
