import React from 'react';

/**
 * Reusable empty state component
 */
export default function EmptyState({ 
  icon = '📋', 
  title, 
  message, 
  action 
}) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: 40,
      textAlign: 'center',
      borderRadius: 8,
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ color: '#6b7280', marginBottom: action ? 20 : 0 }}>
        {message}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 14
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
