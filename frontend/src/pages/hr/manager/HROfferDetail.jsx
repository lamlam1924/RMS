import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { authService } from '../../../services/authService';
import notify from '../../../utils/notification';

export default function HROfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ salary: '', benefits: '', startDate: '' });

  const userInfo = authService.getUserInfo();
  const roles = userInfo?.roles || [];
  const isHRManager = roles.includes('HR_MANAGER');
  const isHRStaff = roles.includes('HR_STAFF');

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

  const handleSaveOnly = async () => {
    const salary = parseFloat(editForm.salary) || 0;
    if (!salary || salary <= 0) {
      notify.error('Vui lòng nhập mức lương hợp lệ');
      return;
    }
    const payload = {
      salary,
      benefits: editForm.benefits?.trim() || null,
      startDate: editForm.startDate || null
    };
    try {
      setActionLoading(true);
      await hrService.offers.saveInNegotiation(id, payload);
      notify.success('Đã lưu thay đổi và lịch sử chỉnh sửa');
      setShowEditModal(false);
      loadOffer();
    } catch (err) {
      notify.error(err.message || 'Lưu thất bại');
    } finally {
      setActionLoading(false);
    }
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

  const handleSubmitToManager = async () => {
    try {
      setActionLoading(true);
      await hrService.offers.submitToManager(id);
      notify.success('Đã gửi cho HR Manager.');
      loadOffer();
    } catch (err) {
      notify.error(err.message || 'Gửi thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForwardToDirector = async () => {
    try {
      setActionLoading(true);
      await hrService.offers.forwardToDirector(id);
      notify.success('Đã chuyển giám đốc duyệt.');
      loadOffer();
    } catch (err) {
      notify.error(err.message || 'Chuyển thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (!offer) return null;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <button
        onClick={() => navigate(isHRManager ? '/staff/hr-manager/accepted-edited-offers' : '/staff/hr-manager/offers')}
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
            {(offer.statusId === 14 || offer.statusId === 15 || offer.statusId === 21 || offer.statusId === 24) && (isHRManager || isHRStaff) && (
              <>
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
                  {offer.statusId === 21 ? 'Chỉnh sửa' : 'Chỉnh sửa'}
                </button>
                {offer.statusId === 21 && (
                  <button
                    onClick={handleSubmitToManager}
                    disabled={actionLoading}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #8b5cf6',
                      borderRadius: 6,
                      background: '#8b5cf6',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: 14
                    }}
                  >
                    Gửi cho HR Manager
                  </button>
                )}
                {offer.statusId === 24 && isHRManager && (
                  <button
                    onClick={handleForwardToDirector}
                    disabled={actionLoading}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #059669',
                      borderRadius: 6,
                      background: '#059669',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: 14
                    }}
                  >
                    Gửi giám đốc duyệt
                  </button>
                )}
              </>
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
                  : offer.statusId === 24 || offer.currentStatus === 'PENDING_HR_MANAGER'
                  ? '#d1fae5'
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

        {offer.editHistory && offer.editHistory.length > 0 && (
          <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Lịch sử chỉnh sửa</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {offer.editHistory.map((h, i) => (
                <div key={h.id} style={{ padding: 12, backgroundColor: 'white', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{h.editedByName}</span>
                    <span style={{ color: '#6b7280' }}>{formatDate(h.editedAt)}</span>
                  </div>
                  <div style={{ color: '#374151' }}>
                    {h.salary != null && <span>Lương: {formatCurrency(h.salary)}</span>}
                    {h.benefits && <span> • Quyền lợi: {h.benefits}</span>}
                    {h.startDate && <span> • Ngày bắt đầu: {formatDate(h.startDate)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions - Gửi cho ứng viên: chỉ khi DRAFT (14) hoặc đã được Giám đốc duyệt (16). Không hiện khi IN_REVIEW (15) - đang chờ Giám đốc */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
          {(offer.statusId === 14 || offer.statusId === 16) && (isHRManager || isHRStaff) && (
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
          {offer.statusId === 24 && isHRManager && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#d1fae5',
              borderRadius: 6,
              fontSize: 14,
              color: '#065f46',
              fontWeight: 500
            }}>
              📤 HR Staff đã gửi. Nhấn &quot;Gửi giám đốc duyệt&quot; để chuyển cho Giám đốc.
            </div>
          )}
          {offer.statusId === 24 && isHRStaff && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fef3c7',
              borderRadius: 6,
              fontSize: 14,
              color: '#92400e',
              fontWeight: 500
            }}>
              ⏳ Đã gửi HR Manager. Đang chờ HR Manager chuyển giám đốc duyệt.
            </div>
          )}
          {offer.statusId === 15 && (isHRManager || isHRStaff) && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fef3c7',
              borderRadius: 6,
              fontSize: 14,
              color: '#92400e',
              fontWeight: 500
            }}>
              ⏳ Đang chờ Giám đốc duyệt. Sau khi duyệt mới có thể gửi thư mời cho ứng viên.
            </div>
          )}
        </div>
      </div>

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
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
              {offer.statusId === 21 && (
                <button
                  onClick={handleSaveOnly}
                  disabled={actionLoading}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #8b5cf6',
                    borderRadius: 6,
                    background: 'white',
                    color: '#8b5cf6',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  {actionLoading ? 'Đang xử lý...' : 'Lưu'}
                </button>
              )}
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
                {actionLoading ? 'Đang xử lý...' : offer.statusId === 21 ? 'Gửi lại cho ứng viên' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
