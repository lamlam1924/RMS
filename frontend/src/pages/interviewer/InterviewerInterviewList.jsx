import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import interviewerService from '../../services/interviewerService';
import SimpleInterviewListPage from '../../components/shared/interviews/SimpleInterviewListPage';
import { formatDateTime } from '../../utils/formatters/display';

export default function InterviewerInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [focusMode, setFocusMode] = useState('pending');

  useEffect(() => {
    loadInterviews();
  }, [filter]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      let data = [];

      if (filter === 'upcoming') {
        data = await interviewerService.interviews.getUpcoming();
      } else {
        data = await interviewerService.interviews.getAll();
        if (filter === 'past') {
          const now = new Date();
          data = data.filter((item) => new Date(item.startTime) < now);
        }
      }

      setInterviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load interviews:', error);
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const enhancedInterviews = interviews
    .map((item) => {
      const start = new Date(item.startTime);
      const end = new Date(item.endTime || item.startTime);
      const canSubmitNow = end < now;
      const needsFeedback = canSubmitNow && !item.hasMyFeedback;
      return {
        ...item,
        canSubmitNow,
        needsFeedback,
      };
    })
    .filter((item) => {
      if (focusMode === 'pending') return item.needsFeedback;
      return true;
    })
    .sort((a, b) => {
      if (a.needsFeedback !== b.needsFeedback) return a.needsFeedback ? -1 : 1;
      return new Date(a.startTime) - new Date(b.startTime);
    });

  const summary = {
    total: interviews.length,
    pending: enhancedInterviews.filter((item) => item.needsFeedback).length,
    submitted: interviews.filter((item) => item.hasMyFeedback).length,
  };

  const getSessionLabel = (interview) => {
    const date = new Date(interview.startTime);
    const hour = date.getHours();
    const shift = hour < 12 ? 'Buổi sáng' : hour < 18 ? 'Buổi chiều' : 'Buổi tối';
    return `${date.toLocaleDateString('vi-VN')} • ${shift}`;
  };

  return (
    <SimpleInterviewListPage
      title="Phỏng vấn của tôi"
      description="Danh sách buổi phỏng vấn mà bạn đang tham gia với vai trò người phỏng vấn"
      filters={[
        { id: 'upcoming', label: 'Sắp tới' },
        { id: 'past', label: 'Đã qua' },
        { id: 'all', label: 'Tất cả' }
      ]}
      filter={filter}
      onFilterChange={setFilter}
      loading={loading}
      items={enhancedInterviews}
      emptyTitle="Không có buổi phỏng vấn nào"
      emptyDescription={filter === 'upcoming' ? 'Hiện chưa có lịch phỏng vấn sắp tới.' : 'Không có dữ liệu phù hợp với bộ lọc hiện tại.'}
      extraTop={(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Tổng buổi</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{summary.total}</div>
            </div>
            <div style={{ backgroundColor: 'white', border: '1px solid #fecaca', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#991b1b' }}>Cần feedback ngay</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{summary.pending}</div>
            </div>
            <div style={{ backgroundColor: 'white', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#166534' }}>Đã nộp feedback</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{summary.submitted}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'pending', label: 'Ưu tiên chưa nộp' },
              { id: 'all', label: 'Xem tất cả' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setFocusMode(mode.id)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 999,
                  border: `1px solid ${focusMode === mode.id ? '#2563eb' : '#d1d5db'}`,
                  backgroundColor: focusMode === mode.id ? '#2563eb' : 'white',
                  color: focusMode === mode.id ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      )}
      onItemClick={(interview) => navigate(`/staff/interviews/${interview.id}`)}
      getGroupLabel={getSessionLabel}
      renderRowActions={(interview) => (
        interview.needsFeedback ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/staff/interviews/${interview.id}`);
              }}
              style={{
                padding: '7px 12px',
                borderRadius: 6,
                border: 'none',
                backgroundColor: '#2563eb',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              Nộp feedback ngay
            </button>
          </div>
        ) : null
      )}
      getCardData={(interview) => ({
        title: interview.candidateName,
        subtitle: `Phỏng vấn #${interview.id} • Vòng ${interview.roundNo}`,
        statusCode: interview.statusCode,
        statusLabel: interview.needsFeedback ? 'Cần nộp feedback' : interview.statusName,
        infoRows: [
          { label: 'Vị trí', value: interview.positionTitle },
          { label: 'Thời gian', value: formatDateTime(interview.startTime) },
          { label: 'Địa điểm / Link', value: interview.location || interview.meetingLink || 'Chưa cập nhật' }
        ],
        chips: (interview.participants || []).map((participant) => `${participant.userName} (${participant.interviewRole})`),
        note: interview.needsFeedback
          ? '⚠️ Buổi này đã kết thúc và bạn chưa nộp feedback.'
          : interview.hasMyFeedback
            ? '✓ Bạn đã nộp feedback cho buổi này.'
            : ''
      })}
    />
  );
}