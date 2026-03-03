import React, { useState, useEffect } from 'react';
import hrService from '../../../services/hrService';
import { formatDate } from '../../../utils/formatters/display';
import { toast } from '../../../utils';
import notify from '../../../utils/notification';
import { Briefcase } from 'lucide-react';

/**
 * HR Manager — Quản lý Tin tuyển dụng
 * Chức năng: Xem tổng quan + Đóng tin PUBLISHED
 * KHÔNG gán staff ở đây (gán ở trang "Yêu cầu Tuyển dụng" khi request = APPROVED)
 */

const STATUS_TABS = [
  { id: 'all',       label: 'Tất cả' },
  { id: 'DRAFT',     label: 'Nháp' },
  { id: 'PUBLISHED', label: 'Đang đăng' },
  { id: 'CLOSED',    label: 'Đã đóng' },
];

const STATUS_LABEL = {
  DRAFT:     'Nháp',
  PUBLISHED: 'Đang tuyển',
  CLOSED:    'Đã đóng',
};

const STATUS_STYLE = {
  PUBLISHED: { bg: '#dcfce7', color: '#16a34a' },
  CLOSED:    { bg: '#fee2e2', color: '#dc2626' },
  DRAFT:     { bg: '#f3f4f6', color: '#6b7280' },
};

