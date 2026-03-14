import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateService } from '../../services/candidateService';
import notify from '../../utils/notification';
import SimpleInterviewListPage from '../../components/shared/interviews/SimpleInterviewListPage';
import { formatDateTime } from '../../utils/formatters/display';

export default function CandidateInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

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

  return (
    <SimpleInterviewListPage
      title="Lịch phỏng vấn của tôi"
      description="Xem và phản hồi lời mời tham gia phỏng vấn"
      loading={loading}
      items={interviews}
      emptyTitle="Chưa có lịch phỏng vấn"
      emptyDescription="Bạn chưa được mời tham gia phỏng vấn nào."
      getCardData={(interview) => {
        const canRespond = ['SCHEDULED', 'RESCHEDULED'].includes(interview.statusCode);
        return {
          title: interview.positionTitle,
          subtitle: `Vòng ${interview.roundNo} • ${interview.departmentName}`,
          statusCode: interview.statusCode,
          statusLabel: interview.statusName,
          infoRows: [
            { label: 'Bắt đầu', value: formatDateTime(interview.startTime, 'vi-VN') },
            { label: 'Kết thúc', value: formatDateTime(interview.endTime, 'vi-VN') },
            { label: 'Địa điểm', value: interview.location || '—' },
            { label: 'Link họp', value: interview.meetingLink || '—' }
          ],
          note: interview.statusCode === 'CONFIRMED'
            ? 'Bạn đã xác nhận tham gia phỏng vấn này'
            : interview.statusCode === 'DECLINED_BY_CANDIDATE'
              ? 'Bạn đã từ chối lịch phỏng vấn này'
              : canRespond
                ? 'Vui lòng phản hồi lịch phỏng vấn'
                : ''
        };
      }}
      renderRowActions={(interview) => {
        const canRespond = ['SCHEDULED', 'RESCHEDULED'].includes(interview.statusCode);
        const isLoading = responding === interview.id;

        return (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(`/app/interviews/${interview.id}`)}
              style={{
                padding: '8px 14px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Xem chi tiết
            </button>
            {canRespond && (
              <>
                <button
                  onClick={() => handleRespond(interview.id, 'CONFIRM')}
                  disabled={isLoading}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  {isLoading ? '...' : 'Xác nhận tham dự'}
                </button>
                <button
                  onClick={() => handleRespond(interview.id, 'DECLINE')}
                  disabled={isLoading}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: 'white',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 500,
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  {isLoading ? '...' : 'Từ chối'}
                </button>
              </>
            )}
          </div>
        );
      }}
    />
  );
}
