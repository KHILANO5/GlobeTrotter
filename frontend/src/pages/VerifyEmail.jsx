import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !code) return;

    if (code.length !== 6 || isNaN(code)) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await api.post('/verify-email', { email, code });
      setSuccess(data.message || 'Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <form onSubmit={handleSubmit}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Verify Email</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          Enter the 6-digit code sent to your email to activate your account
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.85rem', borderRadius: '12px', marginBottom: '1.5rem', color: 'var(--error)', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.85rem', borderRadius: '12px', marginBottom: '1.5rem', color: 'var(--success)', fontSize: '0.9rem', textAlign: 'center' }}>
            {success}
          </div>
        )}

        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            className="input-field"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={searchParams.has('email')} // Disable input if email came via query params
          />
        </div>

        <div className="input-group" style={{ marginBottom: '2rem' }}>
          <label htmlFor="code">Verification Code</label>
          <input
            type="text"
            id="code"
            className="input-field"
            placeholder="• • • • • •"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            required
            style={{ letterSpacing: '0.25em', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || success}
          style={{ marginBottom: '1.5rem' }}
        >
          {loading ? 'Verifying...' : 'Verify Account'}
        </button>

        <p style={{ fontSize: '0.9rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Remembered password? <Link to="/login" style={{ color: 'var(--text-charcoal)', textDecoration: 'underline', fontWeight: '500' }}>Login here</Link>
        </p>
      </form>
    </div>
  );
}

export default VerifyEmail;
