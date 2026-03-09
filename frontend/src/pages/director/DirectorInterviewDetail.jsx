import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import directorService from '../../services/directorService';
import notify from '../../utils/notification';
import { getStatusBadge } from '../../utils/helpers/badge';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function DirectorInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ scores: [], comment: '', decision: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadInterview(); }, [id]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const data = await directorService.interviews.getById(id);
      setInterview(data);
      if (data.evaluationCriteria?.length) {
        setFeedback(prev => ({
          ...prev,
          scores: data.evaluationCriteria.map(c => ({ criterionId: c.id, score: 0 }))
        }));
      }
    } catch {
      notify.error('Không thể tải thông tin phỏng vấn');
      navigate('/staff/director/my-interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.decision) { notify.warning('Vui lòng chọn kết quả'); return; }
    setSubmitting(true);
    try {
      await directorService.interviews.submitFeedback(id, feedback);
      notify.success('Đã nộp đánh giá phỏng vấn');
      await loadInterview();
    } catch (err) {
      notify.error(err.message || 'Nộp đánh giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;
  if (!interview) return null;

  const badge = getStatusBadge(interview.statusCode);
  const isFinal = ['COMPLETED', 'CANCELLED'].includes(interview.statusCode);
  const myFeedback = interview.feedbacks?.find(fb => fb.interviewerName === interview.candidateName);

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/staff/director/my-interviews')}
          style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}
        >
          ← Quay lại
        </button>
        <h1 style={{ flex: 1, fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>
          Chi tiết Phỏng vấn — Vòng {interview.roundNo}
        </h1>
        <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
          {interview.statusName || badge.label}
        </span>
      </div>

      {/* Candidate */}
      <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Ứng viên</div><div style={{ fontWeight: 500 }}>{interview.candidateName}</div></div>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Vị trí</div><div style={{ fontWeight: 500 }}>{interview.positionTitle}</div></div>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Phòng ban</div><div style={{ fontWeight: 500 }}>{interview.departmentName}</div></div>
        </div>
      </div>

      {/* Schedule */}
      <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Lịch phỏng vấn</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Bắt đầu</div><div style={{ fontWeight: 500 }}>{formatDateTime(interview.startTime)}</div></div>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Kết thúc</div><div style={{ fontWeight: 500 }}>{formatDateTime(interview.endTime)}</div></div>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Địa điểm</div><div style={{ fontWeight: 500 }}>{interview.location || '—'}</div></div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Link họp</div>
            {interview.meetingLink
              ? <a href={interview.meetingLink} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Mở link</a>
              : <span>—</span>}
          </div>
        </div>
      </div>

      {/* Participants */}
      <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>
          Người tham gia ({interview.participants?.length ?? 0})
        </h3>
        {!interview.participants?.length ? (
          <div style={{ color: '#6b7280', fontSize: 13 }}>Chưa có người tham gia</div>
        ) : interview.participants.map(p => (
          <div key={p.userId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: 6, marginBottom: 6 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{p.userName}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{p.email}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>
                {p.interviewRoleName || p.interviewRoleCode}
              </span>
              {p.hasSubmittedFeedback && (
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#d1fae5', color: '#065f46', fontWeight: 600 }}>✓</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Feedback form */}
      {!isFinal && (
        <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>Nộp đánh giá của bạn</h3>

          {feedback.scores.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Điểm đánh giá</div>
              {feedback.scores.map(sc => {
                const criterion = interview.evaluationCriteria?.find(c => c.id === sc.criterionId);
                return (
                  <div key={sc.criterionId} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{ flex: 1, fontSize: 13 }}>{criterion?.name || 'Tiêu chí'}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <button key={n} type="button"
                          onClick={() => setFeedback(prev => ({ ...prev, scores: prev.scores.map(s => s.criterionId === sc.criterionId ? { ...s, score: n } : s) }))}
                          style={{
                            width: 28, height: 28, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            border: sc.score === n ? 'none' : '1px solid #e5e7eb',
                            backgroundColor: sc.score === n ? '#3b82f6' : 'white',
                            color: sc.score === n ? 'white' : '#374151'
                          }}
                        >{n}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Nhận xét</label>
            <textarea
              value={feedback.comment}
              onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))}
              rows={3}
              placeholder="Nhận xét của bạn..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Kết quả <span style={{ color: '#ef4444' }}>*</span></div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['PASS', 'REJECT'].map(d => (
                <button key={d} type="button" onClick={() => setFeedback(f => ({ ...f, decision: d }))}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                    border: '2px solid',
                    borderColor: feedback.decision === d ? (d === 'PASS' ? '#10b981' : '#ef4444') : '#e5e7eb',
                    backgroundColor: feedback.decision === d ? (d === 'PASS' ? '#dcfce7' : '#fee2e2') : 'white',
                    color: feedback.decision === d ? (d === 'PASS' ? '#166534' : '#991b1b') : '#374151'
                  }}>
                  {d === 'PASS' ? '✅ Đạt' : '❌ Không đạt'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSubmitFeedback} disabled={submitting}
              style={{ padding: '10px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Đang nộp...' : 'Nộp đánh giá'}
            </button>
          </div>
        </div>
      )}

      {/* Existing feedbacks */}
      {interview.feedbacks?.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Đánh giá đã nộp ({interview.feedbacks.length})</h3>
          {interview.feedbacks.map(fb => (
            <div key={fb.id} style={{ padding: 14, backgroundColor: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 10 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{fb.interviewerName}</div>
              {fb.note && <div style={{ fontSize: 13, color: '#374151', marginBottom: 8, fontStyle: 'italic' }}>"{fb.note}"</div>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {fb.scores?.map((sc, idx) => (
                  <div key={idx} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, backgroundColor: 'white', border: '1px solid #e5e7eb' }}>
                    {sc.criteriaName}: <strong>{sc.score}</strong>/10
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
