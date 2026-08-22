import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const data = await api.get('/admin/dashboard');
        setAdminData(data);
      } catch (err) {
        setError(err.message || 'Could not load admin stats');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '850px', margin: '0 auto' }}>
      <div className="dashboard-card" style={{ textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1rem' }}>
          <div>
            <h2>Admin Dashboard</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Welcome Back, Administrator {user?.fullName}!</p>
          </div>
          <button className="btn btn-secondary" onClick={logout} style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            Sign Out
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Retrieving administrator reports and statistics...
          </div>
        ) : error ? (
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '12px', color: 'var(--error)' }}>
            Access Denied / Error: {error}
          </div>
        ) : (
          <div>
            {/* Stat Row */}
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-value">{adminData?.stats?.totalUsers}</div>
                <div className="stat-label">Total Registered Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ fontSize: '24px', paddingBottom: '6px' }}>PostgreSQL</div>
                <div className="stat-label">Render Database Status</div>
              </div>
            </div>

            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem', marginTop: '2rem' }}>User Directory (PostgreSQL Users Table)</h3>
            <table className="db-details-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {adminData?.users?.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontFamily: 'monospace' }}>{u.id}</td>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.6rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        background: u.role === 'ADMIN' ? 'rgba(28, 28, 28, 0.08)' : 'rgba(28, 28, 28, 0.03)',
                        color: 'var(--text-charcoal)'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
