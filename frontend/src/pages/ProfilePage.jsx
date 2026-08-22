import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

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
                overflow: 'hidden'
              }}>
                {profile?.photoUrl ? (
                  <img src={profile.photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'
                )}
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
                  <button className="btn btn-ghost btn-sm" onClick={() => alert('Edit profile functionality coming soon!')} style={{ textDecoration: 'underline' }}>
                    Edit Information
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
