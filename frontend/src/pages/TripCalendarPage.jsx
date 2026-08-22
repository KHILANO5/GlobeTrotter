import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function TripCalendarPage() {
  const { tripId } = useParams();

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="shell-container" style={{ textAlign: 'left', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1rem' }}>
          <div>
            <h2>Trip Calendar & Timeline</h2>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Visual timeline and day-by-day scheduling view
            </p>
          </div>
          <Link to={tripId ? `/trips/${tripId}/itinerary` : '/trips/itinerary'} className="btn btn-ghost btn-sm">
            ← Back to Itinerary
          </Link>
        </div>

        <div style={{ padding: '2.5rem', backgroundColor: 'var(--bg-page)', borderRadius: '10px', border: '1px dashed var(--border-passive)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '0.75rem' }}>📅</div>
          <h4>Interactive Calendar & Timeline Grid</h4>
          <p className="text-sm text-muted" style={{ maxWidth: '480px', margin: '0.5rem auto 1.5rem' }}>
            Multi-day stops, activity blocks, and visual scheduling timeline.
          </p>
          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
            <span className="nav-badge">Month View</span>
            <span className="nav-badge">Week View</span>
            <span className="nav-badge" style={{ backgroundColor: 'rgba(13, 92, 70, 0.1)', color: 'var(--accent-green)' }}>Timeline View</span>
          </div>
        </div>
      </div>
    </div>
  );
}
