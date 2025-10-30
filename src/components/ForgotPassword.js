import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import './Auth.css';

function ForgotPassword({ onBackToLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error) {
      setError(getErrorMessage(error.code));
    }
    setLoading(false);
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      default:
        return 'Failed to send reset email. Please try again';
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-icon">📧</span>
            <h1 className="auth-title">Check Your Email</h1>
            <p className="auth-subtitle">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>
          
          <div style={{
            background: 'rgba(72, 187, 120, 0.1)',
            border: '1px solid rgba(72, 187, 120, 0.2)',
            color: '#38a169',
            padding: '1.5rem',
            borderRadius: '12px',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>
              ✅ Check your inbox and click the link to reset your password.
            </p>
          </div>

          <div className="auth-actions">
            <button 
              onClick={onBackToLogin}
              className="auth-button"
            >
              ← Back to Sign In
            </button>
          </div>

          <div className="auth-switch">
            <p className="auth-switch-text">Don't have an account?</p>
            <button 
              onClick={onSwitchToRegister}
              className="switch-button"
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🔑</span>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            Enter your email and we'll send you a reset link
          </p>
        </div>
        
        <form onSubmit={handleResetPassword} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          {error && (
            <div className="auth-error">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="auth-button"
          >
            {loading ? (
              <>
                <span style={{marginRight: '0.5rem'}}>⏳</span>
                Sending...
              </>
            ) : (
              <>
                <span style={{marginRight: '0.5rem'}}>📨</span>
                Send Reset Link
              </>
            )}
          </button>
        </form>

        <div className="auth-actions" style={{ marginTop: '1.5rem' }}>
          <button 
            onClick={onBackToLogin}
            className="switch-button"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            ← Back to Sign In
          </button>
        </div>

        <div className="auth-switch">
          <p className="auth-switch-text">Don't have an account?</p>
          <button 
            onClick={onSwitchToRegister}
            className="switch-button"
          >
            Create New Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;