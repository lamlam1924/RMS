import React from 'react';

/**
 * Reusable stat card component for dashboards
 */
export default function StatCard({ 
  label, 
  value, 
  subtext, 
  icon,
  color = '#111827',
  subtextColor = '#6b7280'
}) {
  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: 20, 
      borderRadius: 8, 
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
        {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      {subtext && (
        <div style={{ fontSize: 12, color: subtextColor, marginTop: 4 }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
