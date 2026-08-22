import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function TripCalendarPage() {
  const { tripId } = useParams();

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="shell-container" style={{ textAlign: 'left', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1rem' }}>
          <div>
            <span className="shell-badge terra">Visualization Screen</span>
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
            Calendar component will render multi-day stops, activity blocks, and quick drag-to-reorder interactions.
          </p>
          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
            <span className="nav-badge">Month View</span>
            <span className="nav-badge">Week View</span>
            <span className="nav-badge green">Timeline View</span>
          </div>
        </div>

        {/* Team Note Box */}
        <div className="shell-box" style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <h4>💡 Module Info for Team</h4>
          <p className="text-sm text-muted" style={{ margin: '0.5rem 0 0' }}>
            This page represents <strong>Trip Calendar / Timeline (<code>/trips/:tripId/calendar</code>)</strong>. Ready for calendar UI integration.
          </p>
        </div>
      </div>
    </div>
  );
}
