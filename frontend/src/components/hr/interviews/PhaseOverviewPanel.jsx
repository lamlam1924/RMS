import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { formatDateTimeVi } from '../../../utils/helpers/interviewPhase';

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  padding: 16
};

function formatDateTimeShort(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

export default function PhaseOverviewPanel() {
  const navigate = useNavigate();
  const [noShowSummary, setNoShowSummary] = useState(null);
  const [pendingFeedbacks, setPendingFeedbacks] = useState([]);
  const [needingAttention, setNeedingAttention] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [noShowResult, pendingResult, attentionResult] = await Promise.allSettled([
        hrService.interviews.getNoShowStatistics(),
        hrService.interviews.getPendingFeedbacks({ overdueOnly: true }),
        hrService.interviews.getNeedingAttention()
      ]);

      if (!active) return;

      if (noShowResult.status === 'fulfilled') {
        setNoShowSummary(noShowResult.value);
      }

      if (pendingResult.status === 'fulfilled') {
        setPendingFeedbacks(Array.isArray(pendingResult.value) ? pendingResult.value.slice(0, 6) : []);
      }

      if (attentionResult.status === 'fulfilled' && Array.isArray(attentionResult.value)) {
        setNeedingAttention(attentionResult.value.slice(0, 8));
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  if (!noShowSummary && pendingFeedbacks.length === 0 && needingAttention.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 24 }}>
      {needingAttention.length > 0 && (
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
            Cần xử lý từ chối (ứng viên / interviewer)
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
            Các buổi có ghi chú từ chối — đề cử interviewer khác hoặc đổi lịch rồi gửi lại cho ứng viên.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {needingAttention.map((item) => (
              <div
                key={item.interviewId}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/staff/hr-manager/interviews/${item.interviewId}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/staff/hr-manager/interviews/${item.interviewId}`)}
                style={{
                  padding: 10,
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  backgroundColor: '#fef2f2',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                  {item.candidateName} — {item.positionTitle}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                  {formatDateTimeShort(item.startTime)} • {item.statusName}
                </div>
                {item.candidateDeclined && item.candidateDeclineNote && (
                  <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}>
                    Ứng viên từ chối: {item.candidateDeclineNote}
                  </div>
                )}
                {item.declinedParticipantNames?.length > 0 && (
                  <div style={{ fontSize: 12, color: '#92400e', marginTop: 4 }}>
                    Interviewer từ chối: {item.declinedParticipantNames.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {noShowSummary && (
        <div style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Tổng quan vắng mặt (No-show)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            <div style={{ padding: 12, borderRadius: 8, backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Tổng no-show</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{noShowSummary.totalNoShows || 0}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, backgroundColor: '#fef2f2' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Ứng viên</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c' }}>{noShowSummary.candidateNoShows || 0}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, backgroundColor: '#eff6ff' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Người phỏng vấn</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1d4ed8' }}>{noShowSummary.interviewerNoShows || 0}</div>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#111827' }}>Ứng viên vắng mặt nhiều nhất</div>
          {noShowSummary.topOffenders?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {noShowSummary.topOffenders.slice(0, 4).map((item) => (
                <div key={item.candidateId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, border: '1px solid #eef2f7', borderRadius: 8, backgroundColor: '#fcfcfd' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{item.candidateName}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{item.candidateEmail}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#111827' }}>{item.totalNoShows} lần</div>
                    <div style={{ fontSize: 12, color: item.isBlacklisted ? '#b91c1c' : '#6b7280' }}>
                      {item.isBlacklisted ? 'Đã đưa vào danh sách đen' : 'Đang theo dõi'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#6b7280' }}>Chưa có dữ liệu no-show.</div>
          )}
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Đánh giá (feedback) quá hạn</div>
        {pendingFeedbacks.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingFeedbacks.map((item) => (
              <div key={`${item.interviewId}-${item.interviewerId}`} style={{ padding: 10, border: '1px solid #eef2f7', borderRadius: 8, backgroundColor: item.isOverdue ? '#fff7ed' : '#f8fafc' }}>
                <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>{item.interviewTitle}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{item.interviewerName} • {item.interviewerEmail}</div>
                <div style={{ fontSize: 12, color: item.isOverdue ? '#c2410c' : '#475569' }}>
                  Hạn nộp: {formatDateTimeVi(item.requiresFeedbackBy)} • {item.daysSinceInterview} ngày sau buổi phỏng vấn
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#6b7280' }}>Không có đánh giá nào quá hạn.</div>
        )}
      </div>
    </div>
  );
}
