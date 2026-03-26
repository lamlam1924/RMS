import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';

export default function HRManagerAcceptedEditedOffers() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('accepted'); // 'accepted' | 'edited' | 'pending'
  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [editedOffers, setEditedOffers] = useState([]);
  const [pendingOffers, setPendingOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (tab === 'accepted') {
        const data = await hrService.offers.getAcceptedForManager();
        setAcceptedOffers(data);
      } else if (tab === 'pending') {
        const data = await hrService.offers.getPendingHRManager();
        setPendingOffers(data);
      } else {
        const data = await hrService.offers.getEdited();
        setEditedOffers(data);
      }
    } catch (error) {
      console.error('Failed to load offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status, statusId) => {
    const styleByStatusId = {
      14: { bg: '#f3f4f6', color: '#374151' },
      15: { bg: '#fef3c7', color: '#92400e' },
      16: { bg: '#dcfce7', color: '#166534' },
      18: { bg: '#dbeafe', color: '#1e40af' },
      19: { bg: '#d1fae5', color: '#065f46' },
      20: { bg: '#fee2e2', color: '#991b1b' },
      21: { bg: '#ede9fe', color: '#5b21b6' }
    };
    const mapById = {
      14: 'Nháp',
      15: 'Chờ duyệt',
      16: 'Đã duyệt',
      18: 'Đã gửi',
      19: 'Đã chấp nhận',
      20: 'Đã từ chối',
      21: 'Đang thương lượng'
    };
    const style = styleByStatusId[statusId] || { bg: '#f3f4f6', color: '#374151' };
    const label = mapById[statusId] || status;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: 16,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color
      }}>
        {label}
      </span>
    );
  };

  const offers = tab === 'accepted' ? acceptedOffers : tab === 'pending' ? pendingOffers : editedOffers;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Ứng viên đã chấp nhận & Offer đã chỉnh sửa
        </h1>
        <p style={{ color: '#6b7280' }}>
          Xem danh sách ứng viên đã đồng ý thư mời và các offer đã được chỉnh sửa
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => setTab('accepted')}
          style={{
            padding: '8px 16px',
            backgroundColor: tab === 'accepted' ? '#10b981' : 'white',
            color: tab === 'accepted' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Ứng viên đã chấp nhận
        </button>
        <button
          onClick={() => setTab('pending')}
          style={{
            padding: '8px 16px',
            backgroundColor: tab === 'pending' ? '#059669' : 'white',
            color: tab === 'pending' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Chờ chuyển giám đốc
        </button>
        <button
          onClick={() => setTab('edited')}
          style={{
            padding: '8px 16px',
            backgroundColor: tab === 'edited' ? '#3b82f6' : 'white',
            color: tab === 'edited' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Offer đã chỉnh sửa
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : offers.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: 40,
          textAlign: 'center',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Chưa có dữ liệu</div>
          <div style={{ color: '#6b7280' }}>
            {tab === 'accepted' && 'Chưa có ứng viên nào chấp nhận thư mời'}
            {tab === 'pending' && 'Chưa có offer nào chờ chuyển giám đốc'}
            {tab === 'edited' && 'Chưa có offer nào được chỉnh sửa'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {offers.map((offer) => (
            <div
              key={offer.id}
              onClick={() => navigate(`/staff/hr-manager/offers/${offer.id}`)}
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                    {offer.candidateName}
                  </div>
                  <div style={{ fontSize: 14, color: '#3b82f6', fontWeight: 500, marginBottom: 4 }}>
                    {offer.positionTitle}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {offer.departmentName}
                  </div>
                </div>
                <div>
                  {getStatusBadge(offer.currentStatus, offer.statusId)}
                </div>
              </div>

              <div style={{
                padding: 16,
                backgroundColor: '#f0fdf4',
                borderRadius: 8,
                marginBottom: 12
              }}>
                <div style={{ fontSize: 12, color: '#166534', marginBottom: 4 }}>Mức lương đề xuất</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
                  {formatCurrency(offer.salary)}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16
              }}>
                {offer.startDate && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Ngày bắt đầu</div>
                    <div style={{ fontWeight: 600 }}>{formatDate(offer.startDate)}</div>
                  </div>
                )}
                {offer.createdAt && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Ngày tạo</div>
                    <div style={{ fontWeight: 500 }}>{formatDate(offer.createdAt)}</div>
                  </div>
                )}
                {(tab === 'edited' || tab === 'pending') && offer.updatedAt && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Chỉnh sửa lúc</div>
                    <div style={{ fontWeight: 500, color: '#3b82f6' }}>{formatDate(offer.updatedAt)}</div>
                  </div>
                )}
              </div>

              {offer.benefits && (
                <div style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#374151'
                }}>
                  <span style={{ fontWeight: 600 }}>Phúc lợi:</span> {offer.benefits}
                </div>
              )}

              {tab === 'pending' && (offer.statusId === 24) && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  backgroundColor: '#d1fae5',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#065f46',
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  📤 Nhấn vào để xem chi tiết và gửi giám đốc duyệt
                </div>
              )}
              {tab === 'accepted' && (offer.currentStatus === 'ACCEPTED' || offer.statusId === 19) && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  backgroundColor: '#d1fae5',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#065f46',
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  ✅ Ứng viên đã chấp nhận thư mời
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
