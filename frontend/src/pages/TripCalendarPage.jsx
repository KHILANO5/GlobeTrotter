import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

export default function TripCalendarPage() {
  const { tripId } = useParams();

  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tripId) {
      loadCalendar();
    }
  }, [tripId]);

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
      setError('Failed to load calendar view.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Calendar & Timeline...
      </div>
    );
  }

  if (error || !calendarData) {
    return (
      <div className="shell-container" style={{ padding: '2rem' }}>
        <h3>Calendar Not Available</h3>
        <p className="text-muted text-sm">{error || 'Could not load calendar data.'}</p>
        <Link to={`/trips/${tripId}/itinerary`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Itinerary
        </Link>
      </div>
    );
  }

  const { tripName, startDate, endDate, days = [] } = calendarData;
  const totalActivities = days.reduce((sum, d) => sum + (d.items?.length || 0), 0);

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', padding: '1.75rem', borderRadius: '12px', border: '1px solid var(--border-passive)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
<<<<<<< HEAD
            <h2>Trip Calendar & Timeline</h2>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Visual timeline and day-by-day scheduling view
=======
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span className="shell-badge hub">Timeline Visualization</span>
              <span className="nav-badge green">{days.length} Days</span>
            </div>
            <h2 style={{ margin: '0.25rem 0' }}>{tripName} — Calendar & Timeline</h2>
            <p className="text-sm text-muted" style={{ margin: 0 }}>
              📅 {new Date(startDate).toLocaleDateString()} – {new Date(endDate).toLocaleDateString()} • {totalActivities} Scheduled Events
>>>>>>> bb4224b4a0f25d6339e9ba76c6930bbf3ead484e
            </p>
          </div>

<<<<<<< HEAD
        <div style={{ padding: '2.5rem', backgroundColor: 'var(--bg-page)', borderRadius: '10px', border: '1px dashed var(--border-passive)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '0.75rem' }}>📅</div>
          <h4>Interactive Calendar & Timeline Grid</h4>
          <p className="text-sm text-muted" style={{ maxWidth: '480px', margin: '0.5rem auto 1.5rem' }}>
            Multi-day stops, activity blocks, and visual scheduling timeline.
          </p>
          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
            <span className="nav-badge">Month View</span>
            <span className="nav-badge">Week View</span>
            <span className="nav-badge" style={{ backgroundColor: 'rgba(13, 92, 70, 0.1)', color: 'var(--accent-green)' }}>Timeline View</span>
          </div>
        </div>
=======
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/trips/${tripId}/builder`} className="btn btn-secondary btn-sm">
              ✏️ Builder
            </Link>
            <Link to={`/trips/${tripId}/itinerary`} className="btn btn-primary btn-sm">
              ← Itinerary View
            </Link>
          </div>
        </div>
      </div>

      {/* Calendar Timeline Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {days.map((day) => (
          <div
            key={day.date}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid var(--border-passive)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Day Header Box */}
            <div
              style={{
                backgroundColor: 'var(--bg-page)',
                padding: '0.85rem 1rem',
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
                <div style={{ fontWeight: '600', fontSize: '13px', marginTop: '3px' }}>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>
              <span className="text-muted text-sm" style={{ fontSize: '12px', fontWeight: '500' }}>
                {day.stopTitle}
              </span>
            </div>

            {/* Scheduled Activities Body */}
            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {day.items && day.items.length > 0 ? (
                day.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '0.6rem 0.8rem',
                      backgroundColor: 'var(--bg-page)',
                      borderRadius: '6px',
                      borderLeft: '3px solid var(--accent-terra)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        ⏰ {item.time}
                      </span>
                      <span className="nav-badge" style={{ fontSize: '9px', textTransform: 'capitalize' }}>
                        {item.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{item.title}</div>
                    {item.cost > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: '600', marginTop: '2px' }}>
                        ${item.cost.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                  No activities scheduled
                </div>
              )}
            </div>
          </div>
        ))}
>>>>>>> bb4224b4a0f25d6339e9ba76c6930bbf3ead484e
      </div>
    </div>
  );
}
