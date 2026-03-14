import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import directorService from '../../services/directorService';
import notify from '../../utils/notification';
import { getStatusBadge } from '../../utils/helpers/badge';
import InterviewFeedbackForm from '../../components/shared/InterviewFeedbackForm';
import SimpleInterviewerDetailPage from '../../components/shared/interviews/SimpleInterviewerDetailPage';
import { formatDateTime } from '../../utils/formatters/display';

export default function DirectorInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ comment: '', decision: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadInterview(); }, [id]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const data = await directorService.interviews.getById(id);
      setInterview(data);
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
  const isPast = new Date(interview.endTime) < new Date();
  const canEvaluate = isPast && !interview.hasMyFeedback && !isFinal;

  return (
    <SimpleInterviewerDetailPage
      onBack={() => navigate('/staff/director/my-interviews')}
      title={`Chi tiết phỏng vấn — Vòng ${interview.roundNo}`}
      statusBadge={badge}
      statusText={interview.statusName || badge.label}
      flowMessage={
        interview.hasMyFeedback
          ? 'Bạn đã nộp đánh giá cho buổi phỏng vấn này.'
          : canEvaluate
            ? 'Bạn có thể nộp đánh giá ngay ở phần bên dưới.'
            : 'Phần đánh giá chỉ mở sau khi buổi phỏng vấn kết thúc.'
      }
      summaryRows={[
        { label: 'Ứng viên', value: interview.candidateName },
        { label: 'Vị trí', value: interview.positionTitle },
        { label: 'Phòng ban', value: interview.departmentName }
      ]}
      scheduleRows={[
        { label: 'Bắt đầu', value: formatDateTime(interview.startTime) },
        { label: 'Kết thúc', value: formatDateTime(interview.endTime) },
        { label: 'Địa điểm', value: interview.location || '—' },
        { label: 'Link họp', value: interview.meetingLink || '—' }
      ]}
      participants={(interview.participants || []).map((p) => ({
        id: p.userId,
        name: p.userName,
        email: p.email,
        role: p.interviewRoleName || p.interviewRoleCode,
        hasFeedback: p.hasSubmittedFeedback
      }))}
      feedbackSection={
        canEvaluate ? (
          <InterviewFeedbackForm
            title="Nộp đánh giá của bạn"
            description="Ghi nhận xét về ứng viên và chọn kết luận cuối cùng."
            feedback={feedback}
            setFeedback={setFeedback}
            submitting={submitting}
            onSubmit={handleSubmitFeedback}
            submitLabel="Gửi đánh giá"
            commentLabel="Nhận xét tổng quan"
            commentPlaceholder="Ghi nhận xét chính của bạn về ứng viên..."
          />
        ) : null
      }
      successMessage={interview.hasMyFeedback ? 'Đánh giá của bạn đã được lưu cho buổi phỏng vấn này.' : null}
      pendingMessage={!canEvaluate && !interview.hasMyFeedback && !isFinal ? `Bạn có thể nộp đánh giá sau khi buổi phỏng vấn kết thúc vào ${formatDateTime(interview.endTime)}.` : null}
      extraSections={
        interview.feedbacks?.length > 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Đánh giá đã nộp ({interview.feedbacks.length})</h3>
            {interview.feedbacks.map((fb) => (
              <div key={fb.id} style={{ padding: 14, backgroundColor: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 10 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{fb.interviewerName}</div>
                {fb.note ? <div style={{ fontSize: 13, color: '#374151', marginBottom: 8, fontStyle: 'italic' }}>"{fb.note}"</div> : null}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(fb.scores || []).map((sc, idx) => (
                    <div key={idx} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, backgroundColor: 'white', border: '1px solid #e5e7eb' }}>
                      {sc.criteriaName}: <strong>{sc.score}</strong>/10
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null
      }
    />
  );
}
