import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/dashboard');
        if (res.stats) {
          setStats(res.stats);
          setUsers(res.users || []);
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <span className="shell-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>Admin Only</span>
          <h2>Admin & Analytics Dashboard</h2>
          <p className="text-muted text-sm">Monitor app adoption, manage users, and view platform metrics</p>
        </div>
        <Link to="/dashboard" className="btn btn-ghost btn-sm">
          ← Back to Hub
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-passive)' }}>
          <div className="text-xs text-muted">Total Registered Users</div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-charcoal)' }}>{stats?.totalUsers || 0}</div>
        </div>
        <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-passive)' }}>
          <div className="text-xs text-muted">Total Seeded Cities</div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--accent-green)' }}>40</div>
        </div>
        <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-passive)' }}>
          <div className="text-xs text-muted">Total Activities Catalog</div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--accent-hub)' }}>100+</div>
        </div>
      </div>

      <div className="dashboard-card" style={{ textAlign: 'left' }}>
        <div className="card-header">
          <div className="card-title">Registered User Directory</div>
          <span className="nav-badge">Database Records</span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading user directory...
          </div>
        ) : (
          <table className="db-details-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: '600' }}>{u.fullName || u.username || 'User'}</td>
                  <td>{u.email}</td>
                  <td><span className="nav-badge" style={{ textTransform: 'uppercase' }}>{u.role}</span></td>
                  <td>
                    <span className={`status-dot ${u.isVerified ? 'active' : 'inactive'}`} style={{ display: 'inline-block', marginRight: '6px' }}></span>
                    {u.isVerified ? 'Yes' : 'No'}
                  </td>
                  <td className="text-xs text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Team Note Box */}
      <div className="shell-box" style={{ marginTop: '2.5rem', textAlign: 'center' }}>
        <h4>💡 Module Info for Team</h4>
        <p className="text-sm text-muted" style={{ margin: '0.5rem 0 0' }}>
          This page represents the optional <strong>Admin / Analytics Dashboard (<code>/admin</code>)</strong> for user trends, popular cities, and engagement metrics.
        </p>
      </div>
    </div>
  );
}
