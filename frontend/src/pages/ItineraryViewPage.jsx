import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function ItineraryViewPage() {
  const { tripId } = useParams();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="shell-container" style={{ textAlign: 'left', padding: '2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1rem' }}>
          <div>
            <h2>Itinerary View</h2>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Day-by-day itinerary schedule and activity roadmap
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={tripId ? `/trips/${tripId}/builder` : '/trips/builder'} className="btn btn-secondary btn-sm">
              ✏️ Edit in Builder
            </Link>
            <Link to="/trips" className="btn btn-ghost btn-sm">
              My Trips
            </Link>
          </div>
        </div>

        {/* Fan Out Navigation Bar */}
        <div 
          style={{ 
            display: 'flex', 
            gap: '1rem', 
            padding: '1rem', 
            backgroundColor: 'var(--bg-page)', 
            border: '1px solid var(--border-passive)', 
            borderRadius: '10px',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}
        >
          <Link to={tripId ? `/trips/${tripId}/budget` : '/trips/budget'} className="btn btn-secondary btn-sm" style={{ flex: 1, minWidth: '150px' }}>
            View Budget Breakdown
          </Link>
          <Link to={tripId ? `/trips/${tripId}/calendar` : '/trips/calendar'} className="btn btn-secondary btn-sm" style={{ flex: 1, minWidth: '150px' }}>
            View Calendar Timeline
          </Link>
          <Link to={tripId ? `/shared/${tripId}` : '/shared/demo'} className="btn btn-secondary btn-sm" style={{ flex: 1, minWidth: '150px' }}>
            Public Share Link
          </Link>
        </div>

        {/* Day-by-Day Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid var(--border-passive)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4>Day 1: Arrival & City Orientation (Tokyo)</h4>
              <span className="nav-badge" style={{ backgroundColor: 'rgba(13, 92, 70, 0.1)', color: 'var(--accent-green)' }}>Stop: Tokyo</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-passive)' }}>
              <div className="text-sm">
                <strong>09:00 AM:</strong> Senso-ji Temple exploration & street food
              </div>
              <div className="text-sm">
                <strong>02:00 PM:</strong> Shibuya Crossing & Shopping
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
