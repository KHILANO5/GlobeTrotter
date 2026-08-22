import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import ShareModal from '../components/modals/ShareModal';

export default function ItineraryViewPage() {
  const { tripId } = useParams();

  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (tripId) {
      loadItinerary();
    }
  }, [tripId]);

  const loadItinerary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/trips/${tripId}/itinerary`);
      if (res.data) {
        setItinerary(res.data);
      }
    } catch (err) {
      console.error('Error loading itinerary:', err);
      setError('Failed to assemble itinerary.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Assembling Day-by-Day Itinerary View...
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="shell-container" style={{ padding: '2rem' }}>
        <h3>Itinerary Unavailable</h3>
        <p className="text-muted text-sm">{error || 'Could not load itinerary data.'}</p>
        <Link to="/trips" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to My Trips
        </Link>
      </div>
    );
  }

  const { tripName, startDate, endDate, totalBudget, days = [], stops = [] } = itinerary;

  const totalCalculatedCost = days.reduce((sum, d) => sum + (d.dailyCost || 0), 0);
  const totalActivitiesCount = days.reduce((sum, d) => sum + (d.activities?.length || 0), 0);

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      
      {/* Itinerary Header */}
      <div style={{ backgroundColor: '#ffffff', padding: '1.75rem', borderRadius: '12px', border: '1px solid var(--border-passive)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
<<<<<<< HEAD
            <h2>Itinerary View</h2>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Day-by-day itinerary schedule and activity roadmap
=======
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span className="shell-badge hub">Central Sub-Hub</span>
              <span className="nav-badge green">{days.length} Days Itinerary</span>
            </div>
            <h2 style={{ margin: '0.25rem 0' }}>{tripName}</h2>
            <p className="text-sm text-muted" style={{ margin: 0 }}>
              📅 {new Date(startDate).toLocaleDateString()} – {new Date(endDate).toLocaleDateString()}
              {stops.length > 0 && ` • ${stops.length} Stops / Sections`}
              {totalActivitiesCount > 0 && ` • ${totalActivitiesCount} Experiences`}
>>>>>>> bb4224b4a0f25d6339e9ba76c6930bbf3ead484e
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/trips/${tripId}/builder`} className="btn btn-secondary btn-sm">
              ✏️ Edit in Builder
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsShareModalOpen(true)}
            >
              🔗 Share Trip
            </button>
          </div>
        </div>

<<<<<<< HEAD
        {/* Fan Out Navigation Bar */}
=======
        {/* Sub-Hub Fan-Out Action Bar (Matches architecture diagram) */}
>>>>>>> bb4224b4a0f25d6339e9ba76c6930bbf3ead484e
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '0.75rem',
            padding: '0.85rem', 
            backgroundColor: 'var(--bg-page)', 
            border: '1px solid var(--border-passive)', 
            borderRadius: '8px',
          }}
        >
<<<<<<< HEAD
          <Link to={tripId ? `/trips/${tripId}/budget` : '/trips/budget'} className="btn btn-secondary btn-sm" style={{ flex: 1, minWidth: '150px' }}>
            View Budget Breakdown
          </Link>
          <Link to={tripId ? `/trips/${tripId}/calendar` : '/trips/calendar'} className="btn btn-secondary btn-sm" style={{ flex: 1, minWidth: '150px' }}>
            View Calendar Timeline
          </Link>
          <Link to={tripId ? `/shared/${tripId}` : '/shared/demo'} className="btn btn-secondary btn-sm" style={{ flex: 1, minWidth: '150px' }}>
            Public Share Link
=======
          <Link to={`/trips/${tripId}/budget`} className="btn btn-secondary btn-sm" style={{ textAlign: 'center' }}>
            💰 Budget & Breakdown
          </Link>
          <Link to={`/trips/${tripId}/calendar`} className="btn btn-secondary btn-sm" style={{ textAlign: 'center' }}>
            📅 Calendar & Timeline
          </Link>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsShareModalOpen(true)}
          >
            🌐 Public View Link
          </button>
          <Link to={`/trips/${tripId}/builder`} className="btn btn-ghost btn-sm" style={{ textAlign: 'center' }}>
            ➕ Add More Stops
>>>>>>> bb4224b4a0f25d6339e9ba76c6930bbf3ead484e
          </Link>
        </div>
      </div>

<<<<<<< HEAD
        {/* Day-by-Day Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid var(--border-passive)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4>Day 1: Arrival & City Orientation (Tokyo)</h4>
              <span className="nav-badge" style={{ backgroundColor: 'rgba(13, 92, 70, 0.1)', color: 'var(--accent-green)' }}>Stop: Tokyo</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-passive)' }}>
              <div className="text-sm">
                <strong>09:00 AM:</strong> Senso-ji Temple exploration & street food
              </div>
              <div className="text-sm">
                <strong>02:00 PM:</strong> Shibuya Crossing & Shopping
              </div>
            </div>
          </div>
        </div>

=======
      {/* Embedded Budget Highlights Banner */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: '#ffffff', 
          padding: '1.25rem 1.5rem', 
          borderRadius: '10px', 
          border: '1px solid var(--border-passive)',
          marginBottom: '1.75rem' 
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Activity Cost Rollup
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-green)' }}>
            ${totalCalculatedCost.toFixed(2)}
          </div>
        </div>

        {totalBudget && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Target Budget
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>
              ${parseFloat(totalBudget).toFixed(2)}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Daily Average
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700' }}>
            ${(totalCalculatedCost / Math.max(1, days.length)).toFixed(2)} / day
          </div>
        </div>

        <Link to={`/trips/${tripId}/budget`} className="btn btn-secondary btn-sm">
          Full Budget Details →
        </Link>
>>>>>>> bb4224b4a0f25d6339e9ba76c6930bbf3ead484e
      </div>

      {/* Day-by-Day Itinerary Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
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
            {/* Day Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-page)',
                padding: '0.9rem 1.25rem',
                borderBottom: '1px solid var(--border-passive)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="nav-badge green" style={{ fontSize: '12px', fontWeight: '700' }}>
                  Day {day.dayNumber}
                </span>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-muted text-sm">• {day.stopTitle}</span>
              </div>

              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-green)' }}>
                Daily: ${day.dailyCost.toFixed(2)}
              </div>
            </div>

            {/* Day Activities Timeline */}
            <div style={{ padding: '1.25rem' }}>
              {day.activities && day.activities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {day.activities.map((act) => (
                    <div
                      key={act.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-page)',
                        borderRadius: '8px',
                        borderLeft: '4px solid var(--accent-terra)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          ⏰ {act.scheduledTime || '09:00'}
                        </span>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>{act.name}</div>
                          <span className="nav-badge" style={{ fontSize: '10px', textTransform: 'capitalize', marginTop: '2px' }}>
                            {act.category}
                          </span>
                        </div>
                      </div>

                      <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--accent-green)' }}>
                        {parseFloat(act.cost) === 0 ? 'Free' : `$${parseFloat(act.cost).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No scheduled activities for this day.{' '}
                  <Link to={`/trips/${tripId}/builder`} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                    Add activities in Builder
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tripId={tripId}
        tripName={tripName}
      />
    </div>
  );
}
