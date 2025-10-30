import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import ProfileSettings from './components/ProfileSettings';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Следим за состоянием аутентификации
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  // Если пользователь не авторизован - показываем соответствующую форму
  if (!user) {
    if (showForgotPassword) {
      return (
        <ForgotPassword 
          onBackToLogin={() => setShowForgotPassword(false)}
          onSwitchToRegister={() => {
            setShowForgotPassword(false);
            setShowRegister(true);
          }}
        />
      );
    }

    if (showRegister) {
      return (
        <Register onSwitchToLogin={() => setShowRegister(false)} />
      );
    }

    return (
      <Login 
        onSwitchToRegister={() => setShowRegister(true)}
        onShowForgotPassword={() => setShowForgotPassword(true)}
      />
    );
  }

  // Если пользователь авторизован - показываем Dashboard
  return (
    <div className="App">
      <header className="app-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>🏃‍♂️ Sport Contracts</h1>
        <div className="user-info">
          <span className="user-greeting">
            👋 Hello, <strong>{user.displayName || user.email}</strong>!
          </span>
          <div className="header-actions" style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setShowProfileSettings(true)}
              className="btn btn-secondary"
            >
              ✏️ Edit Profile
            </button>
            <button 
              onClick={handleLogout}
              className="btn btn-danger"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <div className="fade-in">
        <Dashboard user={user} />
      </div>
      
      {showProfileSettings && (
        <ProfileSettings 
          user={user} 
          onClose={() => setShowProfileSettings(false)} 
        />
      )}
    </div>
  );
}

export default App;