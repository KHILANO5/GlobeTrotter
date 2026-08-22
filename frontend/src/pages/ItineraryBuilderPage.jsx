import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function ItineraryBuilderPage() {
  const { tripId } = useParams();

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="shell-container" style={{ textAlign: 'left', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1rem' }}>
          <div>
            <span className="shell-badge terra">Builder Screen</span>
            <h2>Itinerary Builder</h2>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Add stops, select cities, and assign activities to sections
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={tripId ? `/trips/${tripId}/itinerary` : '/trips/itinerary'} className="btn btn-primary btn-sm">
              View Itinerary →
            </Link>
            <Link to="/trips" className="btn btn-ghost btn-sm">
              My Trips
            </Link>
          </div>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-page)', borderRadius: '10px', border: '1px solid var(--border-passive)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4>Trip Stops & Sections</h4>
              <p className="text-sm text-muted">Trip Context: {tripId ? `ID: ${tripId}` : 'Active draft'}</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => alert('Add Stop / City Search modal will open here')}>
              + Add Stop (City)
            </button>
          </div>
        </div>

        {/* Section Blocks Mock Shell */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid var(--border-passive)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>Section 1: City Stop (Tokyo, Japan)</div>
              <span className="nav-badge">Days 1 - 4</span>
            </div>
            <p className="text-sm text-muted" style={{ margin: '0 0 0.75rem 0' }}>
              First leg — arrival, hotel check-in, cultural exploration, and sightseeing.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => alert('Activity Search modal will open here')}>
                + Assign Activity
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => alert('Edit stop details')}>
                Edit Section
              </button>
            </div>
          </div>
        </div>

        {/* Team Note Box */}
        <div className="shell-box" style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <h4>💡 Module Info for Team</h4>
          <p className="text-sm text-muted" style={{ margin: '0.5rem 0 0' }}>
            This page represents <strong>Itinerary Builder (Add stops, activities)</strong>. Once stops and activities are saved, the user proceeds to <strong>Itinerary View</strong> (<code>/trips/:tripId/itinerary</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
