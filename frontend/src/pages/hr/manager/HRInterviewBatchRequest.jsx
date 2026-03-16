import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';
import { formatDateTime } from '../../../utils/formatters/display';

function groupInterviewsByBlock(interviews) {
  const byKey = new Map();
  for (const i of interviews) {
    const dateStr = i.startTime ? new Date(i.startTime).toDateString() : '';
    const key = `${i.positionTitle || ''}|${dateStr}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(i);
  }
  return Array.from(byKey.entries())
    .map(([key, list]) => ({
      key,
      positionTitle: list[0]?.positionTitle || '',
      dateStr: list[0]?.startTime ? new Date(list[0].startTime).toDateString() : '',
      timeStart: list.length ? new Date(Math.min(...list.map(x => new Date(x.startTime)))) : null,
      timeEnd: list.length ? new Date(Math.max(...list.map(x => new Date(x.endTime)))) : null,
      interviews: list.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    }))
    .filter(g => g.interviews.length >= 2);
}

/** Trả về true nếu có ít nhất một request trùng khớp cả block (cùng tập interview ids). */
function blockHasRequestSent(block, requestsForFirstInterview) {
  if (!Array.isArray(requestsForFirstInterview) || !block?.interviews?.length) return false;
  const blockIds = new Set(block.interviews.map((i) => i.id));
  for (const req of requestsForFirstInterview) {
    const reqIds = Array.isArray(req.interviews) ? req.interviews.map((x) => x.interviewId) : [];
    if (reqIds.length === blockIds.size && reqIds.every((id) => blockIds.has(id))) return true;
  }
  return false;
}

export default function HRInterviewBatchRequest() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [deptManagers, setDeptManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalGroup, setModalGroup] = useState(null);
  const [form, setForm] = useState({ assignedToUserId: '', requiredCount: 1, message: '' });
  /** block.key -> true nếu đã gửi yêu cầu đề cử cho block đó */
  const [blockSent, setBlockSent] = useState({});
  /** Modal gửi thông báo (địa điểm/link) cho cả block */
  const [inviteModalGroup, setInviteModalGroup] = useState(null);
  const [inviteType, setInviteType] = useState('online');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLocation, setInviteLocation] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [data, managers] = await Promise.all([
          hrService.interviews.getAll(),
          hrService.interviews.getDeptManagers(),
        ]);
        setInterviews(Array.isArray(data) ? data : []);
        setDeptManagers(managers || []);
      } catch (err) {
        notify.error(err?.message || 'Không thể tải dữ liệu');
        if (err?.message?.includes('đăng nhập') || err?.message?.includes('quyền')) {
          setTimeout(() => navigate('/login', { replace: true }), 1500);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const blocks = groupInterviewsByBlock(interviews);

  // Khi có blocks, kiểm tra block nào đã có participant request (batch) gửi cho đúng tập interview
  useEffect(() => {
    if (!blocks.length) return;
    let cancelled = false;
    const next = {};
    (async () => {
      for (const block of blocks) {
        if (cancelled) return;
        const firstId = block.interviews[0]?.id;
        if (!firstId) continue;
        try {
          const list = await hrService.interviews.getParticipantRequests(firstId);
          const arr = Array.isArray(list) ? list : list?.data ?? [];
          next[block.key] = blockHasRequestSent(block, arr);
        } catch {
          next[block.key] = false;
        }
      }
      if (!cancelled) setBlockSent((prev) => ({ ...prev, ...next }));
    })();
    return () => { cancelled = true; };
  }, [blocks.length, blocks.map((b) => b.key).filter(Boolean).join('|')]);

  const openModal = (group) => {
    setModalGroup(group);
    setForm({ assignedToUserId: '', requiredCount: 1, message: '' });
  };

  const handleSubmit = async () => {
    if (!modalGroup) return;
    if (!form.assignedToUserId) {
      notify.warning('Vui lòng chọn trưởng phòng');
      return;
    }
    setSubmitting(true);
    try {
      await hrService.interviews.createParticipantRequestBatch({
        interviewIds: modalGroup.interviews.map(i => i.id),
        assignedToUserId: parseInt(form.assignedToUserId),
        requiredCount: form.requiredCount || 1,
        message: form.message || null,
      });
      notify.success('Đã gửi yêu cầu đề cử theo block');
      setBlockSent((prev) => ({ ...prev, [modalGroup.key]: true }));
      setModalGroup(null);
      const data = await hrService.interviews.getAll();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      notify.error(err?.message || 'Gửi yêu cầu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInvitationBatch = async () => {
    if (!inviteModalGroup) return;
    const body = {
      interviewIds: inviteModalGroup.interviews.map((i) => i.id),
      meetingLink: inviteType === 'online' ? inviteLink || undefined : undefined,
      location: inviteType === 'offline' ? inviteLocation || undefined : undefined
    };
    if (inviteType === 'online' && !body.meetingLink) {
      notify.warning('Vui lòng nhập link họp');
      return;
    }
    if (inviteType === 'offline' && !body.location) {
      notify.warning('Vui lòng nhập địa điểm');
      return;
    }
    setSubmitting(true);
    try {
      await hrService.interviews.sendInvitationBatch(body);
      notify.success('Đã gửi thông báo cho người phỏng vấn của cả block');
      setInviteModalGroup(null);
      const data = await hrService.interviews.getAll();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      notify.error(err?.message || 'Gửi thông báo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => navigate('/staff/hr-manager/interviews')}
            style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}
          >
            ← Quay lại
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Gửi yêu cầu đề cử theo block</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Chọn block (nhiều buổi cùng vị trí, cùng ngày) và gửi một yêu cầu đến trưởng phòng; trưởng phòng sẽ đề cử người cho cả block.
            </p>
          </div>
        </div>

        {blocks.length === 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 40, textAlign: 'center', color: '#6b7280' }}>
            Chưa có block nào (cần ít nhất 2 buổi cùng vị trí cùng ngày). Tạo nhiều buổi trong &quot;Tạo phỏng vấn&quot; trước.
          </div>
        )}

        {blocks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {blocks.map((block) => (
              <div key={block.key} style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{block.positionTitle}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {block.interviews.length} buổi · {block.timeStart && formatDateTime(block.timeStart)} → {block.timeEnd && formatDateTime(block.timeEnd)}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                    {block.interviews.map(i => i.candidateName || `#${i.id}`).join(', ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => openModal(block)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: blockSent[block.key] ? 'transparent' : '#2563eb',
                      color: blockSent[block.key] ? '#059669' : 'white',
                      border: `1px solid ${blockSent[block.key] ? '#059669' : '#2563eb'}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {blockSent[block.key] ? 'Đã gửi yêu cầu · Gửi lại' : 'Gửi yêu cầu đề cử'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Gửi yêu cầu xác nhận tham gia cho ${block.interviews.length} ứng viên (mỗi buổi 1 người)?`)) return;
                      setSubmitting(true);
                      try {
                        await hrService.interviews.sendCandidateConfirmationBatch({ interviewIds: block.interviews.map((i) => i.id) });
                        notify.success('Đã gửi yêu cầu xác nhận tham gia cho ứng viên');
                        const data = await hrService.interviews.getAll();
                        setInterviews(Array.isArray(data) ? data : []);
                      } catch (err) {
                        notify.error(err?.message || 'Gửi thất bại');
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    disabled={submitting}
                    style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Gửi xác nhận cho ứng viên
                  </button>
                  <button
                    onClick={() => { setInviteModalGroup(block); setInviteLink(''); setInviteLocation(''); }}
                    style={{ padding: '8px 16px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Gửi thông báo (địa điểm/link)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalGroup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => !submitting && setModalGroup(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: 10, padding: 24, maxWidth: 420, width: '100%', margin: 16 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>{blockSent[modalGroup?.key] ? 'Gửi lại yêu cầu đề cử' : 'Gửi yêu cầu đề cử'} cho block</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{modalGroup.interviews.length} buổi · {modalGroup.positionTitle}</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Trưởng phòng <span style={{ color: '#dc2626' }}>*</span></label>
              <select
                value={form.assignedToUserId}
                onChange={e => setForm(f => ({ ...f, assignedToUserId: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
              >
                <option value="">— Chọn trưởng phòng ban —</option>
                {deptManagers.map(m => (
                  <option key={m.id} value={m.id}>{m.fullName}{m.departmentName ? ` — ${m.departmentName}` : ''}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Số lượng người cần</label>
              <input type="number" min={1} value={form.requiredCount} onChange={e => setForm(f => ({ ...f, requiredCount: parseInt(e.target.value, 10) || 1 }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Tin nhắn (tùy chọn)</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', resize: 'vertical' }} placeholder="Ghi chú cho trưởng phòng" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setModalGroup(null)} disabled={submitting} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}>Hủy</button>
              <button type="button" onClick={handleSubmit} disabled={submitting} style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>{submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>
            </div>
          </div>
        </div>
      )}

      {inviteModalGroup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => !submitting && setInviteModalGroup(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: 10, padding: 24, maxWidth: 420, width: '100%', margin: 16 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Gửi thông báo (địa điểm/link) cho người phỏng vấn</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{inviteModalGroup.interviews.length} buổi · {inviteModalGroup.positionTitle}. Chỉ gửi cho interviewer, không gửi ứng viên.</p>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="radio" name="inviteTypeBatch" checked={inviteType === 'online'} onChange={() => setInviteType('online')} />
                <span>Online</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="radio" name="inviteTypeBatch" checked={inviteType === 'offline'} onChange={() => setInviteType('offline')} />
                <span>Offline</span>
              </label>
            </div>
            {inviteType === 'online' ? (
              <input type="url" placeholder="Link họp (Meet, Zoom...)" value={inviteLink} onChange={e => setInviteLink(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 16, boxSizing: 'border-box' }} />
            ) : (
              <input type="text" placeholder="Địa điểm phỏng vấn" value={inviteLocation} onChange={e => setInviteLocation(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 16, boxSizing: 'border-box' }} />
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setInviteModalGroup(null)} disabled={submitting} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}>Hủy</button>
              <button type="button" onClick={handleSendInvitationBatch} disabled={submitting || (inviteType === 'online' ? !inviteLink?.trim() : !inviteLocation?.trim())} style={{ padding: '8px 16px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: (submitting || (inviteType === 'online' ? !inviteLink?.trim() : !inviteLocation?.trim())) ? 0.7 : 1 }}>{submitting ? 'Đang gửi...' : 'Gửi thông báo'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
