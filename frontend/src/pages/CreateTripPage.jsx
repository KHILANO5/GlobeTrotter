import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const QUICK_INSPIRATIONS = [
  {
    name: '🌸 Tokyo & Kyoto Spring Loop',
    description: 'Multi-city journey exploring ancient temples, bullet trains, and modern Japanese culture.',
    durationDays: 10,
    budget: 2800,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: '🥐 Classic Paris & Rome Grand Tour',
    description: 'Art, architecture, and world-class gastronomy across France and Italy.',
    durationDays: 12,
    budget: 3500,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: '🏝️ Bali Island Sanctuary',
    description: 'Relaxation, surfing, temple hikes, and cultural immersion in Ubud and Seminyak.',
    durationDays: 8,
    budget: 1500,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: '🗽 New York & East Coast Highlights',
    description: 'Iconic skylines, Broadway theatre, museums, and food markets.',
    durationDays: 7,
    budget: 2200,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop&q=80',
  },
];

export default function CreateTripPage() {
  const navigate = useNavigate();

  // Helper default dates
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: today,
    endDate: nextWeek,
    totalBudget: '',
    coverPhotoUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live calculation of duration
  const tripDuration = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return null;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = end - start;
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (days <= 0) return 'Invalid dates (End must be on or after Start)';
    return `${days} Days / ${days - 1} Nights`;
  }, [formData.startDate, formData.endDate]);

  const handleApplyInspiration = (insp) => {
    const start = new Date();
    const end = new Date(Date.now() + insp.durationDays * 24 * 60 * 60 * 1000);
    setFormData({
      ...formData,
      name: insp.name,
      description: insp.description,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      totalBudget: String(insp.budget),
      coverPhotoUrl: insp.coverPhotoUrl,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/trips', {
        ...formData,
        totalBudget: formData.totalBudget ? parseFloat(formData.totalBudget) : null,
      });

      if (res.data?.id) {
        navigate(`/trips/${res.data.id}/builder`);
      } else {
        navigate('/trips');
      }
    } catch (err) {
      console.error('Error creating trip:', err);
      setError(err.message || 'Failed to create trip.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div className="shell-container" style={{ textAlign: 'left', padding: '2.25rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1.25rem' }}>
          <div>
            <span className="shell-badge green">Step 1 • Initial Setup</span>
            <h2 style={{ margin: '0.25rem 0' }}>Plan a New Trip</h2>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Set your journey name, dates, and budget — then construct your custom stops in the Itinerary Builder
            </p>
          </div>
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            ← Back to Hub
          </Link>
        </div>

        {/* Quick Inspiration Pills */}
        <div style={{ marginBottom: '1.75rem', backgroundColor: 'var(--bg-page)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-passive)' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '0.6rem' }}>
            ✨ Quick Inspiration Ideas (Click to auto-fill):
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {QUICK_INSPIRATIONS.map(insp => (
              <button
                key={insp.name}
                type="button"
                onClick={() => handleApplyInspiration(insp)}
                className="filter-pill"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                {insp.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#dc2626', marginBottom: '1.5rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Trip Name */}
          <div className="input-group">
            <label htmlFor="name">Trip Name *</label>
            <input
              id="name"
              type="text"
              className="input-field"
              placeholder="e.g. Japan Spring Loop 2026, Euro Summer Voyage..."
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Date Picker with Live Counter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="input-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                id="startDate"
                type="date"
                className="input-field"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="endDate">End Date *</label>
              <input
                id="endDate"
                type="date"
                className="input-field"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          {tripDuration && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem', backgroundColor: 'rgba(46, 125, 50, 0.08)', color: 'var(--accent-green)', borderRadius: '6px', fontSize: '13px', fontWeight: '600', marginBottom: '1.25rem' }}>
              🗓️ Calculated Duration: {tripDuration}
            </div>
          )}

          {/* Target Budget & Cover Photo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="input-group">
              <label htmlFor="totalBudget">Target Budget ($ USD)</label>
              <input
                id="totalBudget"
                type="number"
                min="0"
                step="50"
                className="input-field"
                placeholder="e.g. 2500"
                value={formData.totalBudget}
                onChange={e => setFormData({ ...formData, totalBudget: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label htmlFor="coverPhotoUrl">Cover Photo URL (Optional)</label>
              <input
                id="coverPhotoUrl"
                type="url"
                className="input-field"
                placeholder="https://images.unsplash.com/..."
                value={formData.coverPhotoUrl}
                onChange={e => setFormData({ ...formData, coverPhotoUrl: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="input-group">
            <label htmlFor="description">Trip Description & Highlights</label>
            <textarea
              id="description"
              className="input-field"
              rows={3}
              placeholder="Notes about destinations, packing lists, flight references, or companions..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Creating Trip...' : 'Create Trip & Proceed to Itinerary Builder →'}
            </button>
            <Link to="/dashboard" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>

        {/* Tree Hierarchy Path info */}
        <div className="shell-box" style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <h4>🗺️ Creation Funnel Path</h4>
          <p className="text-sm text-muted" style={{ margin: '0.5rem 0 0' }}>
            <strong>Create Trip</strong> → <strong>Itinerary Builder</strong> (Add stops & activities) → <strong>Itinerary View</strong> (Sub-Hub fanning out to Budget, Calendar & Share).
          </p>
        </div>
      </div>
    </div>
  );
}
