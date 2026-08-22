import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import CitySearchModal from '../components/modals/CitySearchModal';
import ActivitySearchModal from '../components/modals/ActivitySearchModal';

export default function ItineraryBuilderPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activeStopForActivity, setActiveStopForActivity] = useState(null);

  useEffect(() => {
    if (tripId) {
      loadTripAndStops();
    }
  }, [tripId]);

  const loadTripAndStops = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tripRes, stopsRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/trips/${tripId}/stops`),
      ]);

      if (tripRes.data) {
        setTrip(tripRes.data);
      }
      if (stopsRes.data) {
        setStops(stopsRes.data);
      }
    } catch (err) {
      console.error('Error loading builder data:', err);
      setError('Failed to load trip details.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Add new Stop
  const handleAddStop = async (stopPayload) => {
    try {
      const res = await api.post(`/trips/${tripId}/stops`, stopPayload);
      if (res.data) {
        setStops([...stops, res.data]);
      }
    } catch (err) {
      console.error('Error creating stop:', err);
      alert(err.message || 'Failed to add stop.');
    }
  };

  // 2. Delete Stop
  const handleDeleteStop = async (stopId) => {
    if (!window.confirm('Are you sure you want to remove this stop and all its scheduled activities?')) {
      return;
    }
    try {
      await api.delete(`/trips/${tripId}/stops/${stopId}`);
      setStops(stops.filter(s => s.id !== stopId));
    } catch (err) {
      console.error('Error deleting stop:', err);
      alert('Failed to remove stop.');
    }
  };

  // 3. Move Stop Up/Down
  const handleMoveStop = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stops.length) return;

    const reordered = [...stops];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setStops(reordered);

    try {
      await api.patch(`/trips/${tripId}/stops/reorder`, {
        orderedStopIds: reordered.map(s => s.id),
      });
    } catch (err) {
      console.error('Error saving stop order:', err);
    }
  };

  // 4. Assign Activity to Stop
  const handleOpenActivityModal = (stop) => {
    setActiveStopForActivity(stop);
    setIsActivityModalOpen(true);
  };

  const handleAssignActivity = async (activityPayload) => {
    if (!activeStopForActivity) return;
    try {
      const res = await api.post(`/trips/${tripId}/stops/${activeStopForActivity.id}/activities`, activityPayload);
      if (res.data) {
        // Refresh stops
        const updatedStops = stops.map(s => {
          if (s.id === activeStopForActivity.id) {
            return {
              ...s,
              activities: [...(s.activities || []), res.data],
            };
          }
          return s;
        });
        setStops(updatedStops);
      }
    } catch (err) {
      console.error('Error assigning activity:', err);
      alert(err.message || 'Failed to assign activity.');
    }
  };

  // 5. Remove Activity
  const handleRemoveActivity = async (stopId, activityJoinId) => {
    try {
      await api.delete(`/trips/${tripId}/stops/${stopId}/activities/${activityJoinId}`);
      const updatedStops = stops.map(s => {
        if (s.id === stopId) {
          return {
            ...s,
            activities: (s.activities || []).filter(a => a.id !== activityJoinId),
          };
        }
        return s;
      });
      setStops(updatedStops);
    } catch (err) {
      console.error('Error removing activity:', err);
      alert('Failed to remove activity.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Itinerary Builder...
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="shell-container" style={{ padding: '2rem' }}>
        <h3>Trip Not Found</h3>
        <p className="text-muted text-sm">{error || 'Please check the trip ID or create a new trip.'}</p>
        <Link to="/trips/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          + Plan a New Trip
        </Link>
      </div>
    );
  }

  const stopTypeIcon = {
    city_stop: '🏙️',
    travel: '✈️',
    lodging: '🏨',
    activity_block: '🎯',
  };

  return (
<<<<<<< HEAD
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="shell-container" style={{ textAlign: 'left', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1rem' }}>
          <div>
            <h2>Itinerary Builder</h2>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Add stops, select cities, and assign activities to sections
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={tripId ? `/trips/${tripId}/itinerary` : '/trips/itinerary'} className="btn btn-primary btn-sm">
              View Itinerary →
            </Link>
            <Link to="/trips" className="btn btn-ghost btn-sm">
              My Trips
            </Link>
          </div>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-page)', borderRadius: '10px', border: '1px solid var(--border-passive)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4>Trip Stops & Sections</h4>
              <p className="text-sm text-muted">Trip Context: {tripId ? `ID: ${tripId}` : 'Active draft'}</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => alert('Add Stop / City Search modal will open here')}>
              + Add Stop (City)
            </button>
          </div>
        </div>

        {/* Section Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid var(--border-passive)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>Section 1: City Stop (Tokyo, Japan)</div>
              <span className="nav-badge">Days 1 - 4</span>
            </div>
            <p className="text-sm text-muted" style={{ margin: '0 0 0.75rem 0' }}>
              First leg — arrival, hotel check-in, cultural exploration, and sightseeing.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => alert('Activity Search modal will open here')}>
                + Assign Activity
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => alert('Edit stop details')}>
                Edit Section
              </button>
            </div>
          </div>
=======
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      
      {/* Builder Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-passive)' }}>
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span className="shell-badge terra">Builder Mode</span>
            <span className="nav-badge" style={{ textTransform: 'capitalize' }}>{trip.status}</span>
          </div>
          <h2 style={{ margin: '0.25rem 0' }}>{trip.name}</h2>
          <p className="text-sm text-muted" style={{ margin: 0 }}>
            📅 {new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}
            {trip.totalBudget && ` • Target Budget: $${trip.totalBudget}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsCityModalOpen(true)}
          >
            + Add Stop (City)
          </button>
          <Link to={`/trips/${tripId}/itinerary`} className="btn btn-primary btn-sm">
            View Itinerary →
          </Link>
