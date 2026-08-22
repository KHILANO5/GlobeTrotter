import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PublicItineraryPage() {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (shareToken) {
      loadSharedTrip();
    }
  }, [shareToken]);

  const loadSharedTrip = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/shared/${shareToken}`);
      if (res.data) {
        setTrip(res.data);
      }
    } catch (err) {
      console.error('Error loading shared trip:', err);
      setError('This shared itinerary link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTrip = async () => {
    if (!user) {
      if (window.confirm('You must be logged in to copy this itinerary to your account. Would you like to log in now?')) {
        navigate('/login');
      }
      return;
    }

    try {
      setCopying(true);
      const res = await api.post(`/shared/${shareToken}/copy`);
      if (res.data?.id) {
        alert('🎉 Trip copied successfully to your account!');
        navigate(`/trips/${res.data.id}/builder`);
      } else {
        navigate('/trips');
      }
    } catch (err) {
      console.error('Error copying trip:', err);
      alert(err.message || 'Failed to copy trip.');
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Shared Itinerary...
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="shell-container" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '0.5rem' }}>🔗</div>
        <h3>Shared Link Unavailable</h3>
        <p className="text-muted text-sm">{error || 'This link may have been revoked by the creator.'}</p>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
          Go to GlobeTrotter Home
        </Link>
      </div>
    );
  }

  const { tripName, description, startDate, endDate, ownerDisplayName, days = [] } = trip;

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      
      {/* Shared Itinerary Header */}
      <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-passive)', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span className="shell-badge green">Public Shared Itinerary</span>
              <span className="nav-badge">Shared by {ownerDisplayName}</span>
            </div>
            <h1 style={{ margin: '0.25rem 0', fontSize: '26px' }}>{tripName}</h1>
            <p className="text-sm text-muted" style={{ margin: 0 }}>
              📅 {new Date(startDate).toLocaleDateString()} – {new Date(endDate).toLocaleDateString()} • {days.length} Days Itinerary
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCopyTrip}
            disabled={copying}
            style={{ fontSize: '14px', padding: '10px 20px' }}
          >
            {copying ? 'Copying to Account...' : '📋 Copy Trip to My Account'}
          </button>
        </div>

        {description && (
          <p className="text-sm" style={{ color: 'var(--text-body)', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-passive)', fontStyle: 'italic' }}>
            "{description}"
          </p>
        )}
      </div>

      {/* Day by Day Plan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {days.map((day) => (
          <div
            key={day.date}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid var(--border-passive)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--bg-page)',
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid var(--border-passive)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="nav-badge green" style={{ fontWeight: '700' }}>
                  Day {day.dayNumber}
                </span>
                <span style={{ fontWeight: '600', fontSize: '14px' }}>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-muted text-sm">• {day.stopTitle}</span>
              </div>
            </div>

            <div style={{ padding: '1.25rem' }}>
              {day.activities && day.activities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {day.activities.map((act, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '0.65rem 0.9rem',
                        backgroundColor: 'var(--bg-page)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <span style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-primary)' }}>
                        ⏰ {act.scheduledTime || '09:00'}
                      </span>
                      <span style={{ fontWeight: '500', fontSize: '14px' }}>
                        {act.name}
                      </span>
                      <span className="nav-badge" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                        {act.category}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted" style={{ fontStyle: 'italic' }}>
                  Open exploration and free time.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Copy CTA Banner */}
      <div className="shell-container" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <h3>Inspired by this Journey?</h3>
        <p className="text-muted text-sm" style={{ maxWidth: '500px', margin: '0.5rem auto 1.5rem' }}>
          You can copy this complete travel plan into your GlobeTrotter account with all stops, cities, and scheduled activities preserved to customize for your own vacation.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCopyTrip}
          disabled={copying}
        >
          {copying ? 'Copying...' : '📋 Copy Trip to My Account →'}
        </button>
      </div>
    </div>
  );
}
