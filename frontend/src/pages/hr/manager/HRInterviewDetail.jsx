import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';
import { authService } from '../../../services/authService';
import { ROLES } from '../../../constants/roles';
import { getStatusBadge } from '../../../utils/helpers/badge';
import PhaseTwoActionsPanel from '../../../components/hr/interviews/PhaseTwoActionsPanel';
import InterviewSection from '../../../components/hr/interviews/InterviewSection';
import InterviewFeedbackForm from '../../../components/shared/InterviewFeedbackForm';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const reqStatusLabel = { PENDING: 'Đang chờ', FORWARDED: 'Đã chuyển tiếp', FULFILLED: 'Hoàn thành', CANCELLED: 'Đã hủy' };
const reqStatusColor = { PENDING: { bg: '#fef3c7', color: '#92400e' }, FORWARDED: { bg: '#dbeafe', color: '#1e40af' }, FULFILLED: { bg: '#d1fae5', color: '#065f46' }, CANCELLED: { bg: '#fee2e2', color: '#991b1b' } };

export default function HRInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participantRequests, setParticipantRequests] = useState([]);
  const [deptManagers, setDeptManagers] = useState([]);
  const [directors, setDirectors] = useState([]);

  // Modals
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardingReqId, setForwardingReqId] = useState(null);
  const [finalizeDecision, setFinalizeDecision] = useState('PASS');
  const [finalizeNote, setFinalizeNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Participant request form
  const [reqForm, setReqForm] = useState({ assignedToUserId: '', requiredCount: 1, message: '' });
  const [forwardForm, setForwardForm] = useState({ toUserId: '', message: '' });

  // HR feedback form (when HR is a participant)
  const [feedback, setFeedback] = useState({ comment: '', decision: '' });

  const user = authService.getUserInfo();
  const isManager = user?.roles?.includes(ROLES.HR_MANAGER);
  const currentUserId = user?.id;

  useEffect(() => { loadAll(); }, [id]);

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
      try {
        const data = await hrService.interviews.getDeptManagers();
        setDeptManagers(data || []);
      } catch { notify.error('Không thể tải danh sách trưởng phòng'); }
    }
    setReqForm({ assignedToUserId: '', requiredCount: 1, message: '' });
    setShowRequestModal(true);
  };

  const handleCreateRequest = async () => {
    if (!reqForm.assignedToUserId) { notify.warning('Vui lòng chọn trưởng phòng'); return; }
    setSubmitting(true);
    try {
      await hrService.interviews.createParticipantRequest(id, {
        assignedToUserId: parseInt(reqForm.assignedToUserId),
        requiredCount: reqForm.requiredCount,
        message: reqForm.message || null
      });
      notify.success('Đã gửi yêu cầu đề cử người phỏng vấn');
      setShowRequestModal(false);
      const reqs = await hrService.interviews.getParticipantRequests(id);
      setParticipantRequests(reqs || []);
    } catch (err) {
      notify.error(err.message || 'Gửi yêu cầu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const openForwardModal = async (reqId) => {
    if (!directors.length) {
      try {
        const data = await hrService.interviews.getDirectors();
        setDirectors(data || []);
      } catch { notify.error('Không thể tải danh sách Giám đốc'); }
    }
    setForwardingReqId(reqId);
    setForwardForm({ toUserId: '', message: '' });
    setShowForwardModal(true);
  };

  const handleForward = async () => {
    if (!forwardForm.toUserId) { notify.warning('Vui lòng chọn Giám đốc'); return; }
    setSubmitting(true);
    try {
      await hrService.interviews.forwardParticipantRequest(forwardingReqId, {
        toUserId: parseInt(forwardForm.toUserId),
        message: forwardForm.message || null
      });
      notify.success('Đã chuyển tiếp yêu cầu đến Giám đốc');
      setShowForwardModal(false);
      const reqs = await hrService.interviews.getParticipantRequests(id);
      setParticipantRequests(reqs || []);
    } catch (err) {
      notify.error(err.message || 'Chuyển tiếp thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.decision) { notify.warning('Vui lòng chọn kết quả'); return; }
    setSubmitting(true);
    try {
      await hrService.interviews.submitFeedback(id, feedback);
      notify.success('Đã nộp đánh giá phỏng vấn');
      await loadAll();
    } catch (err) {
      notify.error(err.message || 'Nộp đánh giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    setSubmitting(true);
    try {
      await hrService.interviews.finalize(id, { decision: finalizeDecision, note: finalizeNote || null });
      notify.success(`Đã kết thúc phỏng vấn: ${finalizeDecision === 'PASS' ? 'ĐẠT' : 'KHÔNG ĐẠT'}`);
      setShowFinalizeModal(false);
      await loadAll();
    } catch (err) {
      notify.error(err.message || 'Kết thúc phỏng vấn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      await hrService.interviews.cancel(id);
      notify.success('Đã hủy phỏng vấn');
      setShowCancelModal(false);
      await loadAll();
    } catch (err) {
      notify.error(err.message || 'Hủy phỏng vấn thất bại');
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
  const canSubmitFeedback = isParticipant && !myFeedback && !isFinal;
  const feedbackProgressLabel = `${interview.feedbackCount || 0}/${interview.participantCount || 0}`;
  const missingFeedbackCount = Math.max((interview.participantCount || 0) - (interview.feedbackCount || 0), 0);

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/staff/hr-manager/interviews')}
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

      <InterviewSection step="Tổng quan" title="Thông tin chính" description="Thông tin cốt lõi của buổi phỏng vấn và tiến độ feedback.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Ứng viên</div><div style={{ fontWeight: 500 }}>{interview.candidateName}</div></div>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Vị trí</div><div style={{ fontWeight: 500 }}>{interview.positionTitle}</div></div>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Phòng ban</div><div style={{ fontWeight: 500 }}>{interview.departmentName}</div></div>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Application ID</div><div style={{ fontWeight: 500 }}>#{interview.applicationId}</div></div>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Bắt đầu</div><div style={{ fontWeight: 500 }}>{formatDateTime(interview.startTime)}</div></div>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Kết thúc</div><div style={{ fontWeight: 500 }}>{formatDateTime(interview.endTime)}</div></div>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Địa điểm</div><div style={{ fontWeight: 500 }}>{interview.location || '—'}</div></div>
          <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Tiến độ feedback</div><div style={{ fontWeight: 700, color: '#111827' }}>{feedbackProgressLabel}</div></div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Link họp</div>
            {interview.meetingLink
              ? <a href={interview.meetingLink} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Mở link</a>
              : <span style={{ fontWeight: 500 }}>—</span>}
          </div>
        </div>
      </InterviewSection>

      <PhaseTwoActionsPanel interview={interview} onUpdated={loadAll} />

      {/* Participants */}
      <InterviewSection step="Phối hợp" title={`Người tham gia (${interview.participants?.length ?? 0})`} description="Theo dõi ai sẽ tham gia phỏng vấn và ai đã hoàn thành đánh giá.">
        {!interview.participants?.length ? (
          <div style={{ color: '#6b7280', fontSize: 13 }}>Chưa có người tham gia</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {interview.participants.map((p) => (
              <div key={p.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f9fafb', borderRadius: 6 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.userName} {p.userId === currentUserId && <span style={{ fontSize: 11, color: '#6b7280' }}>(bạn)</span>}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{p.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>
                    {p.interviewRoleName || p.interviewRoleCode}
                  </span>
                  {p.hasSubmittedFeedback && (
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#d1fae5', color: '#065f46', fontWeight: 600 }}>✓ Đã đánh giá</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </InterviewSection>

      {/* Participant Requests */}
      <InterviewSection
        step="Điều phối"
        title={`Yêu cầu đề cử (${participantRequests.length})`}
        description="Dùng khi cần bổ sung interviewer hoặc chuyển tiếp lên giám đốc."
        actions={!isFinal && (
          <button
            onClick={openRequestModal}
            style={{ padding: '6px 14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            + Gửi yêu cầu
          </button>
        )}
      >
        {!participantRequests.length ? (
          <div style={{ color: '#6b7280', fontSize: 13 }}>Chưa có yêu cầu đề cử nào</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {participantRequests.map(req => {
              const sc = reqStatusColor[req.status] || { bg: '#f3f4f6', color: '#374151' };
              return (
                <div key={req.id} style={{ padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        Gửi đến: {req.assignedToName}
                        {req.forwardedToName && <span style={{ color: '#6b7280', fontWeight: 400 }}> → Chuyển tiếp: {req.forwardedToName}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>
                        Cần {req.requiredCount} người • {formatDateTime(req.createdAt)}
                      </div>
                      {req.message && <div style={{ fontSize: 13, color: '#374151', marginTop: 4, fontStyle: 'italic' }}>"{req.message}"</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, backgroundColor: sc.bg, color: sc.color }}>
                        {reqStatusLabel[req.status] || req.status}
                      </span>
                      {isManager && req.status === 'PENDING' && (
                        <button
                          onClick={() => openForwardModal(req.id)}
                          style={{ padding: '4px 10px', border: '1px solid #6366f1', borderRadius: 6, backgroundColor: 'white', color: '#6366f1', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                        >
                          Chuyển lên GĐ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </InterviewSection>

      {/* Feedbacks */}
      {interview.feedbacks?.length > 0 && (
        <InterviewSection step="Đánh giá" title={`Danh sách đánh giá (${interview.feedbacks.length})`} description="Đọc nhanh ý kiến của từng người phỏng vấn để chốt kết quả vòng phỏng vấn.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {interview.feedbacks.map((fb) => (
              <div key={fb.id} style={{ padding: 14, backgroundColor: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{fb.interviewerName}</div>
                {fb.note && <div style={{ fontSize: 13, color: '#374151', marginBottom: 8, fontStyle: 'italic' }}>"{fb.note}"</div>}
              </div>
            ))}
          </div>
        </InterviewSection>
      )}

      {/* HR Feedback form (when HR is a participant) */}
      {canSubmitFeedback && (
        <InterviewSection step="Việc của bạn" title="Nộp đánh giá của bạn" description="Chỉ hiện khi bạn là người tham gia phỏng vấn và chưa nộp đánh giá.">
          <InterviewFeedbackForm
            title="Nộp đánh giá của bạn"
            description="Ghi nhận xét về ứng viên và chọn kết luận cuối cùng."
            feedback={feedback}
            setFeedback={setFeedback}
            submitting={submitting}
            onSubmit={handleSubmitFeedback}
            submitLabel="Nộp đánh giá"
            commentLabel="Nhận xét"
            commentPlaceholder="Nhận xét của bạn về ứng viên..."
          />
        </InterviewSection>
      )}

      {/* Actions */}
      {(canFinalize || canCancel || !isFinal) && (
        <div style={{
          position: 'sticky',
          bottom: 12,
          zIndex: 20,
          marginTop: 16,
          borderRadius: 10,
          padding: '12px 14px',
          backgroundColor: '#111827',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div style={{ fontSize: 13 }}>
            {missingFeedbackCount > 0
              ? `Còn thiếu ${missingFeedbackCount} feedback để chốt vòng.`
              : 'Đã đủ feedback, bạn có thể chốt vòng phỏng vấn.'}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!isFinal && (
              <button
                onClick={openRequestModal}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #4b5563',
                  borderRadius: 6,
                  backgroundColor: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + Gửi yêu cầu đề cử
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ef4444',
                  borderRadius: 6,
                  backgroundColor: 'transparent',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Hủy phỏng vấn
              </button>
            )}

            {canFinalize && (
              <button
                onClick={() => setShowFinalizeModal(true)}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: 6,
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Chốt phỏng vấn
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Participant Request */}
      {showRequestModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 10, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Gửi yêu cầu đề cử</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Trưởng phòng ban *</label>
              <select
                value={reqForm.assignedToUserId}
                onChange={e => setReqForm(f => ({ ...f, assignedToUserId: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
              >
                <option value="">— Chọn trưởng phòng —</option>
                {deptManagers.map(dm => (
                  <option key={dm.id} value={dm.id}>{dm.fullName} ({dm.email})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Số người cần đề cử *</label>
              <input
                type="number" min={1} max={10}
                value={reqForm.requiredCount}
                onChange={e => setReqForm(f => ({ ...f, requiredCount: parseInt(e.target.value) || 1 }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Ghi chú (tùy chọn)</label>
              <textarea
                value={reqForm.message}
                onChange={e => setReqForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
                placeholder="Mô tả yêu cầu hoặc lưu ý đặc biệt..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRequestModal(false)} disabled={submitting}
                style={{ padding: '8px 18px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}>
                Hủy
              </button>
              <button onClick={handleCreateRequest} disabled={submitting}
                style={{ padding: '8px 18px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Forward to Director */}
      {showForwardModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 10, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Chuyển lên Giám đốc</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Giám đốc *</label>
              <select
                value={forwardForm.toUserId}
                onChange={e => setForwardForm(f => ({ ...f, toUserId: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
              >
                <option value="">— Chọn Giám đốc —</option>
                {directors.map(d => (
                  <option key={d.id} value={d.id}>{d.fullName} ({d.email})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Ghi chú (tùy chọn)</label>
              <textarea
                value={forwardForm.message}
                onChange={e => setForwardForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
                placeholder="Lý do chuyển tiếp..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForwardModal(false)} disabled={submitting}
                style={{ padding: '8px 18px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}>
                Hủy
              </button>
              <button onClick={handleForward} disabled={submitting}
                style={{ padding: '8px 18px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {submitting ? 'Đang gửi...' : 'Chuyển tiếp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Finalize */}
      {showFinalizeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 10, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Kết thúc Phỏng vấn</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>Kết quả</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['PASS', 'REJECT'].map(d => (
                  <button key={d} onClick={() => setFinalizeDecision(d)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14, border: '2px solid',
                      borderColor: finalizeDecision === d ? (d === 'PASS' ? '#10b981' : '#ef4444') : '#e5e7eb',
                      backgroundColor: finalizeDecision === d ? (d === 'PASS' ? '#dcfce7' : '#fee2e2') : 'white',
                      color: finalizeDecision === d ? (d === 'PASS' ? '#166534' : '#991b1b') : '#374151'
                    }}>
                    {d === 'PASS' ? '✅ Đạt' : '❌ Không đạt'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>Ghi chú (tùy chọn)</label>
              <textarea value={finalizeNote} onChange={e => setFinalizeNote(e.target.value)} rows={3}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowFinalizeModal(false)} disabled={submitting}
                style={{ padding: '8px 18px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleFinalize} disabled={submitting}
                style={{ padding: '8px 18px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {submitting ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancel */}
      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 10, padding: 28, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 18 }}>Hủy Phỏng vấn</h3>
            <p style={{ color: '#6b7280', marginBottom: 20 }}>Bạn có chắc chắn muốn hủy phỏng vấn này không?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCancelModal(false)} disabled={submitting}
                style={{ padding: '8px 18px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}>Quay lại</button>
              <button onClick={handleCancel} disabled={submitting}
                style={{ padding: '8px 18px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {submitting ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

