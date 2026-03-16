import React from 'react';

const baseInputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
  boxSizing: 'border-box'
};

const DEFAULT_DECISION_OPTIONS = [
  { value: 'PASS', label: 'Đạt', isPositive: true },
  { value: 'REJECT', label: 'Không đạt', isPositive: false },
];

// Lựa chọn kết luận cho tất cả interviewer: chỉ còn Đạt / Không đạt
export const INTERVIEW_FEEDBACK_DECISION_OPTIONS = [
  { value: 'PASS', label: 'Đạt', isPositive: true },
  { value: 'REJECT', label: 'Không đạt', isPositive: false },
];

/** Map recommendation code → label (dùng khi hiển thị feedback trong danh sách / chốt vòng) */
export const RECOMMENDATION_LABELS = {
  STRONG_HIRE: 'Rất nên tuyển',
  HIRE: 'Đạt',
  NO_HIRE: 'Không đạt',
  STRONG_NO_HIRE: 'Dứt khoát không tuyển',
};

export default function InterviewFeedbackForm({
  title = 'Nộp đánh giá',
  description,
  feedback,
  setFeedback,
  submitting,
  onSubmit,
  submitLabel = 'Nộp đánh giá',
  commentLabel = 'Nhận xét',
  commentPlaceholder = 'Ghi nhận xét của bạn về ứng viên...',
  decisionLabels,
  decisionOptions: decisionOptionsProp,
  disabled = false
}) {
  const decisionOptions = decisionOptionsProp != null
    ? decisionOptionsProp
    : (decisionLabels
        ? Object.entries(decisionLabels).map(([value, label]) => ({
            value,
            label,
            isPositive: value === 'PASS' || value === 'HIRE' || value === 'STRONG_HIRE',
          }))
        : DEFAULT_DECISION_OPTIONS);

  return (
    <div style={{ backgroundColor: 'white', borderRadius: 10, border: '1px solid #e5e7eb', padding: 20 }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h3>
        {description && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{description}</div>}
      </div>

      {/* Nhận xét */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{commentLabel}</label>
        <textarea
          value={feedback.comment || ''}
          disabled={disabled || submitting}
          onChange={(e) => setFeedback((prev) => ({ ...prev, comment: e.target.value }))}
          rows={4}
          placeholder={commentPlaceholder}
          style={{ ...baseInputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Kết luận */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
          Kết luận <span style={{ color: '#ef4444' }}>*</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: decisionOptions.length === 4 ? '1fr 1fr' : '1fr 1fr', gap: 10 }}>
          {decisionOptions.map((opt) => {
            const active = feedback.decision === opt.value;
            const isPositive = opt.isPositive !== false;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled || submitting}
                onClick={() => setFeedback((prev) => ({ ...prev, decision: opt.value }))}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: disabled || submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  border: '2px solid',
                  borderColor: active ? (isPositive ? '#10b981' : '#ef4444') : '#e5e7eb',
                  backgroundColor: active ? (isPositive ? '#dcfce7' : '#fee2e2') : 'white',
                  color: active ? (isPositive ? '#166534' : '#991b1b') : '#374151',
                  fontSize: 13,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || submitting || !feedback.decision}
          style={{
            padding: '11px 24px',
            backgroundColor: disabled || submitting || !feedback.decision ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: disabled || submitting || !feedback.decision ? 'not-allowed' : 'pointer',
            fontWeight: 600
          }}
        >
          {submitting ? 'Đang nộp...' : submitLabel}
        </button>
      </div>
    </div>
  );
}