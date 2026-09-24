import React from 'react';

export default function Loader({ text = "Loading..." }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', width: '100%', background: 'var(--bg-app)', color: 'var(--text-main)'
    }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{
        width: '40px', height: '40px', 
        border: '4px solid var(--border-color)',
        borderTop: '4px solid var(--brand)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
      }} />
      <div style={{ fontSize: '14px', color: 'var(--text-sub)', fontWeight: 500, letterSpacing: '0.5px' }}>
        {text}
      </div>
    </div>
  );
}
