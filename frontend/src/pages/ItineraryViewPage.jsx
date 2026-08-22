import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ShareModal from '../components/modals/ShareModal';
import { CalendarIcon, MapPinIcon, TicketIcon, EditIcon, ShareIcon, BudgetIcon, GlobeIcon, PlusIcon, ClockIcon } from '../components/common/Icons';

export default function ItineraryViewPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState({});

  useEffect(() => {
    if (tripId) {
      loadItinerary();
    } else {
      resolveDefaultTrip();
    }
  }, [tripId]);

  const resolveDefaultTrip = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trips?pageSize=1&sort=createdAt:desc');
      if (res.data && res.data.length > 0) {
        navigate(`/trips/${res.data[0].id}/itinerary`, { replace: true });
      } else {
        setError('No trips found. Please plan a trip first.');
        setLoading(false);
      }
    } catch (err) {
      setError('Please select a trip to view.');
      setLoading(false);
    }
  };

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
      setError('Failed to assemble itinerary. The trip may not exist or has been deleted.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDayCollapse = (dateStr) => {
    setCollapsedDays(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const toggleAllDays = (collapse) => {
    if (!itinerary?.days) return;
    const newState = {};
    itinerary.days.forEach(d => {
      newState[d.date] = collapse;
    });
    setCollapsedDays(newState);
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--primary-dark)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.75rem' }} />
        <div>Assembling Day-by-Day Itinerary View...</div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="shell-container" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '0.5rem' }}>🗺️</div>
        <h3>Itinerary Unavailable</h3>
        <p className="text-muted text-sm" style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
          {error || 'Could not load itinerary data.'}
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

  const { tripName, startDate, endDate, totalBudget, days = [], stops = [] } = itinerary;

  const totalCalculatedCost = days.reduce((sum, d) => sum + (d.dailyCost || 0), 0);
  const totalActivitiesCount = days.reduce((sum, d) => sum + (d.activities?.length || 0), 0);
  const totalDays = Math.max(1, days.length);
  const dailyAverage = totalCalculatedCost / totalDays;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Central Sub-Hub Master Header */}
      <div style={{ backgroundColor: '#ffffff', padding: '1.5rem 1.75rem', borderRadius: '12px', border: '1px solid var(--border-passive)', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span className="shell-badge hub">Central Sub-Hub</span>
              <span className="nav-badge green" style={{ fontWeight: '700' }}>{days.length} Days Itinerary</span>
            </div>
            <h2 style={{ margin: '0 0 0.25rem 0' }}>{tripName}</h2>
            <p className="text-sm text-muted" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CalendarIcon size={13} />
                <span>{new Date(startDate).toLocaleDateString()} – {new Date(endDate).toLocaleDateString()}</span>
              </span>
              {stops.length > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  • <MapPinIcon size={12} /> {stops.length} {stops.length === 1 ? 'Stop' : 'Stops'}
                </span>
              )}
              {totalActivitiesCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  • <TicketIcon size={12} /> {totalActivitiesCount} Experiences
                </span>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <Link to={`/trips/${tripId}/builder`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <EditIcon size={13} />
              <span>Edit in Builder</span>
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsShareModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <ShareIcon size={13} />
              <span>Share Trip</span>
            </button>
          </div>
        </div>

        {/* Sub-Hub Fan-Out Action Bar */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', 
            gap: '0.75rem',
            padding: '0.85rem', 
            backgroundColor: 'var(--bg-page)', 
            border: '1px solid var(--border-passive)', 
            borderRadius: '10px',
          }}
        >
          <Link to={`/trips/${tripId}/budget`} className="btn btn-secondary btn-sm" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <BudgetIcon size={14} />
            <span>Budget & Breakdown</span>
          </Link>
          <Link to={`/trips/${tripId}/calendar`} className="btn btn-secondary btn-sm" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <CalendarIcon size={14} />
            <span>Calendar Timeline</span>
          </Link>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => setIsShareModalOpen(true)}
          >
            <GlobeIcon size={14} />
            <span>Public View Link</span>
          </button>
          <Link to={`/trips/${tripId}/builder`} className="btn btn-ghost btn-sm" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <PlusIcon size={13} />
            <span>Add Stops</span>
          </Link>
        </div>
      </div>

      {/* Embedded Budget Highlights Banner */}
      <div 
        style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          backgroundColor: '#ffffff', 
          padding: '1.25rem 1.5rem', 
          borderRadius: '12px', 
          border: '1px solid var(--border-passive)',
          marginBottom: '1.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
            Activities Cost Rollup
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-green)', marginTop: '2px' }}>
            ${totalCalculatedCost.toFixed(2)}
          </div>
        </div>

        {totalBudget && (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Target Budget
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-charcoal)', marginTop: '2px' }}>
              ${parseFloat(totalBudget).toFixed(2)}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
            Daily Average
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-charcoal)', marginTop: '2px' }}>
            ${dailyAverage.toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ day</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Link to={`/trips/${tripId}/budget`} className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'center' }}>
            Full Budget Breakdown →
          </Link>
        </div>
      </div>

      {/* Day Controls Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0 }}>Daily Itinerary Roadmap</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={() => toggleAllDays(false)}
            style={{ fontSize: '12px' }}
          >
            Expand All
          </button>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={() => toggleAllDays(true)}
            style={{ fontSize: '12px' }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Day-by-Day Itinerary Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {days.map((day) => {
          const isCollapsed = collapsedDays[day.date];

          return (
            <div
              key={day.date}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid var(--border-passive)',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'box-shadow 0.15s ease',
              }}
            >
              {/* Day Header */}
              <div
                onClick={() => toggleDayCollapse(day.date)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-page)',
                  padding: '1rem 1.25rem',
                  borderBottom: isCollapsed ? 'none' : '1px solid var(--border-passive)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span className="nav-badge green" style={{ fontSize: '12px', fontWeight: '700' }}>
                    Day {day.dayNumber}
                  </span>
                  <span style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-charcoal)' }}>
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-muted text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    • <MapPinIcon size={12} /> {day.stopTitle}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-green)' }}>
                    ${day.dailyCost.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {isCollapsed ? '▼' : '▲'}
                  </span>
                </div>
              </div>

              {/* Day Activities Timeline */}
              {!isCollapsed && (
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-terra)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <ClockIcon size={12} />
                              <span>{act.scheduledTime || '09:00'}</span>
                            </span>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-charcoal)' }}>{act.name}</div>
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
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', backgroundColor: 'var(--bg-page)', borderRadius: '8px' }}>
                      No scheduled activities for this day.{' '}
                      <Link to={`/trips/${tripId}/builder`} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                        Add experiences in Builder →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
