import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import directorService from '../../services/directorService';
import notify from '../../utils/notification';

const reqStatusLabel = { PENDING: 'Đang chờ', FORWARDED: 'Đã chuyển tiếp', FULFILLED: 'Hoàn thành', CANCELLED: 'Đã hủy' };

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function DirectorNominationList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReqId, setActiveReqId] = useState(null);
  const [nominees, setNominees] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // For Director, nominations come from admin user IDs input
  // (Director can nominate any staff user by their ID — simplified approach)
  const [selectedIds, setSelectedIds] = useState([]);
  const [nomineeInput, setNomineeInput] = useState('');

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await directorService.participantRequests.getForwarded();
      setRequests(data || []);
    } catch {
      notify.error('Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleNominate = async (reqId) => {
    const ids = nomineeInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (!ids.length) { notify.warning('Vui lòng nhập ID người tham gia'); return; }
    setSubmitting(true);
    try {
      await directorService.participantRequests.nominate(reqId, ids);
      notify.success('Đã đề cử người tham gia phỏng vấn');
      setActiveReqId(null);
      setNomineeInput('');
      await loadRequests();
    } catch (err) {
      notify.error(err.message || 'Đề cử thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingReqs = requests.filter(r => r.status === 'FORWARDED');
  const doneReqs = requests.filter(r => r.status !== 'FORWARDED');

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Yêu cầu đề cử từ HR Manager</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Đề cử người tham gia phỏng vấn cho các vị trí cấp cao</p>
      </div>

      {requests.length === 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 40, textAlign: 'center', color: '#6b7280' }}>
          Không có yêu cầu đề cử nào
        </div>
      )}

      {pendingReqs.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#374151' }}>Cần xử lý ({pendingReqs.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingReqs.map(req => (
              <div key={req.id} style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #a5b4fc', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{req.candidateName}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{req.positionTitle}</div>
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                      📅 {formatDateTime(req.startTime)} &nbsp;|&nbsp; Cần <strong>{req.requiredCount}</strong> người
                    </div>
                    {req.message && (
                      <div style={{ fontSize: 13, fontStyle: 'italic', color: '#374151', backgroundColor: '#f0f0ff', padding: '6px 10px', borderRadius: 6, marginTop: 6 }}>
                        💬 {req.message}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Chuyển tiếp từ: {req.assignedToName}</div>
                  </div>
                  <button
                    onClick={() => { setActiveReqId(activeReqId === req.id ? null : req.id); setNomineeInput(''); }}
                    style={{ padding: '8px 16px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    {activeReqId === req.id ? 'Đóng' : 'Đề cử người'}
                  </button>
                </div>

                {activeReqId === req.id && (
                  <div style={{ marginTop: 16, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Nhập ID người tham gia</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                      Nhập ID người dùng (phân cách bằng dấu phẩy). VD: 5, 12, 18
                    </div>
                    <input
                      type="text"
                      value={nomineeInput}
                      onChange={e => setNomineeInput(e.target.value)}
                      placeholder="VD: 5, 12, 18"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }}
                    />
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button onClick={() => setActiveReqId(null)}
                        style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}>
                        Hủy
                      </button>
                      <button onClick={() => handleNominate(req.id)} disabled={submitting}
                        style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: submitting ? 0.7 : 1 }}>
                        {submitting ? 'Đang gửi...' : 'Xác nhận đề cử'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {doneReqs.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#374151' }}>Đã xử lý ({doneReqs.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {doneReqs.map(req => (
              <div key={req.id} style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{req.candidateName}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{req.positionTitle} • {formatDateTime(req.startTime)}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, backgroundColor: '#d1fae5', color: '#065f46' }}>
                    {reqStatusLabel[req.status] || req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
