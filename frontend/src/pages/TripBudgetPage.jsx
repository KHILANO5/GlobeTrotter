import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function TripBudgetPage() {
  const { tripId } = useParams();

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="shell-container" style={{ textAlign: 'left', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1rem' }}>
          <div>
            <span className="shell-badge terra">Analytics Screen</span>
            <h2>Trip Budget & Cost Breakdown</h2>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Automatic cost rollup across transport, stay, activities, and meals
            </p>
          </div>
          <Link to={tripId ? `/trips/${tripId}/itinerary` : '/trips/itinerary'} className="btn btn-ghost btn-sm">
            ← Back to Itinerary
          </Link>
        </div>

        {/* Budget Cards Overview Mock */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-page)', borderRadius: '8px', border: '1px solid var(--border-passive)' }}>
            <div className="text-xs text-muted">Total Estimated Cost</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-charcoal)' }}>$2,450.00</div>
          </div>
          <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-page)', borderRadius: '8px', border: '1px solid var(--border-passive)' }}>
            <div className="text-xs text-muted">Target Budget</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--accent-green)' }}>$3,000.00</div>
          </div>
          <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-page)', borderRadius: '8px', border: '1px solid var(--border-passive)' }}>
            <div className="text-xs text-muted">Daily Average</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-charcoal)' }}>$175.00/day</div>
          </div>
        </div>

        {/* Breakdown by Category */}
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid var(--border-passive)' }}>
          <h4>Category Breakdown</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>✈️ Transport:</span>
              <span style={{ fontWeight: '600' }}>$900.00 (37%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>🏨 Lodging / Stay:</span>
              <span style={{ fontWeight: '600' }}>$800.00 (33%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>🎯 Activities:</span>
              <span style={{ fontWeight: '600' }}>$500.00 (20%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>🍜 Meals & Food:</span>
              <span style={{ fontWeight: '600' }}>$250.00 (10%)</span>
            </div>
          </div>
        </div>

        {/* Team Note Box */}
        <div className="shell-box" style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <h4>💡 Module Info for Team</h4>
          <p className="text-sm text-muted" style={{ margin: '0.5rem 0 0' }}>
            This page represents <strong>Trip Budget & Cost Breakdown (<code>/trips/:tripId/budget</code>)</strong>. Ready for the chart/breakdown implementation by your teammate.
          </p>
        </div>
      </div>
    </div>
  );
}
