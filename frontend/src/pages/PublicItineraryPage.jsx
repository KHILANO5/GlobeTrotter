import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function PublicItineraryPage() {
  const { shareToken } = useParams();

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="shell-container" style={{ textAlign: 'left', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1rem' }}>
          <div>
            <span className="shell-badge terra">Public View</span>
            <h2>Shared Public Itinerary</h2>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Read-only public trip page with "Copy Trip" feature
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/community" className="btn btn-ghost btn-sm">
              Community Feed
            </Link>
            <Link to="/trips/new" className="btn btn-primary btn-sm">
              Copy Trip to My Plans
            </Link>
          </div>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid var(--border-passive)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Japan Spring Exploration</h3>
              <p className="text-sm text-muted">Shared by Jane D. • Token: {shareToken || 'demo'}</p>
            </div>
            <span className="nav-badge green">Public Link Active</span>
          </div>
        </div>

        {/* Team Note Box */}
        <div className="shell-box" style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <h4>💡 Module Info for Team</h4>
          <p className="text-sm text-muted" style={{ margin: '0.5rem 0 0' }}>
            This page represents <strong>Shared / Public Itinerary View (<code>/shared/:shareToken</code>)</strong>. It allows public viewers to view and copy the itinerary to their own account.
          </p>
        </div>
      </div>
    </div>
  );
}
