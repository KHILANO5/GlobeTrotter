import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function MyTripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
        const res = await api.get(`/trips${query}`);
        if (res.data) {
          setTrips(res.data);
        }
      } catch (err) {
        console.error('Error fetching trips:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [statusFilter]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <span className="shell-badge green">Green Module 2</span>
          <h2>My Trips</h2>
          <p className="text-muted text-sm">List of user trips — Click any trip to open its Itinerary View</p>
        </div>
        <Link to="/trips/new" className="btn btn-primary">
          + Plan a New Trip
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '0.5rem' }}>
        {['all', 'upcoming', 'ongoing', 'completed'].map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`btn btn-sm ${statusFilter === tab ? 'btn-primary' : 'btn-ghost'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {tab === 'all' ? 'All Trips' : tab}
          </button>
        ))}
      </div>

      {/* Trips Content */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your trips...
        </div>
      ) : trips.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {trips.map(trip => (
            <div key={trip.id} className="module-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div className="module-card-title">{trip.name}</div>
                  <span className="nav-badge" style={{ textTransform: 'capitalize' }}>{trip.status}</span>
                </div>
                <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                  📅 {new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}
                </p>
                {trip.description && (
                  <p className="text-sm" style={{ marginBottom: '1rem', color: 'var(--text-body)' }}>
                    {trip.description}
                  </p>
                )}
                {trip.totalBudget && (
                  <div className="text-sm" style={{ fontWeight: '600', color: 'var(--accent-green)' }}>
                    Budget: ${trip.totalBudget}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-passive)' }}>
                <Link to={`/trips/${trip.id}/itinerary`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                  View Itinerary
                </Link>
                <Link to={`/trips/${trip.id}/builder`} className="btn btn-secondary btn-sm">
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="shell-container">
          <div style={{ fontSize: '36px', marginBottom: '0.5rem' }}>🧳</div>
          <h3>No trips in this view</h3>
          <p className="text-muted text-sm" style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
            Ready to plan your next adventure? Create a trip and start organizing cities and activities.
          </p>
          <Link to="/trips/new" className="btn btn-primary">
            + Plan Your First Trip
          </Link>
        </div>
      )}

      {/* Team Note Box */}
      <div className="shell-box" style={{ marginTop: '3rem', textAlign: 'center' }}>
        <h4>💡 Module Info for Team</h4>
        <p className="text-sm text-muted" style={{ margin: '0.5rem 0 0' }}>
          This page represents <strong>My Trips (Trip List)</strong>. Clicking a trip card opens its <strong>Itinerary View</strong> (<code>/trips/:tripId/itinerary</code>) or <strong>Itinerary Builder</strong> (<code>/trips/:tripId/builder</code>).
        </p>
      </div>
    </div>
  );
}
