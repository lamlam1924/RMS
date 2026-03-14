import React, { useEffect, useState } from 'react';
import hrService from '../../../services/hrService';
import { formatDateTimeVi } from '../../../utils/helpers/interviewPhase';

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  padding: 16
};

export default function PhaseOverviewPanel() {
  const [noShowSummary, setNoShowSummary] = useState(null);
  const [pendingFeedbacks, setPendingFeedbacks] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [noShowResult, pendingResult] = await Promise.allSettled([
        hrService.interviews.getNoShowStatistics(),
        hrService.interviews.getPendingFeedbacks({ overdueOnly: true })
      ]);

      if (!active) return;

      if (noShowResult.status === 'fulfilled') {
        setNoShowSummary(noShowResult.value);
      }

      if (pendingResult.status === 'fulfilled') {
        setPendingFeedbacks(Array.isArray(pendingResult.value) ? pendingResult.value.slice(0, 6) : []);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  if (!noShowSummary && pendingFeedbacks.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 24 }}>
      {noShowSummary && (
        <div style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Phase 2: No-show overview</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            <div style={{ padding: 12, borderRadius: 8, backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Tổng no-show</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{noShowSummary.totalNoShows || 0}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, backgroundColor: '#fef2f2' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Candidate</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c' }}>{noShowSummary.candidateNoShows || 0}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, backgroundColor: '#eff6ff' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Interviewer</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1d4ed8' }}>{noShowSummary.interviewerNoShows || 0}</div>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#111827' }}>Top no-show candidates</div>
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
                      {item.isBlacklisted ? 'Đã blacklist' : 'Đang theo dõi'}
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
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Phase 2: Pending feedback</div>
        {pendingFeedbacks.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingFeedbacks.map((item) => (
              <div key={`${item.interviewId}-${item.interviewerId}`} style={{ padding: 10, border: '1px solid #eef2f7', borderRadius: 8, backgroundColor: item.isOverdue ? '#fff7ed' : '#f8fafc' }}>
                <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>{item.interviewTitle}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{item.interviewerName} • {item.interviewerEmail}</div>
                <div style={{ fontSize: 12, color: item.isOverdue ? '#c2410c' : '#475569' }}>
                  Hạn: {formatDateTimeVi(item.requiresFeedbackBy)} • {item.daysSinceInterview} ngày từ lúc interview
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#6b7280' }}>Không có feedback quá hạn.</div>
        )}
      </div>
    </div>
  );
}
