import React from 'react';

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  padding: 16,
  marginBottom: 16
};

const SectionCard = ({ title, children }) => (
  <div style={cardStyle}>
    {title ? <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>{title}</h3> : null}
    {children}
  </div>
);

export default function SimpleInterviewerDetailPage({
  backLabel = '← Quay lại',
  title,
  statusBadge,
  statusText,
  flowMessage,
  summaryRows = [],
  scheduleRows = [],
  participants = [],
  candidateSection,
  feedbackSection,
  successMessage,
  pendingMessage,
  extraSections,
  maxWidth = 980,
  onBack
}) {
  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={onBack}
            style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}
          >
            {backLabel}
          </button>
          <h1 style={{ flex: 1, fontSize: 21, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h1>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: statusBadge?.bg || '#f3f4f6',
              color: statusBadge?.color || '#374151'
            }}
          >
            {statusText}
          </span>
        </div>

        <SectionCard>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Luồng của bạn</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>{flowMessage}</div>

          {summaryRows.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {summaryRows.map((row) => (
                <div key={row.label}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{row.label}</div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{row.value || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {scheduleRows.length > 0 && (
          <SectionCard title="Lịch phỏng vấn">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {scheduleRows.map((row) => (
                <div key={row.label}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{row.label}</div>
                  <div style={{ fontWeight: 500, color: '#111827' }}>{row.value || '—'}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {candidateSection}

        <SectionCard title={`Người tham gia (${participants.length})`}>
          {!participants.length ? (
            <div style={{ color: '#6b7280', fontSize: 13 }}>Chưa có người tham gia</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {participants.map((participant) => (
                <div key={participant.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {participant.name}
                      {participant.isMe ? <span style={{ fontSize: 11, color: '#6b7280' }}> (bạn)</span> : null}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{participant.email || participant.role}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {participant.role ? (
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>
                        {participant.role}
                      </span>
                    ) : null}
                    {participant.hasFeedback ? (
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#d1fae5', color: '#065f46', fontWeight: 600 }}>
                        Đã nộp
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {feedbackSection}

        {successMessage ? (
          <div style={{ backgroundColor: '#d1fae5', border: '1px solid #10b981', borderRadius: 8, padding: 20, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#065f46', marginBottom: 8 }}>Bạn đã nộp đánh giá</div>
            <div style={{ color: '#047857' }}>{successMessage}</div>
          </div>
        ) : null}

        {pendingMessage ? (
          <div style={{ backgroundColor: '#dbeafe', border: '1px solid #3b82f6', borderRadius: 8, padding: 20, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>Chưa đến bước nộp đánh giá</div>
            <div style={{ color: '#1e40af' }}>{pendingMessage}</div>
          </div>
        ) : null}

        {extraSections}
      </div>
    </div>
  );
}
