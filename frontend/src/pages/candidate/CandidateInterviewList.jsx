import React, { useState, useEffect } from 'react';
import { candidateService } from '../../services/candidateService';
import notify from '../../utils/notification';
import { getStatusBadge } from '../../utils/helpers/badge';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export default function CandidateInterviewList() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null); // id of interview being responded to

  useEffect(() => { loadInterviews(); }, []);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data = await candidateService.getMyInterviews();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      notify.error('Không thể tải danh sách phỏng vấn');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (interviewId, response) => {
    setResponding(interviewId);
    try {
      await candidateService.respondInterview(interviewId, response);
      notify.success(response === 'CONFIRM' ? 'Đã xác nhận tham gia phỏng vấn' : 'Đã từ chối lịch phỏng vấn');
      await loadInterviews();
    } catch (err) {
      notify.error(err.message || 'Thao tác thất bại');
    } finally {
      setResponding(null);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
          Lịch phỏng vấn của tôi
        </h1>
        <p style={{ color: '#6b7280' }}>Xem và phản hồi lời mời tham gia phỏng vấn</p>
      </div>

      {interviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Chưa có lịch phỏng vấn</h3>
          <p style={{ color: '#6b7280' }}>Bạn chưa được mời tham gia phỏng vấn nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {interviews.map((interview) => {
            const canRespond = ['SCHEDULED', 'RESCHEDULED'].includes(interview.statusCode);
            const isLoading = responding === interview.id;
            const badge = getStatusBadge(interview.statusCode);

            return (
              <div key={interview.id} style={{
                backgroundColor: 'white', padding: 20, borderRadius: 8,
                border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{interview.positionTitle}</h3>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>Round {interview.roundNo} • {interview.departmentName}</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
                    {interview.statusName || badge.label}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 12 }}>
                  <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Start</div><div style={{ fontWeight: 500 }}>{formatDateTime(interview.startTime)}</div></div>
                  <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>End</div><div style={{ fontWeight: 500 }}>{formatDateTime(interview.endTime)}</div></div>
                  <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Location</div><div style={{ fontWeight: 500 }}>{interview.location || '—'}</div></div>
                  {interview.meetingLink && (
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Meeting Link</div>
                      <a href={interview.meetingLink} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 500 }}>Open link</a>
                    </div>
                  )}
                </div>

                {canRespond && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => handleRespond(interview.id, 'CONFIRM')} disabled={isLoading}
                      style={{ padding: '8px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: isLoading ? 0.7 : 1 }}>
                      {isLoading ? '...' : 'Xác nhận tham dự'}
                    </button>
                    <button onClick={() => handleRespond(interview.id, 'DECLINE')} disabled={isLoading}
                      style={{ padding: '8px 20px', backgroundColor: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 6, cursor: 'pointer', fontWeight: 500, opacity: isLoading ? 0.7 : 1 }}>
                      {isLoading ? '...' : 'Từ chối'}
                    </button>
                  </div>
                )}
                {interview.statusCode === 'CONFIRMED' && (
                  <div style={{ padding: '8px 12px', backgroundColor: '#d1fae5', borderRadius: 6, fontSize: 13, color: '#065f46' }}>
                    ✓ Bạn đã xác nhận tham gia phỏng vấn này
                  </div>
                )}
                {interview.statusCode === 'DECLINED_BY_CANDIDATE' && (
                  <div style={{ padding: '8px 12px', backgroundColor: '#fee2e2', borderRadius: 6, fontSize: 13, color: '#991b1b' }}>
                    Bạn đã từ chối lịch phỏng vấn này
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
