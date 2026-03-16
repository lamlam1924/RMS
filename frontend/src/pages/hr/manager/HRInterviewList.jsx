import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';
import InterviewListPage from '../../../components/shared/interviews/InterviewListPage';
import { formatDateTime } from '../../../utils/formatters/display';

export default function HRInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [focusMode, setFocusMode] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [roundFilter, setRoundFilter] = useState('all');

  useEffect(() => { loadInterviews(); }, [filter]);

  const isMissingInterviewer = (item) => {
    const participantCount = item.participantCount || 0;
    const openRequestCount = item.openParticipantRequestCount || 0;
    const fulfilledRequestCount = item.fulfilledParticipantRequestCount || 0;
    return participantCount === 0 && openRequestCount === 0 && fulfilledRequestCount === 0;
  };

  const isFinalStatus = (statusCode) => ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'INTERVIEWER_ABSENT'].includes(statusCode);

  const isReadyToFinalize = (item) => {
    const participantCount = item.participantCount || 0;
    const feedbackCount = item.feedbackCount || 0;
    if (isFinalStatus(item.statusCode)) return false;
    return participantCount > 0 && feedbackCount >= participantCount;
  };

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data = filter === 'upcoming'
        ? await hrService.interviews.getUpcoming()
        : await hrService.interviews.getAll();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load interviews:', error);
      notify.error(error?.message || 'Không thể tải danh sách phỏng vấn');
      setInterviews([]);
      if (error?.message?.includes('đăng nhập') || error?.message?.includes('quyền')) {
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const positionOptions = Array.from(new Set(interviews.map((item) => item.positionTitle).filter(Boolean)));
  const roundOptions = Array.from(new Set(interviews.map((item) => item.roundNo).filter((value) => value != null))).sort((a, b) => a - b);

  const displayedInterviews = interviews.filter((item) => {
    if (focusMode === 'pending-feedback') {
      return (item.participantCount || 0) > (item.feedbackCount || 0);
    }

    if (focusMode === 'missing-interviewer') {
      return isMissingInterviewer(item);
    }

    if (focusMode === 'ready-finalize') {
      return isReadyToFinalize(item);
    }

    if (focusMode === 'decline-notes') {
      return item.hasDeclineNote === true;
    }

    return true;
  }).filter((item) => {
    if (positionFilter !== 'all' && item.positionTitle !== positionFilter) {
      return false;
    }

    if (roundFilter !== 'all' && String(item.roundNo) !== roundFilter) {
      return false;
    }

    return true;
  });

  const summary = {
    total: interviews.length,
    pendingFeedback: interviews.filter((item) => (item.participantCount || 0) > (item.feedbackCount || 0)).length,
    missingInterviewer: interviews.filter((item) => isMissingInterviewer(item)).length,
    readyFinalize: interviews.filter((item) => isReadyToFinalize(item)).length,
    declineNotes: interviews.filter((item) => item.hasDeclineNote === true).length,
  };

  return (
    <InterviewListPage
      title="Danh sách phỏng vấn"
      description="Quản lý và theo dõi các buổi phỏng vấn ứng viên"
      filters={[
        { id: 'upcoming', label: 'Sắp diễn ra' },
        { id: 'all', label: 'Tất cả' }
      ]}
      filter={filter}
      onFilterChange={setFilter}
      loading={loading}
      items={displayedInterviews}
      emptyTitle="Chưa có lịch phỏng vấn"
      emptyDescription={filter === 'upcoming' ? 'Không có buổi phỏng vấn sắp diễn ra' : 'Không có dữ liệu phỏng vấn theo bộ lọc hiện tại'}
      topRight={(
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/staff/hr-manager/interviews/batch-request')}
            style={{
              padding: '9px 16px',
              border: '1px solid #2563eb',
              backgroundColor: 'white',
              color: '#2563eb',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Gửi yêu cầu theo block
          </button>
          <button
            onClick={() => navigate('/staff/hr-manager/interviews/next-round-batch')}
            style={{
              padding: '9px 16px',
              border: '1px solid #10b981',
              backgroundColor: 'white',
              color: '#047857',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Lên lịch vòng tiếp (theo vị trí)
          </button>
          <button
            onClick={() => navigate('/staff/hr-manager/interviews/create')}
            style={{
              padding: '9px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            + Tạo lịch phỏng vấn
          </button>
        </div>
      )}
      extraTop={(
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[
              { id: 'all', label: `Tất cả (${summary.total})` },
              { id: 'pending-feedback', label: `Chờ feedback (${summary.pendingFeedback})` },
              { id: 'missing-interviewer', label: `Thiếu interviewer (${summary.missingInterviewer})` },
              { id: 'ready-finalize', label: `Đủ điều kiện chốt vòng (${summary.readyFinalize})` },
              { id: 'decline-notes', label: `Cần xử lý từ chối (${summary.declineNotes})` },
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
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 8, marginBottom: 10 }}>
            <select
              value={positionFilter}
              onChange={(event) => setPositionFilter(event.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: 13,
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
            >
              <option value='all'>Tất cả vị trí</option>
              {positionOptions.map((position) => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>

            <select
              value={roundFilter}
              onChange={(event) => setRoundFilter(event.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: 13,
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
            >
              <option value='all'>Mọi vòng</option>
              {roundOptions.map((roundNo) => (
                <option key={roundNo} value={String(roundNo)}>Vòng {roundNo}</option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Đang hiển thị {displayedInterviews.length} buổi phỏng vấn theo bộ lọc hiện tại.
          </div>
        </div>
      )}
      onItemClick={(interview) => navigate(`/staff/hr-manager/interviews/${interview.id}`)}
      getCardData={(interview) => ({
        title: interview.candidateName,
        subtitle: `Vòng ${interview.roundNo} • ${interview.positionTitle} • ${interview.departmentName}`,
        statusCode: interview.statusCode,
        statusLabel: interview.statusName,
        infoRows: [
          { label: 'Bắt đầu', value: formatDateTime(interview.startTime, 'vi-VN') },
          { label: 'Kết thúc', value: formatDateTime(interview.endTime, 'vi-VN') },
          { label: 'Địa điểm', value: interview.location || '—' },
          { label: 'Người tham gia / Đánh giá', value: `${interview.participantCount} / ${interview.feedbackCount}` }
        ],
        note: [
          (interview.participantCount || 0) === 0
            ? ((interview.fulfilledParticipantRequestCount || 0) > 0
              ? '✅ Đã đề cử interviewer thành công, danh sách người tham gia sẽ được đồng bộ ngay.'
              : ((interview.openParticipantRequestCount || 0) > 0
                ? '⏳ Đang chờ phản hồi đề cử interviewer.'
                : '⚠️ Buổi này chưa có interviewer, cần điều phối sớm.'))
            : (interview.participantCount || 0) > (interview.feedbackCount || 0)
              ? `📝 Còn thiếu ${(interview.participantCount || 0) - (interview.feedbackCount || 0)} feedback.`
              : '',
          interview.hasDeclineNote ? '📌 Có ghi chú từ chối — cần xử lý (đề cử interviewer / đổi lịch).' : ''
        ].filter(Boolean).join(' • ')
      })}
    />
  );
}
