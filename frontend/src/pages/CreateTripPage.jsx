import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

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

  const [popularCities, setPopularCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch real-time destinations from the database
  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      setLoadingCities(true);
      const res = await api.get('/cities?sort=popularityScore:desc&pageSize=8');
      if (res.data && Array.isArray(res.data)) {
        setPopularCities(res.data);
      }
    } catch (err) {
      console.error('Error fetching destinations from DB:', err);
    } finally {
      setLoadingCities(false);
    }
  };

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

  const handleApplyCityInspiration = (city) => {
    const defaultDays = 7;
    const estimatedDailyCost = (city.costIndex || 2) * 120;
    const calculatedBudget = estimatedDailyCost * defaultDays;

    setFormData(prev => ({
      ...prev,
      name: `Journey to ${city.name}`,
      description: city.description || `Exploring the culture, sights, and cuisine of ${city.name}, ${city.country}.`,
      coverPhotoUrl: city.imageUrl || prev.coverPhotoUrl,
      totalBudget: prev.totalBudget || String(calculatedBudget),
    }));
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
            <h2 style={{ margin: '0 0 0.25rem 0' }}>Plan a New Trip</h2>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Set up your journey title, travel dates, and target budget to start planning
            </p>
          </div>
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Realtime Popular Destinations from DB */}
        <div style={{ marginBottom: '1.75rem', backgroundColor: 'var(--bg-page)', padding: '1.15rem', borderRadius: '10px', border: '1px solid var(--border-passive)' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '0.6rem', color: 'var(--text-charcoal)' }}>
            ✨ Popular Destinations (Click to auto-fill from live database):
          </div>
          
          {loadingCities ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading top destinations...</div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {popularCities.map(city => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleApplyCityInspiration(city)}
                  className="filter-pill"
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  title={`Cost Index: ${city.costIndex}/5 • Region: ${city.region}`}
                >
                  📍 {city.name}, {city.country}
                </button>
              ))}
            </div>
          )}
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
              placeholder="e.g. Summer in Kyoto, European Highlights..."
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
              {loading ? 'Creating Trip...' : 'Create Trip & Proceed to Builder →'}
            </button>
            <Link to="/dashboard" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
