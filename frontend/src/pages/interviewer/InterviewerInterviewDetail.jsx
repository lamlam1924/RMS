import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import interviewerService from '../../services/interviewerService';
import notify from '../../utils/notification';
import { getStatusBadge } from '../../utils/helpers/badge';
import InterviewFeedbackForm from '../../components/shared/InterviewFeedbackForm';
import SimpleInterviewerDetailPage from '../../components/shared/interviews/SimpleInterviewerDetailPage';
import { formatDateTime } from '../../utils/formatters/display';

export default function InterviewerInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ comment: '', decision: '' });

  useEffect(() => {
    loadInterview();
  }, [id]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const data = await interviewerService.interviews.getById(id);
      setInterview(data);

    } catch (error) {
      console.error('Failed to load interview detail:', error);
      notify.error('Không thể tải thông tin phỏng vấn');
      navigate('/staff/interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.decision) {
      notify.warning('Vui lòng chọn kết luận');
      return;
    }

    try {
      setSubmitting(true);
      await interviewerService.interviews.submitFeedback(id, feedback);
      notify.success('Đã nộp đánh giá phỏng vấn');
      await loadInterview();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      notify.error(error.message || 'Không thể nộp đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;
  if (!interview) return null;

  const badge = getStatusBadge(interview.statusCode);
  const isFinal = ['COMPLETED', 'CANCELLED'].includes(interview.statusCode);
  const canEvaluate = new Date(interview.endTime) < new Date() && !interview.hasMyFeedback && !isFinal;

  const cp = interview.candidateProfile;
  const prevRounds = interview.previousRounds || [];

  const sectionCard = (title, children, mb = 12) => (
    <div style={{ backgroundColor: 'white', borderRadius: 10, border: '1px solid #e5e7eb', padding: 20, marginBottom: mb }}>
      {title && (
        <h3 style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );

  const candidateSection = cp ? (
    <>
      {sectionCard('Hồ sơ ứng viên', (
        <>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
            {cp.summary || <span style={{ color: '#9ca3af' }}>Chưa có tóm tắt.</span>}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {cp.yearsOfExperience != null && (
              <span style={{ fontSize: 12, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 20, padding: '3px 10px' }}>
                {cp.yearsOfExperience} năm kinh nghiệm
              </span>
            )}
            {cp.cvFileUrl && (
              <a href={cp.cvFileUrl} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none', padding: '3px 10px', border: '1px solid #bfdbfe', borderRadius: 20, background: '#eff6ff' }}>
                ↓ Tải xuống CV
              </a>
            )}
          </div>
        </>
      ))}

      {cp.experiences?.length > 0 && sectionCard('Kinh nghiệm', (
        cp.experiences.map((exp, i) => (
          <div key={i} style={{ borderLeft: '3px solid #3b82f6', paddingLeft: 12, marginBottom: i < cp.experiences.length - 1 ? 14 : 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{exp.jobTitle}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{exp.companyName}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {exp.startDate ? new Date(exp.startDate + 'T00:00:00').getFullYear() : ''}
              {' – '}
              {exp.endDate ? new Date(exp.endDate + 'T00:00:00').getFullYear() : 'Hiện tại'}
            </div>
            {exp.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{exp.description}</div>}
          </div>
        ))
      ))}

      {cp.educations?.length > 0 && sectionCard('Học vấn', (
        cp.educations.map((edu, i) => (
          <div key={i} style={{ borderLeft: '3px solid #10b981', paddingLeft: 12, marginBottom: i < cp.educations.length - 1 ? 14 : 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{edu.schoolName}</div>
            {(edu.degree || edu.major) && (
              <div style={{ fontSize: 13, color: '#6b7280' }}>{[edu.degree, edu.major].filter(Boolean).join(' — ')}</div>
            )}
            {(edu.startYear || edu.endYear) && (
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{edu.startYear} – {edu.endYear ?? 'Hiện tại'}</div>
            )}
          </div>
        ))
      ))}

      {prevRounds.length > 0 && sectionCard('Các vòng trước', (
        prevRounds.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < prevRounds.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Vòng {r.roundNo}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {r.averageScore != null && (
                <span style={{ fontSize: 12, background: '#fef9c3', color: '#92400e', padding: '2px 8px', borderRadius: 12 }}>
                  TB: {parseFloat(r.averageScore).toFixed(1)}
                </span>
              )}
              <span style={{ fontSize: 12, color: '#6b7280' }}>{r.statusName}</span>
              {r.decisionCode && (
                <span style={{ fontSize: 12, fontWeight: 700, color: r.decisionCode === 'PASS' ? '#16a34a' : '#dc2626' }}>
                  {r.decisionCode === 'PASS' ? 'Đạt' : 'Trượt'}
                </span>
              )}
            </div>
          </div>
        ))
      ), 0)}
    </>
  ) : null;

  return (
    <SimpleInterviewerDetailPage
      onBack={() => navigate('/staff/interviews')}
      title={`Chi tiết phỏng vấn — Vòng ${interview.roundNo}`}
      statusBadge={badge}
      statusText={interview.statusName || badge.label}
      flowMessage={
        interview.hasMyFeedback
          ? 'Bạn đã nộp đánh giá cho buổi phỏng vấn này.'
          : canEvaluate
            ? 'Bạn có thể nộp đánh giá ngay bên dưới.'
            : 'Phần đánh giá sẽ mở sau khi buổi phỏng vấn kết thúc.'
      }
      summaryRows={[
        { label: 'Ứng viên', value: interview.candidateName },
        { label: 'Vị trí', value: interview.positionTitle }
      ]}
      scheduleRows={[
        { label: 'Bắt đầu', value: formatDateTime(interview.startTime) },
        { label: 'Kết thúc', value: formatDateTime(interview.endTime) },
        { label: 'Địa điểm', value: interview.location || '—' },
        { label: 'Link họp', value: interview.meetingLink || '—' }
      ]}
      participants={(interview.participants || []).map((participant) => ({
        id: participant.userId,
        name: participant.userName,
        role: participant.interviewRole,
        hasFeedback: participant.hasFeedback
      }))}
      candidateSection={candidateSection}
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
    />
  );
}