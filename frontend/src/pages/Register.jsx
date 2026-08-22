import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordField from '../components/PasswordField';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await register(fullName, email, password);
      setSuccess('Account created successfully! Redirecting to verification...');
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Email might already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <form onSubmit={handleSubmit}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Create Account</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          Sign up to get started as a USER
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
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            className="input-field"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

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
          />
        </div>

        <div className="input-group" style={{ marginBottom: '2rem' }}>
          <label htmlFor="password">Password</label>
          <PasswordField
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <p style={{ fontSize: '0.9rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--text-charcoal)', textDecoration: 'underline', fontWeight: '500' }}>Login here</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
