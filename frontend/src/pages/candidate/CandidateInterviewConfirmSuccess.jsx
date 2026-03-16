import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Trang hiển thị sau khi ứng viên bấm link xác nhận/tham gia phỏng vấn trong email.
 */
export default function CandidateInterviewConfirmSuccess() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 40, maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#166534', marginBottom: 12 }}>Xác nhận thành công</h1>
        <p style={{ fontSize: 15, color: '#15803d', marginBottom: 24 }}>
          Chúng tôi đã ghi nhận phản hồi của bạn. Bạn có thể xem lại lịch phỏng vấn trong mục Ứng tuyển của mình.
        </p>
        <button
          type="button"
          onClick={() => navigate('/app/interviews', { replace: true })}
          style={{ padding: '12px 24px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 15 }}
        >
          Xem danh sách phỏng vấn
        </button>
      </div>
    </div>
  );
}
