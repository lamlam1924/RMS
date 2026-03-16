import React, { useState, useEffect } from 'react';
import deptManagerService from '../../services/deptManagerService';
import notify from '../../utils/notification';

const reqStatusLabel = { PENDING: 'Đang chờ', FORWARDED: 'Đã chuyển tiếp', FULFILLED: 'Hoàn thành', CANCELLED: 'Đã hủy' };
const reqStatusColor = {
  PENDING: { bg: '#fef3c7', color: '#92400e' },
  FORWARDED: { bg: '#dbeafe', color: '#1e40af' },
  FULFILLED: { bg: '#d1fae5', color: '#065f46' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b' }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function DeptManagerNominationList() {
  const [requests, setRequests] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReqId, setActiveReqId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqs, members] = await Promise.all([
        deptManagerService.participantRequests.getMyAssigned(),
        deptManagerService.participantRequests.getTeamMembers()
      ]);
      setRequests(reqs?.data ?? reqs ?? []);
      setTeamMembers(members?.data ?? members ?? []);
    } catch {
      notify.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNominate = (req) => {
    setActiveReqId(req.id);
    setSelectedIds([]);
  };

  const toggleMember = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleNominate = async () => {
    if (!selectedIds.length) { notify.warning('Vui lòng chọn ít nhất một người'); return; }
    setSubmitting(true);
    try {
      await deptManagerService.participantRequests.nominate(activeReqId, selectedIds);
      notify.success('Đã đề cử người tham gia phỏng vấn');
      setActiveReqId(null);
      await loadData();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Đề cử thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingReqs = requests.filter(r => r.status === 'PENDING');
  const doneReqs = requests.filter(r => r.status !== 'PENDING');
  const isBlock = (req) => Array.isArray(req.interviews) && req.interviews.length > 1;

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Yêu cầu đề cử người phỏng vấn</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Đề cử thành viên trong phòng ban tham gia buổi phỏng vấn</p>
      </div>

      {pendingReqs.length === 0 && doneReqs.length === 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 40, textAlign: 'center', color: '#6b7280' }}>
          Không có yêu cầu đề cử nào
        </div>
      )}

      {pendingReqs.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#374151' }}>Cần xử lý ({pendingReqs.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingReqs.map(req => {
              const block = isBlock(req);
              return (
                <div
                  key={req.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 8,
                    border: `1px solid ${block ? '#bfdbfe' : '#fde68a'}`,
                    padding: 20
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                        {block ? (req.titleLabel || `${req.interviews?.length ?? 0} buổi`) : req.candidateName}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
                        {req.positionTitle} {req.departmentName && ` · ${req.departmentName}`}
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                        📅 {block
                          ? `${formatDateTime(req.timeRangeStart)} → ${formatDateTime(req.timeRangeEnd)}`
                          : formatDateTime(req.startTime)}
                        &nbsp;|&nbsp; Cần <strong>{req.requiredCount}</strong> người
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>Từ: {req.requestedByName}</div>
                      {req.message && (
                        <div style={{ fontSize: 13, color: '#374151', marginTop: 6, fontStyle: 'italic', backgroundColor: block ? '#eff6ff' : '#fffbeb', padding: '6px 10px', borderRadius: 6 }}>
                          💬 {req.message}
                        </div>
                      )}
                      {block && Array.isArray(req.interviews) && req.interviews.length > 0 && (
                        <div style={{ marginTop: 10, padding: 10, backgroundColor: '#f8fafc', borderRadius: 6, fontSize: 12, color: '#475569' }}>
                          {req.interviews.map((inv, idx) => (
                            <div key={inv.interviewId}>Buổi {idx + 1}: {inv.candidateName} — {formatDateTime(inv.startTime)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleOpenNominate(req)}
                      style={{ padding: '8px 16px', backgroundColor: block ? '#2563eb' : '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}
                    >
                      {block ? 'Đề cử cho cả block' : 'Đề cử người'}
                    </button>
                  </div>

                  {activeReqId === req.id && (
                    <div style={{ marginTop: 16, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
                        Chọn thành viên tham gia {block ? `tất cả ${req.interviews?.length ?? 0} buổi` : ''} ({selectedIds.length} người)
                      </div>
                      {teamMembers.length === 0 ? (
                        <div style={{ color: '#6b7280', fontSize: 13 }}>Không có thành viên trong phòng ban</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                          {teamMembers.map(m => (
                            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, backgroundColor: selectedIds.includes(m.id) ? '#eff6ff' : '#f9fafb', border: `1px solid ${selectedIds.includes(m.id) ? '#93c5fd' : '#e5e7eb'}`, cursor: 'pointer' }}>
                              <input type="checkbox" checked={selectedIds.includes(m.id)} onChange={() => toggleMember(m.id)} style={{ width: 16, height: 16 }} />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{m.fullName}</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>{m.email}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button onClick={() => setActiveReqId(null)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}>Hủy</button>
                        <button onClick={handleNominate} disabled={submitting || !selectedIds.length} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: (submitting || !selectedIds.length) ? 0.7 : 1 }}>
                          {submitting ? 'Đang gửi...' : `Xác nhận đề cử (${selectedIds.length} người)`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {doneReqs.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#374151' }}>Đã xử lý ({doneReqs.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {doneReqs.map(req => {
              const sc = reqStatusColor[req.status] || { bg: '#f3f4f6', color: '#374151' };
              const block = isBlock(req);
              return (
                <div key={req.id} style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {block ? (req.titleLabel || `${req.interviews?.length ?? 0} buổi`) : req.candidateName}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>
                        {req.positionTitle}
                        {block && req.timeRangeStart ? ` • ${formatDateTime(req.timeRangeStart)} – ${formatDateTime(req.timeRangeEnd)}` : req.startTime ? ` • ${formatDateTime(req.startTime)}` : ''}
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, backgroundColor: sc.bg, color: sc.color }}>
                      {reqStatusLabel[req.status] || req.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
