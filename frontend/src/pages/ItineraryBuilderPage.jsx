import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import CitySearchModal from '../components/modals/CitySearchModal';
import ActivitySearchModal from '../components/modals/ActivitySearchModal';
import { MapPinIcon, CalendarIcon, CompassIcon, BuildingIcon, FlightIcon, ClockIcon, TicketIcon, PlusIcon } from '../components/common/Icons';

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
    } else {
      resolveDefaultTrip();
    }
  }, [tripId]);

  const resolveDefaultTrip = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trips?pageSize=1&sort=createdAt:desc');
      if (res.data && res.data.length > 0) {
        navigate(`/trips/${res.data[0].id}/builder`, { replace: true });
      } else {
        setError('No trips found. Please plan a trip first.');
        setLoading(false);
      }
    } catch (err) {
      setError('Please select a trip to build.');
      setLoading(false);
    }
  };

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
      setError('Failed to load trip details. The trip may have been removed.');
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

  const totalActivitiesCount = useMemo(() => {
    return stops.reduce((sum, s) => sum + (s.activities?.length || 0), 0);
  }, [stops]);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--primary-dark)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.75rem' }} />
        <div>Loading Itinerary Builder...</div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="shell-container" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
          <CompassIcon size={36} style={{ color: 'var(--text-muted)' }} />
        </div>
        <h3>Trip Not Found</h3>
        <p className="text-muted text-sm" style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
          {error || 'Please check the trip ID or choose an active trip from your list.'}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link to="/trips" className="btn btn-secondary">
            View My Trips
          </Link>
          <Link to="/trips/new" className="btn btn-primary">
            + Plan a New Trip
          </Link>
        </div>
      </div>
    );
  }

  const renderStopTypeIcon = (type) => {
    switch (type) {
      case 'travel':
        return <FlightIcon size={16} style={{ color: 'var(--accent-terra)' }} />;
      case 'lodging':
        return <BuildingIcon size={16} style={{ color: 'var(--accent-terra)' }} />;
      case 'activity_block':
        return <TicketIcon size={16} style={{ color: 'var(--accent-terra)' }} />;
      case 'city_stop':
      default:
        return <MapPinIcon size={16} style={{ color: 'var(--accent-terra)' }} />;
    }
  };

  const isCompleted = trip?.status?.toLowerCase() === 'completed';

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)' }}>
      
      {/* Builder Top Header Card */}
      <div 
        style={{ 
          backgroundColor: '#ffffff', 
          padding: '1.5rem 1.75rem', 
          borderRadius: '12px', 
          border: '1px solid var(--border-passive)', 
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span className="shell-badge terra">Builder Mode</span>
              <span className="nav-badge" style={{ textTransform: 'capitalize' }}>{trip.status}</span>
              {isCompleted && (
                <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500', marginLeft: '4px' }}>
                  (Read-only)
                </span>
              )}
            </div>
            <h2 style={{ margin: '0 0 0.25rem 0' }}>{trip.name}</h2>
            <p className="text-sm text-muted" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CalendarIcon size={13} />
                <span>{new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}</span>
              </span>
              {trip.totalBudget && <span>• Target Budget: <strong>${parseFloat(trip.totalBudget).toLocaleString()}</strong></span>}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!isCompleted && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsCityModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusIcon size={14} />
                <span>Add Stop / Section</span>
              </button>
            )}
            <Link to={`/trips/${tripId}/itinerary`} className="btn btn-secondary btn-sm">
              Itinerary View →
            </Link>
          </div>
        </div>
      </div>

      {/* Stops & Sections Builder Container */}
      <div style={{ flex: 1, marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.2rem 0' }}>Itinerary Sections & Stops ({stops.length})</h3>
            <p className="text-sm text-muted" style={{ margin: 0 }}>
              Add destinations, travel legs, or lodging, then attach scheduled activities to each section.
            </p>
          </div>

          {stops.length > 0 && !isCompleted && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsCityModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <PlusIcon size={13} />
              <span>Add Another Section</span>
            </button>
          )}
        </div>

        {stops.length === 0 ? (
          <div className="shell-container" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
              <MapPinIcon size={44} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>No Stops Added Yet</h3>
            <p className="text-muted text-sm" style={{ maxWidth: '460px', margin: '0 auto 1.5rem' }}>
              Your journey is waiting to be built! Add your first destination city or travel leg to begin planning activities.
            </p>
            {!isCompleted && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCityModalOpen(true)}
                style={{ padding: '10px 20px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusIcon size={14} />
                <span>Add First Destination Stop</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {stops.map((stop, index) => (
              <div
                key={stop.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid var(--border-passive)',
                  padding: '1.25rem 1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'box-shadow 0.15s ease',
                }}
              >
                {/* Stop Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-passive)' }}>
                        {renderStopTypeIcon(stop.type)}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-charcoal)' }}>
                        Section {index + 1}: {stop.title}
                      </h4>
                      {stop.cityName && (
                        <span className="nav-badge green" style={{ fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <MapPinIcon size={11} />
                          <span>{stop.cityName}{stop.cityCountry ? `, ${stop.cityCountry}` : ''}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted" style={{ margin: 0, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      <CalendarIcon size={12} />
                      <span>{new Date(stop.startDate).toLocaleDateString()} – {new Date(stop.endDate).toLocaleDateString()}</span>
                      {stop.budget && ` • Section Budget: $${parseFloat(stop.budget).toLocaleString()}`}
                    </p>
                  </div>

                  {/* Stop Reordering & Action Controls */}
                  {!isCompleted && (
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        disabled={index === 0}
                        onClick={() => handleMoveStop(index, -1)}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        disabled={index === stops.length - 1}
                        onClick={() => handleMoveStop(index, 1)}
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px', color: '#dc2626', fontSize: '14px' }}
                        onClick={() => handleDeleteStop(stop.id)}
                        title="Delete Stop"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {stop.description && (
                  <p className="text-sm" style={{ color: 'var(--text-body)', marginBottom: '1rem', fontStyle: 'italic', lineHeight: '1.4' }}>
                    "{stop.description}"
                  </p>
                )}

                {/* Assigned Activities Container */}
                <div style={{ backgroundColor: 'var(--bg-page)', borderRadius: '10px', padding: '1rem 1.15rem', border: '1px solid var(--border-passive)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-charcoal)' }}>
                      Activities & Experiences ({stop.activities?.length || 0})
                    </span>
                    {!isCompleted && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '12px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleOpenActivityModal(stop)}
                      >
                        <PlusIcon size={12} />
                        <span>Assign Activity</span>
                      </button>
                    )}
                  </div>

                  {stop.activities && stop.activities.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {stop.activities.map(act => (
                        <div
                          key={act.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#ffffff',
                            padding: '0.65rem 0.9rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-passive)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-terra)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <ClockIcon size={12} />
                              <span>{act.scheduledTime ? act.scheduledTime.slice(0, 5) : '09:00'}</span>
                            </span>
                            <span style={{ fontWeight: '500', fontSize: '14px', color: 'var(--text-charcoal)' }}>
                              {act.name}
                            </span>
                            <span className="nav-badge" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                              {act.category}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--accent-green)' }}>
                              {parseFloat(act.cost) === 0 ? 'Free' : `$${parseFloat(act.cost).toFixed(2)}`}
                            </span>
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleRemoveActivity(stop.id, act.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px', padding: '2px 6px' }}
                                title="Remove activity"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted" style={{ margin: 0, fontStyle: 'italic', fontSize: '12px', textAlign: 'center', padding: '0.5rem 0' }}>
                      No activities added yet. Click "+ Assign Activity" to pick from sightseeing, food tours, or excursions.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Anchored / Sticky Bottom Completion Bar */}
      <div 
        style={{ 
          position: 'sticky', 
          bottom: '1rem', 
          zIndex: 25, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: '#ffffff', 
          padding: '1rem 1.5rem', 
          borderRadius: '12px', 
          border: '1px solid var(--border-passive)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          marginTop: 'auto',
        }}
      >
        <Link to="/trips" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          ← Back to My Trips
        </Link>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <MapPinIcon size={13} />
            <span><strong>{stops.length}</strong> {stops.length === 1 ? 'Stop' : 'Stops'}</span>
          </span>
          <span>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <TicketIcon size={13} />
            <span><strong>{totalActivitiesCount}</strong> {totalActivitiesCount === 1 ? 'Activity' : 'Activities'}</span>
          </span>
        </div>

        <Link to={`/trips/${tripId}/itinerary`} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '14px' }}>
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
