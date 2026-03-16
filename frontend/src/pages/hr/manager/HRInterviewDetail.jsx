import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';
import { authService } from '../../../services/authService';
import { ROLES } from '../../../constants/roles';
import { getStatusBadge } from '../../../utils/helpers/badge';
import InterviewRoundActionsPanel from '../../../components/hr/interviews/InterviewRoundActionsPanel';
import InterviewSection from '../../../components/hr/interviews/InterviewSection';
import InterviewFeedbackForm, { RECOMMENDATION_LABELS } from '../../../components/shared/InterviewFeedbackForm';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const REQ_STATUS = {
  PENDING: { label: 'Đang chờ', bg: '#fef3c7', color: '#92400e' },
  FORWARDED: { label: 'Đã chuyển tiếp', bg: '#dbeafe', color: '#1e40af' },
  FULFILLED: { label: 'Hoàn thành', bg: '#d1fae5', color: '#065f46' },
  CANCELLED: { label: 'Đã hủy', bg: '#fee2e2', color: '#991b1b' }
};

const sx = {
  page: { padding: 24, backgroundColor: '#f8fafc', minHeight: '100vh' },
  container: { maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' },
  title: { flex: 1, fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 },
  gridLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  gridValue: { fontWeight: 500 },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { backgroundColor: 'white', borderRadius: 10, padding: 28, width: 440, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle: { margin: '0 0 16px 0', fontSize: 18 },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 },
  btnSecondary: { padding: '8px 18px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' },
  input: { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' },
  stickyBar: { position: 'sticky', bottom: 12, zIndex: 20, marginTop: 16, borderRadius: 10, padding: '12px 14px', backgroundColor: '#111827', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }
};

// ─── Subcomponents (modals & blocks) ─────────────────────────────────────────
function OverviewGrid({ interview, formatDateTime, feedbackProgressLabel }) {
  const items = [
    { label: 'Ứng viên', value: interview.candidateName },
    { label: 'Vị trí', value: interview.positionTitle },
    { label: 'Phòng ban', value: interview.departmentName },
    { label: 'Application', value: `#${interview.applicationId}` },
    { label: 'Bắt đầu', value: formatDateTime(interview.startTime) },
    { label: 'Kết thúc', value: formatDateTime(interview.endTime) },
    { label: 'Địa điểm', value: interview.location || '—' },
    { label: 'Link họp', value: interview.meetingLink ? <a href={interview.meetingLink} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Mở link</a> : '—' },
    { label: 'Tiến độ feedback', value: feedbackProgressLabel, highlight: true }
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
      {items.map(({ label, value, highlight }) => (
        <div key={label}>
          <div style={sx.gridLabel}>{label}</div>
          <div style={{ ...sx.gridValue, ...(highlight ? { fontWeight: 700, color: '#111827' } : {}) }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function ParticipantList({ participants, currentUserId }) {
  if (!participants?.length) return <div style={{ color: '#6b7280', fontSize: 13 }}>Chưa có người tham gia</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {participants.map((p) => (
        <div key={p.userId} style={{ padding: '10px 14px', backgroundColor: '#f9fafb', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span style={{ fontWeight: 600 }}>{p.userName}</span>
              {p.userId === currentUserId && <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 6 }}>(bạn)</span>}
              <div style={{ fontSize: 12, color: '#6b7280' }}>{p.email}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>
                {p.interviewRoleName || p.interviewRoleCode}
              </span>
              {p.confirmedAt && (
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#d1fae5', color: '#065f46', fontWeight: 600 }}>✓ Đã xác nhận</span>
              )}
              {p.declinedAt && (
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 600 }}>Từ chối</span>
              )}
              {!p.confirmedAt && !p.declinedAt && (
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 600 }}>Chưa xác nhận</span>
              )}
              {p.hasSubmittedFeedback && (
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>✓ Đã đánh giá</span>
              )}
            </div>
          </div>
          {p.declinedAt && p.declineNote && (
            <div style={{ marginTop: 8, padding: '8px 10px', backgroundColor: '#fef2f2', borderRadius: 6, fontSize: 13, color: '#991b1b' }}>
              <strong>Ghi chú từ chối:</strong> {p.declineNote}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RequestCard({ req, isManager, onForward, formatDateTime }) {
  const sc = REQ_STATUS[req.status] || { label: req.status, bg: '#f3f4f6', color: '#374151' };
  return (
    <div key={req.id} style={{ padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Gửi đến: {req.assignedToName}
            {req.forwardedToName && <span style={{ color: '#6b7280', fontWeight: 400 }}> → {req.forwardedToName}</span>}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Cần {req.requiredCount} người · {formatDateTime(req.createdAt)}</div>
          {req.message && <div style={{ fontSize: 13, color: '#374151', marginTop: 4, fontStyle: 'italic' }}>"{req.message}"</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
          {isManager && req.status === 'PENDING' && (
            <button type="button" onClick={() => onForward(req.id)} style={{ padding: '4px 10px', border: '1px solid #6366f1', borderRadius: 6, backgroundColor: 'white', color: '#6366f1', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Chuyển lên GĐ</button>
          )}
        </div>
      </div>
    </div>
  );
}

function SendInvitationForm({ type, setType, link, setLink, location, setLocation, onSubmit, submitting }) {
  const canSubmit = type === 'online' ? link?.trim() : location?.trim();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 520 }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="radio" name="inviteType" checked={type === 'online'} onChange={() => setType('online')} />
          <span>Online (Link họp)</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="radio" name="inviteType" checked={type === 'offline'} onChange={() => setType('offline')} />
          <span>Offline (Địa điểm)</span>
        </label>
      </div>
      {type === 'online' ? (
        <input type="url" placeholder="https://meet.google.com/..." value={link} onChange={e => setLink(e.target.value)} style={{ ...sx.input, padding: '10px 12px' }} />
      ) : (
        <input type="text" placeholder="Địa điểm phỏng vấn" value={location} onChange={e => setLocation(e.target.value)} style={{ ...sx.input, padding: '10px 12px' }} />
      )}
      <button type="button" onClick={onSubmit} disabled={submitting || !canSubmit}
        style={{ padding: '10px 20px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: (submitting || !canSubmit) ? 0.7 : 1 }}>
        {submitting ? 'Đang gửi...' : 'Gửi thông báo cho ứng viên và người phỏng vấn'}
      </button>
    </div>
  );
}

function Modal({ show, onClose, title, children, width = 440 }) {
  if (!show) return null;
  return (
    <div style={sx.modalOverlay} onClick={() => onClose()}>
      <div style={{ ...sx.modalBox, width }} onClick={e => e.stopPropagation()}>
        <h3 style={sx.modalTitle}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function HRInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = authService.getUserInfo();
  const isManager = user?.roles?.includes(ROLES.HR_MANAGER);
  const currentUserId = user?.id;

  const [interview, setInterview] = useState(null);
  const [participantRequests, setParticipantRequests] = useState([]);
  const [deptManagers, setDeptManagers] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [forwardingReqId, setForwardingReqId] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ startTime: '', endTime: '', location: '', meetingLink: '' });
  const [interviewHistory, setInterviewHistory] = useState([]);

  const [reqForm, setReqForm] = useState({ assignedToUserId: '', requiredCount: 1, message: '' });
  const [forwardForm, setForwardForm] = useState({ toUserId: '', message: '' });
  const [finalizeDecision, setFinalizeDecision] = useState('PASS');
  const [finalizeNote, setFinalizeNote] = useState('');
  const [feedback, setFeedback] = useState({ comment: '', decision: '' });
  const [sendInvitationType, setSendInvitationType] = useState('online');
  const [sendInvitationLink, setSendInvitationLink] = useState('');
  const [sendInvitationLocation, setSendInvitationLocation] = useState('');

  useEffect(() => { loadAll(); }, [id]);
  useEffect(() => {
    if (!id) return;
    hrService.interviews.getHistory(id).then(setInterviewHistory).catch(() => setInterviewHistory([]));
  }, [id]);
  useEffect(() => {
    if (interview) {
      if (interview.meetingLink) setSendInvitationLink(interview.meetingLink);
      if (interview.location) setSendInvitationLocation(interview.location);
      setRescheduleForm({
        startTime: interview.startTime ? interview.startTime.slice(0, 16) : '',
        endTime: interview.endTime ? interview.endTime.slice(0, 16) : '',
        location: interview.location || '',
        meetingLink: interview.meetingLink || ''
      });
    }
  }, [interview?.id]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [data, reqs] = await Promise.all([
        hrService.interviews.getById(id),
        hrService.interviews.getParticipantRequests(id)
      ]);
      setInterview(data);
      setParticipantRequests(reqs || []);
    } catch {
      notify.error('Không thể tải thông tin phỏng vấn');
      navigate('/staff/hr-manager/interviews');
    } finally {
      setLoading(false);
    }
  };

  const openRequestModal = async () => {
    if (!deptManagers.length) {
      try { setDeptManagers(await hrService.interviews.getDeptManagers() || []); } catch { notify.error('Không thể tải danh sách trưởng phòng'); }
    }
    setReqForm({ assignedToUserId: '', requiredCount: 1, message: '' });
    setShowRequestModal(true);
  };

  const handleCreateRequest = async () => {
    if (!reqForm.assignedToUserId) { notify.warning('Vui lòng chọn trưởng phòng'); return; }
    setSubmitting(true);
    try {
      await hrService.interviews.createParticipantRequest(id, { assignedToUserId: parseInt(reqForm.assignedToUserId), requiredCount: reqForm.requiredCount, message: reqForm.message || null });
      notify.success('Đã gửi yêu cầu đề cử người phỏng vấn');
      setShowRequestModal(false);
      setParticipantRequests(await hrService.interviews.getParticipantRequests(id) || []);
    } catch (err) { notify.error(err.message || 'Gửi yêu cầu thất bại'); }
    finally { setSubmitting(false); }
  };

  const openForwardModal = (reqId) => {
    if (!directors.length) {
      hrService.interviews.getDirectors().then(d => setDirectors(d || [])).catch(() => notify.error('Không thể tải danh sách Giám đốc'));
    }
    setForwardingReqId(reqId);
    setForwardForm({ toUserId: '', message: '' });
    setShowForwardModal(true);
  };

  const handleForward = async () => {
    if (!forwardForm.toUserId) { notify.warning('Vui lòng chọn Giám đốc'); return; }
    setSubmitting(true);
    try {
      await hrService.interviews.forwardParticipantRequest(forwardingReqId, { toUserId: parseInt(forwardForm.toUserId), message: forwardForm.message || null });
      notify.success('Đã chuyển tiếp yêu cầu đến Giám đốc');
      setShowForwardModal(false);
      setParticipantRequests(await hrService.interviews.getParticipantRequests(id) || []);
    } catch (err) { notify.error(err.message || 'Chuyển tiếp thất bại'); }
    finally { setSubmitting(false); }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.decision) { notify.warning('Vui lòng chọn kết quả'); return; }
    setSubmitting(true);
    try {
      await hrService.interviews.submitFeedback(id, feedback);
      notify.success('Đã nộp đánh giá phỏng vấn');
      await loadAll();
    } catch (err) { notify.error(err.message || 'Nộp đánh giá thất bại'); }
    finally { setSubmitting(false); }
  };

  const handleFinalize = async () => {
    setSubmitting(true);
    try {
      await hrService.interviews.finalize(id, { decision: finalizeDecision, note: finalizeNote || null });
      notify.success(finalizeDecision === 'PASS' ? 'Đã kết thúc: ĐẠT' : 'Đã kết thúc: KHÔNG ĐẠT');
      setShowFinalizeModal(false);
      await loadAll();
    } catch (err) { notify.error(err.message || 'Chốt phỏng vấn thất bại'); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      await hrService.interviews.cancel(id);
      notify.success('Đã hủy phỏng vấn');
      setShowCancelModal(false);
      await loadAll();
    } catch (err) { notify.error(err.message || 'Hủy thất bại'); }
    finally { setSubmitting(false); }
  };

  const handleSendInvitation = async () => {
    const body = sendInvitationType === 'online' ? { meetingLink: sendInvitationLink || undefined } : { location: sendInvitationLocation || undefined };
    setSubmitting(true);
    try {
      await hrService.interviews.sendInvitation(id, body);
      notify.success('Đã gửi thông báo cho người phỏng vấn');
      await loadAll();
    } catch (err) { notify.error(err.message || 'Gửi thông báo thất bại'); }
    finally { setSubmitting(false); }
  };

  const hasParticipantDeclines = interview?.participants?.some((p) => p.declinedAt);
  const candidateDeclined = interview?.statusCode === 'DECLINED_BY_CANDIDATE' && interview?.candidateDeclineNote;

  const handleRescheduleAndResend = async () => {
    if (!rescheduleForm.startTime || !rescheduleForm.endTime) {
      notify.warning('Vui lòng nhập thời gian bắt đầu và kết thúc');
      return;
    }
    setSubmitting(true);
    try {
      await hrService.interviews.update(id, {
        startTime: rescheduleForm.startTime,
        endTime: rescheduleForm.endTime,
        location: rescheduleForm.location || undefined,
        meetingLink: rescheduleForm.meetingLink || undefined
      });
      notify.success('Đã cập nhật lịch');
      await hrService.interviews.requestParticipantsAfterReschedule(id);
      notify.success('Đã gửi yêu cầu đề cử đến trưởng phòng. Sau khi trưởng phòng đề cử và interviewer xác nhận tham gia, hãy bấm "Gửi yêu cầu xác nhận cho ứng viên" để thông báo ứng viên.');
      setShowRescheduleModal(false);
      await loadAll();
    } catch (err) {
      notify.error(err?.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;
  if (!interview) return null;

  const isFinal = ['COMPLETED', 'CANCELLED'].includes(interview.statusCode);
  const canFinalize = isManager && !isFinal;
  const canCancel = !isFinal;
  const badge = getStatusBadge(interview.statusCode);
  const isParticipant = interview.participants?.some(p => p.userId === currentUserId);
  const myFeedback = interview.feedbacks?.find(fb => fb.interviewerId === currentUserId);
  const hasRoundDecision = !!interview.roundDecision;
  const isLocked = isFinal || hasRoundDecision;
  const canSubmitFeedback = isParticipant && !myFeedback && !isLocked;
  const feedbackProgressLabel = `${interview.feedbackCount || 0}/${interview.participantCount || 0}`;
  const missingFeedbackCount = Math.max((interview.participantCount || 0) - (interview.feedbackCount || 0), 0);

  return (
    <div style={sx.page}>
      <div style={sx.container}>

        {/* Header */}
        <header style={sx.header}>
          <button type="button" onClick={() => navigate('/staff/hr-manager/interviews')} style={sx.backBtn}>← Quay lại</button>
          <h1 style={sx.title}>Chi tiết Phỏng vấn — Vòng {interview.roundNo}</h1>
          <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
            {interview.statusName || badge.label}
          </span>
        </header>

        {/* 1. Thông tin chính */}
        <InterviewSection step="1" title="Thông tin chính" description="Thông tin buổi phỏng vấn và tiến độ đánh giá.">
          {(candidateDeclined || hasParticipantDeclines) && !isLocked && (
            <div style={{ marginBottom: 16, padding: '14px 18px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>Cần xử lý từ chối</div>
              {candidateDeclined && (
                <div style={{ marginBottom: 8, fontSize: 13, color: '#b91c1c' }}>
                  Ứng viên đã từ chối. Ghi chú: {interview.candidateDeclineNote}
                </div>
              )}
              {hasParticipantDeclines && (
                <div style={{ marginBottom: 8, fontSize: 13, color: '#92400e' }}>
                  Có interviewer từ chối tham gia — cần trưởng phòng đề cử người khác.
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {hasParticipantDeclines && !isFinal && (
                  <button type="button" onClick={openRequestModal} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', backgroundColor: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    Đề cử interviewer khác
                  </button>
                )}
                {candidateDeclined && !isFinal && (
                  <button type="button" onClick={() => setShowRescheduleModal(true)} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', backgroundColor: '#059669', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    Đổi lịch (gửi yêu cầu đề cử trưởng phòng)
                  </button>
                )}
              </div>
            </div>
          )}
          <OverviewGrid interview={interview} formatDateTime={formatDateTime} feedbackProgressLabel={feedbackProgressLabel} />
        </InterviewSection>

        {/* Lịch sử thay đổi */}
        {interviewHistory.length > 0 && (
          <InterviewSection step="" title="Lịch sử thay đổi" description="Các sự kiện và thay đổi trạng thái của buổi phỏng vấn.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {interviewHistory.map((item, idx) => (
                <div key={idx} style={{ padding: '10px 14px', backgroundColor: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ color: '#6b7280' }}>{item.at ? formatDateTime(item.at) : '—'}</span>
                    {item.changedByName && <span style={{ fontWeight: 600, color: '#374151' }}>{item.changedByName}</span>}
                    {(item.fromStatusName || item.toStatusName) && (
                      <span style={{ color: '#1d4ed8' }}>
                        {item.fromStatusName ? `${item.fromStatusName} → ` : ''}{item.toStatusName || ''}
                      </span>
                    )}
                  </div>
                  {item.note && <div style={{ color: '#475569' }}>{item.note}</div>}
                </div>
              ))}
            </div>
          </InterviewSection>
        )}

        {/* 2. Phối hợp: Người tham gia + Yêu cầu đề cử + Gửi thông báo */}
        <InterviewSection
          step="2"
          title="Phối hợp & Điều phối"
          description="Người tham gia phỏng vấn, yêu cầu đề cử và gửi thông báo (địa điểm/link) cho ứng viên."
          actions={!isLocked && (
            <button type="button" onClick={openRequestModal} style={{ padding: '6px 14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Gửi yêu cầu đề cử</button>
          )}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Người tham gia ({interview.participants?.length ?? 0})</h4>
              <ParticipantList participants={interview.participants} currentUserId={currentUserId} />
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Yêu cầu đề cử ({participantRequests.length})</h4>
              {participantRequests.length === 0 ? (
                <div style={{ color: '#6b7280', fontSize: 13 }}>Chưa có yêu cầu đề cử nào</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {participantRequests.map(req => (
                    <RequestCard key={req.id} req={req} isManager={isManager} onForward={openForwardModal} formatDateTime={formatDateTime} />
                  ))}
                </div>
              )}
            </div>
            {!isLocked && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Gửi thông báo cho người phỏng vấn</h4>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>Sau khi chọn Online (link) hoặc Offline (địa điểm), gửi thông báo chỉ cho interviewer để họ xác nhận tham gia. Ứng viên chưa nhận email ở bước này.</p>
                  <SendInvitationForm
                    type={sendInvitationType} setType={setSendInvitationType}
                    link={sendInvitationLink} setLink={setSendInvitationLink}
                    location={sendInvitationLocation} setLocation={setSendInvitationLocation}
                    onSubmit={handleSendInvitation} submitting={submitting}
                  />
                </div>
                <div style={{ padding: 12, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 4 }}>Gửi yêu cầu xác nhận tham gia cho ứng viên</h4>
                  <p style={{ fontSize: 12, color: '#15803d', marginBottom: 10 }}>Nên gửi sau khi interviewer đã xác nhận. Ứng viên mới thấy buổi trong &quot;Phỏng vấn của tôi&quot; và nhận email nhắc xác nhận.</p>
                  <button
                    type="button"
                    onClick={async () => {
                      setSubmitting(true);
                      try {
                        await hrService.interviews.sendCandidateConfirmation(id);
                        notify.success('Đã gửi yêu cầu xác nhận tham gia cho ứng viên');
                        await loadAll();
                      } catch (err) {
                        notify.error(err?.message || 'Gửi thất bại');
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    disabled={submitting}
                    style={{ padding: '8px 14px', borderRadius: 6, border: 'none', backgroundColor: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu xác nhận cho ứng viên'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </InterviewSection>

        {/* 3. Đánh giá */}
        {interview.feedbacks?.length > 0 && (
          <InterviewSection step="3" title={`Đánh giá (${interview.feedbacks.length})`} description="Ý kiến từng người phỏng vấn.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {interview.feedbacks.map((fb) => (
                <div key={fb.id} style={{ padding: 14, backgroundColor: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>{fb.interviewerName}</span>
                    {fb.recommendation && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', padding: '2px 8px', borderRadius: 6, backgroundColor: '#e5e7eb' }}>
                        {RECOMMENDATION_LABELS[fb.recommendation] ?? fb.recommendation}
                      </span>
                    )}
                  </div>
                  {fb.note && <div style={{ fontSize: 13, color: '#374151', fontStyle: 'italic' }}>"{fb.note}"</div>}
                </div>
              ))}
            </div>
          </InterviewSection>
        )}

        {canSubmitFeedback && (
          <InterviewSection step="Việc của bạn" title="Nộp đánh giá" description="Bạn là người tham gia và chưa nộp đánh giá.">
            <InterviewFeedbackForm feedback={feedback} setFeedback={setFeedback} submitting={submitting} onSubmit={handleSubmitFeedback}
              submitLabel="Nộp đánh giá" commentLabel="Nhận xét" commentPlaceholder="Nhận xét của bạn về ứng viên..." />
          </InterviewSection>
        )}

        {/* 4. Xử lý sự cố + Chốt vòng + Lên lịch vòng tiếp (chỉ khi vòng hoàn thành) */}
        <InterviewRoundActionsPanel interview={interview} onUpdated={loadAll} canReviewRound={isManager} />

        {/* Sticky actions */}
        {(canFinalize || canCancel) && !isLocked && (
          <div style={sx.stickyBar}>
            <span style={{ fontSize: 13 }}>
              {missingFeedbackCount > 0 ? `Còn thiếu ${missingFeedbackCount} feedback để chốt vòng.` : 'Đã đủ feedback, có thể chốt vòng.'}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canCancel && (
                <button type="button" onClick={() => setShowCancelModal(true)} disabled={submitting}
                  style={{ padding: '8px 12px', border: '1px solid #ef4444', borderRadius: 6, backgroundColor: 'transparent', color: '#fca5a5', cursor: 'pointer', fontWeight: 600 }}>Hủy phỏng vấn</button>
              )}
              {canFinalize && (
                <button type="button" onClick={() => setShowFinalizeModal(true)} disabled={submitting}
                  style={{ padding: '8px 12px', border: 'none', borderRadius: 6, backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 700 }}>Chốt phỏng vấn</button>
              )}
            </div>
          </div>
        )}

        {/* Modals */}
        <Modal show={showRequestModal} onClose={() => !submitting && setShowRequestModal(false)} title="Gửi yêu cầu đề cử">
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Trưởng phòng ban *</label>
            <select value={reqForm.assignedToUserId} onChange={e => setReqForm(f => ({ ...f, assignedToUserId: e.target.value }))} style={sx.input}>
              <option value="">— Chọn trưởng phòng ban —</option>
              {deptManagers.map(dm => <option key={dm.id} value={dm.id}>{dm.fullName}{dm.departmentName ? ` — ${dm.departmentName}` : ''} ({dm.email})</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Số người cần đề cử *</label>
            <input type="number" min={1} max={10} value={reqForm.requiredCount} onChange={e => setReqForm(f => ({ ...f, requiredCount: parseInt(e.target.value) || 1 }))} style={sx.input} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Ghi chú (tùy chọn)</label>
            <textarea value={reqForm.message} onChange={e => setReqForm(f => ({ ...f, message: e.target.value }))} rows={3} placeholder="Mô tả yêu cầu..." style={{ ...sx.input, resize: 'vertical' }} />
          </div>
          <div style={sx.modalActions}>
            <button type="button" onClick={() => setShowRequestModal(false)} disabled={submitting} style={sx.btnSecondary}>Hủy</button>
            <button type="button" onClick={handleCreateRequest} disabled={submitting} style={{ padding: '8px 18px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>{submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>
          </div>
        </Modal>

        <Modal show={showForwardModal} onClose={() => !submitting && setShowForwardModal(false)} title="Chuyển lên Giám đốc">
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Giám đốc *</label>
            <select value={forwardForm.toUserId} onChange={e => setForwardForm(f => ({ ...f, toUserId: e.target.value }))} style={sx.input}>
              <option value="">— Chọn Giám đốc —</option>
              {directors.map(d => <option key={d.id} value={d.id}>{d.fullName} ({d.email})</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Ghi chú (tùy chọn)</label>
            <textarea value={forwardForm.message} onChange={e => setForwardForm(f => ({ ...f, message: e.target.value }))} rows={3} placeholder="Lý do chuyển tiếp..." style={{ ...sx.input, resize: 'vertical' }} />
          </div>
          <div style={sx.modalActions}>
            <button type="button" onClick={() => setShowForwardModal(false)} disabled={submitting} style={sx.btnSecondary}>Hủy</button>
            <button type="button" onClick={handleForward} disabled={submitting} style={{ padding: '8px 18px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>{submitting ? 'Đang gửi...' : 'Chuyển tiếp'}</button>
          </div>
        </Modal>

        <Modal show={showFinalizeModal} onClose={() => !submitting && setShowFinalizeModal(false)} title="Kết thúc Phỏng vấn">
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>Kết quả</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['PASS', 'REJECT'].map(d => (
                <button key={d} type="button" onClick={() => setFinalizeDecision(d)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14, border: '2px solid', borderColor: finalizeDecision === d ? (d === 'PASS' ? '#10b981' : '#ef4444') : '#e5e7eb', backgroundColor: finalizeDecision === d ? (d === 'PASS' ? '#dcfce7' : '#fee2e2') : 'white', color: finalizeDecision === d ? (d === 'PASS' ? '#166534' : '#991b1b') : '#374151' }}>
                  {d === 'PASS' ? '✅ Đạt' : '❌ Không đạt'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>Ghi chú (tùy chọn)</label>
            <textarea value={finalizeNote} onChange={e => setFinalizeNote(e.target.value)} rows={3} style={{ ...sx.input, resize: 'vertical' }} />
          </div>
          <div style={sx.modalActions}>
            <button type="button" onClick={() => setShowFinalizeModal(false)} disabled={submitting} style={sx.btnSecondary}>Hủy</button>
            <button type="button" onClick={handleFinalize} disabled={submitting} style={{ padding: '8px 18px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>{submitting ? 'Đang lưu...' : 'Xác nhận'}</button>
          </div>
        </Modal>

        <Modal show={showCancelModal} onClose={() => !submitting && setShowCancelModal(false)} title="Hủy Phỏng vấn" width={360}>
          <p style={{ color: '#6b7280', marginBottom: 20 }}>Bạn có chắc muốn hủy phỏng vấn này?</p>
          <div style={sx.modalActions}>
            <button type="button" onClick={() => setShowCancelModal(false)} disabled={submitting} style={sx.btnSecondary}>Quay lại</button>
            <button type="button" onClick={handleCancel} disabled={submitting} style={{ padding: '8px 18px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>{submitting ? 'Đang hủy...' : 'Xác nhận hủy'}</button>
          </div>
        </Modal>

        <Modal show={showRescheduleModal} onClose={() => !submitting && setShowRescheduleModal(false)} title="Đổi lịch (gửi yêu cầu đề cử trưởng phòng)" width={480}>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Cập nhật thời gian/địa điểm. Hệ thống sẽ gửi yêu cầu đề cử người phỏng vấn đến trưởng phòng cho ngày mới. Chỉ khi trưởng phòng đề cử và interviewer xác nhận tham gia, bạn mới nên gửi thông báo cho ứng viên (nút &quot;Gửi yêu cầu xác nhận cho ứng viên&quot; bên dưới).</p>
          <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Bắt đầu *</label>
              <input type="datetime-local" value={rescheduleForm.startTime} onChange={(e) => setRescheduleForm((f) => ({ ...f, startTime: e.target.value }))} style={sx.input} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Kết thúc *</label>
              <input type="datetime-local" value={rescheduleForm.endTime} onChange={(e) => setRescheduleForm((f) => ({ ...f, endTime: e.target.value }))} style={sx.input} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Địa điểm</label>
              <input type="text" value={rescheduleForm.location} onChange={(e) => setRescheduleForm((f) => ({ ...f, location: e.target.value }))} placeholder="Offline" style={sx.input} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Link họp</label>
              <input type="url" value={rescheduleForm.meetingLink} onChange={(e) => setRescheduleForm((f) => ({ ...f, meetingLink: e.target.value }))} placeholder="https://..." style={sx.input} />
            </div>
          </div>
          <div style={sx.modalActions}>
            <button type="button" onClick={() => setShowRescheduleModal(false)} disabled={submitting} style={sx.btnSecondary}>Hủy</button>
            <button type="button" onClick={handleRescheduleAndResend} disabled={submitting} style={{ padding: '8px 18px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>{submitting ? 'Đang xử lý...' : 'Cập nhật lịch & gửi yêu cầu đề cử'}</button>
          </div>
        </Modal>

      </div>
    </div>
  );
}
