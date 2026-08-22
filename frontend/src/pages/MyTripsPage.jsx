import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ShareModal from '../components/modals/ShareModal';
import { CalendarIcon, GlobeIcon, EditIcon, ShareIcon, TrashIcon, FlightIcon, LuggageIcon, CompassIcon, AlertCircleIcon } from '../components/common/Icons';

export default function MyTripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('startDate:asc');

  // Deletion & Share modal states
  const [deletingId, setDeletingId] = useState(null);
  const [shareModalTrip, setShareModalTrip] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, [statusFilter, sortBy]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (sortBy) {
        params.append('sort', sortBy);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/trips${queryString}`);

      if (res.data && Array.isArray(res.data)) {
        setTrips(res.data);
      } else {
        setTrips([]);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(err.message || 'Failed to load your trips. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Client-side search filter for responsive instantaneous typing
  const filteredTrips = useMemo(() => {
    if (!searchTerm.trim()) return trips;
    const term = searchTerm.toLowerCase().trim();
    return trips.filter(trip => 
      (trip.name && trip.name.toLowerCase().includes(term)) ||
      (trip.description && trip.description.toLowerCase().includes(term))
    );
  }, [trips, searchTerm]);

  // Status counts for filter pills
  const statusCounts = useMemo(() => {
    const counts = { all: trips.length, upcoming: 0, ongoing: 0, completed: 0 };
    trips.forEach(t => {
      const s = (t.status || 'upcoming').toLowerCase();
      if (counts[s] !== undefined) {
        counts[s]++;
      }
    });
    return counts;
  }, [trips]);

  // Handle Trip Deletion
  const handleDeleteTrip = async (tripId, tripName) => {
    if (!window.confirm(`Are you sure you want to delete "${tripName}"? This will permanently remove all stops, activities, and budget records for this trip.`)) {
      return;
    }

    try {
      setDeletingId(tripId);
      await api.delete(`/trips/${tripId}`);
      setTrips(prev => prev.filter(t => t.id !== tripId));
    } catch (err) {
      console.error('Error deleting trip:', err);
      alert(err.message || 'Failed to delete trip. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Calculate Duration Helper
  const getDurationText = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays <= 0) return '1 Day';
    if (diffDays === 1) return '1 Day';
    return `${diffDays} Days`;
  };

  const getStatusBadgeStyle = (status) => {
    const s = (status || 'upcoming').toLowerCase();
    const baseStyle = { 
      padding: '4px 8px', 
      borderRadius: '12px', 
      backdropFilter: 'blur(4px)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
    };
    if (s === 'ongoing') {
      return { ...baseStyle, backgroundColor: 'rgba(13, 92, 70, 0.85)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)' };
    }
    if (s === 'upcoming') {
      return { ...baseStyle, backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)' };
    }
    if (s === 'completed') {
      return { ...baseStyle, backgroundColor: 'rgba(75, 85, 99, 0.85)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)' };
    }
    return baseStyle;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0' }}>My Trips</h2>
          <p className="text-muted text-sm" style={{ margin: 0 }}>
            Manage, edit, and explore all your planned itineraries and past travel memories
          </p>
        </div>
        <Link to="/trips/new" className="btn btn-primary">
          + Plan a New Trip
        </Link>
      </div>

      {/* Filter, Search & Sort Bar */}
      <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-passive)', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All Trips' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'ongoing', label: 'Ongoing' },
              { key: 'completed', label: 'Completed' },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '13px', padding: '6px 12px' }}
              >
                {tab.label} {statusFilter === 'all' && trips.length > 0 && tab.key !== 'all' ? `(${statusCounts[tab.key] || 0})` : ''}
              </button>
            ))}
          </div>

          {/* Search Input & Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <input
                type="text"
                placeholder="Search trips by title..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input-field"
                style={{ padding: '6px 28px 6px 12px', fontSize: '13px' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px' }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="input-field"
              style={{ padding: '6px 10px', fontSize: '13px', width: 'auto', cursor: 'pointer' }}
            >
              <option value="startDate:asc">Start Date (Earliest)</option>
              <option value="startDate:desc">Start Date (Latest)</option>
              <option value="createdAt:desc">Recently Created</option>
              <option value="name:asc">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div style={{ padding: '1rem 1.25rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#dc2626', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircleIcon size={16} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={fetchTrips} className="btn btn-secondary btn-sm" style={{ borderColor: '#dc2626', color: '#dc2626' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--primary-dark)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.75rem' }} />
          <div>Loading your journeys...</div>
        </div>
      ) : filteredTrips.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredTrips.map(trip => {
            const duration = getDurationText(trip.startDate, trip.endDate);
            const isDeleting = deletingId === trip.id;

            return (
              <div
                key={trip.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid var(--border-passive)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                {/* Cover Photo Header */}
                <div style={{ position: 'relative', height: '140px', backgroundColor: 'var(--bg-page)', overflow: 'hidden' }}>
                  {trip.coverPhotoUrl ? (
                    <img
                      src={trip.coverPhotoUrl}
                      alt={trip.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(28,28,28,0.03)' }}>
                      <FlightIcon size={32} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}

                  {/* Status Badge overlay */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.4rem', zIndex: 10 }}>
                    <span 
                      style={{ 
                        ...getStatusBadgeStyle(trip.status),
                        fontSize: '11px', 
                        fontWeight: '700',
                        textTransform: 'capitalize'
                      }}
                    >
                      {trip.status}
                    </span>
                    {trip.isPublic && (
<<<<<<< Updated upstream
                      <span className="nav-badge green" style={{ fontSize: '10px', fontWeight: '600', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <GlobeIcon size={11} />
                        <span>Shared</span>
=======
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        backgroundColor: 'rgba(59, 130, 246, 0.85)', 
                        color: '#ffffff', 
                        border: '1px solid rgba(255,255,255,0.4)', 
                        backdropFilter: 'blur(4px)', 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)' 
                      }}>
                        🌐 Shared
>>>>>>> Stashed changes
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '17px', color: 'var(--text-charcoal)', lineHeight: '1.3' }}>
                      {trip.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarIcon size={12} />
                        <span>{new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}</span>
                      </span>
                      {duration && <span>• <strong>{duration}</strong></span>}
                    </div>
                  </div>

                  {trip.description && (
                    <p style={{ fontSize: '13px', color: 'var(--text-body)', margin: '0.5rem 0 1rem', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {trip.description}
                    </p>
                  )}

                  {trip.totalBudget && (
                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span className="text-muted">Target Budget:</span>
                      <span style={{ fontWeight: '700', color: 'var(--accent-green)' }}>
                        ${parseFloat(trip.totalBudget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-passive)' }}>
                    <Link to={`/trips/${trip.id}/itinerary`} className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                      View Hub →
                    </Link>
                    <Link to={`/trips/${trip.id}/builder`} className="btn btn-secondary btn-sm" title="Edit in Builder" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <EditIcon size={13} />
                      <span>Edit</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShareModalTrip(trip)}
                      className="btn btn-ghost btn-sm"
                      title="Share trip"
                      style={{ padding: '6px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ShareIcon size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTrip(trip.id, trip.name)}
                      disabled={isDeleting}
                      className="btn btn-ghost btn-sm"
                      title="Delete trip"
                      style={{ color: '#dc2626', padding: '6px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {isDeleting ? '...' : <TrashIcon size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : trips.length === 0 ? (
        /* Empty State: No Trips in Account */
        <div className="shell-container" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <LuggageIcon size={44} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No Trips Planned Yet</h3>
          <p className="text-muted text-sm" style={{ maxWidth: '440px', margin: '0 auto 1.75rem' }}>
            You haven't created any travel plans yet. Start building your first personalized journey with destinations, activities, and budget tracking.
          </p>
          <Link to="/trips/new" className="btn btn-primary" style={{ padding: '10px 22px', fontSize: '15px' }}>
            + Plan Your First Trip
          </Link>
        </div>
      ) : (
        /* Empty State: No search results */
        <div className="shell-container" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            <CompassIcon size={36} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No Matching Trips Found</h3>
          <p className="text-muted text-sm" style={{ maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            No journeys match your filter <strong>"{statusFilter}"</strong> {searchTerm && `or search term "${searchTerm}"`}.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setSearchTerm('');
            }}
            className="btn btn-secondary"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Share Modal */}
      {shareModalTrip && (
        <ShareModal
          isOpen={Boolean(shareModalTrip)}
          onClose={() => setShareModalTrip(null)}
          tripId={shareModalTrip.id}
          tripName={shareModalTrip.name}
        />
      )}
    </div>
  );
}
