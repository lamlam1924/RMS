import React, { useEffect, useMemo, useState } from 'react';
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
  input: { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 },
  btnSecondary: { padding: '8px 18px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' },
};

/** Số người phỏng vấn cần đã xác nhận tham gia: tổng requiredCount của yêu cầu đề cử (không hủy), hoặc nếu không có thì bằng số người đang trong danh sách. */
function getRequiredInterviewerConfirmCount(participantRequests, participants) {
  const active = (participantRequests || []).filter((r) => r.status !== 'CANCELLED');
  if (active.length > 0) {
    const sum = active.reduce((acc, r) => acc + (Number(r.requiredCount) || 0), 0);
    if (sum > 0) return sum;
  }
  return (participants || []).length;
}

function getConfirmedInterviewerCount(participants) {
  return (participants || []).filter((p) => p.confirmedAt).length;
}

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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ label, value, highlight }) => (
        <div key={label}>
          <div className="mb-1 text-xs text-slate-500">{label}</div>
          <div className={`font-medium text-slate-800 ${highlight ? 'font-bold text-slate-900' : ''}`}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function ParticipantList({ participants, currentUserId }) {
  if (!participants?.length) return <div className="text-sm text-slate-500">Chưa có người tham gia</div>;
  return (
    <div className="space-y-2">
      {participants.map((p) => (
        <div key={p.userId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-900">{p.userName}</span>
              {p.userId === currentUserId && <span className="ml-1 text-xs text-slate-500">(bạn)</span>}
              <div className="text-xs text-slate-500">{p.email}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
                {p.interviewRoleName || p.interviewRoleCode}
              </span>
              {p.confirmedAt && (
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Đã xác nhận</span>
              )}
              {p.declinedAt && (
                <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">Từ chối</span>
              )}
              {!p.confirmedAt && !p.declinedAt && (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Chưa xác nhận</span>
              )}
              {p.hasSubmittedFeedback && (
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">Đã đánh giá</span>
              )}
            </div>
          </div>
          {p.declinedAt && p.declineNote && (
            <div className="mt-2 rounded-md bg-rose-50 px-2.5 py-2 text-sm text-rose-800">
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
    <div key={req.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="mb-1 font-semibold text-slate-900">
            Gửi đến: {req.assignedToName}
            {req.forwardedToName && <span className="font-normal text-slate-500"> → {req.forwardedToName}</span>}
          </div>
          <div className="text-sm text-slate-500">Cần {req.requiredCount} người · {formatDateTime(req.createdAt)}</div>
          {req.message && <div className="mt-1 text-sm italic text-slate-700">"{req.message}"</div>}
        </div>
        <div className="flex items-center gap-2">
          <span style={{ backgroundColor: sc.bg, color: sc.color }} className="rounded-md px-2 py-0.5 text-xs font-semibold">{sc.label}</span>
          {/* {isManager && req.status === 'PENDING' && (
            <button type="button" onClick={() => onForward(req.id)} className="rounded-md border border-indigo-500 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50">Chuyển lên GĐ</button>
          )} */}
        </div>
      </div>
    </div>
  );
}

function SendInvitationForm({ type, setType, link, setLink, location, setLocation, onSubmit, submitting }) {
  const canSubmit = type === 'online' ? link?.trim() : location?.trim();
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
          <input type="radio" name="inviteType" checked={type === 'online'} onChange={() => setType('online')} />
          <span>Online (Link họp)</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
          <input type="radio" name="inviteType" checked={type === 'offline'} onChange={() => setType('offline')} />
          <span>Offline (Địa điểm)</span>
        </label>
      </div>
      {type === 'online' ? (
        <input type="url" placeholder="https://meet.google.com/..." value={link} onChange={e => setLink(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
      ) : (
        <input type="text" placeholder="Địa điểm phỏng vấn" value={location} onChange={e => setLocation(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
      )}
      <button type="button" onClick={onSubmit} disabled={submitting || !canSubmit}
        className="w-fit rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? 'Đang gửi...' : 'Gửi thông báo cho người phỏng vấn'}
      </button>
    </div>
  );
}

function Modal({ show, onClose, title, children, width = 440 }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4" onClick={() => onClose()}>
      <div className="w-[95vw] rounded-xl bg-white p-6 shadow-2xl" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
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
  const [submitting, setSubmitting] = useState(false); // cho các modal và thao tác khác
  const [submittingInvitation, setSubmittingInvitation] = useState(false); // chỉ cho gửi thông báo interviewer
  const [submittingCandidateConfirmation, setSubmittingCandidateConfirmation] = useState(false); // chỉ cho gửi xác nhận ứng viên

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [forwardingReqId, setForwardingReqId] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ startTime: '', endTime: '', location: '', meetingLink: '' });
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [blockInterviews, setBlockInterviews] = useState([]);

  const [reqForm, setReqForm] = useState({ assignedToUserId: '', requiredCount: 1, message: '' });
  const [forwardForm, setForwardForm] = useState({ toUserId: '', message: '' });
  const [finalizeDecision, setFinalizeDecision] = useState('PASS');
  const [finalizeNote, setFinalizeNote] = useState('');
  const [feedback, setFeedback] = useState({ comment: '', decision: '' });
  const [sendInvitationType, setSendInvitationType] = useState('online');
  const [sendInvitationLink, setSendInvitationLink] = useState('');
  const [sendInvitationLocation, setSendInvitationLocation] = useState('');
  const [invitationSent, setInvitationSent] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | coordination | feedback | history

  const activeIdx = useMemo(() => {
    if (!interview?.id || !blockInterviews.length) return 0;
    const idx = blockInterviews.findIndex((x) => String(x.id) === String(interview.id));
    return Math.max(0, idx);
  }, [blockInterviews, interview?.id]);

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
      await loadBlockInterviews(data);
    } catch {
      notify.error('Không thể tải thông tin phỏng vấn');
      navigate('/staff/hr-manager/interviews');
    } finally {
      setLoading(false);
    }
  };

  const dateKey = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const loadBlockInterviews = async (currentInterview) => {
    try {
      const all = await hrService.interviews.getAll();
      const list = Array.isArray(all) ? all : [];
      const current = currentInterview || list.find((x) => String(x.id) === String(id));
      if (!current) {
        setBlockInterviews([]);
        return;
      }
      const currentDate = dateKey(current.startTime);
      const grouped = list
        .filter((x) =>
          x.positionTitle === current.positionTitle &&
          x.roundNo === current.roundNo &&
          dateKey(x.startTime) === currentDate
        )
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      setBlockInterviews(grouped.length ? grouped : [current]);
    } catch {
      setBlockInterviews(currentInterview ? [currentInterview] : []);
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
    setSubmittingInvitation(true);
    try {
      await hrService.interviews.sendInvitation(id, body);
      notify.success('Đã gửi thông báo cho người phỏng vấn');
      setInvitationSent(true);
      await loadAll();
    } catch (err) { notify.error(err.message || 'Gửi thông báo thất bại'); }
    finally { setSubmittingInvitation(false); }
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
  const requiredInterviewerSlots = getRequiredInterviewerConfirmCount(participantRequests, interview.participants);
  const confirmedInterviewerSlots = getConfirmedInterviewerCount(interview.participants);
  // Chỉ hiện nút gửi xác nhận cho ứng viên khi đủ interviewer xác nhận và đã có địa chỉ hoặc link
  const hasLocationOrLink = !!(sendInvitationType === 'online' ? sendInvitationLink?.trim() : sendInvitationLocation?.trim());
  const canSendCandidateConfirmation =
    requiredInterviewerSlots > 0 && confirmedInterviewerSlots >= requiredInterviewerSlots && hasLocationOrLink;
  const isParticipant = interview.participants?.some(p => p.userId === currentUserId);
  const myParticipant = interview.participants?.find(p => p.userId === currentUserId);
  const myConfirmedParticipation = !!(myParticipant?.confirmedAt && !myParticipant?.declinedAt);
  const myFeedback = interview.feedbacks?.find(fb => fb.interviewerId === currentUserId);
  const hasRoundDecision = !!interview.roundDecision;
  const isLocked = isFinal || hasRoundDecision;
  const canSubmitFeedback = isParticipant && myConfirmedParticipation && !myFeedback && !isLocked;
  const feedbackProgressLabel = `${interview.feedbackCount || 0}/${interview.participantCount || 0}`;
  const missingFeedbackCount = Math.max((interview.participantCount || 0) - (interview.feedbackCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => navigate('/staff/hr-manager/interviews')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">← Quay lại</button>
          <h1 className="flex-1 text-2xl font-bold text-slate-900">Chi tiết Phỏng vấn — Vòng {interview.roundNo}</h1>
          <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
            {interview.statusName || badge.label}
          </span>
        </header>

        {blockInterviews.length > 1 && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-800">
                Cùng block: {interview.positionTitle} • {blockInterviews.length} ứng viên
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={activeIdx <= 0}
                  onClick={() => navigate(`/staff/hr-manager/interviews/${blockInterviews[Math.max(0, activeIdx - 1)]?.id}`)}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  ◀
                </button>
                <button
                  type="button"
                  disabled={activeIdx >= blockInterviews.length - 1}
                  onClick={() => navigate(`/staff/hr-manager/interviews/${blockInterviews[Math.min(blockInterviews.length - 1, activeIdx + 1)]?.id}`)}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  ▶
                </button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {blockInterviews.map((iv, idx) => {
                const isActive = String(iv.id) === String(interview.id);
                return (
                  <button
                    key={iv.id}
                    type="button"
                    onClick={() => navigate(`/staff/hr-manager/interviews/${iv.id}`)}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-left transition ${
                      isActive ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-semibold">Buổi {idx + 1}</div>
                    <div className="max-w-[180px] truncate text-xs">{iv.candidateName || `#${iv.id}`}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Tổng quan' },
              { id: 'coordination', label: 'Điều phối' },
              { id: 'feedback', label: 'Feedback' },
              { id: 'history', label: 'Lịch sử' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Thông tin chính */}
        {activeTab === 'overview' && (
        <InterviewSection step="1" title="Thông tin chính" description="Thông tin buổi phỏng vấn và tiến độ đánh giá.">
          {(candidateDeclined || hasParticipantDeclines) && !isLocked && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="mb-2 text-sm font-bold text-amber-800">Cần xử lý từ chối</div>
              {candidateDeclined && (
                <div className="mb-2 text-sm text-rose-700">
                  Ứng viên đã từ chối. Ghi chú: {interview.candidateDeclineNote}
                </div>
              )}
              {hasParticipantDeclines && (
                <div className="mb-2 text-sm text-amber-800">
                  Có interviewer từ chối tham gia — cần trưởng phòng đề cử người khác.
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {hasParticipantDeclines && !isFinal && (
                  <button type="button" onClick={openRequestModal} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                    Đề cử interviewer khác
                  </button>
                )}
                {candidateDeclined && !isFinal && (
                  <button type="button" onClick={() => setShowRescheduleModal(true)} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                    Đổi lịch (gửi yêu cầu đề cử trưởng phòng)
                  </button>
                )}
              </div>
            </div>
          )}
          <OverviewGrid interview={interview} formatDateTime={formatDateTime} feedbackProgressLabel={feedbackProgressLabel} />
        </InterviewSection>
        )}

        {/* Lịch sử thay đổi */}
        {activeTab === 'history' && interviewHistory.length > 0 && (
          <InterviewSection step="" title="Lịch sử thay đổi" description="Các sự kiện và thay đổi trạng thái của buổi phỏng vấn.">
            <div className="space-y-2">
              {interviewHistory.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-slate-500">{item.at ? formatDateTime(item.at) : '—'}</span>
                    {item.changedByName && <span className="font-semibold text-slate-700">{item.changedByName}</span>}
                    {(item.fromStatusName || item.toStatusName) && (
                      <span className="text-blue-700">
                        {item.fromStatusName ? `${item.fromStatusName} → ` : ''}{item.toStatusName || ''}
                      </span>
                    )}
                  </div>
                  {item.note && <div className="text-slate-600">{item.note}</div>}
                </div>
              ))}
            </div>
          </InterviewSection>
        )}

        {/* 2. Phối hợp: Người tham gia + Yêu cầu đề cử + Gửi thông báo */}
        {activeTab === 'coordination' && (
        <InterviewSection
          step="2"
          title="Phối hợp & Điều phối"
          description="Người tham gia phỏng vấn, yêu cầu đề cử và gửi thông báo (địa điểm/link) cho ứng viên."
          actions={!isLocked && (
            <button type="button" onClick={openRequestModal} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">+ Gửi yêu cầu đề cử</button>
          )}
        >
          <div className="space-y-5">
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Người tham gia ({interview.participants?.length ?? 0})</h4>
              <ParticipantList participants={interview.participants} currentUserId={currentUserId} />
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Yêu cầu đề cử ({participantRequests.length})</h4>
              {participantRequests.length === 0 ? (
                <div className="text-sm text-slate-500">Chưa có yêu cầu đề cử nào</div>
              ) : (
                <div className="space-y-2.5">
                  {participantRequests.map(req => (
                    <RequestCard key={req.id} req={req} isManager={isManager} onForward={openForwardModal} formatDateTime={formatDateTime} />
                  ))}
                </div>
              )}
            </div>
            {/* Gửi thông báo cho người phỏng vấn: Luôn hiển thị nếu chưa khóa vòng */}
            {!isLocked && (
              <div className="mb-6">
                <h4 className="mb-2 text-sm font-semibold text-slate-700">Gửi thông báo cho người phỏng vấn</h4>
                <p className="mb-3 text-xs text-slate-500">Sau khi chọn Online (link) hoặc Offline (địa điểm), gửi thông báo chỉ cho interviewer để họ xác nhận tham gia. Ứng viên chưa nhận email ở bước này.</p>
                <SendInvitationForm
                  type={sendInvitationType} setType={setSendInvitationType}
                  link={sendInvitationLink} setLink={setSendInvitationLink}
                  location={sendInvitationLocation} setLocation={setSendInvitationLocation}
                  onSubmit={handleSendInvitation} submitting={submittingInvitation}
                />
              </div>
            )}

            {/* Gửi yêu cầu xác nhận cho ứng viên: Chỉ phụ thuộc đủ interviewer xác nhận */}
            {!isLocked && (
              <div>
                {canSendCandidateConfirmation ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <h4 className="mb-1 text-sm font-semibold text-emerald-800">Gửi yêu cầu xác nhận cho ứng viên</h4>
                    <p className="mb-2.5 text-xs text-emerald-700">
                      {`Đã đủ ${confirmedInterviewerSlots}/${requiredInterviewerSlots} người phỏng vấn xác nhận tham gia. Ứng viên sẽ thấy buổi này trong "Phỏng vấn của tôi" và nhận email xác nhận.`}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        setSubmittingCandidateConfirmation(true);
                        try {
                          await hrService.interviews.sendCandidateConfirmation(id);
                          notify.success('Đã gửi yêu cầu xác nhận cho ứng viên');
                          await loadAll();
                        } catch (err) {
                          // Hiển thị rõ message lỗi trả về từ backend
                          let msg = err?.message;
                          if (err?.response?.data?.message) msg = err.response.data.message;
                          notify.error(msg || 'Gửi thất bại');
                        } finally {
                          setSubmittingCandidateConfirmation(false);
                        }
                      }}
                      disabled={submittingCandidateConfirmation}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {submittingCandidateConfirmation ? 'Đang gửi...' : 'Gửi yêu cầu xác nhận cho ứng viên'}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <h4 className="mb-1 text-sm font-semibold text-slate-700">Gửi yêu cầu xác nhận cho ứng viên</h4>
                    <p className="text-xs text-slate-500">
                      {requiredInterviewerSlots <= 0
                        ? 'Cần có người tham gia phỏng vấn (hoặc yêu cầu đề cử) để xác định số lượng cần xác nhận trước khi gửi cho ứng viên.'
                        : `Chỉ hiện nút gửi cho ứng viên khi đủ người phỏng vấn đã xác nhận tham gia: hiện ${confirmedInterviewerSlots}/${requiredInterviewerSlots} (người từ chối không tính; chỉ tính người đã chấp nhận).`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </InterviewSection>
        )}

        {/* 3. Đánh giá */}
        {activeTab === 'feedback' && interview.feedbacks?.length > 0 && (
          <InterviewSection step="3" title={`Đánh giá (${interview.feedbacks.length})`} description="Ý kiến từng người phỏng vấn.">
            <div className="space-y-3">
              {interview.feedbacks.map((fb) => (
                <div key={fb.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">{fb.interviewerName}</span>
                    {fb.recommendation && (
                      <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {RECOMMENDATION_LABELS[fb.recommendation] ?? fb.recommendation}
                      </span>
                    )}
                  </div>
                  {fb.note && <div className="text-sm italic text-slate-700">"{fb.note}"</div>}
                </div>
              ))}
            </div>
          </InterviewSection>
        )}

        {activeTab === 'feedback' && canSubmitFeedback && (
          <InterviewSection step="Việc của bạn" title="Nộp đánh giá" description="Bạn là người tham gia và chưa nộp đánh giá.">
            <InterviewFeedbackForm feedback={feedback} setFeedback={setFeedback} submitting={submitting} onSubmit={handleSubmitFeedback}
              submitLabel="Nộp đánh giá" commentLabel="Nhận xét" commentPlaceholder="Nhận xét của bạn về ứng viên..." />
          </InterviewSection>
        )}

        {/* 4. Xử lý sự cố + Chốt vòng + Lên lịch vòng tiếp (chỉ khi vòng hoàn thành) */}
        {/* {activeTab === 'overview' && <InterviewRoundActionsPanel interview={interview} onUpdated={loadAll} canReviewRound={isManager} />} */}

        {/* Sticky actions */}
        {(canFinalize || canCancel) && !isLocked && (
          <div className="sticky bottom-3 z-20 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white">
            <span className="text-sm">
              {missingFeedbackCount > 0 ? `Còn thiếu ${missingFeedbackCount} feedback để chốt vòng.` : 'Đã đủ feedback, có thể chốt vòng.'}
            </span>
            <div className="flex flex-wrap gap-2">
              {canCancel && (
                <button type="button" onClick={() => setShowCancelModal(true)} disabled={submitting}
                  className="rounded-lg border border-rose-400 bg-transparent px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10">Hủy phỏng vấn</button>
              )}
              {canFinalize && (
                <button type="button" onClick={() => setShowFinalizeModal(true)} disabled={submitting}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-700">Chốt phỏng vấn</button>
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
