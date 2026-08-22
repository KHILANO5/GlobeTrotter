import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function CommunityPage() {
  const [communityTrips, setCommunityTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunityTrips = async () => {
      try {
        setLoading(true);
        const res = await api.get('/community/trips');
        if (res.data) {
          setCommunityTrips(res.data);
        }
      } catch (err) {
        console.error('Error fetching community trips:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityTrips();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <span className="shell-badge green">Green Module 3</span>
          <h2>Community Tab</h2>
          <p className="text-muted text-sm">Shared experiences — Browse and copy public itineraries</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading community feed...
        </div>
      ) : communityTrips.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {communityTrips.map(trip => (
            <div key={trip.id} className="module-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div className="module-card-title">{trip.name}</div>
                  <span className="nav-badge" style={{ backgroundColor: 'rgba(13, 92, 70, 0.1)', color: 'var(--accent-green)' }}>Public</span>
                </div>
                <p className="text-xs text-muted" style={{ marginBottom: '0.75rem' }}>
                  By {trip.ownerDisplayName} • {new Date(trip.startDate).toLocaleDateString()}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-body)', marginBottom: '1rem' }}>
                  {trip.description || 'Public traveler journey shared with the GlobeTrotter community.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-passive)' }}>
                <Link to={`/shared/${trip.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  View Public Plan
                </Link>
                <Link to={`/trips/new`} className="btn btn-primary btn-sm">
                  Copy Trip
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="shell-container">
          <div style={{ fontSize: '36px', marginBottom: '0.5rem' }}>🌍</div>
          <h3>Welcome to the GlobeTrotter Community</h3>
          <p className="text-muted text-sm" style={{ maxWidth: '500px', margin: '0.5rem auto 1.5rem' }}>
            No public trips shared yet. When users publish their trips with public share links, they appear here for inspiration and copying.
          </p>
          <Link to="/trips/new" className="btn btn-primary">
            + Create & Share a Trip
          </Link>
        </div>
      )}

      {/* Team Note Box */}
      <div className="shell-box" style={{ marginTop: '3rem', textAlign: 'center' }}>
        <h4>💡 Module Info for Team</h4>
        <p className="text-sm text-muted" style={{ margin: '0.5rem 0 0' }}>
          This page represents the <strong>Community Tab (Shared experiences)</strong>. Opening a shared trip connects to <strong>Public Itinerary View</strong> (<code>/shared/:shareToken</code>).
        </p>
      </div>
    </div>
  );
}
