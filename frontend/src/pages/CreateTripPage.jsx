import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MapPinIcon, CalendarIcon, CompassIcon, AlertCircleIcon } from '../components/common/Icons';

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

  const [selectedFile, setSelectedFile] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [popularCities, setPopularCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [previewImageError, setPreviewImageError] = useState(false);

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

  // Helper to validate and calculate duration
  const durationInfo = useMemo(() => {
    if (!formData.startDate || !formData.endDate) {
      return { valid: false, text: 'Select start and end dates' };
    }
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { valid: false, text: 'Invalid date format' };
    }

    if (formData.startDate < today) {
      return { valid: false, text: 'Start date cannot be in the past' };
    }

    if (end < start) {
      return { valid: false, text: 'End date cannot be earlier than start date' };
    }

    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > 365) {
      return { valid: false, text: 'Trip duration exceeds maximum limit of 365 days' };
    }

    if (diffDays === 1) {
      return { valid: true, text: '1 Day (Single day journey)', days: 1 };
    }

    return { valid: true, text: `${diffDays} Days / ${diffDays - 1} Nights`, days: diffDays };
  }, [formData.startDate, formData.endDate, today]);

  // Handle Input Changes & Clear Specific Field Error
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (field === 'coverPhotoUrl') {
      setPreviewImageError(false);
      if (!value.startsWith('blob:')) {
        setSelectedFile(null); // Clear selected file if user manually types a URL
      }
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      handleChange('coverPhotoUrl', URL.createObjectURL(file));
    }
  };

  // Apply a popular destination from DB
  const handleApplyCityInspiration = (city) => {
    const estimatedDailyCost = (city.costIndex || 2) * 120;
    const defaultDays = durationInfo.valid && durationInfo.days ? durationInfo.days : 7;
    const calculatedBudget = estimatedDailyCost * defaultDays;

    setFormData(prev => ({
      ...prev,
      name: `Journey to ${city.name}`,
      description: city.description || `Exploring the culture, sights, and cuisine of ${city.name}, ${city.country}.`,
      coverPhotoUrl: city.imageUrl || prev.coverPhotoUrl,
      totalBudget: prev.totalBudget ? prev.totalBudget : String(calculatedBudget),
    }));

    setFieldErrors({});
    setPreviewImageError(false);
  };

  // Client-side Validation for all edge cases
  const validateForm = () => {
    const errors = {};

    // 1. Name
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errors.name = 'Trip name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Trip name must be at least 2 characters long.';
    } else if (trimmedName.length > 120) {
      errors.name = 'Trip name cannot exceed 120 characters.';
    }

    // 2. Dates
    if (!formData.startDate) {
      errors.startDate = 'Start date is required.';
    } else if (formData.startDate < today) {
      errors.startDate = 'Start date cannot be in the past. Please select today or a future date.';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required.';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (isNaN(start.getTime())) {
        errors.startDate = 'Invalid start date.';
      }
      if (isNaN(end.getTime())) {
        errors.endDate = 'Invalid end date.';
      }
      if (end < start) {
        errors.endDate = 'End date cannot be earlier than start date (duration cannot be negative).';
      } else {
        const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > 365) {
          errors.endDate = 'Maximum trip duration is 365 days (1 year).';
        }
      }
    }

    // 3. Budget
    if (formData.totalBudget !== '' && formData.totalBudget !== null) {
      const budgetNum = Number(formData.totalBudget);
      if (isNaN(budgetNum) || budgetNum < 0) {
        errors.totalBudget = 'Budget must be a valid positive number (or 0).';
      } else if (budgetNum > 10000000) {
        errors.totalBudget = 'Budget cannot exceed $10,000,000.';
      }
    }

    // 4. Cover Photo URL Validation
    if (formData.coverPhotoUrl && formData.coverPhotoUrl.trim()) {
      const url = formData.coverPhotoUrl.trim();
      const isHttp = /^https?:\/\//i.test(url);
      const isData = url.startsWith('data:image/');
      const isBlob = url.startsWith('blob:');
      if (!isHttp && !isData && !isBlob) {
        errors.coverPhotoUrl = 'Please enter a valid URL starting with http:// or https://';
      }
    }

    // 5. Description
    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      if (formData.description?.trim()) submitData.append('description', formData.description.trim());
      submitData.append('startDate', formData.startDate);
      submitData.append('endDate', formData.endDate);
      if (formData.totalBudget !== '') submitData.append('totalBudget', parseFloat(formData.totalBudget));
      
      if (selectedFile) {
        submitData.append('coverPhoto', selectedFile);
      } else if (formData.coverPhotoUrl?.trim()) {
        submitData.append('coverPhotoUrl', formData.coverPhotoUrl.trim());
      }

      const res = await api.post('/trips', submitData);

      if (res.data?.id) {
        navigate(`/trips/${res.data.id}/builder`);
      } else {
        navigate('/trips');
      }
    } catch (err) {
      console.error('Error creating trip:', err);
      setGeneralError(err.message || 'Failed to create trip. Please try again.');
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
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '0.6rem', color: 'var(--text-charcoal)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CompassIcon size={15} style={{ color: 'var(--accent-terra)' }} />
            <span>Popular Destinations (Click to auto-fill from live database):</span>
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
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  title={`Cost Index: ${city.costIndex}/5 • Region: ${city.region}`}
                >
                  <MapPinIcon size={12} style={{ color: 'var(--accent-terra)' }} />
                  <span>{city.name}, {city.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {generalError && (
          <div style={{ padding: '0.85rem 1.15rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#dc2626', marginBottom: '1.5rem', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircleIcon size={16} />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Trip Name */}
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="name">Trip Name *</label>
              <span style={{ fontSize: '11px', color: formData.name.length > 120 ? '#dc2626' : 'var(--text-muted)' }}>
                {formData.name.length}/120
              </span>
            </div>
            <input
              id="name"
              type="text"
              className={`input-field ${fieldErrors.name ? 'input-error' : ''}`}
              placeholder="e.g. Summer in Kyoto, European Highlights..."
              value={formData.name}
              maxLength={120}
              onChange={e => handleChange('name', e.target.value)}
              required
            />
            {fieldErrors.name && (
              <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {fieldErrors.name}
              </span>
            )}
          </div>

          {/* Date Picker with Live Counter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="input-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                id="startDate"
                type="date"
                min={today}
                className={`input-field ${fieldErrors.startDate ? 'input-error' : ''}`}
                value={formData.startDate}
                onChange={e => {
                  const newStart = e.target.value;
                  handleChange('startDate', newStart);
                  if (formData.endDate && formData.endDate < newStart) {
                    handleChange('endDate', newStart);
                  }
                }}
                required
              />
              {fieldErrors.startDate && (
                <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.startDate}
                </span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="endDate">End Date *</label>
              <input
                id="endDate"
                type="date"
                className={`input-field ${fieldErrors.endDate ? 'input-error' : ''}`}
                value={formData.endDate}
                min={formData.startDate || today}
                onChange={e => handleChange('endDate', e.target.value)}
                required
              />
              {fieldErrors.endDate && (
                <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.endDate}
                </span>
              )}
            </div>
          </div>

          {/* Duration Status Pill */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem',
                backgroundColor: durationInfo.valid ? 'rgba(46, 125, 50, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                color: durationInfo.valid ? 'var(--accent-green)' : '#dc2626',
                border: `1px solid ${durationInfo.valid ? 'rgba(46, 125, 50, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              {durationInfo.valid ? <CalendarIcon size={14} /> : <AlertCircleIcon size={14} />}
              <span>{durationInfo.valid ? 'Calculated Duration:' : 'Date Range:'} {durationInfo.text}</span>
            </div>
          </div>

          {/* Target Budget & Cover Photo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="input-group">
              <label htmlFor="totalBudget">Target Budget ($ USD)</label>
              <input
                id="totalBudget"
                type="number"
                min="0"
                max="10000000"
                step="any"
                className={`input-field ${fieldErrors.totalBudget ? 'input-error' : ''}`}
                placeholder="e.g. 2500"
                value={formData.totalBudget}
                onChange={e => handleChange('totalBudget', e.target.value)}
              />
              {fieldErrors.totalBudget && (
                <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.totalBudget}
                </span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="coverPhotoUrl">Cover Photo (Upload or URL)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  id="coverPhotoUrl"
                  type="url"
                  className={`input-field ${fieldErrors.coverPhotoUrl ? 'input-error' : ''}`}
                  placeholder="https://..."
                  value={formData.coverPhotoUrl && formData.coverPhotoUrl.startsWith('blob:') ? 'Local file selected' : formData.coverPhotoUrl}
                  onChange={e => handleChange('coverPhotoUrl', e.target.value)}
                  readOnly={formData.coverPhotoUrl && formData.coverPhotoUrl.startsWith('blob:')}
                  style={{ flex: 1 }}
                />
                <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 1rem', whiteSpace: 'nowrap' }}>
                  <span>Upload Image</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>
              </div>
              {fieldErrors.coverPhotoUrl && (
                <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.coverPhotoUrl}
                </span>
              )}
            </div>
          </div>

          {/* Image Thumbnail Preview */}
          {formData.coverPhotoUrl && !fieldErrors.coverPhotoUrl && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-page)', borderRadius: '8px', border: '1px solid var(--border-passive)' }}>
              {!previewImageError ? (
                <img
                  src={formData.coverPhotoUrl}
                  alt="Trip cover preview"
                  onError={() => setPreviewImageError(true)}
                  style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                />
              ) : (
                <div style={{ width: '80px', height: '50px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  No Preview
                </div>
              )}
              <div style={{ flex: 1, fontSize: '12px' }}>
                <div style={{ fontWeight: '600', color: 'var(--text-charcoal)' }}>Cover Image Preview</div>
                <div style={{ color: previewImageError ? '#dc2626' : 'var(--text-muted)' }}>
                  {previewImageError ? 'Unable to load image preview from this URL' : 'Image loaded successfully'}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => handleChange('coverPhotoUrl', '')}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Remove
              </button>
            </div>
          )}

          {/* Description */}
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="description">Trip Description & Highlights</label>
              <span style={{ fontSize: '11px', color: formData.description.length > 1000 ? '#dc2626' : 'var(--text-muted)' }}>
                {formData.description.length}/1000
              </span>
            </div>
            <textarea
              id="description"
              className={`input-field ${fieldErrors.description ? 'input-error' : ''}`}
              rows={3}
              maxLength={1000}
              placeholder="Notes about destinations, packing lists, flight references, or companions..."
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
            />
            {fieldErrors.description && (
              <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {fieldErrors.description}
              </span>
            )}
          </div>

          {/* Submit Action with Double-Click Protection */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={loading || !durationInfo.valid}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Creating Trip...
                </>
              ) : (
                'Create Trip & Proceed to Builder →'
              )}
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
