import React, { useEffect, useState } from 'react';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';
import { formatDateTimeVi } from '../../../utils/helpers/interviewPhase';
import { RECOMMENDATION_LABELS } from '../../shared/InterviewFeedbackForm';
import InterviewSection from './InterviewSection';

function feedbacksToSummary(feedbacks) {
  if (!feedbacks?.length) return null;
  return {
    strongHireCount: feedbacks.filter((f) => f.recommendation === 'STRONG_HIRE').length,
    hireCount: feedbacks.filter((f) => f.recommendation === 'HIRE').length,
    noHireCount: feedbacks.filter((f) => f.recommendation === 'NO_HIRE').length,
    strongNoHireCount: feedbacks.filter((f) => f.recommendation === 'STRONG_NO_HIRE').length,
  };
}

const DECISION_OPTIONS = [
  { value: 'PASS', label: '✅ Đạt (sang vòng tiếp)', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { value: 'FAIL', label: '❌ Không đạt (dừng)', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { value: 'HOLD', label: '⏸ Chờ quyết định thêm', color: '#92400e', bg: '#fffbeb', border: '#fcd34d' },
  { value: 'EXTRA_ROUND', label: '🔄 Cần thêm vòng phỏng vấn', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
];

const STATUS_LABEL = {
  SCHEDULED: 'Đã lên lịch',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
  NO_SHOW: 'Ứng viên vắng',
  INTERVIEWER_ABSENT: 'Người phỏng vấn vắng',
};

function RecommendationBar({ summary }) {
  if (!summary) return null;
  const items = [
    { label: 'Rất nên tuyển', value: summary.strongHireCount, color: '#16a34a' },
    { label: 'Đạt', value: summary.hireCount, color: '#65a30d' },
    { label: 'Không đạt', value: summary.noHireCount, color: '#ea580c' },
    { label: 'Dứt khoát không', value: summary.strongNoHireCount, color: '#dc2626' },
  ].filter((i) => i.value > 0);
  if (items.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      {items.map((item) => (
        <span key={item.label} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, border: `1px solid ${item.color}`, color: item.color, fontWeight: 600 }}>
          {item.label}: {item.value}
        </span>
      ))}
    </div>
  );
}

function RoundTimeline({ rounds }) {
  if (!rounds?.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {rounds.map((round, idx) => {
        const isLast = idx === rounds.length - 1;
        const decisionColor = round.roundDecision
          ? DECISION_OPTIONS.find((d) => d.value === round.roundDecision.decisionCode)?.color || '#475569'
          : '#94a3b8';
        return (
          <div key={round.interviewId} style={{ display: 'flex', gap: 12 }}>
            {/* Timeline column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
              <div style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: round.roundDecision ? decisionColor : '#cbd5e1', border: `2px solid ${round.roundDecision ? decisionColor : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                {round.roundNo}
              </div>
              {!isLast && <div style={{ width: 2, flex: 1, backgroundColor: '#e2e8f0', marginTop: 2, marginBottom: 2 }} />}
            </div>
            {/* Content */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 12 }}>
              <div style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Vòng {round.roundNo}</div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                    {STATUS_LABEL[round.status] || round.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                  {formatDateTimeVi(round.startTime)} → {formatDateTimeVi(round.endTime)}
                </div>
                {round.interviewerNames?.length > 0 && (
                  <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>
                    Người phỏng vấn: {round.interviewerNames.join(', ')}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {typeof round.averageScore === 'number' && round.averageScore !== null && (
                    <span style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>Điểm TB: {round.averageScore}</span>
                  )}
                  {round.allFeedbackSubmitted && (
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Đủ đánh giá</span>
                  )}
                  {round.isNextRoundScheduled && (
                    <span style={{ fontSize: 11, color: '#6b7280' }}>→ Đã có vòng tiếp</span>
                  )}
                </div>
                {round.roundDecision && (
                  <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, backgroundColor: DECISION_OPTIONS.find((d) => d.value === round.roundDecision.decisionCode)?.bg || '#f8fafc', border: `1px solid ${DECISION_OPTIONS.find((d) => d.value === round.roundDecision.decisionCode)?.border || '#e5e7eb'}` }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: decisionColor }}>
                      {DECISION_OPTIONS.find((d) => d.value === round.roundDecision.decisionCode)?.label || round.roundDecision.decisionCode}
                    </span>
                    {round.roundDecision.note && (
                      <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{round.roundDecision.note}</span>
                    )}
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>bởi {round.roundDecision.decidedByName}</div>
                  </div>
                )}
                <RecommendationBar summary={round.recommendationSummary} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function InterviewRoundActionsPanel({ interview, onUpdated, canReviewRound = true }) {
  const [submitting, setSubmitting] = useState(false);
  const [nextRoundCheck, setNextRoundCheck] = useState(null);
  const [roundProgress, setRoundProgress] = useState(null);
  const [noShowReason, setNoShowReason] = useState('');
  const [reviewDecision, setReviewDecision] = useState('PASS');
  const [reviewNote, setReviewNote] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [nextRoundForm, setNextRoundForm] = useState({
    startTime: '',
    endTime: '',
    location: '',
    meetingLink: ''
  });

  // Pre-fill next round form from current interview
  useEffect(() => {
    setNextRoundForm((current) => ({
      ...current,
      location: interview?.location || '',
      meetingLink: interview?.meetingLink || ''
    }));
  }, [interview]);

  // Auto-check next round eligibility when interview is COMPLETED
  useEffect(() => {
    if (interview?.statusCode === 'COMPLETED' && !nextRoundCheck) {
      hrService.interviews.checkNextRound(interview.id)
        .then((result) => setNextRoundCheck(result))
        .catch(() => {});
    }
  }, [interview?.statusCode, interview?.id]);

  const isTerminal = ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'INTERVIEWER_ABSENT'].includes(interview?.statusCode);
  const feedbackIncomplete = (interview?.participantCount || 0) > (interview?.feedbackCount || 0);
  const hasDecision = !!interview?.roundDecision;
  const isLocked = isTerminal || hasDecision;
  const confirmedParticipants = (interview?.participants || []).filter((p) => p.confirmedAt && !p.declinedAt);
  const nonDeclinedParticipants = (interview?.participants || []).filter((p) => !p.declinedAt);

  const refreshParent = async () => {
    if (onUpdated) await onUpdated();
  };

  const markCandidateNoShow = async () => {
    setSubmitting(true);
    try {
      await hrService.interviews.markNoShow(interview.id, { noShowType: 'CANDIDATE', reason: noShowReason || null });
      notify.success('Đã đánh dấu ứng viên vắng mặt');
      await refreshParent();
    } catch (error) {
      notify.error(error.message || 'Không thể đánh dấu vắng mặt');
    } finally {
      setSubmitting(false);
    }
  };

  const markInterviewerNoShow = async (userId) => {
    setSubmitting(true);
    try {
      await hrService.interviews.markNoShow(interview.id, { noShowType: 'INTERVIEWER', userId, reason: noShowReason || null });
      notify.success('Đã đánh dấu người phỏng vấn vắng mặt');
      await refreshParent();
    } catch (error) {
      notify.error(error.message || 'Không thể đánh dấu vắng mặt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReminder = async () => {
    setSubmitting(true);
    try {
      await hrService.interviews.sendFeedbackReminder(interview.id);
      notify.success('Đã gửi nhắc nộp đánh giá');
      await refreshParent();
    } catch (error) {
      notify.error(error.message || 'Không thể gửi nhắc');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewRound = async () => {
    setSubmitting(true);
    try {
      await hrService.interviews.reviewRound(interview.id, { decision: reviewDecision, note: reviewNote || null });
      notify.success('Đã chốt kết quả vòng phỏng vấn');
      setShowReviewForm(false);
      const [updated, check] = await Promise.all([
        refreshParent(),
        hrService.interviews.checkNextRound(interview.id)
      ]);
      setNextRoundCheck(check);
      if (interview?.applicationId) {
        const progress = await hrService.interviews.getRoundProgress(interview.applicationId);
        setRoundProgress(progress);
      }
    } catch (error) {
      notify.error(error.message || 'Không thể chốt kết quả');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckNextRound = async () => {
    setSubmitting(true);
    try {
      const result = await hrService.interviews.checkNextRound(interview.id);
      setNextRoundCheck(result);
    } catch (error) {
      notify.error(error.message || 'Không thể kiểm tra điều kiện');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadProgress = async () => {
    setSubmitting(true);
    try {
      const result = await hrService.interviews.getRoundProgress(interview.applicationId);
      setRoundProgress(result);
    } catch (error) {
      notify.error(error.message || 'Không thể tải tiến độ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleNextRound = async () => {
    if (!nextRoundForm.startTime || !nextRoundForm.endTime) {
      notify.warning('Cần nhập thời gian cho vòng tiếp theo');
      return;
    }
    setSubmitting(true);
    try {
      await hrService.interviews.scheduleNextRound(interview.id, {
        startTime: nextRoundForm.startTime,
        endTime: nextRoundForm.endTime,
        location: nextRoundForm.location || null,
        meetingLink: nextRoundForm.meetingLink || null
      });
      notify.success('Đã tạo lịch vòng phỏng vấn tiếp theo');
      const [check, progress] = await Promise.all([
        hrService.interviews.checkNextRound(interview.id),
        hrService.interviews.getRoundProgress(interview.applicationId)
      ]);
      setNextRoundCheck(check);
      setRoundProgress(progress);
      await refreshParent();
    } catch (error) {
      notify.error(error.message || 'Không thể tạo vòng phỏng vấn tiếp theo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Sự cố ── */}
      <InterviewSection
        step="Xử lý nhanh"
        title="Sự cố trong buổi phỏng vấn"
        description="Dùng khi ứng viên hoặc người phỏng vấn vắng mặt, hoặc khi cần nhắc nộp đánh giá còn thiếu."
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Lý do</label>
          <input
            type="text"
            value={noShowReason}
            onChange={(e) => setNoShowReason(e.target.value)}
            placeholder="Ví dụ: ứng viên không đến đúng giờ"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <button
            type="button"
            disabled={submitting || isLocked}
            onClick={markCandidateNoShow}
            style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #dc2626', backgroundColor: '#fef2f2', color: '#b91c1c', cursor: 'pointer', fontWeight: 600 }}
          >
            Ứng viên vắng mặt
          </button>
          {feedbackIncomplete && !isLocked && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSendReminder}
              style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #2563eb', backgroundColor: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontWeight: 600 }}
            >
              Nhắc nộp đánh giá ({interview.feedbackCount}/{interview.participantCount})
            </button>
          )}
        </div>

        {confirmedParticipants.length > 0 && !isLocked && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {confirmedParticipants.map((participant) => (
              <div key={participant.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#fafafa' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{participant.userName}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{participant.email}</div>
                </div>
                <button
                  type="button"
                  disabled={submitting || isTerminal}
                  onClick={() => markInterviewerNoShow(participant.userId)}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #f59e0b', backgroundColor: '#fffbeb', color: '#b45309', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  Đánh dấu vắng mặt
                </button>
              </div>
            ))}
          </div>
        )}
      </InterviewSection>

      {/* ── Chốt kết quả vòng (chỉ HR Manager) ── */}
      {canReviewRound && (
      <InterviewSection
        title="Chốt kết quả vòng phỏng vấn"
        description="Sau khi đủ đánh giá, chốt quyết định vòng này (Đạt / Không đạt / Chờ / Cần thêm vòng) trước khi lên lịch vòng tiếp."
        tone={hasDecision ? 'muted' : 'default'}
      >
        {hasDecision ? (
          <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#16a34a', marginBottom: 4 }}>
              ✓ Đã có kết quả:{' '}
              {DECISION_OPTIONS.find((d) => d.value === interview.roundDecision?.decisionCode)?.label || interview.roundDecision?.decisionCode}
            </div>
            {interview.roundDecision?.note && (
              <div style={{ fontSize: 13, color: '#374151' }}>{interview.roundDecision.note}</div>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {nextRoundCheck
                  ? `${nextRoundCheck.submittedFeedbacks}/${nextRoundCheck.totalInterviewers} đánh giá đã nộp`
                  : interview?.feedbacks?.length != null && interview?.participants?.length != null
                    ? `${interview.feedbacks.length}/${interview.participants.length} đánh giá đã nộp`
                    : 'Chưa kiểm tra số lượng đánh giá'}
              </div>
              <button
                type="button"
                onClick={() => setShowReviewForm((v) => !v)}
                style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #374151', backgroundColor: '#111827', color: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                {showReviewForm ? 'Thu gọn' : 'Chốt kết quả vòng này'}
              </button>
            </div>

            {/* Tổng hợp recommendation từ feedback + danh sách từng đánh giá */}
            {(nextRoundCheck?.recommendationSummary || feedbacksToSummary(interview?.feedbacks)) && (
              <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <RecommendationBar summary={nextRoundCheck?.recommendationSummary ?? feedbacksToSummary(interview?.feedbacks)} />
                {interview?.feedbacks?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Từng đánh giá:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {interview.feedbacks.map((fb) => (
                        <div key={fb.id} style={{ padding: 10, backgroundColor: '#fff', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: fb.note ? 4 : 0 }}>
                            <span style={{ fontWeight: 600 }}>{fb.interviewerName}</span>
                            {fb.recommendation && (
                              <span style={{ fontWeight: 600, color: '#374151', padding: '2px 8px', borderRadius: 6, backgroundColor: '#e5e7eb' }}>
                                {RECOMMENDATION_LABELS[fb.recommendation] ?? fb.recommendation}
                              </span>
                            )}
                          </div>
                          {fb.note && <div style={{ color: '#475569', fontStyle: 'italic' }}>"{fb.note}"</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {showReviewForm && !isLocked && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                  {DECISION_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: `1px solid ${reviewDecision === opt.value ? opt.border : '#e5e7eb'}`, backgroundColor: reviewDecision === opt.value ? opt.bg : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                    >
                      <input type="radio" name="reviewDecision" value={opt.value} checked={reviewDecision === opt.value} onChange={() => setReviewDecision(opt.value)} style={{ accentColor: opt.color }} />
                      <span style={{ color: reviewDecision === opt.value ? opt.color : '#374151' }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Ghi chú (tuỳ chọn)</label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Tóm tắt lý do quyết định..."
                    rows={2}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box', resize: 'vertical', fontSize: 13 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleReviewRound}
                  disabled={submitting}
                  style={{ padding: '10px 20px', borderRadius: 6, border: 'none', backgroundColor: DECISION_OPTIONS.find((d) => d.value === reviewDecision)?.color || '#111827', color: 'white', cursor: 'pointer', fontWeight: 700 }}
                >
                  {submitting ? 'Đang lưu...' : `Xác nhận: ${DECISION_OPTIONS.find((d) => d.value === reviewDecision)?.label}`}
                </button>
              </div>
            )}
          </>
        )}
      </InterviewSection>
      )}

      {/* ── Vòng tiếp theo: chỉ hiện khi vòng đã hoàn thành (COMPLETED) hoặc đã có quyết định ── */}
      {(interview?.statusCode === 'COMPLETED' || hasDecision) && (
      <InterviewSection
        title="Vòng phỏng vấn tiếp theo"
        description="Kiểm tra điều kiện và, nếu phù hợp, lên lịch vòng tiếp theo."
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: nextRoundCheck ? 14 : 0 }}>
          <button
            type="button"
            onClick={handleCheckNextRound}
            disabled={submitting}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #2563eb', backgroundColor: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontWeight: 600 }}
          >
            Kiểm tra điều kiện
          </button>
          <button
            type="button"
            onClick={handleLoadProgress}
            disabled={submitting}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #475569', backgroundColor: '#f8fafc', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
          >
            Xem tiến độ tất cả vòng
          </button>
        </div>

        {nextRoundCheck && (
          <div style={{ padding: 12, borderRadius: 8, marginBottom: 14, backgroundColor: nextRoundCheck.shouldScheduleNextRound ? '#ecfdf5' : '#fff7ed', border: `1px solid ${nextRoundCheck.shouldScheduleNextRound ? '#86efac' : '#fdba74'}` }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{nextRoundCheck.message}</div>
            <div style={{ fontSize: 13, color: '#475569' }}>
              Đánh giá đã nộp: {nextRoundCheck.submittedFeedbacks}/{nextRoundCheck.totalInterviewers}
              {typeof nextRoundCheck.averageScore === 'number' && ` • Điểm TB: ${nextRoundCheck.averageScore}`}
              {nextRoundCheck.averageScore == null && (
                <span style={{ marginLeft: 6, fontSize: 11, color: '#94a3b8' }}>(Điểm TB chỉ hiện khi có chấm điểm theo tiêu chí)</span>
              )}
            </div>
            <RecommendationBar summary={nextRoundCheck.recommendationSummary} />
          </div>
        )}

        {nextRoundCheck?.shouldScheduleNextRound && !isLocked && (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
              Lên lịch vòng {nextRoundCheck.nextRoundNo ?? ''}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Bắt đầu</label>
                <input type="datetime-local" value={nextRoundForm.startTime} onChange={(e) => setNextRoundForm((c) => ({ ...c, startTime: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Kết thúc</label>
                <input type="datetime-local" value={nextRoundForm.endTime} onChange={(e) => setNextRoundForm((c) => ({ ...c, endTime: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: 12, fontSize: 12, color: '#6b7280' }}>
              Sau khi tạo vòng tiếp theo, hãy mở chi tiết buổi đó và dùng chức năng
              {' '}<strong>"Gửi yêu cầu đề cử"</strong> để trưởng phòng chọn người phỏng vấn cho vòng mới.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Địa điểm</label>
                <input type="text" value={nextRoundForm.location} onChange={(e) => setNextRoundForm((c) => ({ ...c, location: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Link họp trực tuyến</label>
                <input type="text" value={nextRoundForm.meetingLink} onChange={(e) => setNextRoundForm((c) => ({ ...c, meetingLink: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button
              type="button"
              onClick={handleScheduleNextRound}
              disabled={submitting}
              style={{ padding: '10px 20px', borderRadius: 6, border: 'none', backgroundColor: '#111827', color: 'white', cursor: 'pointer', fontWeight: 700 }}
            >
              {submitting ? 'Đang tạo...' : 'Tạo lịch vòng tiếp theo'}
            </button>
          </div>
        )}

        {roundProgress && (
          <div style={{ borderTop: nextRoundCheck ? '1px solid #e5e7eb' : 'none', paddingTop: nextRoundCheck ? 14 : 0, marginTop: nextRoundCheck ? 14 : 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              Tiến độ phỏng vấn — {roundProgress.candidateName}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
              {roundProgress.jobTitle} • Tổng {roundProgress.totalRoundsCompleted} vòng hoàn thành / vòng hiện tại: {roundProgress.currentRound}
            </div>
            <RoundTimeline rounds={roundProgress.rounds} />
          </div>
        )}
      </InterviewSection>
      )}
    </>
  );
}
