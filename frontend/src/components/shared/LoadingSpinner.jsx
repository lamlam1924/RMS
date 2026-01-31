import React from 'react';

/**
 * Reusable loading spinner component
 */
export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh',
      flexDirection: 'column',
      gap: 16
    }}>
      <div style={{ 
        width: 40, 
        height: 40, 
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <div style={{ fontSize: 18, color: '#6b7280' }}>{message}</div>
    </div>
  );
}
