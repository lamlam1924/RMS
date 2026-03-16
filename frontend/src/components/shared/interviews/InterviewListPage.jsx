import React from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { getStatusBadge } from '../../../utils/helpers/badge';

const pageStyle = { padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' };
const contentStyle = { maxWidth: 1100, margin: '0 auto' };

const baseTabStyle = {
  padding: '7px 14px',
  borderRadius: 999,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500
};

const tabStyle = (active) => ({
  ...baseTabStyle,
  border: `1px solid ${active ? '#2563eb' : '#d1d5db'}`,
  backgroundColor: active ? '#2563eb' : 'white',
  color: active ? 'white' : '#374151'
});

/** Trang danh sách phỏng vấn dùng chung cho HR, Director, DeptManager, Employee, Interviewer, Candidate */
export default function InterviewListPage({
  title,
  description,
  filters = [],
  filter,
  onFilterChange,
  loading,
  items,
  emptyTitle,
  emptyDescription,
  topRight,
  extraTop,
  onItemClick,
  getCardData,
  renderRowActions,
  getGroupLabel
}) {
  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20, gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h1>
            {description ? <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>{description}</p> : null}
          </div>
          {topRight}
        </div>

        {filters.length > 0 && onFilterChange && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {filters.map((tab) => (
              <button key={tab.id} onClick={() => onFilterChange(tab.id)} style={tabStyle(filter === tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {extraTop}

        {loading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', color: '#6b7280' }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: '#111827', marginBottom: 8 }}>{emptyTitle}</h3>
            <p style={{ margin: 0 }}>{emptyDescription}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item, index) => {
              const card = getCardData(item);
              const badge = getStatusBadge(card.statusCode);
              const statusText = card.statusLabel || badge.label;
              const clickable = Boolean(onItemClick);
              const currentGroup = getGroupLabel ? getGroupLabel(item) : null;
              const previousGroup = getGroupLabel && index > 0 ? getGroupLabel(items[index - 1]) : null;
              const shouldRenderGroup = Boolean(currentGroup && currentGroup !== previousGroup);

              return (
                <React.Fragment key={item.id}>
                  {shouldRenderGroup && (
                    <div style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      alignSelf: 'stretch',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#334155'
                    }}>
                      {currentGroup}
                    </div>
                  )}

                  <div
                    onClick={clickable ? () => onItemClick(item) : undefined}
                    style={{
                      backgroundColor: 'white',
                      padding: 14,
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      cursor: clickable ? 'pointer' : 'default'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{card.title}</div>
                        {card.subtitle ? <div style={{ fontSize: 13, color: '#6b7280' }}>{card.subtitle}</div> : null}
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
                        {statusText}
                      </span>
                    </div>

                    {Array.isArray(card.infoRows) && card.infoRows.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        {card.infoRows.map((row) => (
                          <div key={row.label}>
                            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{row.label}</div>
                            <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{row.value || '—'}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {Array.isArray(card.chips) && card.chips.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                        {card.chips.map((chip) => (
                          <span key={chip} style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6, backgroundColor: '#f8fafc', color: '#374151', border: '1px solid #e5e7eb' }}>
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}

                    {card.note && (
                      <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 6, fontSize: 13, backgroundColor: '#f8fafc', color: '#374151', border: '1px solid #e5e7eb' }}>
                        {card.note}
                      </div>
                    )}

                    {renderRowActions ? <div style={{ marginTop: 12 }}>{renderRowActions(item, card)}</div> : null}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
