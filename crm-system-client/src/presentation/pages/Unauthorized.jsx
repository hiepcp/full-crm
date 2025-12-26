
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          padding: '48px 32px',
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 8 }}>
            <circle cx="12" cy="12" r="12" fill="#ffe0e0" />
            <path d="M12 7v4" stroke="#e57373" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="#e57373" />
          </svg>
          <h1 style={{ color: '#e57373', fontSize: 28, margin: 0 }}>403</h1>
        </div>
        <p style={{ color: '#333', fontSize: 16, marginBottom: 32 }}>
          You do not have permission to access this page<br />please contact your administrator.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={handleReturnHome}
            style={{
              padding: '10px 20px',
              fontSize: 16,
              borderRadius: 6,
              border: 'none',
              background: '#1976d2',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)',
              transition: 'background 0.2s',
            }}
          >
            Return Home
          </button>
          <button
            onClick={handleLogin}
            style={{
              padding: '10px 20px',
              fontSize: 16,
              borderRadius: 6,
              border: 'none',
              background: '#e57373',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(229, 115, 115, 0.08)',
              transition: 'background 0.2s',
            }}
          >
            Sign in again
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
