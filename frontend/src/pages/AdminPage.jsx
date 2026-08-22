import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function AdminPage() {
  // Active Tab: 'analytics', 'users', 'cities', 'activities'
  const [activeTab, setActiveTab] = useState('analytics');

  // Search & Filter controls State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('none');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('recent');

  // Dropdown Open States
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Data States
  const [analyticsData, setAnalyticsData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [popularCities, setPopularCities] = useState([]);
  const [popularActivities, setPopularActivities] = useState([]);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected User for Trips Inspection Modal
  const [inspectUser, setInspectUser] = useState(null);
  const [userTrips, setUserTrips] = useState([]);
  const [loadingUserTrips, setLoadingUserTrips] = useState(false);

  // Fetch all admin data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [engRes, usersRes, citiesRes, actRes] = await Promise.all([
        api.get('/admin/analytics/engagement').catch(() => ({ data: null })),
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/admin/analytics/popular-cities').catch(() => ({ data: [] })),
        api.get('/admin/analytics/popular-activities').catch(() => ({ data: [] }))
      ]);

      if (engRes?.data) setAnalyticsData(engRes.data);
      if (usersRes?.data) setUsersList(usersRes.data);
      if (citiesRes?.data) setPopularCities(citiesRes.data);
      if (actRes?.data) setPopularActivities(actRes.data);
    } catch (err) {
      console.error('Error fetching admin panel data:', err);
      setError('Failed to load admin data. Please verify your admin access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.controls-dropdown-container')) {
        setShowGroupDropdown(false);
        setShowFilterDropdown(false);
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Inspect User Trips
  const handleInspectUserTrips = async (user) => {
    setInspectUser(user);
    setLoadingUserTrips(true);
    try {
      const res = await api.get(`/admin/users/${user.id}/trips`);
      setUserTrips(res.data || []);
    } catch (err) {
      console.error('Error loading user trips:', err);
      setUserTrips([]);
    } finally {
      setLoadingUserTrips(false);
    }
  };

  // Filtered and Sorted Users
  const filteredUsers = useMemo(() => {
    let list = [...usersList];
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter(u =>
        (u.fullName && u.fullName.toLowerCase().includes(s)) ||
        (u.email && u.email.toLowerCase().includes(s)) ||
        (u.username && u.username.toLowerCase().includes(s))
      );
    }
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'admin') list = list.filter(u => u.role?.toLowerCase() === 'admin');
      if (selectedFilter === 'user') list = list.filter(u => u.role?.toLowerCase() === 'user');
      if (selectedFilter === 'verified') list = list.filter(u => u.isVerified);
      if (selectedFilter === 'unverified') list = list.filter(u => !u.isVerified);
    }
    if (selectedSort === 'trips') {
      list.sort((a, b) => (b.tripCount || 0) - (a.tripCount || 0));
    } else if (selectedSort === 'name') {
      list.sort((a, b) => (a.fullName || a.username || '').localeCompare(b.fullName || b.username || ''));
    } else if (selectedSort === 'recent') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [usersList, searchTerm, selectedFilter, selectedSort]);

  // Filtered and Sorted Cities
  const filteredCities = useMemo(() => {
    let list = [...popularCities];
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter(c =>
        (c.name && c.name.toLowerCase().includes(s)) ||
        (c.country && c.country.toLowerCase().includes(s)) ||
        (c.region && c.region.toLowerCase().includes(s))
      );
    }
    if (selectedSort === 'trips' || selectedSort === 'recent') {
      list.sort((a, b) => (b.tripCount - a.tripCount) || (b.popularityScore - a.popularityScore));
    } else if (selectedSort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedSort === 'cost') {
      list.sort((a, b) => parseFloat(a.costIndex || 0) - parseFloat(b.costIndex || 0));
    }
    return list;
  }, [popularCities, searchTerm, selectedSort]);

  // Filtered and Sorted Activities
  const filteredActivities = useMemo(() => {
    let list = [...popularActivities];
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter(a =>
        (a.name && a.name.toLowerCase().includes(s)) ||
        (a.category && a.category.toLowerCase().includes(s)) ||
        (a.cityName && a.cityName.toLowerCase().includes(s))
      );
    }
    if (selectedFilter !== 'all' && ['sightseeing', 'food', 'adventure', 'culture', 'nightlife', 'relaxation'].includes(selectedFilter.toLowerCase())) {
      list = list.filter(a => a.category?.toLowerCase() === selectedFilter.toLowerCase());
    }
    if (selectedSort === 'trips' || selectedSort === 'recent') {
      list.sort((a, b) => (b.addCount - a.addCount) || a.name.localeCompare(b.name));
    } else if (selectedSort === 'cost') {
      list.sort((a, b) => parseFloat(a.estimatedCost || 0) - parseFloat(b.estimatedCost || 0));
    } else if (selectedSort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [popularActivities, searchTerm, selectedFilter, selectedSort]);

  // Total trips status numbers for Pie Chart
  const statusBreakdown = analyticsData?.statusBreakdown || [
    { name: 'Upcoming', value: 0, color: '#3b82f6' },
    { name: 'Ongoing', value: 0, color: '#10b981' },
    { name: 'Completed', value: 0, color: '#8b5cf6' }
  ];
  const totalStatusCount = statusBreakdown.reduce((acc, s) => acc + s.value, 0) || 1;

  // Category counts for Bar Chart
  const categoryBreakdown = analyticsData?.categoryBreakdown || [];
  const maxCategoryCount = Math.max(...categoryBreakdown.map(c => c.count), 1);

  // Group label helper
  const getGroupLabel = () => {
    if (selectedGroup === 'none') return 'Default';
    if (selectedGroup === 'role') return 'Role';
    if (selectedGroup === 'status') return 'Status';
    if (selectedGroup === 'region') return 'Region / Category';
    return selectedGroup;
  };

  // Filter label helper
  const getFilterLabel = () => {
    if (selectedFilter === 'all') return 'All';
    if (selectedFilter === 'admin') return 'Admins Only';
    if (selectedFilter === 'user') return 'Regular Users';
    if (selectedFilter === 'verified') return 'Verified';
    if (selectedFilter === 'unverified') return 'Unverified';
    return selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1);
  };

  // Sort label helper
  const getSortLabel = () => {
    if (selectedSort === 'recent') return 'Recent';
    if (selectedSort === 'trips') return 'Most Trips / Activity';
    if (selectedSort === 'name') return 'Name (A-Z)';
    if (selectedSort === 'cost') return 'Cost / Budget';
    return selectedSort;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── Top Title & Actions Bar ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Admin Panel / Analytics Hub</h2>
          <p className="text-muted text-sm">System metrics overview, user trip inspection, and trend monitoring</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchAllData} className="btn btn-ghost btn-sm" title="Refresh Dashboard Data">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            Refresh
          </button>
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            ← Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 16px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171', borderRadius: '8px', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Proper Horizontal Controls Bar (Matching Screen Wireframe) ────────── */}
      <div className="dashboard-controls-bar">
        {/* Search input field */}
        <div className="search-input-wrapper">
          <svg className="search-icon-prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input-field"
            placeholder="Search bar ...... (users, emails, cities, activities, metrics)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dropdown controls group aligned horizontally */}
        <div className="filter-btn-group">
          {/* Group by */}
          <div className="controls-dropdown-container" style={{ position: 'relative' }}>
            <button
              type="button"
              className={`btn btn-ghost btn-sm ${selectedGroup !== 'none' ? 'btn-primary' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowGroupDropdown(!showGroupDropdown);
                setShowFilterDropdown(false);
                setShowSortDropdown(false);
              }}
            >
              <span>Group by: {getGroupLabel()}</span>
              <span>▾</span>
            </button>

            {showGroupDropdown && (
              <div style={{ position: 'absolute', top: '110%', left: 0, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-passive)', borderRadius: '8px', padding: '6px', minWidth: '170px', zIndex: 50, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }}>
                {[
                  { key: 'none', label: 'Default' },
                  { key: 'role', label: 'Role' },
                  { key: 'status', label: 'Status' },
                  { key: 'region', label: 'Region / Category' },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => { setSelectedGroup(item.key); setShowGroupDropdown(false); }}
                    style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', cursor: 'pointer', backgroundColor: selectedGroup === item.key ? 'var(--bg-hover)' : 'transparent', fontWeight: selectedGroup === item.key ? '600' : '400' }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter */}
          <div className="controls-dropdown-container" style={{ position: 'relative' }}>
            <button
              type="button"
              className={`btn btn-ghost btn-sm ${selectedFilter !== 'all' ? 'btn-primary' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowFilterDropdown(!showFilterDropdown);
                setShowGroupDropdown(false);
                setShowSortDropdown(false);
              }}
            >
              <span>Filter: {getFilterLabel()}</span>
              <span>▾</span>
            </button>

            {showFilterDropdown && (
              <div style={{ position: 'absolute', top: '110%', left: 0, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-passive)', borderRadius: '8px', padding: '6px', minWidth: '170px', zIndex: 50, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }}>
                {[
                  { key: 'all', label: 'All' },
                  ...(activeTab === 'users' ? [
                    { key: 'admin', label: 'Admins Only' },
                    { key: 'user', label: 'Regular Users' },
                    { key: 'verified', label: 'Verified Accounts' },
                    { key: 'unverified', label: 'Unverified Accounts' },
                  ] : []),
                  ...(activeTab === 'activities' ? [
                    { key: 'sightseeing', label: 'Sightseeing' },
                    { key: 'food', label: 'Food & Dining' },
                    { key: 'adventure', label: 'Adventure' },
                    { key: 'culture', label: 'Culture' },
                    { key: 'nightlife', label: 'Nightlife' },
                    { key: 'relaxation', label: 'Relaxation' },
                  ] : [])
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => { setSelectedFilter(item.key); setShowFilterDropdown(false); }}
                    style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', cursor: 'pointer', backgroundColor: selectedFilter === item.key ? 'var(--bg-hover)' : 'transparent', fontWeight: selectedFilter === item.key ? '600' : '400' }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sort by */}
          <div className="controls-dropdown-container" style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowSortDropdown(!showSortDropdown);
                setShowGroupDropdown(false);
                setShowFilterDropdown(false);
              }}
            >
              <span>Sort by: {getSortLabel()}</span>
              <span>▾</span>
            </button>

            {showSortDropdown && (
              <div style={{ position: 'absolute', top: '110%', right: 0, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-passive)', borderRadius: '8px', padding: '6px', minWidth: '180px', zIndex: 50, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }}>
                {[
                  { key: 'recent', label: 'Recent' },
                  { key: 'trips', label: 'Most Trips / Activity' },
                  { key: 'name', label: 'Name (A-Z)' },
                  { key: 'cost', label: 'Cost / Budget' },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => { setSelectedSort(item.key); setShowSortDropdown(false); }}
                    style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', cursor: 'pointer', backgroundColor: selectedSort === item.key ? 'var(--bg-hover)' : 'transparent', fontWeight: selectedSort === item.key ? '600' : '400' }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Wireframe Tab Switcher (4 Rounded Pills) ─────────────────────────── */}
      <div className="admin-tab-bar">
        <button
          onClick={() => { setActiveTab('users'); setSelectedFilter('all'); }}
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
        >
          Manage Users ({usersList.length})
        </button>
        <button
          onClick={() => { setActiveTab('cities'); setSelectedFilter('all'); }}
          className={`admin-tab-btn ${activeTab === 'cities' ? 'active' : ''}`}
        >
          Popular cities ({popularCities.length})
        </button>
        <button
          onClick={() => { setActiveTab('activities'); setSelectedFilter('all'); }}
          className={`admin-tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
        >
          Popular Activities ({popularActivities.length})
        </button>
        <button
          onClick={() => { setActiveTab('analytics'); setSelectedFilter('all'); }}
          className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          User Trends and Analytics
        </button>
      </div>

      {/* ── Tab 1: User Trends & Analytics (Charts & Visuals) ────────────────── */}
      {activeTab === 'analytics' && (
        <div>
          {/* Key Metric Highlights */}
          <div className="admin-metrics-grid">
            <div className="admin-metric-card">
              <span className="text-xs text-muted">Total Registered Users</span>
              <div style={{ fontSize: '26px', fontWeight: '600', color: 'var(--text-charcoal)' }}>
                {analyticsData?.totalUsers || usersList.length || 0}
              </div>
              <span className="text-xs text-muted">Active (30d): {analyticsData?.activeUsersLast30Days || 0}</span>
            </div>

            <div className="admin-metric-card">
              <span className="text-xs text-muted">Total Trips Created</span>
              <div style={{ fontSize: '26px', fontWeight: '600', color: 'var(--accent-green)' }}>
                {analyticsData?.totalTrips || 0}
              </div>
              <span className="text-xs text-muted">Public in Community: {analyticsData?.totalPublicTrips || 0}</span>
            </div>

            <div className="admin-metric-card">
              <span className="text-xs text-muted">Avg Target Trip Budget</span>
              <div style={{ fontSize: '26px', fontWeight: '600', color: 'var(--accent-amber)' }}>
                ${analyticsData?.averageBudget || '0.00'}
              </div>
              <span className="text-xs text-muted">Calculated across itineraries</span>
            </div>

            <div className="admin-metric-card">
              <span className="text-xs text-muted">Global Catalog Base</span>
              <div style={{ fontSize: '26px', fontWeight: '600', color: 'var(--accent-hub)' }}>
                {analyticsData?.totalCities || 40} Cities
              </div>
              <span className="text-xs text-muted">{analyticsData?.totalActivities || 145} Curated Activities</span>
            </div>
          </div>

          {/* Wireframe Centered Charts Card (Pie, Line, and Bar Charts) */}
          <div className="admin-chart-card">
            <div style={{ marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-passive)' }}>
              <h3 style={{ margin: 0 }}>System Visual Analytics & Engagement Trends</h3>
              <p className="text-muted text-xs">Overview across trips, categories, and timeline activity</p>
            </div>

            <div className="admin-charts-row">
              {/* 1. Trip Status Distribution Donut / Pie Chart */}
              <div style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-passive)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '0.5rem', textAlign: 'left' }}>
                  Trip Status Distribution
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', padding: '1rem 0' }}>
                  {/* Custom Crisp SVG Pie / Donut */}
                  <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      {(() => {
                        let accumulatedPercent = 0;
                        return statusBreakdown.map((item, idx) => {
                          const percent = Math.round((item.value / totalStatusCount) * 100);
                          const strokeDasharray = `${percent} ${100 - percent}`;
                          const strokeDashoffset = -accumulatedPercent;
                          accumulatedPercent += percent;
                          return (
                            <circle
                              key={idx}
                              cx="18"
                              cy="18"
                              r="15.915"
                              fill="transparent"
                              stroke={item.color}
                              strokeWidth="5"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              style={{ transition: 'all 0.3s ease' }}
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-charcoal)' }}>
                        {analyticsData?.totalTrips || 0}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Trips</div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left' }}>
                    {statusBreakdown.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: item.color }}></span>
                        <span style={{ fontWeight: '500' }}>{item.name}:</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {item.value} ({Math.round((item.value / totalStatusCount) * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Monthly Trend Line Chart matching wireframe sketch */}
              <div style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-passive)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>Platform Activity Trend Line</div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-dark)', fontWeight: '600' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span> Trips
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span> Users
                    </span>
                  </div>
                </div>

                {/* SVG Line Graph */}
                <div style={{ width: '100%', height: '150px', position: 'relative', marginTop: '1rem' }}>
                  <svg viewBox="0 0 300 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Grid lines */}
                    <line x1="20" y1="20" x2="290" y2="20" stroke="var(--border-passive)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="20" y1="60" x2="290" y2="60" stroke="var(--border-passive)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="20" y1="100" x2="290" y2="100" stroke="var(--border-passive)" strokeWidth="1" />

                    {/* Polyline for Trips (matching sketch: red dots with bold line) */}
                    <polyline
                      fill="none"
                      stroke="#4b5563"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="30,85 85,70 140,55 195,35 250,45"
                    />

                    {/* Nodes matching sketch */}
                    {[
                      { cx: 30, cy: 85 },
                      { cx: 85, cy: 70 },
                      { cx: 140, cy: 55 },
                      { cx: 195, cy: 35 },
                      { cx: 250, cy: 45 }
                    ].map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.cx}
                        cy={pt.cy}
                        r="6"
                        fill="#ef4444"
                        stroke="#fcfbf8"
                        strokeWidth="2"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                      />
                    ))}
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', padding: '0 10px' }}>
                    <span>Launch</span>
                    <span>Q1</span>
                    <span>Q2</span>
                    <span>Q3</span>
                    <span>Live ({analyticsData?.totalTrips || 0} trips)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Category Distribution Bar Chart matching wireframe bottom */}
            <div style={{ marginTop: '1.5rem', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-passive)', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '1rem' }}>
                Activity Category Distribution
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', alignItems: 'flex-end', minHeight: '140px', padding: '1rem 0' }}>
                {categoryBreakdown.map((cat, idx) => {
                  const barHeight = Math.max(20, Math.round((cat.count / maxCategoryCount) * 100));
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-charcoal)' }}>
                        {cat.count}
                      </div>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '44px',
                          height: `${barHeight}px`,
                          backgroundColor: idx % 2 === 0 ? '#f97316' : '#94a3b8',
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.3s ease'
                        }}
                      ></div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', textTransform: 'capitalize' }}>
                        {cat.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Manage Users (Directory & View Trips Only) ─────────────────── */}
      {activeTab === 'users' && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-passive)', borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-passive)' }}>
            <h3 style={{ margin: 0 }}>Registered User Directory ({filteredUsers.length})</h3>
            <p className="text-muted text-xs">View registered accounts and inspect user trip history</p>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading user accounts...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No users found matching your search filter.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="db-details-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>User / Avatar</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Trips</th>
                    <th>Registered</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-dark)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', flexShrink: 0 }}>
                            {u.photoUrl ? (
                              <img src={u.photoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              (u.firstName?.[0] || u.username?.[0] || u.email?.[0] || 'U').toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>{u.fullName || u.username}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px' }}>{u.email}</td>
                      <td>
                        <span
                          className="nav-badge"
                          style={{
                            backgroundColor: u.role === 'admin' ? 'var(--accent-terra-bg)' : 'var(--bg-hover)',
                            color: u.role === 'admin' ? 'var(--accent-terra)' : 'var(--text-charcoal)',
                            textTransform: 'uppercase',
                            fontWeight: '600'
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                          <span className={`status-dot ${u.isVerified ? 'active' : 'inactive'}`}></span>
                          {u.isVerified ? 'Verified' : 'Pending OTP'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '600', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-passive)', fontSize: '12px' }}>
                          {u.tripCount || 0} trips
                        </span>
                      </td>
                      <td className="text-xs text-muted">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleInspectUserTrips(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '13px', padding: '5px 12px' }}
                          title="Inspect Trips made by this user"
                        >
                          View Trips
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Popular Cities ────────────────────────────────────────────── */}
      {activeTab === 'cities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Popular Cities Trending Across Trips ({filteredCities.length})</h3>
            <span className="text-sm text-muted">Ranked by user additions & popularity scores</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filteredCities.map((city, idx) => (
              <div key={city.cityId || idx} className="admin-item-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{city.name}</div>
                    <div className="text-xs text-muted">{city.country} • {city.region}</div>
                  </div>
                  <span className="nav-badge" style={{ backgroundColor: 'var(--primary-dark)', color: '#fff', fontWeight: '700' }}>
                    #{idx + 1}
                  </span>
                </div>

                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-passive)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span>Cost Index: <strong>${city.costIndex || '50.00'}</strong></span>
                  <span>Popularity: <strong>{city.popularityScore}%</strong></span>
                </div>

                <div style={{ marginTop: '0.5rem', width: '100%', height: '6px', backgroundColor: 'var(--bg-page)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${city.popularityScore || 50}%`, height: '100%', backgroundColor: 'var(--accent-green)' }}></div>
                </div>

                <div style={{ marginTop: '0.5rem', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                  Included in <strong>{city.tripCount || 0}</strong> user stops
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 4: Popular Activities ─────────────────────────────────────────── */}
      {activeTab === 'activities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Popular Activities & Experiences ({filteredActivities.length})</h3>
            <span className="text-sm text-muted">Ranked by user itinerary selections</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filteredActivities.map((act, idx) => (
              <div key={act.activityId || idx} className="admin-item-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600' }}>{act.name}</div>
                    <div className="text-xs text-muted">{act.cityName || 'Worldwide'} • {act.countryName || 'Global'}</div>
                  </div>
                  <span className="nav-badge" style={{ textTransform: 'capitalize', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-passive)' }}>
                    {act.category}
                  </span>
                </div>

                {act.description && (
                  <p style={{ fontSize: '12px', color: 'var(--text-body)', marginTop: '0.35rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {act.description}
                  </p>
                )}

                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-passive)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span>Estimated: <strong>${parseFloat(act.estimatedCost || 0).toFixed(2)}</strong></span>
                  <span>Duration: <strong>{act.estimatedDurationMinutes ? `${act.estimatedDurationMinutes}m` : 'Flexible'}</strong></span>
                </div>

                <div style={{ marginTop: '0.5rem', fontSize: '12px', color: 'var(--accent-hub)', fontWeight: '500' }}>
                  Added to <strong>{act.addCount || 0}</strong> itineraries
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── User Trips Inspection Modal ────────────────────────────────────── */}
      {inspectUser && (
        <div className="admin-modal-overlay" onClick={() => setInspectUser(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-passive)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Trips Created by {inspectUser.fullName || inspectUser.username}</h3>
                <p className="text-muted text-xs">{inspectUser.email} • Role: {inspectUser.role?.toUpperCase()}</p>
              </div>
              <button onClick={() => setInspectUser(null)} className="btn btn-ghost btn-sm">
                ✕ Close
              </button>
            </div>

            {loadingUserTrips ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading user trip history...
              </div>
            ) : userTrips.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>This user has not created any trips yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {userTrips.map((t) => (
                  <div key={t.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-passive)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600' }}>{t.name}</div>
                        <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                          {t.startDate} — {t.endDate} • {t.destinationCount || 0} destination stops
                        </div>
                      </div>
                      <span className={`trip-status-badge status-${t.status || 'upcoming'}`}>
                        {t.status}
                      </span>
                    </div>
                    {t.description && (
                      <p style={{ fontSize: '13px', marginTop: '0.5rem', color: 'var(--text-body)' }}>{t.description}</p>
                    )}
                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span>Target Budget: <strong>${t.totalBudget ? parseFloat(t.totalBudget).toFixed(2) : 'Unset'}</strong></span>
                      <span style={{ fontSize: '12px', color: t.isPublic ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                        {t.isPublic ? '🌐 Public in Community' : '🔒 Private Trip'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
