import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import deptManagerService from '../../services/deptManagerService';
import notify from '../../utils/notification';
import { getStatusBadge } from '../../utils/helpers/badge';
import InterviewFeedbackForm from '../../components/shared/InterviewFeedbackForm';
import InterviewDetailPage from '../../components/shared/interviews/InterviewDetailPage';
import { formatDateTime } from '../../utils/formatters/display';

export default function DeptManagerInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ comment: '', decision: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInterview();
  }, [id]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const data = await deptManagerService.interviews.getById(id);
      setInterview(data);
      
    } catch (error) {
      console.error('Failed to load interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.decision) {
      notify.warning('Vui lòng chọn kết quả (Đạt/Trượt)');
      return;
    }

    try {
      setSubmitting(true);
      await deptManagerService.interviews.submitFeedback(id, feedback);
      notify.success('Gửi đánh giá thành công!');
      navigate('/staff/dept-manager/interviews');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      notify.error('Gửi đánh giá thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const isUpcoming = (dateString) => new Date(dateString) > new Date();
  const isPast = (dateString) => new Date(dateString) < new Date();

  if (loading) {
    return <div style={{ padding: 24 }}>Đang tải...</div>;
  }

  if (!interview) {
    return <div style={{ padding: 24 }}>Không tìm thấy buổi phỏng vấn</div>;
  }

  const canEvaluate = isPast(interview.endTime) && !interview.hasMyFeedback;
  const badge = getStatusBadge(interview.statusCode);

  const cp = interview.candidateProfile;
  const cvDownloadUrl = interview?.applicationId
    ? `/api/files/application/${interview.applicationId}/cv`
    : (cp?.cvFileUrl ? `/api/files/cv?url=${encodeURIComponent(cp.cvFileUrl)}` : '');
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
            {cvDownloadUrl && (
              <a href={cvDownloadUrl} target="_blank" rel="noreferrer"
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
    <InterviewDetailPage
      onBack={() => navigate('/staff/dept-manager/interviews')}
      backLabel="← Quay lại danh sách"
      title="Chi tiết buổi phỏng vấn"
      statusBadge={badge}
      statusText={interview.statusName || badge.label}
      flowMessage={
        interview.hasMyFeedback
          ? 'Bạn đã hoàn tất phần đánh giá của mình.'
          : canEvaluate
            ? 'Bạn có thể nộp đánh giá ngay ở cuối trang.'
            : 'Buổi phỏng vấn chưa kết thúc, hiện chưa thể nộp đánh giá.'
      }
      summaryRows={[
        { label: 'Ứng viên', value: interview.candidateName },
        { label: 'Vị trí', value: interview.positionTitle },
        { label: 'Vòng', value: `Vòng ${interview.roundNo}` },
        { label: 'Trạng thái', value: interview.statusName }
      ]}
      scheduleRows={[
        { label: 'Bắt đầu', value: formatDateTime(interview.startTime, 'vi-VN') },
        { label: 'Kết thúc', value: formatDateTime(interview.endTime, 'vi-VN') },
        { label: 'Địa điểm', value: interview.location || interview.meetingLink || 'Chưa cập nhật' }
      ]}
      participants={(interview.participants || []).map((p, idx) => ({
        id: p.userId || p.id || idx,
        name: p.name || p.userName,
        role: p.role || p.interviewRole,
        hasFeedback: p.hasFeedback || p.hasSubmittedFeedback
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
            commentPlaceholder="Chia sẻ nhận xét chính của bạn về ứng viên..."
          />
        ) : null
      }
      successMessage={interview.hasMyFeedback ? 'Đánh giá của bạn đã được lưu cho buổi phỏng vấn này.' : null}
      pendingMessage={isUpcoming(interview.startTime) ? 'Bạn chỉ có thể nộp đánh giá sau khi buổi phỏng vấn kết thúc.' : null}
      maxWidth={1100}
    />
  );
}
