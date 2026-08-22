import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function TripCalendarPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (tripId) {
      loadCalendar();
    } else {
      resolveDefaultTrip();
    }
  }, [tripId]);

  const resolveDefaultTrip = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trips?pageSize=1&sort=createdAt:desc');
      if (res.data && res.data.length > 0) {
        navigate(`/trips/${res.data[0].id}/calendar`, { replace: true });
      } else {
        setError('No trips found. Please plan a trip first.');
        setLoading(false);
      }
    } catch (err) {
      setError('Please select a trip to view calendar.');
      setLoading(false);
    }
  };

  const loadCalendar = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/trips/${tripId}/calendar`);
      if (res.data) {
        setCalendarData(res.data);
      }
    } catch (err) {
      console.error('Error loading calendar:', err);
      setError('Failed to load calendar view. The trip may not exist or has been deleted.');
    } finally {
      setLoading(false);
    }
  };

  const totalActivities = useMemo(() => {
    if (!calendarData?.days) return 0;
    return calendarData.days.reduce((sum, d) => sum + (d.items?.length || 0), 0);
  }, [calendarData]);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--primary-dark)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.75rem' }} />
        <div>Loading Calendar & Timeline...</div>
      </div>
    );
  }

  if (error || !calendarData) {
    return (
      <div className="shell-container" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '0.5rem' }}>📅</div>
        <h3>Calendar Not Available</h3>
        <p className="text-muted text-sm" style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
          {error || 'Could not load calendar data.'}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link to="/trips" className="btn btn-secondary">
            Back to My Trips
          </Link>
          <Link to="/trips/new" className="btn btn-primary">
            + Plan a New Trip
          </Link>
        </div>
      </div>
    );
  }

  const { tripName, startDate, endDate, days = [] } = calendarData;

  const filteredDays = days.map(day => {
    if (categoryFilter === 'all') return day;
    return {
      ...day,
      items: (day.items || []).filter(item => (item.category || '').toLowerCase() === categoryFilter.toLowerCase())
    };
  });

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', padding: '1.5rem 1.75rem', borderRadius: '12px', border: '1px solid var(--border-passive)', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span className="shell-badge hub">Timeline Visualization</span>
              <span className="nav-badge green" style={{ fontWeight: '700' }}>{days.length} Days</span>
            </div>
            <h2 style={{ margin: '0 0 0.25rem 0' }}>{tripName} — Calendar & Timeline</h2>
            <p className="text-sm text-muted" style={{ margin: 0 }}>
              📅 {new Date(startDate).toLocaleDateString()} – {new Date(endDate).toLocaleDateString()} • {totalActivities} {totalActivities === 1 ? 'Event' : 'Events'} Scheduled
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <Link to={`/trips/${tripId}/builder`} className="btn btn-secondary btn-sm">
              ✏️ Edit in Builder
            </Link>
            <Link to={`/trips/${tripId}/itinerary`} className="btn btn-primary btn-sm">
              ← Itinerary Hub
            </Link>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Filter Activity Type:</span>
          {['all', 'sightseeing', 'food', 'adventure', 'culture', 'nightlife', 'relaxation'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '11px', padding: '4px 10px', textTransform: 'capitalize' }}
            >
              {cat === 'all' ? 'All Activities' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Timeline Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {filteredDays.map((day) => (
          <div
            key={day.date}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--border-passive)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              transition: 'box-shadow 0.15s ease',
            }}
          >
            {/* Day Header Box */}
            <div
              style={{
                backgroundColor: 'var(--bg-page)',
                padding: '0.9rem 1.15rem',
                borderBottom: '1px solid var(--border-passive)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span className="nav-badge green" style={{ fontSize: '11px', fontWeight: '700' }}>
                  Day {day.dayNumber}
                </span>
                <div style={{ fontWeight: '600', fontSize: '14px', marginTop: '3px', color: 'var(--text-charcoal)' }}>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>
              <span className="text-muted text-sm" style={{ fontSize: '12px', fontWeight: '500' }}>
                📍 {day.stopTitle}
              </span>
            </div>

            {/* Scheduled Activities Body */}
            <div style={{ padding: '1.1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {day.items && day.items.length > 0 ? (
                day.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'var(--bg-page)',
                      borderRadius: '8px',
                      borderLeft: '3px solid var(--accent-terra)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-terra)' }}>
                        ⏰ {item.time}
                      </span>
                      <span className="nav-badge" style={{ fontSize: '9px', textTransform: 'capitalize' }}>
                        {item.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-charcoal)' }}>{item.title}</div>
                    {item.cost > 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: '700', marginTop: '3px' }}>
                        ${item.cost.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '1.75rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic', display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                  <span>No activities scheduled</span>
                  <Link to={`/trips/${tripId}/builder`} style={{ color: 'var(--primary-dark)', fontSize: '11px', fontWeight: '600' }}>
                    + Add in Builder
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
