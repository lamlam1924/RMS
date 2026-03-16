import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import employeeService from '../../services/employeeService';
import notify from '../../utils/notification';
import InterviewListPage from '../../components/shared/interviews/InterviewListPage';
import { formatDateTime } from '../../utils/formatters/display';

export default function EmployeeInterviewList() {
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
        data = await employeeService.interviews.getUpcoming();
      } else {
        data = await employeeService.interviews.getAll();
        if (filter === 'past') {
          const now = new Date();
          data = (Array.isArray(data) ? data : []).filter(
            (item) => new Date(item.startTime) < now
          );
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
  const participationStatus = (item) => {
    if (item.myConfirmedAt) return 'confirmed';
    if (item.myDeclinedAt) return 'declined';
    return 'pending';
  };

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
    pending: interviews.filter((i) => {
      const end = new Date(i.endTime || i.startTime);
      return end < now && !i.hasMyFeedback;
    }).length,
    submitted: interviews.filter((i) => i.hasMyFeedback).length,
  };

  const getSessionLabel = (interview) => {
    const date = new Date(interview.startTime);
    const hour = date.getHours();
    const shift = hour < 12 ? 'Buổi sáng' : hour < 18 ? 'Buổi chiều' : 'Buổi tối';
    return `${date.toLocaleDateString('vi-VN')} • ${shift}`;
  };

  const unconfirmedCount = interviews.filter((i) => !i.myConfirmedAt && !i.myDeclinedAt).length;

  return (
    <InterviewListPage
      title="Phỏng vấn của tôi"
      description="Các buổi bạn được phân công phỏng vấn. Bấm vào từng dòng để xem chi tiết hoặc xác nhận/từ chối tham gia."
      filters={[
        { id: 'upcoming', label: 'Sắp tới' },
        { id: 'past', label: 'Đã qua' },
        { id: 'all', label: 'Tất cả' },
      ]}
      filter={filter}
      onFilterChange={setFilter}
      loading={loading}
      items={enhancedInterviews}
      emptyTitle="Không có buổi phỏng vấn nào"
      emptyDescription={
        filter === 'upcoming'
          ? 'Chưa có lịch sắp tới.'
          : 'Không có dữ liệu.'
      }
      extraTop={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {unconfirmedCount > 0 && (
            <div style={{ padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
              Bạn có <strong>{unconfirmedCount}</strong> buổi chưa xác nhận — bấm <strong>Xác nhận</strong> hoặc <strong>Từ chối</strong> ở từng dòng bên dưới.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ padding: '14px 16px', backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Tổng</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{summary.total}</div>
            </div>
            <div style={{ padding: '14px 16px', backgroundColor: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Cần feedback</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{summary.pending}</div>
            </div>
            <div style={{ padding: '14px 16px', backgroundColor: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#15803d', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Đã nộp</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>{summary.submitted}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setFocusMode(focusMode === 'pending' ? 'all' : 'pending')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${focusMode === 'pending' ? '#2563eb' : '#e5e7eb'}`,
                backgroundColor: focusMode === 'pending' ? '#eff6ff' : 'white',
                color: focusMode === 'pending' ? '#1d4ed8' : '#6b7280',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 12,
              }}
            >
              {focusMode === 'pending' ? 'Xem tất cả' : 'Chỉ cần nộp feedback'}
            </button>
          </div>
        </div>
      }
      onItemClick={(interview) => navigate(`/staff/employee/interviews/${interview.id}`)}
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
            await employeeService.interviews.respond(interview.id, response, note);
            notify.success(response === 'CONFIRM' ? 'Đã xác nhận tham gia' : 'Đã ghi nhận từ chối');
            loadInterviews();
          } catch (err) {
            notify.error(err?.message || 'Thao tác thất bại');
          }
        };
        return (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/staff/employee/interviews/${interview.id}`); }}
              style={{ padding: '8px 14px', borderRadius: 6, border: 'none', backgroundColor: '#4f46e5', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
            >
              Xem chi tiết
            </button>
            {interview.participation === 'pending' && (
              <>
                <button onClick={(e) => handleRespond(e, 'CONFIRM')} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', backgroundColor: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                  Xác nhận
                </button>
                <button onClick={(e) => handleRespond(e, 'DECLINE')} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#6b7280', cursor: 'pointer', fontWeight: 500, fontSize: 12 }}>
                  Từ chối
                </button>
              </>
            )}
            {interview.needsFeedback && (
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Cần nộp feedback → bấm Xem chi tiết</span>
            )}
          </div>
        );
      }}
      getCardData={(interview) => {
        const partLabel = interview.participation === 'confirmed' ? 'Đã xác nhận' : interview.participation === 'declined' ? 'Đã từ chối' : 'Chưa xác nhận';
        return {
          title: interview.candidateName,
          subtitle: `Vòng ${interview.roundNo} · ${formatDateTime(interview.startTime, 'vi-VN')} · ${partLabel}`,
          statusCode: interview.statusCode,
          statusLabel: interview.needsFeedback ? 'Cần nộp feedback' : interview.statusName,
          infoRows: [
            { label: 'Vị trí', value: interview.positionTitle },
            { label: 'Phòng ban', value: interview.departmentName },
            { label: 'Địa điểm / Link', value: interview.location || interview.meetingLink || '—' },
          ],
          note: interview.needsFeedback ? 'Đã kết thúc — chưa nộp đánh giá.' : interview.hasMyFeedback ? 'Đã nộp feedback.' : null,
        };
      }}
    />
  );
}
