import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CreateTripPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    totalBudget: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/trips', formData);
      if (res.data?.id) {
        navigate(`/trips/${res.data.id}/builder`);
      } else {
        navigate('/trips');
      }
    } catch (err) {
      setError(err.message || 'Failed to create trip.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div className="shell-container" style={{ textAlign: 'left', padding: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1rem' }}>
          <div>
            <h2>Create Trip</h2>
            <p className="text-muted text-sm" style={{ margin: 0 }}>Start a new travel plan — Add stops, activities, and budget</p>
          </div>
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#dc2626', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="name">Trip Name *</label>
            <input
              id="name"
              type="text"
              className="input-field"
              placeholder="e.g. Japan Spring Loop 2026"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

          <div className="input-group">
            <label htmlFor="totalBudget">Target Budget ($ USD)</label>
            <input
              id="totalBudget"
              type="number"
              className="input-field"
              placeholder="e.g. 2500"
              value={formData.totalBudget}
              onChange={e => setFormData({ ...formData, totalBudget: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label htmlFor="description">Trip Description & Notes</label>
            <textarea
              id="description"
              className="input-field"
              rows={3}
              placeholder="Multi-city trip across Tokyo, Kyoto, and Osaka..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Creating Trip...' : 'Create Trip & Proceed to Itinerary Builder →'}
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
