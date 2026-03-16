import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { candidateService } from '../../services/candidateService';
import notify from '../../utils/notification';

/**
 * Trang xác nhận / từ chối tham gia phỏng vấn (mở từ link trong email).
 * Route: /app/interviews/:id/confirm hoặc /app/interviews/:id/decline
 */
export default function CandidateInterviewConfirm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isDecline = location.pathname.endsWith('/decline');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await candidateService.respondInterview(id, isDecline ? 'DECLINE' : 'CONFIRM', isDecline ? note : undefined);
      setDone(true);
      notify.success(isDecline ? 'Đã ghi nhận từ chối tham gia' : 'Đã xác nhận tham gia phỏng vấn');
      setTimeout(() => navigate('/app/interviews/confirm-success', { replace: true }), 800);
    } catch (err) {
      notify.error(err?.message || 'Thao tác thất bại');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 32, maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        {!done ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
              {isDecline ? 'Từ chối tham gia phỏng vấn?' : 'Xác nhận tham gia phỏng vấn?'}
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
              {isDecline
                ? 'Bạn chắc chắn muốn từ chối lịch phỏng vấn này? Bạn có thể ghi chú lý do hoặc đề xuất khung giờ khác để HR xem xét đổi lịch.'
                : 'Bấm bên dưới để xác nhận bạn sẽ tham gia buổi phỏng vấn.'}
            </p>
            {isDecline && (
              <div style={{ marginBottom: 20, textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Ghi chú cho HR (tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Em bận hôm đó, có thể đổi sang buổi chiều hôm sau được không?"
                  style={{
                    width: '100%',
                    fontSize: 13,
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/app/interviews', { replace: true })}
                style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, backgroundColor: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  backgroundColor: isDecline ? '#dc2626' : '#16a34a',
                  color: 'white',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Đang xử lý...' : isDecline ? 'Từ chối tham gia' : 'Xác nhận tham gia'}
              </button>
            </div>
          </>
        ) : (
          <p style={{ fontSize: 16, color: '#16a34a', fontWeight: 600 }}>Đang chuyển hướng...</p>
        )}
      </div>
    </div>
  );
}
