import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Mode States
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, tripsRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/trips')
        ]);
        if (profileRes.data) setProfile(profileRes.data);
        if (tripsRes.data) setTrips(tripsRes.data);
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const preplannedTrips = trips.filter(t => t.status !== 'completed');
  const previousTrips = trips.filter(t => t.status === 'completed');

  const startEdit = () => {
    setEditForm({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      username: profile?.username || '',
      city: profile?.city || '',
      country: profile?.country || '',
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      Object.keys(editForm).forEach(key => {
         if (editForm[key] !== undefined) {
           formData.append(key, editForm[key]);
         }
      });
      if (selectedFile) formData.append('photo', selectedFile);

      await api.put('/users/me', formData);
      
      setEditMode(false);
      // Reload profile
      const profileRes = await api.get('/users/me');
      if (profileRes.data) {
        setProfile(profileRes.data);
        if (updateUser) updateUser(profileRes.user || profileRes.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save profile. Make sure the backend is running properly.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-charcoal)', fontWeight: '600' }}>User Profile</h2>
        <button onClick={logout} className="btn btn-ghost btn-sm" style={{ color: '#dc2626' }}>
          Sign Out
        </button>
      </div>

      <div style={{ padding: '2.5rem', backgroundColor: '#faf9f6', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading profile...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* Top Section: Avatar and Details */}
            <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              
              {/* Avatar (Left) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  flexShrink: 0, 
                  width: '180px', 
                  height: '180px', 
                  borderRadius: '50%', 
                  backgroundColor: 'transparent',
                  border: '2px solid var(--text-charcoal)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '56px',
                  fontWeight: '400',
                  color: 'var(--text-charcoal)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {(previewUrl || profile?.photoUrl) ? (
                    <img src={previewUrl || profile.photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'
                  )}
                  {editMode && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', padding: '0.5rem', textAlign: 'center' }}>
                      <label style={{ color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
                        Change
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* User Details Box (Right) */}
              <div style={{ 
                flex: 1, 
                minWidth: '300px',
                border: '2px solid var(--text-charcoal)', 
                borderRadius: '16px', 
                padding: '2rem', 
                backgroundColor: 'transparent' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-charcoal)', fontSize: '20px' }}>User Details</h3>
                  {editMode ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={cancelEdit} disabled={saving}>
                        Cancel
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={startEdit} style={{ textDecoration: 'underline' }}>
                      Edit Information
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {editMode ? (
                    <>
                      <div>
                        <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>First Name</div>
                        <input type="text" className="form-control" value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} style={{ marginTop: '0.25rem' }} />
                      </div>
                      <div>
                        <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Name</div>
                        <input type="text" className="form-control" value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} style={{ marginTop: '0.25rem' }} />
                      </div>
                      <div>
                        <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</div>
                        <input type="text" className="form-control" value={editForm.username} onChange={(e) => setEditForm({...editForm, username: e.target.value})} style={{ marginTop: '0.25rem' }} />
                      </div>
                      <div>
                        <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</div>
                        <div style={{ fontWeight: '500', marginTop: '0.25rem', fontSize: '15px', color: 'var(--text-muted)' }}>{profile?.email || user?.email} (Read Only)</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>City</div>
                        <input type="text" className="form-control" value={editForm.city} onChange={(e) => setEditForm({...editForm, city: e.target.value})} style={{ marginTop: '0.25rem' }} />
                      </div>
                      <div>
                        <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Country</div>
                        <input type="text" className="form-control" value={editForm.country} onChange={(e) => setEditForm({...editForm, country: e.target.value})} style={{ marginTop: '0.25rem' }} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</div>
                        <div style={{ fontWeight: '500', marginTop: '0.25rem', fontSize: '15px' }}>
                          {profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : (user?.fullName || '—')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</div>
                        <div style={{ fontWeight: '500', marginTop: '0.25rem', fontSize: '15px' }}>{profile?.username || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</div>
                        <div style={{ fontWeight: '500', marginTop: '0.25rem', fontSize: '15px' }}>{profile?.email || user?.email}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</div>
                        <div style={{ fontWeight: '500', marginTop: '0.25rem', fontSize: '15px' }}>
                          {[profile?.city, profile?.country].filter(Boolean).join(', ') || '—'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-passive)' }} />

            {/* Preplanned Trips */}
            <div>
              <h3 style={{ marginBottom: '1.25rem', color: 'var(--text-charcoal)', fontSize: '22px' }}>Preplanned Trips</h3>
              {preplannedTrips.length > 0 ? (
                <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                  {preplannedTrips.map(trip => (
                    <div key={trip.id} style={{ 
                      flexShrink: 0,
                      width: '240px', 
                      height: '340px', 
                      border: '2px solid var(--text-charcoal)', 
                      borderRadius: '16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      padding: '2.5rem 1.5rem',
                      backgroundColor: 'transparent'
                    }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <h2 style={{ margin: 0, textAlign: 'center', wordBreak: 'break-word', fontSize: '28px', color: 'var(--text-charcoal)', lineHeight: '1.2' }}>
                          {trip.name}
                        </h2>
                      </div>
                      <Link to={`/trips/${trip.id}/itinerary`} className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', backgroundColor: '#ffffff', border: '2px solid var(--text-charcoal)', borderRadius: '8px' }}>
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No preplanned trips found.</p>
              )}
            </div>

            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-passive)' }} />

            {/* Previous Trips */}
            <div>
              <h3 style={{ marginBottom: '1.25rem', color: 'var(--text-charcoal)', fontSize: '22px' }}>Previous Trips</h3>
              {previousTrips.length > 0 ? (
                <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                  {previousTrips.map(trip => (
                    <div key={trip.id} style={{ 
                      flexShrink: 0,
                      width: '240px', 
                      height: '340px', 
                      border: '2px solid var(--text-charcoal)', 
                      borderRadius: '16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      padding: '2.5rem 1.5rem',
                      backgroundColor: 'transparent'
                    }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <h2 style={{ margin: 0, textAlign: 'center', wordBreak: 'break-word', fontSize: '28px', color: 'var(--text-charcoal)', lineHeight: '1.2' }}>
                          {trip.name}
                        </h2>
                      </div>
                      <Link to={`/trips/${trip.id}/itinerary`} className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', backgroundColor: '#ffffff', border: '2px solid var(--text-charcoal)', borderRadius: '8px' }}>
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No previous trips found.</p>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