>>>>>>> bb4224b4a0f25d6339e9ba76c6930bbf3ead484e
        </div>
      </div>

      {/* Stops & Sections Builder Container */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Itinerary Sections & Stops ({stops.length})</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setIsCityModalOpen(true)}
          >
            + Add Another Section
          </button>
        </div>

        {stops.length === 0 ? (
          <div className="shell-container" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '0.75rem' }}>📍</div>
            <h3>No Stops Added Yet</h3>
            <p className="text-muted text-sm" style={{ maxWidth: '450px', margin: '0.5rem auto 1.5rem' }}>
              Your journey is waiting to be built! Add your first destination city or travel leg to begin planning activities.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCityModalOpen(true)}
            >
              + Add First Destination Stop
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {stops.map((stop, index) => (
              <div
                key={stop.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid var(--border-passive)',
                  padding: '1.25rem',
                  transition: 'box-shadow 0.15s ease',
                }}
              >
                {/* Stop Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '18px' }}>{stopTypeIcon[stop.type] || '📍'}</span>
                      <h4 style={{ margin: 0, fontSize: '16px' }}>
                        Section {index + 1}: {stop.title}
                      </h4>
                      {stop.cityName && (
                        <span className="nav-badge green" style={{ fontSize: '11px' }}>
                          {stop.cityName}{stop.cityCountry ? `, ${stop.cityCountry}` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted" style={{ margin: 0, fontSize: '12px' }}>
                      📅 {new Date(stop.startDate).toLocaleDateString()} – {new Date(stop.endDate).toLocaleDateString()}
                      {stop.budget && ` • Section Budget: $${stop.budget}`}
                    </p>
                  </div>

                  {/* Stop Reordering & Action Controls */}
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px' }}
                      disabled={index === 0}
                      onClick={() => handleMoveStop(index, -1)}
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px' }}
                      disabled={index === stops.length - 1}
                      onClick={() => handleMoveStop(index, 1)}
                      title="Move Down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', color: '#dc2626' }}
                      onClick={() => handleDeleteStop(stop.id)}
                      title="Delete Stop"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {stop.description && (
                  <p className="text-sm" style={{ color: 'var(--text-body)', marginBottom: '1rem', fontStyle: 'italic' }}>
                    "{stop.description}"
                  </p>
                )}

                {/* Assigned Activities Section */}
                <div style={{ backgroundColor: 'var(--bg-page)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border-passive)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>
                      Activities & Experiences ({stop.activities?.length || 0})
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                      onClick={() => handleOpenActivityModal(stop)}
                    >
                      + Assign Activity
                    </button>
                  </div>

                  {stop.activities && stop.activities.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {stop.activities.map(act => (
                        <div
                          key={act.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#ffffff',
                            padding: '0.6rem 0.85rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-passive)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-terra)' }}>
                              ⏰ {act.scheduledTime ? act.scheduledTime.slice(0, 5) : '09:00'}
                            </span>
                            <span style={{ fontWeight: '500', fontSize: '14px' }}>
                              {act.name}
                            </span>
                            <span className="nav-badge" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                              {act.category}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--accent-green)' }}>
                              {parseFloat(act.cost) === 0 ? 'Free' : `$${act.cost}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveActivity(stop.id, act.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px' }}
                              title="Remove activity"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted" style={{ margin: 0, fontStyle: 'italic', fontSize: '12px' }}>
                      No activities added yet. Click "+ Assign Activity" to pick from sightseeing, food tours, or adventure.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Completion Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-passive)' }}>
        <Link to="/trips" className="btn btn-ghost btn-sm">
          ← Back to My Trips
        </Link>
        <Link to={`/trips/${tripId}/itinerary`} className="btn btn-primary">
          Save & Review Itinerary View →
        </Link>
      </div>

      {/* City Search Modal */}
      <CitySearchModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        onSelectCity={handleAddStop}
        tripDates={{ startDate: trip.startDate, endDate: trip.endDate }}
      />

      {/* Activity Search Modal */}
      <ActivitySearchModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onAssignActivity={handleAssignActivity}
        stop={activeStopForActivity}
      />
    </div>
  );
}
