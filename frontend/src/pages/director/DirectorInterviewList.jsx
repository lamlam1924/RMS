import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import directorService from '../../services/directorService';
import { LoadingSpinner } from '../../components/shared';
import { getStatusBadge } from '../../utils/helpers/badge';
import notify from '../../utils/notification';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function DirectorInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => { loadInterviews(); }, [filter]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data = filter === 'upcoming'
        ? await directorService.interviews.getUpcoming()
        : await directorService.interviews.getAll();
      setInterviews(data || []);
    } catch {
      notify.error('Không thể tải danh sách phỏng vấn');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Phỏng vấn của tôi</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Các buổi phỏng vấn bạn tham gia với tư cách người phỏng vấn</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['upcoming', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                border: filter === f ? 'none' : '1px solid #d1d5db',
                backgroundColor: filter === f ? '#3b82f6' : 'white',
                color: filter === f ? 'white' : '#374151'
              }}
            >
              {f === 'upcoming' ? 'Sắp diễn ra' : 'Tất cả'}
            </button>
          ))}
        </div>
      </div>

      {interviews.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 40, textAlign: 'center', color: '#6b7280' }}>
          {filter === 'upcoming' ? 'Không có cuộc phỏng vấn nào sắp diễn ra' : 'Chưa có cuộc phỏng vấn nào'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {interviews.map(interview => {
            const badge = getStatusBadge(interview.statusCode);
            return (
              <div
                key={interview.id}
                onClick={() => navigate(`/staff/director/my-interviews/${interview.id}`)}
                style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20, cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{interview.candidateName}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{interview.positionTitle} — {interview.departmentName}</div>
                    <div style={{ fontSize: 13, color: '#374151' }}>📅 {formatDateTime(interview.startTime)}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
