import React from 'react';

/**
 * Reusable filter tabs component
 */
export default function FilterTabs({ tabs, activeTab, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
      {tabs.map((tab) => (
        <button
          key={tab.id || tab.value}
          onClick={() => onChange(tab.id || tab.value)}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === (tab.id || tab.value) ? '#3b82f6' : 'white',
            color: activeTab === (tab.id || tab.value) ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          {tab.label} {tab.count !== undefined && `(${tab.count})`}
        </button>
      ))}
    </div>
  );
}
