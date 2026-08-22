import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function CommunityPage() {
  const [communityTrips, setCommunityTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter Controls State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('createdAt:desc');
  const [selectedGroup, setSelectedGroup] = useState('none');

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  useEffect(() => {
    const fetchCommunityTrips = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/community/trips?sort=${selectedSort}`);
        if (res.data) {
          setCommunityTrips(res.data);
        }
      } catch (err) {
        console.error('Error fetching community trips:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityTrips();
  }, [selectedSort]);

  // Client-side search & filtering
  const filteredFeed = useMemo(() => {
    let result = [...communityTrips];

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.name?.toLowerCase().includes(s) || 
        t.description?.toLowerCase().includes(s) ||
        t.ownerDisplayName?.toLowerCase().includes(s)
      );
    }

    if (selectedFilter !== 'all') {
      result = result.filter(t => t.status?.toLowerCase() === selectedFilter.toLowerCase());
    }

    return result;
  }, [communityTrips, searchTerm, selectedFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* 1. Search Bar, Group by, Filter, Sort by Controls (Screen 10 Wireframe Top Bar) */}
      <div className="dashboard-controls-bar">
        {/* Search Input Field */}
        <div className="search-input-wrapper">
          <svg className="search-icon-prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input-field"
            placeholder="Search bar ...... (trips, experiences, destinations)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Action Dropdown Group */}
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
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-passive)',
                  borderRadius: '8px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                  padding: '6px',
                  zIndex: 20,
                  minWidth: '150px'
                }}
              >
                {['none', 'status'].map(opt => (
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
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-passive)',
                  borderRadius: '8px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                  padding: '6px',
                  zIndex: 20,
                  minWidth: '150px'
                }}
              >
                {['all', 'upcoming', 'completed'].map(opt => (
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
              <span>Sort by: {selectedSort.startsWith('createdAt') ? 'Recent' : selectedSort.startsWith('totalBudget') ? 'Budget' : 'Name'}</span>
              <span>▾</span>
            </button>

            {showSortDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-passive)',
                  borderRadius: '8px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                  padding: '6px',
                  zIndex: 20,
                  minWidth: '160px'
                }}
              >
                {[
                  { id: 'createdAt:desc', label: 'Recently Shared' },
                  { id: 'totalBudget:desc', label: 'Highest Budget' },
                  { id: 'name:asc', label: 'Trip Name (A-Z)' }
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

      {/* 2. Feed List: Circular Avatar on Left + Large Experience Card on Right (Screen 10 Wireframe) */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading community experiences from database...
        </div>
      ) : filteredFeed.length > 0 ? (
        <div className="community-feed">
          {filteredFeed.map(trip => {
            const authorInitial = trip.owner?.firstName?.[0] || trip.ownerDisplayName?.[0] || 'T';

            return (
              <div key={trip.id} className="community-post-row">
                
                {/* Left Author Circle */}
                <div className="community-avatar-col">
                  <div className="community-user-avatar">
                    {authorInitial}
                  </div>
                </div>

                {/* Right Post / Experience Card */}
                <div className="community-post-card">
                  
                  <div className="community-post-header">
                    <div>
                      <div className="community-post-title">{trip.name}</div>
                      <div className="community-post-author">
                        Shared by <strong>{trip.ownerDisplayName}</strong> • {new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="nav-badge" style={{ backgroundColor: 'rgba(13, 92, 70, 0.1)', color: 'var(--accent-green)', textTransform: 'capitalize' }}>
                      {trip.status || 'Public'}
                    </span>
                  </div>

                  <p className="community-post-desc">
                    {trip.description || 'Traveler journey with custom stops, local recommendations, and scheduled activities.'}
                  </p>

                  <div className="community-post-footer">
                    <div>
                      <span className="text-xs text-muted" style={{ display: 'block' }}>Estimated Budget</span>
                      <span style={{ fontWeight: '600', color: 'var(--accent-green)', fontSize: '15px' }}>
                        {trip.totalBudget ? `$${trip.totalBudget}` : 'Flexible'}
                      </span>
                    </div>

                    <div className="community-post-actions">
                      <Link to={trip.shareToken ? `/shared/${trip.shareToken}` : `/trips/${trip.id}/itinerary`} className="btn btn-secondary btn-sm">
                        View Public Plan
                      </Link>
                      {trip.shareToken ? (
                        <Link to={`/shared/${trip.shareToken}`} className="btn btn-primary btn-sm">
                          Copy Trip
                        </Link>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={async () => {
                            try {
                              const res = await api.post(`/trips/${trip.id}/copy`);
                              if (res.data?.id) {
                                alert('🎉 Trip copied successfully to your account!');
                                window.location.href = `/trips/${res.data.id}/builder`;
                              }
                            } catch (err) {
                              alert('Failed to copy trip. Make sure you are logged in.');
                            }
                          }}
                        >
                          Copy Trip
                        </button>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="shell-container">
          <div style={{ fontSize: '32px', marginBottom: '0.5rem' }}>🌍</div>
          <h3>No community experiences match your search</h3>
          <p className="text-muted text-sm" style={{ maxWidth: '450px', margin: '0.5rem auto 1.5rem' }}>
            Try adjusting your search keywords or filter options.
          </p>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedFilter('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

    </div>
  );
}
