import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function CitySearchModal({ isOpen, onClose, onSelectCity, tripDates }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form fields for new stop creation
  const [selectedCity, setSelectedCity] = useState(null);
  const [stopTitle, setStopTitle] = useState('');
  const [stopType, setStopType] = useState('city_stop');
  const [startDate, setStartDate] = useState(tripDates?.startDate || '');
  const [endDate, setEndDate] = useState(tripDates?.endDate || '');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCities();
      if (tripDates) {
        setStartDate(tripDates.startDate || '');
        setEndDate(tripDates.endDate || '');
      }
    }
  }, [isOpen, selectedRegion, tripDates]);

  const fetchCities = async () => {
    try {
      setLoading(true);
      let url = '/cities?pageSize=30&sort=popularityScore:desc';
      if (selectedRegion !== 'All') {
        url += `&region=${encodeURIComponent(selectedRegion)}`;
      }
      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      }
      const res = await api.get(url);
      if (res.data) {
        setCities(res.data);
      }
    } catch (err) {
      console.error('Error loading cities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCities();
  };

  const handlePickCity = (city) => {
    setSelectedCity(city);
    setStopTitle(city ? `Visit ${city.name}` : '');
  };

  const handleConfirm = () => {
    if (!stopTitle.trim()) {
      alert('Please provide a title for this stop.');
      return;
    }
    if (!startDate || !endDate) {
      alert('Please specify start and end dates for this stop.');
      return;
    }
    if (endDate < startDate) {
      alert('Stop end date cannot be earlier than start date.');
      return;
    }
    if (budget !== '' && (isNaN(Number(budget)) || Number(budget) < 0)) {
      alert('Section budget must be a positive number or 0.');
      return;
    }

    onSelectCity({
      cityId: selectedCity?.id || null,
      cityName: selectedCity?.name || null,
      cityCountry: selectedCity?.country || null,
      type: stopType,
      title: stopTitle.trim(),
      description: description.trim() || null,
      startDate,
      endDate,
      budget: budget !== '' ? parseFloat(budget) : null,
    });

    // Reset and close
    setSelectedCity(null);
    setStopTitle('');
    setDescription('');
    setBudget('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '0.75rem' }}>
          <div>
            <h3>Add Stop / Section</h3>
            <p className="text-sm text-muted" style={{ margin: 0 }}>Select a destination or define a custom travel leg</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Region Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {['All', 'Asia', 'Europe', 'North America', 'South America', 'Middle East', 'Africa', 'Oceania'].map(region => (
            <button
              key={region}
              type="button"
              onClick={() => setSelectedRegion(region)}
              className={`filter-pill ${selectedRegion === region ? 'active' : ''}`}
              style={{ fontSize: '12px' }}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search destination cities (e.g. Tokyo, Paris, Rome)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>

        {/* City Grid Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
            1. Select Destination City (Optional for generic travel/hotel sections):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto', padding: '4px' }}>
            {loading ? (
              <p className="text-sm text-muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem' }}>Loading cities...</p>
            ) : cities.map(c => {
              const isSelected = selectedCity?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handlePickCity(c)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--text-primary)' : '1px solid var(--border-passive)',
                    backgroundColor: isSelected ? 'rgba(28, 28, 28, 0.05)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.name}</div>
                  <div className="text-sm text-muted" style={{ fontSize: '12px' }}>{c.country} • {c.region}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '11px' }}>
                    <span style={{ color: 'var(--accent-terra)', fontWeight: '600' }}>★ {c.popularityScore}</span>
                    <span className="text-muted">Cost Index: {c.costIndex || '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stop Details Configuration */}
        <div style={{ backgroundColor: 'var(--bg-page)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-passive)' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>2. Configure Stop Details</h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Section Title *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Tokyo Stop, Hotel Stay, Flight to Rome"
                value={stopTitle}
                onChange={e => setStopTitle(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label>Section Type</label>
              <select
                className="input-field"
                value={stopType}
                onChange={e => setStopType(e.target.value)}
              >
                <option value="city_stop">City Stop</option>
                <option value="travel">Travel / Flight Leg</option>
                <option value="lodging">Lodging / Hotel Stay</option>
                <option value="activity_block">Activity Block</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Start Date *</label>
              <input
                type="date"
                className="input-field"
                min={tripDates?.startDate}
                max={tripDates?.endDate}
                value={startDate}
                onChange={e => {
                  const newStart = e.target.value;
                  setStartDate(newStart);
                  if (endDate && endDate < newStart) {
                    setEndDate(newStart);
                  }
                }}
                required
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label>End Date *</label>
              <input
                type="date"
                className="input-field"
                min={startDate || tripDates?.startDate}
                max={tripDates?.endDate}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label>Section Budget ($)</label>
              <input
                type="number"
                min="0"
                step="any"
                className="input-field"
                placeholder="e.g. 800"
                value={budget}
                onChange={e => setBudget(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label>Notes / Description (Optional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Arrive at Narita, stay in Shinjuku..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleConfirm}>
            Add Stop to Itinerary →
          </button>
        </div>
      </div>
    </div>
  );
}
