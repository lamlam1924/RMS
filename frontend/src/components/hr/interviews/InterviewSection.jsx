import React from 'react';

const toneMap = {
  default: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb'
  },
  muted: {
    backgroundColor: '#f8fafc',
    border: '1px solid #dbe4f0'
  },
  info: {
    backgroundColor: '#f8fbff',
    border: '1px solid #bfdbfe'
  },
  warning: {
    backgroundColor: '#fffaf0',
    border: '1px solid #fcd34d'
  }
};

export default function InterviewSection({
  step,
  title,
  description,
  actions,
  tone = 'default',
  children,
  style
}) {
  const palette = toneMap[tone] || toneMap.default;

  return (
    <section
      style={{
        ...palette,
        borderRadius: 10,
        padding: 20,
        marginBottom: 16,
        ...style
      }}
    >
      {(step || title || description || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            {step && (
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: '#2563eb', marginBottom: 6 }}>
                {step}
              </div>
            )}
            {title && (
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                {title}
              </h3>
            )}
            {description && (
              <div style={{ fontSize: 13, lineHeight: 1.5, color: '#6b7280', marginTop: 6 }}>
                {description}
              </div>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}