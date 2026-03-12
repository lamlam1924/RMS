import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';

export default function HROfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [toStatusId, setToStatusId] = useState(null);
  const [note, setNote] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ salary: '', benefits: '', startDate: '' });

  useEffect(() => {
    loadOffer();
  }, [id]);

  const loadOffer = async () => {
    try {
      setLoading(true);
      const data = await hrService.offers.getById(id);
      setOffer(data);
    } catch (err) {
      notify.error(err.message || 'Không thể tải thông tin offer');
      navigate('/staff/hr-manager/offers');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!toStatusId) return;
    try {
      setActionLoading(true);
      await hrService.offers.updateStatus(id, toStatusId, note);
      notify.success('Cập nhật trạng thái thành công');
      setShowStatusModal(false);
      setNote('');
      setToStatusId(null);
      loadOffer();
    } catch (err) {
      notify.error(err.message || 'Cập nhật thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      setActionLoading(true);
      await hrService.offers.send(id);
      notify.success('Đã gửi thư mời cho ứng viên');
      loadOffer();
    } catch (err) {
      notify.error(err.message || 'Gửi thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditForm({
      salary: offer.salary?.toString() || '',
      benefits: offer.benefits || '',
      startDate: offer.startDate ? offer.startDate.slice(0, 10) : ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    const salary = parseFloat(editForm.salary) || 0;
    if (!salary || salary <= 0) {
      notify.error('Vui lòng nhập mức lương hợp lệ');
      return;
    }
    const payload = {
      salary,
      benefits: editForm.benefits?.trim() || null,
      startDate: editForm.startDate ? editForm.startDate : null
    };
    try {
      setActionLoading(true);
      if (offer.statusId === 21) {
        await hrService.offers.updateAfterNegotiation(id, payload);
        notify.success('Đã cập nhật và gửi lại thư mời cho ứng viên');
      } else {
        await hrService.offers.update(id, payload);
        notify.success('Đã cập nhật thư mời thành công');
      }
      setShowEditModal(false);
      loadOffer();
    } catch (err) {
      notify.error(err.message || 'Cập nhật thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

  const isHRManager = true; // Có thể lấy từ user context
  const isHRStaff = true;

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (!offer) return null;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <button
        onClick={() => navigate('/staff/hr-manager/offers')}
        style={{
          padding: '8px 16px',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          background: 'white',
          cursor: 'pointer',
          marginBottom: 16
        }}
      >
        ← Quay lại
      </button>

      <div
        style={{
          backgroundColor: 'white',
          padding: 24,
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{offer.candidateName}</h1>
            <p style={{ fontSize: 16, color: '#3b82f6', fontWeight: 500 }}>{offer.positionTitle}</p>
            <p style={{ color: '#6b7280' }}>{offer.departmentName}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {(offer.statusId === 14 || offer.statusId === 15 || offer.statusId === 21) && (
              <button
                onClick={handleEditClick}
                disabled={actionLoading}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #3b82f6',
                  borderRadius: 6,
                  background: 'white',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 14
                }}
              >
                {offer.statusId === 21 ? 'Chỉnh sửa và gửi lại' : 'Chỉnh sửa'}
              </button>
            )}
            <span
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor:
                offer.currentStatus === 'IN_REVIEW'
                  ? '#fef3c7'
                  : offer.currentStatus === 'APPROVED'
                  ? '#dcfce7'
                  : offer.currentStatus === 'SENT'
                  ? '#dbeafe'
                  : offer.currentStatus === 'NEGOTIATING'
                  ? '#ede9fe'
                  : '#f3f4f6',
              color: offer.currentStatus === 'IN_REVIEW' ? '#92400e' : '#374151'
            }}
          >
            {offer.currentStatus}
          </span>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Mức lương</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{formatCurrency(offer.salary)}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Ngày bắt đầu</div>
            <div style={{ fontWeight: 600 }}>{formatDate(offer.startDate)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Ngày tạo</div>
            <div style={{ fontWeight: 600 }}>{formatDate(offer.createdAt)}</div>
          </div>
          {offer.sentAt && (
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Ngày gửi</div>
              <div style={{ fontWeight: 600 }}>{formatDate(offer.sentAt)}</div>
            </div>
          )}
        </div>

        {offer.benefits && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Quyền lợi</div>
            <div style={{ whiteSpace: 'pre-line' }}>{offer.benefits}</div>
          </div>
        )}

        {offer.statusId === 21 && offer.candidateComment && (
          <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#fef3c7', borderRadius: 8, border: '1px solid #f59e0b' }}>
            <div style={{ fontSize: 12, color: '#92400e', marginBottom: 8, fontWeight: 600 }}>Yêu cầu thương lượng của ứng viên</div>
            <div style={{ color: '#78350f', whiteSpace: 'pre-line' }}>{offer.candidateComment}</div>
          </div>
        )}

        {/* Actions - HR Manager: DRAFT hoặc IN_REVIEW có thể duyệt/từ chối */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
          {(offer.statusId === 14 || offer.statusId === 15) && (
            <>
              <button
                onClick={() => { setToStatusId(16); setShowStatusModal(true); }}
                disabled={actionLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Duyệt (Approve)
              </button>
              <button
                onClick={() => { setToStatusId(17); setShowStatusModal(true); }}
                disabled={actionLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Từ chối (Reject)
              </button>
              {offer.statusId === 14 && (
                <button
                  onClick={() => { setToStatusId(15); setShowStatusModal(true); }}
                  disabled={actionLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Gửi duyệt (IN_REVIEW)
                </button>
              )}
            </>
          )}
          {offer.statusId === 16 && (
            <button
              onClick={handleSend}
              disabled={actionLoading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Gửi thư mời cho ứng viên
            </button>
          )}
        </div>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowStatusModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: 24,
              borderRadius: 8,
              width: 400,
              maxWidth: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16 }}>Cập nhật trạng thái</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>Ghi chú (tuỳ chọn)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowStatusModal(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Huỷ
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={actionLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: 24,
              borderRadius: 8,
              width: 440,
              maxWidth: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 20, fontSize: 18 }}>
              {offer.statusId === 21 ? 'Cập nhật thư mời sau thương lượng' : 'Chỉnh sửa thư mời'}
            </h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#374151' }}>Mức lương (VNĐ)</label>
              <input
                type="number"
                value={editForm.salary}
                onChange={(e) => setEditForm((f) => ({ ...f, salary: e.target.value }))}
                placeholder="VD: 20000000"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                min={0}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#374151' }}>Ngày bắt đầu</label>
              <input
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#374151' }}>Quyền lợi (tuỳ chọn)</label>
              <textarea
                value={editForm.benefits}
                onChange={(e) => setEditForm((f) => ({ ...f, benefits: e.target.value }))}
                placeholder="Nhập quyền lợi..."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Huỷ
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={actionLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                {actionLoading ? 'Đang xử lý...' : offer.statusId === 21 ? 'Cập nhật và gửi lại' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
