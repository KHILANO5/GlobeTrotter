import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CalendarIcon, LuggageIcon } from '../components/common/Icons';

// Curated destination imagery for regional selections
const CITY_IMAGES = {
  Tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
  Paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80',
  Rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80',
  Barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop&q=80',
  Kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80',
  Amsterdam: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=600&auto=format&fit=crop&q=80',
  Lisbon: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&auto=format&fit=crop&q=80',
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&auto=format&fit=crop&q=80',
  Bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&auto=format&fit=crop&q=80',
  Bangkok: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80'
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cities, setCities] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popularity');
  const [selectedGroup, setSelectedGroup] = useState('none');

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  const controlsRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (controlsRef.current && !controlsRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
        setShowSortDropdown(false);
        setShowGroupDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch top regional selection cities from live PostgreSQL DB
        const citiesRes = await api.get('/cities?pageSize=20&sort=popularityScore:desc');
        if (citiesRes.data) {
          setCities(citiesRes.data);
        }

        // Fetch user's previous/recent trips from live PostgreSQL DB
        const tripsRes = await api.get('/trips?pageSize=10&sort=startDate:asc');
        if (tripsRes.data) {
          setTrips(tripsRes.data);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Filtered Cities (Top Regional Selections)
  const filteredCities = useMemo(() => {
    let result = [...cities];

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(s) || 
        c.country.toLowerCase().includes(s) ||
        (c.region && c.region.toLowerCase().includes(s))
      );
    }

    if (selectedFilter !== 'all') {
      if (['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'].includes(selectedFilter)) {
        result = result.filter(c => c.region?.toLowerCase() === selectedFilter.toLowerCase());
      }
    }

    if (selectedSort === 'popularity') {
      result.sort((a, b) => b.popularityScore - a.popularityScore);
    } else if (selectedSort === 'costAsc') {
      result.sort((a, b) => parseFloat(a.costIndex || 0) - parseFloat(b.costIndex || 0));
    } else if (selectedSort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result.slice(0, 5); // Display top 5 cards as shown in wireframe
  }, [cities, searchTerm, selectedFilter, selectedSort]);

  // Filtered Previous Trips
  const filteredTrips = useMemo(() => {
    let result = [...trips];

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(s) || 
        (t.description && t.description.toLowerCase().includes(s))
      );
    }

    if (['upcoming', 'ongoing', 'completed'].includes(selectedFilter)) {
      result = result.filter(t => t.status?.toLowerCase() === selectedFilter);
    }

    return result.slice(0, 3); // Display 3 vertical cards as shown in wireframe
  }, [trips, searchTerm, selectedFilter]);

  const displayName = user?.firstName || user?.fullName?.split(' ')[0] || 'Traveler';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Large Hero Banner Image (Wireframe Component 1) */}
      <div className="dashboard-banner">
        <div className="banner-content">
          <div className="banner-title">Explore. Plan. Journey.</div>
          <div className="banner-tagline">
            Welcome back, <strong>{displayName}</strong>. Your personalized multi-city travel planning hub.
          </div>
        </div>
      </div>

      {/* 2. Search Bar, Group by, Filter, Sort by Controls (Wireframe Component 2) */}
      <div className="dashboard-controls-bar" ref={controlsRef}>
        
        {/* Search input field */}
        <div className="search-input-wrapper">
          <svg className="search-icon-prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input-field"
            placeholder="Search bar ...... (cities, regions, trips)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter / Group / Sort Actions */}
        <div className="filter-btn-group">
          
          {/* Group by */}
          <div style={{ position: 'relative' }}>
            <button 
              type="button"
              className={`btn btn-ghost btn-sm ${selectedGroup !== 'none' ? 'btn-primary' : ''}`}
              onClick={() => {
                setShowGroupDropdown(!showGroupDropdown);
                setShowFilterDropdown(false);
                setShowSortDropdown(false);
              }}
            >
              <span>Group by: {selectedGroup === 'none' ? 'Default' : selectedGroup}</span>
              <span>▾</span>
            </button>

            {showGroupDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-passive)',
                  borderRadius: '8px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                  padding: '6px',
                  zIndex: 40,
                  minWidth: '150px'
                }}
              >
                {['none', 'status', 'region'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 10px',
                      background: selectedGroup === opt ? 'rgba(28,28,28,0.06)' : 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textTransform: 'capitalize'
                    }}
                    onClick={() => {
                      setSelectedGroup(opt);
                      setShowGroupDropdown(false);
                    }}
                  >
                    {opt === 'none' ? 'No Grouping' : `Group by ${opt}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter */}
          <div style={{ position: 'relative' }}>
            <button 
              type="button"
              className={`btn btn-ghost btn-sm ${selectedFilter !== 'all' ? 'btn-primary' : ''}`}
              onClick={() => {
                setShowFilterDropdown(!showFilterDropdown);
                setShowGroupDropdown(false);
                setShowSortDropdown(false);
              }}
            >
              <span>Filter: {selectedFilter === 'all' ? 'All' : selectedFilter}</span>
              <span>▾</span>
            </button>

            {showFilterDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-passive)',
                  borderRadius: '8px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                  padding: '6px',
                  zIndex: 40,
                  minWidth: '160px'
                }}
              >
                {['all', 'Asia', 'Europe', 'North America', 'upcoming', 'completed'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 10px',
                      background: selectedFilter === opt ? 'rgba(28,28,28,0.06)' : 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textTransform: 'capitalize'
                    }}
                    onClick={() => {
                      setSelectedFilter(opt);
                      setShowFilterDropdown(false);
                    }}
                  >
                    {opt === 'all' ? 'Show All' : opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort by */}
          <div style={{ position: 'relative' }}>
            <button 
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                setShowFilterDropdown(false);
                setShowGroupDropdown(false);
              }}
            >
              <span>Sort by: {selectedSort === 'popularity' ? 'Popularity' : selectedSort === 'costAsc' ? 'Budget' : 'Name'}</span>
              <span>▾</span>
            </button>

            {showSortDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-passive)',
                  borderRadius: '8px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                  padding: '6px',
                  zIndex: 40,
                  minWidth: '160px'
                }}
              >
                {[
                  { id: 'popularity', label: 'Popularity Score' },
                  { id: 'costAsc', label: 'Lowest Cost Index' },
                  { id: 'name', label: 'Alphabetical (A-Z)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 10px',
                      background: selectedSort === opt.id ? 'rgba(28,28,28,0.06)' : 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                    onClick={() => {
                      setSelectedSort(opt.id);
                      setShowSortDropdown(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. Section: Top Regional Selections (Wireframe Component 3) */}
      <div>
        <div className="section-divider-header">
          <div className="section-divider-title">Top Regional Selections</div>
          <div className="section-divider-line"></div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading top regional destinations...
          </div>
        ) : filteredCities.length > 0 ? (
          <div className="regional-selections-grid">
            {filteredCities.map(city => {
              const imgUrl = CITY_IMAGES[city.name] || city.imageUrl || CITY_IMAGES.default;
              return (
                <Link
                  key={city.id}
                  to="/trips/new"
                  className="regional-card"
                  title={`Plan a trip to ${city.name}`}
                >
                  <img
                    src={imgUrl}
                    alt={city.name}
                    className="regional-card-img"
                    onError={(e) => {
                      e.target.src = CITY_IMAGES.default;
                    }}
                  />
                  <div className="regional-card-body">
                    <div>
                      <div className="regional-card-name">{city.name}</div>
                      <div className="regional-card-country">{city.country}</div>
                    </div>
                    <div className="regional-card-meta">
                      <span className="regional-score">★ {city.popularityScore}</span>
                      <span className="text-muted">${city.costIndex} index</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="shell-container" style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              No destinations found matching "{searchTerm}".
            </p>
          </div>
        )}
      </div>

      {/* 4. Section: Previous Trips (Wireframe Component 4) */}
      <div>
        <div className="section-divider-header">
          <div className="section-divider-title">Previous Trips</div>
          <div className="section-divider-line"></div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading trips...
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="previous-trips-grid">
            {filteredTrips.map(trip => (
              <Link
                key={trip.id}
                to={`/trips/${trip.id}/itinerary`}
                className="previous-trip-card"
              >
                <img
                  src={trip.coverPhotoUrl || CITY_IMAGES.default}
                  alt={trip.name}
                  className="trip-card-cover"
                  onError={(e) => {
                    e.target.src = CITY_IMAGES.default;
                  }}
                />
                <div className="trip-card-content">
                  <div>
                    <div className="trip-card-header">
                      <div className="trip-card-title">{trip.name}</div>
                      <span className="nav-badge" style={{ textTransform: 'capitalize' }}>
                        {trip.status}
                      </span>
                    </div>

                    <div className="trip-card-dates" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarIcon size={12} />
                      <span>{new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}</span>
                    </div>

                    <p className="trip-card-desc">
                      {trip.description || 'Custom multi-city travel itinerary with day-by-day stops and activities.'}
                    </p>
                  </div>

                  <div className="trip-card-bottom">
                    <span className="trip-card-budget">
                      {trip.totalBudget ? `$${parseFloat(trip.totalBudget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Budget unset'}
                    </span>
                    <span style={{ fontWeight: '500', color: 'var(--text-charcoal)' }}>
                      View Plan →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="shell-container" style={{ padding: '2.5rem 1rem' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <LuggageIcon size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h4>No trips found matching filter</h4>
            <p className="text-muted text-sm" style={{ margin: '0.25rem 0 1rem' }}>
              Start building your first custom journey with stops and activities.
            </p>
            <Link to="/trips/new" className="btn btn-primary btn-sm">
              + Plan a trip
            </Link>
          </div>
        )}
      </div>

      {/* 5. Bottom Right Floating/Pinned Action: + Plan a trip (Wireframe Component 5) */}
      <div className="dashboard-bottom-actions">
        <Link to="/trips/new" className="btn-plan-trip-cta">
          <span style={{ fontSize: '18px' }}>+</span>
          <span>Plan a trip</span>
        </Link>
      </div>

    </div>
  );
}
