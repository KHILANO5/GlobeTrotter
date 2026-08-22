import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ShareModal({ isOpen, onClose, tripId, tripName }) {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && tripId) {
      generateShare();
    }
  }, [isOpen, tripId]);

  const generateShare = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/trips/${tripId}/share`);
      if (res.data?.shareToken) {
        const url = `${window.location.origin}/shared/${res.data.shareToken}`;
        setShareUrl(url);
      }
    } catch (err) {
      console.error('Error generating share token:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '0.75rem' }}>
          <div>
            <h3>Share Itinerary</h3>
            <p className="text-sm text-muted" style={{ margin: 0 }}>
              Generate a public view link for <strong>{tripName || 'your trip'}</strong>
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Generating shareable link...
          </div>
        ) : (
          <div>
            <p className="text-sm" style={{ marginBottom: '1rem' }}>
              Anyone with this link can view the day-by-day itinerary, destination stops, and activities. Authenticated users can also copy it into their account.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="input-field"
                style={{ fontSize: '13px', backgroundColor: 'rgba(28,28,28,0.03)' }}
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`btn btn-sm ${copied ? 'btn-primary' : 'btn-secondary'}`}
                style={{ minWidth: '100px' }}
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-passive)' }}>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                ↗ Open Public View
              </a>
              <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
