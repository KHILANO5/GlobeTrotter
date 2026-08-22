import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import PasswordField from '../components/PasswordField';

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Request code, Step 2: Reset password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await api.post('/forgot-password', { email });
      setSuccess(data.message || 'OTP reset code has been sent to your email.');
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to request password reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !code || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (code.length !== 6 || isNaN(code)) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await api.post('/reset-password', { email, code, newPassword });
      setSuccess(data.message || 'Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      {step === 1 ? (
        <form onSubmit={handleRequestCode}>
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Forgot Password</h2>
          <p style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Enter your email to receive a 6-digit password reset OTP code
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

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="input-field"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ marginBottom: '1.5rem' }}
          >
            {loading ? 'Sending OTP...' : 'Send OTP Code'}
          </button>

          <p style={{ fontSize: '0.9rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Remembered password? <Link to="/login" style={{ color: 'var(--text-charcoal)', textDecoration: 'underline', fontWeight: '500' }}>Login here</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Reset Password</h2>
          <p style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Verify OTP code and create a new password
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

          <div className="input-group">
            <label htmlFor="newPassword">New Password</label>
            <PasswordField
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <PasswordField
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || success}
            style={{ marginBottom: '1.5rem' }}
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Didn't receive code? <span style={{ color: 'var(--text-charcoal)', cursor: 'pointer', fontWeight: '500', textDecoration: 'underline' }} onClick={() => setStep(1)}>Go Back</span>
            </span>
            <Link to="/login" style={{ color: 'var(--text-charcoal)', textDecoration: 'underline', fontWeight: '500' }}>Cancel</Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default ForgotPassword;
