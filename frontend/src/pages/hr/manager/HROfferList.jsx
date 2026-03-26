import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { authService } from '../../../services/authService';
import notify from '../../../utils/notification';
import { 
  Plus, 
  Search, 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  Send,
  Inbox,
  Edit
} from 'lucide-react';

/**
 * HROfferList - Trang quản lý Job Offers cho HR Staff
 * Hiển thị offers với các tab: Tất cả, Chờ duyệt, Đã chấp nhận, Đã từ chối, Đang thương lượng
 */
export default function HROfferList() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [stats, setStats] = useState({
    all: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    negotiating: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sending, setSending] = useState(false);

  const isHRStaff = authService.getUserInfo()?.roles?.includes('HR_STAFF');
  const isHRManager = authService.getUserInfo()?.roles?.includes('HR_MANAGER');

  useEffect(() => {
    loadOffers();
  }, [filter]);

  useEffect(() => {
    loadStatsSource();
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filter]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      let data;
      switch (filter) {
        case 'pending':
          data = await hrService.offers.getPending();
          break;
        case 'accepted':
          if (isHRStaff) {
            data = await hrService.offers.getAcceptedForStaff();
          } else if (isHRManager) {
            data = await hrService.offers.getAcceptedForManager();
          } else {
            data = [];
          }
          break;
        case 'declined':
          data = await hrService.offers.getDeclined();
          break;
        case 'negotiating':
          data = await hrService.offers.getNegotiating();
          break;
        default:
          data = await hrService.offers.getAll();
      }
      setOffers(data || []);
    } catch (error) {
      console.error('Failed to load offers:', error);
      notify.error(error.message || 'Không thể tải danh sách offers');
    } finally {
      setLoading(false);
    }
  };

  const loadStatsSource = async () => {
    try {
      const acceptedPromise = isHRStaff
        ? hrService.offers.getAcceptedForStaff()
        : hrService.offers.getAcceptedForManager();

      const [all, pending, accepted, declined, negotiating] = await Promise.all([
        hrService.offers.getAll(),
        hrService.offers.getPending(),
        acceptedPromise,
        hrService.offers.getDeclined(),
        hrService.offers.getNegotiating()
      ]);

      setStats({
        all: (all || []).length,
        pending: (pending || []).length,
        accepted: (accepted || []).length,
        declined: (declined || []).length,
        negotiating: (negotiating || []).length
      });
    } catch (error) {
      console.error('Failed to load offers for stats:', error);
      setStats({ all: 0, pending: 0, accepted: 0, declined: 0, negotiating: 0 });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOffers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOffers.map(o => o.id)));
    }
  };

  const handleSendToManager = async () => {
    if (selectedIds.size === 0) {
      notify.warning('Vui lòng chọn ít nhất một thư mời');
      return;
    }
    try {
      setSending(true);
      const type = filter === 'accepted' ? 'accepted' : 'declined';
      const result = await hrService.offers.sendOffersToManager(Array.from(selectedIds), type);
      notify.success(result?.message || 'Đã gửi danh sách cho HR Manager');
      setSelectedIds(new Set());
      loadOffers();
      loadStatsSource();
    } catch (err) {
      notify.error(err.message || 'Gửi thất bại');
    } finally {
      setSending(false);
    }
  };

  const getStatusLabel = (status, statusId) => {
    const mapById = {
      14: 'Nháp',
      15: 'Chờ duyệt',
      16: 'Đã duyệt',
      18: 'Đã gửi',
      19: 'Đã chấp nhận',
      20: 'Đã từ chối',
      21: 'Đang thương lượng'
    };
    if (mapById[statusId]) return mapById[statusId];
    const map = {
      'DRAFT': 'Nháp',
      'IN_REVIEW': 'Chờ duyệt',
      'APPROVED': 'Đã duyệt',
      'SENT': 'Đã gửi',
      'ACCEPTED': 'Đã chấp nhận',
      'DECLINED': 'Đã từ chối',
      'NEGOTIATING': 'Đang thương lượng'
    };
    return map[status] || status;
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
    const style = styleByStatusId[statusId] || { bg: '#f3f4f6', color: '#374151' };

    return (
      <span style={{
        padding: '6px 14px',
        borderRadius: 16,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color
      }}>
        {getStatusLabel(status, statusId)}
      </span>
    );
  };

  // Filter offers based on search term
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      const matchesSearch = 
        offer.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.positionTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.id?.toString().includes(searchTerm);
      return matchesSearch;
    });
  }, [offers, searchTerm]);

  if (isHRManager) {
    return <Navigate to="/staff/hr-manager/accepted-edited-offers" replace />;
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                padding: 10,
                backgroundColor: '#10b981',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Briefcase style={{ width: 24, height: 24, color: 'white' }} />
              </div>
              <span style={{
                color: '#10b981',
                fontWeight: 700,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                HR Staff Portal
              </span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Job Offers
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              Quản lý thư mời nhận việc và theo dõi phản hồi ứng viên
            </p>
          </div>
          <button
            onClick={() => navigate('/staff/hr-manager/offers/create')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            <Plus style={{ width: 18, height: 18 }} />
            Tạo Offer mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 12,
          border: filter === 'all' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onClick={() => setFilter('all')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ padding: 8, backgroundColor: '#dbeafe', borderRadius: 8 }}>
              <Inbox style={{ width: 20, height: 20, color: '#3b82f6' }} />
            </div>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Tất cả</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{stats.all}</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 12,
          border: filter === 'pending' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onClick={() => setFilter('pending')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ padding: 8, backgroundColor: '#fef3c7', borderRadius: 8 }}>
              <Clock style={{ width: 20, height: 20, color: '#f59e0b' }} />
            </div>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Chờ duyệt</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{stats.pending}</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 12,
          border: filter === 'accepted' ? '2px solid #10b981' : '1px solid #e5e7eb',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onClick={() => setFilter('accepted')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ padding: 8, backgroundColor: '#d1fae5', borderRadius: 8 }}>
              <CheckCircle style={{ width: 20, height: 20, color: '#10b981' }} />
            </div>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Đã chấp nhận</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{stats.accepted}</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 12,
          border: filter === 'declined' ? '2px solid #ef4444' : '1px solid #e5e7eb',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onClick={() => setFilter('declined')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 }}>
              <XCircle style={{ width: 20, height: 20, color: '#ef4444' }} />
            </div>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Đã từ chối</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{stats.declined}</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 12,
          border: filter === 'negotiating' ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onClick={() => setFilter('negotiating')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ padding: 8, backgroundColor: '#ede9fe', borderRadius: 8 }}>
              <MessageSquare style={{ width: 20, height: 20, color: '#8b5cf6' }} />
            </div>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Đang thương lượng</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6' }}>{stats.negotiating}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 20,
            height: 20,
            color: '#9ca3af'
          }} />
          <input
            type="text"
            placeholder="Tìm kiếm ứng viên, vị trí, mã offer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 48,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#111827'
            }}
          />
        </div>
      </div>

      {/* Action bar for Accepted/Declined tabs - HR Staff only */}
      {(filter === 'accepted' || filter === 'declined') && isHRStaff && filteredOffers.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: 16,
          backgroundColor: 'white',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          marginBottom: 16
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={selectedIds.size === filteredOffers.length && filteredOffers.length > 0}
              onChange={toggleSelectAll}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            Chọn tất cả ({filteredOffers.length})
          </label>
          <button
            onClick={handleSendToManager}
            disabled={sending || selectedIds.size === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              backgroundColor: selectedIds.size > 0 && !sending ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: selectedIds.size > 0 && !sending ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            <Send style={{ width: 16, height: 16 }} />
            {sending ? 'Đang gửi...' : `Gửi cho HR Manager (${selectedIds.size})`}
          </button>
          {selectedIds.size > 0 && (
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              Đã chọn {selectedIds.size} offer
            </span>
          )}
        </div>
      )}

      {/* Offers List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 16, color: '#6b7280' }}>Đang tải...</div>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: 60,
          textAlign: 'center',
          borderRadius: 12,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
            Chưa có offer nào
          </div>
          <div style={{ color: '#6b7280', marginBottom: 16, fontSize: 14 }}>
            {searchTerm ? 'Không tìm thấy offer phù hợp' : 
             filter === 'pending' ? 'Không có offer chờ duyệt' :
             filter === 'accepted' ? 'Chưa có ứng viên nào chấp nhận offer' :
             filter === 'declined' ? 'Chưa có ứng viên nào từ chối offer' :
             filter === 'negotiating' ? 'Chưa có offer nào đang thương lượng' :
             'Chưa có offer nào trong hệ thống'}
          </div>
          {filter === 'all' && !searchTerm && (
            <button
              onClick={() => navigate('/staff/hr-manager/offers/create')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              Tạo Offer đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              filter={filter}
              isHRStaff={isHRStaff}
              selectedIds={selectedIds}
              toggleSelect={toggleSelect}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// OfferCard Component
function OfferCard({ 
  offer, 
  filter, 
  isHRStaff, 
  selectedIds, 
  toggleSelect, 
  formatCurrency, 
  formatDate, 
  getStatusBadge, 
  navigate 
}) {
  const showCheckbox = (filter === 'accepted' || filter === 'declined') && isHRStaff;
  const showEditButton = filter === 'negotiating' && isHRStaff;

  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onClick={(e) => {
        if (e.target.type !== 'checkbox' && e.target.tagName !== 'BUTTON') {
          navigate(`/staff/hr-manager/offers/${offer.id}`);
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Checkbox for Accepted/Declined tabs */}
      {showCheckbox && (
        <div style={{ marginBottom: 12 }} onClick={(e) => e.stopPropagation()}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedIds.has(offer.id)}
              onChange={() => toggleSelect(offer.id)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Chọn offer này</span>
          </label>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
            {offer.candidateName}
          </div>
          <div style={{ fontSize: 15, color: '#3b82f6', fontWeight: 500, marginBottom: 4 }}>
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

      {/* Salary Info */}
      <div style={{
        padding: 16,
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        marginBottom: 16
      }}>
        <div style={{ fontSize: 12, color: '#166534', marginBottom: 4, fontWeight: 600 }}>
          Mức lương đề nghị
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#10b981' }}>
          {formatCurrency(offer.salary)}
        </div>
      </div>

      {/* Offer Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 16
      }}>
        {offer.startDate && (
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Ngày bắt đầu</div>
            <div style={{ fontWeight: 600, color: '#111827' }}>{formatDate(offer.startDate)}</div>
          </div>
        )}
        {offer.probationPeriod && (
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Thời gian thử việc</div>
            <div style={{ fontWeight: 600, color: '#111827' }}>{offer.probationPeriod} tháng</div>
          </div>
        )}
        {offer.createdAt && (
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Ngày tạo</div>
            <div style={{ fontWeight: 600, color: '#111827' }}>{formatDate(offer.createdAt)}</div>
          </div>
        )}
      </div>

      {/* Candidate Comment for Negotiating */}
      {filter === 'negotiating' && offer.candidateComment && (
        <div style={{
          padding: 12,
          backgroundColor: '#fef3c7',
          borderRadius: 8,
          marginBottom: 16
        }}>
          <div style={{ fontSize: 12, color: '#92400e', marginBottom: 4, fontWeight: 600 }}>
            💬 Yêu cầu thương lượng từ ứng viên:
          </div>
          <div style={{ fontSize: 14, color: '#78350f', fontWeight: 500 }}>
            {offer.candidateComment}
          </div>
        </div>
      )}

      {/* Benefits */}
      {offer.benefits && (
        <div style={{
          padding: 12,
          backgroundColor: '#f9fafb',
          borderRadius: 8,
          fontSize: 13,
          color: '#374151',
          marginBottom: 16
        }}>
          <span style={{ fontWeight: 600 }}>Phúc lợi:</span> {offer.benefits}
        </div>
      )}

      {/* Action Buttons for Negotiating */}
      {showEditButton && (
        <div style={{ display: 'flex', gap: 12 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/staff/hr-manager/offers/${offer.id}`)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            <Edit style={{ width: 16, height: 16 }} />
            Chỉnh sửa Offer
          </button>
        </div>
      )}

      {/* Status Indicators */}
      {offer.currentStatus === 'IN_REVIEW' && (
        <div style={{
          padding: '10px 16px',
          backgroundColor: '#fef3c7',
          borderRadius: 8,
          fontSize: 13,
          color: '#92400e',
          textAlign: 'center',
          fontWeight: 500
        }}>
          ⏰ Đang chờ duyệt
        </div>
      )}
      {(offer.currentStatus === 'SENT' || offer.statusId === 18) && (
        <div style={{
          padding: '10px 16px',
          backgroundColor: '#dbeafe',
          borderRadius: 8,
          fontSize: 13,
          color: '#1e40af',
          textAlign: 'center',
          fontWeight: 500
        }}>
          📧 Đã gửi - Đang chờ phản hồi ứng viên
        </div>
      )}
      {(offer.currentStatus === 'ACCEPTED' || offer.statusId === 19) && !showCheckbox && (
        <div style={{
          padding: '10px 16px',
          backgroundColor: '#d1fae5',
          borderRadius: 8,
          fontSize: 13,
          color: '#065f46',
          textAlign: 'center',
          fontWeight: 500
        }}>
          ✅ Ứng viên đã chấp nhận thư mời
        </div>
      )}
      {(offer.currentStatus === 'DECLINED' || offer.statusId === 20) && !showCheckbox && (
        <div style={{
          padding: '10px 16px',
          backgroundColor: '#fee2e2',
          borderRadius: 8,
          fontSize: 13,
          color: '#991b1b',
          textAlign: 'center',
          fontWeight: 500
        }}>
          ❌ Ứng viên đã từ chối thư mời
        </div>
      )}
      {(offer.statusId === 21 || offer.currentStatus === 'NEGOTIATING') && !showEditButton && (
        <div style={{
          padding: '10px 16px',
          backgroundColor: '#ede9fe',
          borderRadius: 8,
          fontSize: 13,
          color: '#5b21b6',
          textAlign: 'center',
          fontWeight: 500
        }}>
          💬 Ứng viên yêu cầu thương lượng
        </div>
      )}
    </div>
  );
}
