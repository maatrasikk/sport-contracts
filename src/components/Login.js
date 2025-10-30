import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import './Auth.css';

function Login({ onSwitchToRegister, onShowForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
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
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      default:
        return 'Failed to sign in. Please try again';
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🔐</span>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your Sport Contracts account</p>
        </div>
        
        <form onSubmit={handleLogin} className="auth-form">
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

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
            <button 
              type="button"
              onClick={onShowForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '0.5rem 0',
                alignSelf: 'flex-start',
                textDecoration: 'underline'
              }}
            >
              Forgot your password?
            </button>
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
                Signing In...
              </>
            ) : (
              <>
                <span style={{marginRight: '0.5rem'}}>🚀</span>
                Sign In
              </>
            )}
          </button>
        </form>

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

export default Login;