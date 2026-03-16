import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import interviewerService from '../../services/interviewerService';
import notify from '../../utils/notification';
import InterviewListPage from '../../components/shared/interviews/InterviewListPage';
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

  const participationStatus = (item) => {
    if (item.myConfirmedAt) return 'confirmed';
    if (item.myDeclinedAt) return 'declined';
    return 'pending';
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
        participation: participationStatus(item),
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
    <InterviewListPage
      title="Phỏng vấn của tôi"
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
          {(() => {
            const unconfirmedCount = interviews.filter((i) => !i.myConfirmedAt && !i.myDeclinedAt).length;
            return unconfirmedCount > 0 ? (
              <div style={{ padding: '12px 16px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, fontSize: 14 }}>
                <strong>📌 Xác nhận tham gia:</strong> Bạn có <strong>{unconfirmedCount}</strong> buổi chưa xác nhận. Vui lòng bấm <strong>Xác nhận tham gia</strong> hoặc <strong>Từ chối</strong> ở từng dòng bên dưới (phần Thao tác), hoặc bấm <strong>Xem chi tiết</strong> rồi thao tác trong trang chi tiết.
              </div>
            ) : null;
          })()}
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
      renderRowActions={(interview) => {
        const handleRespond = async (e, response) => {
          e.stopPropagation();
          let note;
          if (response === 'DECLINE') {
            const value = window.prompt('Ghi chú từ chối (tùy chọn, vd. bận ngày đó / có thể chọn ngày khác) để HR thương lượng:');
            if (value === null) return;
            note = (value || '').trim() || undefined;
          }
          try {
            await interviewerService.interviews.respond(interview.id, response, note);
            notify.success(response === 'CONFIRM' ? 'Đã xác nhận tham gia' : 'Đã ghi nhận từ chối');
            loadInterviews();
          } catch (err) {
            notify.error(err?.message || 'Thao tác thất bại');
          }
        };
        return (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 4 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>Thao tác:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {interview.participation === 'pending' && (
                <>
                  <button
                    onClick={(e) => handleRespond(e, 'CONFIRM')}
                    style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    ✓ Xác nhận tham gia
                  </button>
                  <button
                    onClick={(e) => handleRespond(e, 'DECLINE')}
                    style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #dc2626', backgroundColor: 'white', color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    ✗ Từ chối
                  </button>
                </>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/staff/interviews/${interview.id}`); }}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #6366f1', backgroundColor: 'white', color: '#6366f1', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
              >
                Xem chi tiết
              </button>
              {interview.needsFeedback && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/staff/interviews/${interview.id}`); }}
                  style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  Nộp feedback
                </button>
              )}
            </div>
          </div>
        );
      }}
      getCardData={(interview) => {
        const partLabel = interview.participation === 'confirmed' ? 'Đã xác nhận' : interview.participation === 'declined' ? 'Từ chối' : 'Chưa xác nhận';
        return {
          title: interview.candidateName,
          subtitle: `Phỏng vấn #${interview.id} • Vòng ${interview.roundNo} • ${partLabel}`,
          statusCode: interview.statusCode,
          statusLabel: interview.needsFeedback ? 'Cần nộp feedback' : interview.statusName,
          infoRows: [
            { label: 'Vị trí', value: interview.positionTitle },
            { label: 'Thời gian', value: formatDateTime(interview.startTime) },
            { label: 'Địa điểm / Link', value: interview.location || interview.meetingLink || 'Chưa cập nhật' }
          ],
          chips: (interview.participants || []).map((p) => `${p.userName} (${p.interviewRole})`),
          note: interview.needsFeedback
            ? '⚠️ Buổi này đã kết thúc và bạn chưa nộp feedback.'
            : interview.hasMyFeedback
              ? '✓ Bạn đã nộp feedback cho buổi này.'
              : interview.participation === 'pending'
                ? 'Vui lòng xác nhận tham gia hoặc từ chối (nút bên dưới).'
                : ''
        };
      }}
    />
  );
}