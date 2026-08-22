import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ActivitySearchModal({ isOpen, onClose, onAssignActivity, stop }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxCost, setMaxCost] = useState('');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selected activity to attach
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [scheduledDate, setScheduledDate] = useState(stop?.startDate || '');
  const [costOverride, setCostOverride] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
      if (stop?.startDate) {
        setScheduledDate(stop.startDate);
      }
    }
  }, [isOpen, selectedCategory, stop]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      let url = '/activities?pageSize=50&sort=name:asc';
      if (stop?.cityId) {
        url += `&cityId=${stop.cityId}`;
      }
      if (selectedCategory !== 'All') {
        url += `&category=${encodeURIComponent(selectedCategory.toLowerCase())}`;
      }
      if (maxCost) {
        url += `&maxCost=${encodeURIComponent(maxCost)}`;
      }
      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      }

      const res = await api.get(url);
      if (res.data) {
        setActivities(res.data);
      }
    } catch (err) {
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchActivities();
  };

  const handlePickActivity = (act) => {
    setSelectedActivity(act);
    setCostOverride(act.estimatedCost || '');
  };

  const handleConfirm = () => {
    if (!selectedActivity) {
      alert('Please select an activity from the catalog.');
      return;
    }

    onAssignActivity({
      activityId: selectedActivity.id,
      name: selectedActivity.name,
      category: selectedActivity.category,
      description: selectedActivity.description,
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || null,
      costOverride: costOverride !== '' ? parseFloat(costOverride) : null,
      cost: costOverride !== '' ? parseFloat(costOverride) : parseFloat(selectedActivity.estimatedCost || 0),
    });

    setSelectedActivity(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '0.75rem' }}>
          <div>
            <h3>Activity Search & Assignment</h3>
            <p className="text-sm text-muted" style={{ margin: 0 }}>
              Assign experiences to: <strong>{stop?.title || 'Current Stop'}</strong>
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {['All', 'Sightseeing', 'Food', 'Adventure', 'Culture', 'Nightlife', 'Relaxation'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
              style={{ fontSize: '12px' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search and Max Cost Filters */}
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search activities by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <input
            type="number"
            className="input-field"
            placeholder="Max Cost ($)"
            value={maxCost}
            onChange={e => setMaxCost(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">Filter</button>
        </form>

        {/* Activities List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', padding: '4px', marginBottom: '1.5rem' }}>
          {loading ? (
            <p className="text-sm text-muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1.5rem' }}>
              Loading catalog activities...
            </p>
          ) : activities.length > 0 ? (
            activities.map(act => {
              const isSelected = selectedActivity?.id === act.id;
              return (
                <div
                  key={act.id}
                  onClick={() => handlePickActivity(act)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--text-primary)' : '1px solid var(--border-passive)',
                    backgroundColor: isSelected ? 'rgba(28, 28, 28, 0.05)' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <span className="nav-badge" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                        {act.category}
                      </span>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--accent-green)' }}>
                        {parseFloat(act.estimatedCost) === 0 ? 'Free' : `$${act.estimatedCost}`}
                      </span>
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '0.3rem' }}>{act.name}</div>
                    {act.description && (
                      <p className="text-sm text-muted" style={{ fontSize: '12px', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {act.description}
                      </p>
                    )}
                  </div>
                  {act.estimatedDurationMinutes && (
                    <div className="text-sm text-muted" style={{ fontSize: '11px', marginTop: '0.5rem' }}>
                      ⏱️ {act.estimatedDurationMinutes} mins
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1.5rem' }}>
              No activities found matching filters.
            </p>
          )}
        </div>

        {/* Schedule & Cost Override Settings */}
        {selectedActivity && (
          <div style={{ backgroundColor: 'var(--bg-page)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-passive)' }}>
            <h4 style={{ marginBottom: '0.75rem' }}>Schedule: {selectedActivity.name}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Scheduled Date</label>
                <input
                  type="date"
                  className="input-field"
                  min={stop?.startDate}
                  max={stop?.endDate}
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label>Time Slot</label>
                <input
                  type="time"
                  className="input-field"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label>Cost Override ($)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="input-field"
                  placeholder={selectedActivity.estimatedCost || '0'}
                  value={costOverride}
                  onChange={e => setCostOverride(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!selectedActivity}
            onClick={handleConfirm}
          >
            Assign Activity to Stop →
          </button>
        </div>
      </div>
    </div>
  );
}