export default function HRManagerJobPostingList() {
  const [postings, setPostings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [closing, setClosing]     = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const data = await hrService.jobPostings.getAll();
      setPostings(data || []);
    } catch {
      toast.error('Không thể tải danh sách tin tuyển dụng');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (posting, e) => {
    e.stopPropagation();
    try {
      setLoadingDetail(true);
      const detail = await hrService.jobPostings.getById(posting.id);
      setSelectedPosting(detail);
      setShowDetailModal(true);
    } catch (err) {
      notify.error('Không thể tải chi tiết tin tuyển dụng');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleClose = async (id, title, e) => {
    e.stopPropagation();
    
    notify.confirm(
      'Đóng tin: ' + title + '?',
      async () => {
        try {
          setClosing(id);
          await hrService.jobPostings.close(id, 'Đóng bởi HR Manager');
          toast.success('Đã đóng tin tuyển dụng');
          await loadAll();
        } catch (err) {
          toast.error('Không thể đóng: ' + (err.message || 'Lỗi không xác định'));
        } finally {
          setClosing(null);
        }
      }
    );
  };

  const filtered = activeTab === 'all'
    ? postings
    : postings.filter(p => p.currentStatus === activeTab);

  const count = (s) => postings.filter(p => p.currentStatus === s).length;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>
          Tin tuyển dụng
        </h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
          Theo dõi toàn bộ tin tuyển dụng — đóng tin khi hoàn tất tuyển chọn
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tổng tin',   value: postings.length,    color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Đang đăng',  value: count('PUBLISHED'), color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Đã đóng',    value: count('CLOSED'),    color: '#dc2626', bg: '#fef2f2' },
          { label: 'Tin nháp',   value: count('DRAFT'),     color: '#f59e0b', bg: '#fef3c7' },
        ].map(card => (
          <div key={card.label} style={{
            backgroundColor: card.bg, borderRadius: 10, padding: '16px 20px',
            border: '1px solid ' + card.color + '22'
          }}>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{card.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: card.color, margin: '4px 0 0' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {STATUS_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 0',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              color:  activeTab === tab.id ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === tab.id ? 600 : 400,
              background: 'none', cursor: 'pointer', fontSize: 14,
            }}>
              {tab.label}
              {tab.id !== 'all' && (
                <span style={{
                  marginLeft: 6, fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 10,
                  backgroundColor: activeTab === tab.id ? '#dbeafe' : '#f3f4f6',
                  color: activeTab === tab.id ? '#3b82f6' : '#9ca3af',
                }}>
                  {count(tab.id)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          backgroundColor: 'white', borderRadius: 10, padding: 48,
          textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <Briefcase size={40} style={{ marginBottom: 12, opacity: 0.3, color: '#9ca3af' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: 0 }}>
            Không có tin tuyển dụng nào
          </p>
          <p style={{ fontSize: 14, color: '#9ca3af', marginTop: 8 }}>
            Khi HR Staff tạo tin từ yêu cầu đã được phê duyệt, tin sẽ xuất hiện ở đây
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                {['Tiêu đề', 'Vị trí / Phòng ban', 'Trạng thái', 'Ứng viên', 'Nhân viên phụ trách', 'Ngày tạo', 'Thao tác'].map(h => (
                  <th key={h} style={{
                    padding: '12px 20px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const sc = STATUS_STYLE[p.currentStatus] || STATUS_STYLE.DRAFT;
                return (
                  <tr
                    key={p.id}
                    style={{ borderTop: '1px solid #f3f4f6' }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>#{p.id}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontSize: 14, color: '#374151' }}>{p.positionTitle}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{p.departmentName}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        backgroundColor: sc.bg, color: sc.color,
                      }}>
                        {STATUS_LABEL[p.currentStatus] || p.currentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>
                          {p.applicationCount || 0}
                        </span>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>hồ sơ</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {p.assignedStaffName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            backgroundColor: '#dbeafe', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: '#3b82f6',
                          }}>
                            {p.assignedStaffName.charAt(0)}
                          </div>
                          <span style={{ fontSize: 14, color: '#374151' }}>{p.assignedStaffName}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#9ca3af', fontSize: 13 }}>
                      {formatDate(p.createdAt)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={(e) => handleViewDetail(p, e)}
                          disabled={loadingDetail}
                          style={{
                            padding: '6px 12px',
                            border: '1px solid #3b82f6',
                            borderRadius: 6,
                            backgroundColor: 'white',
                            color: '#3b82f6',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: loadingDetail ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Xem chi tiết
                        </button>
                        {p.currentStatus === 'PUBLISHED' && (
                          <button
                            onClick={(e) => handleClose(p.id, p.title, e)}
                            disabled={closing === p.id}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid ' + (closing === p.id ? '#d1d5db' : '#ef4444'),
                              borderRadius: 6, backgroundColor: 'white',
                              color: closing === p.id ? '#9ca3af' : '#ef4444',
                              fontSize: 13,
                              cursor: closing === p.id ? 'not-allowed' : 'pointer',
                            }}>
                            {closing === p.id ? 'Đang đóng...' : 'Đóng tin'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPosting && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white', borderRadius: 16, maxWidth: 900,
              width: '100%', maxHeight: '90vh', overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '24px 32px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
                  {selectedPosting.title}
                </h2>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    backgroundColor: STATUS_STYLE[selectedPosting.currentStatus]?.bg || '#f3f4f6',
                    color: STATUS_STYLE[selectedPosting.currentStatus]?.color || '#6b7280',
                  }}>
                    {STATUS_LABEL[selectedPosting.currentStatus] || selectedPosting.currentStatus}
                  </span>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>#{selectedPosting.id}</span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '8px 12px', border: 'none', borderRadius: 8,
                  backgroundColor: '#f3f4f6', color: '#6b7280',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '32px' }}>
              {/* Info Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 24, marginBottom: 32,
              }}>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>
                    VỊ TRÍ
                  </div>
                  <div style={{ fontSize: 15, color: '#111827', fontWeight: 600 }}>
                    {selectedPosting.positionTitle}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>
                    PHÒNG BAN
                  </div>
                  <div style={{ fontSize: 15, color: '#111827', fontWeight: 600 }}>
                    {selectedPosting.departmentName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>
                    SỐ LƯỢNG TUYỂN
                  </div>
                  <div style={{ fontSize: 15, color: '#111827', fontWeight: 600 }}>
                    {selectedPosting.quantity} người
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>
                    SỐ ỨNG VIÊN
                  </div>
                  <div style={{ fontSize: 20, color: '#3b82f6', fontWeight: 700 }}>
                    {selectedPosting.applicationCount || 0} hồ sơ
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>
                    NHÂN VIÊN PHỤ TRÁCH
                  </div>
                  <div style={{ fontSize: 15, color: '#111827', fontWeight: 600 }}>
                    {selectedPosting.assignedStaffName || '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>
                    DEADLINE
                  </div>
                  <div style={{ fontSize: 15, color: '#111827', fontWeight: 600 }}>
                    {selectedPosting.deadline ? formatDate(selectedPosting.deadline) : '-'}
                  </div>
                </div>
              </div>

              {/* Description Sections */}
              {selectedPosting.description && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                    Mô tả công việc
                  </h3>
                  <div
                    style={{
                      fontSize: 14, color: '#374151', lineHeight: 1.6,
                      padding: 16, backgroundColor: '#f9fafb', borderRadius: 8,
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedPosting.description }}
                  />
                </div>
              )}

              {selectedPosting.requirements && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                    Yêu cầu
                  </h3>
                  <div
                    style={{
                      fontSize: 14, color: '#374151', lineHeight: 1.6,
                      padding: 16, backgroundColor: '#f9fafb', borderRadius: 8,
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedPosting.requirements }}
                  />
                </div>
              )}

              {selectedPosting.benefits && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                    Quyền lợi
                  </h3>
                  <div
                    style={{
                      fontSize: 14, color: '#374151', lineHeight: 1.6,
                      padding: 16, backgroundColor: '#f9fafb', borderRadius: 8,
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedPosting.benefits }}
                  />
                </div>
              )}

              {(selectedPosting.salaryMin || selectedPosting.salaryMax) && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                    Mức lương
                  </h3>
                  <div style={{
                    fontSize: 18, color: '#10b981', fontWeight: 700,
                    padding: 16, backgroundColor: '#f0fdf4', borderRadius: 8,
                  }}>
                    {selectedPosting.salaryMin && selectedPosting.salaryMax
                      ? `${selectedPosting.salaryMin.toLocaleString()} - ${selectedPosting.salaryMax.toLocaleString()} VNĐ`
                      : selectedPosting.salaryMin
                        ? `Từ ${selectedPosting.salaryMin.toLocaleString()} VNĐ`
                        : `Tới ${selectedPosting.salaryMax.toLocaleString()} VNĐ`
                    }
                  </div>
                </div>
              )}

              {selectedPosting.location && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                    Địa điểm làm việc
                  </h3>
                  <div style={{
                    fontSize: 14, color: '#374151',
                    padding: 16, backgroundColor: '#f9fafb', borderRadius: 8,
                  }}>
                    {selectedPosting.location}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
