import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';
import { Briefcase, Search, Clock, CheckCircle, FileText } from 'lucide-react';

/**
 * HRStaffJobRequestList - Trang danh sách yêu cầu tuyển dụng cho HR Staff
 * Hiển thị các Job Request đã được APPROVED và được gán cho HR Staff
 */
export default function HRStaffJobRequestList() {
  const navigate = useNavigate();
  const [jobRequests, setJobRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadJobRequests();
  }, []);

  const loadJobRequests = async () => {
    try {
      setLoading(true);
      const data = await hrService.jobRequests.getApprovedForMe();
      setJobRequests(data || []);
    } catch (error) {
      console.error('Failed to load job requests:', error);
      notify.error(error.message || 'Không thể tải danh sách yêu cầu tuyển dụng');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getPriorityLabel = (priority) => {
    const map = {
      1: '🔥 Khẩn cấp',
      2: '⚡ Cao',
      3: 'Bình thường'
    };
    return map[priority] || 'Bình thường';
  };

  const getPriorityColor = (priority) => {
    const map = {
      1: { bg: '#fee2e2', color: '#991b1b' },
      2: { bg: '#fef3c7', color: '#92400e' },
      3: { bg: '#f3f4f6', color: '#374151' }
    };
    return map[priority] || { bg: '#f3f4f6', color: '#374151' };
  };

  // Filter job requests based on search term
  const filteredRequests = jobRequests.filter(req => {
    const matchesSearch = 
      req.positionTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id?.toString().includes(searchTerm);
    
    return matchesSearch;
  });

  const handleCardClick = (id) => {
    navigate(`/staff/hr-staff/job-requests/${id}`);
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                padding: 10,
                backgroundColor: '#3b82f6',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Briefcase style={{ width: 24, height: 24, color: 'white' }} />
              </div>
              <span style={{
                color: '#3b82f6',
                fontWeight: 700,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                HR Staff Portal
              </span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Yêu cầu Tuyển dụng
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              Quản lý các yêu cầu tuyển dụng được gán cho bạn
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              padding: 8,
              backgroundColor: '#dbeafe',
              borderRadius: 8
            }}>
              <FileText style={{ width: 20, height: 20, color: '#3b82f6' }} />
            </div>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Tổng số</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>
            {jobRequests.length}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              padding: 8,
              backgroundColor: '#dcfce7',
              borderRadius: 8
            }}>
              <CheckCircle style={{ width: 20, height: 20, color: '#10b981' }} />
            </div>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Đã duyệt</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>
            {jobRequests.length}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              padding: 8,
              backgroundColor: '#fee2e2',
              borderRadius: 8
            }}>
              <Clock style={{ width: 20, height: 20, color: '#ef4444' }} />
            </div>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Khẩn cấp</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>
            {jobRequests.filter(r => r.priority === 1).length}
          </div>
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
            placeholder="Tìm kiếm vị trí, bộ phận, mã yêu cầu..."
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

      {/* Job Requests List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 16, color: '#6b7280' }}>Đang tải...</div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: 60,
          textAlign: 'center',
          borderRadius: 12,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
            Chưa có yêu cầu nào
          </div>
          <div style={{ color: '#6b7280', fontSize: 14 }}>
            {searchTerm ? 'Không tìm thấy yêu cầu phù hợp' : 'Chưa có yêu cầu tuyển dụng nào được gán cho bạn'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredRequests.map((request) => {
            const priorityStyle = getPriorityColor(request.priority);
            return (
              <div
                key={request.id}
                onClick={() => handleCardClick(request.id)}
                style={{
                  backgroundColor: 'white',
                  padding: 24,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
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
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>
                        {request.positionTitle}
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: priorityStyle.bg,
                        color: priorityStyle.color
                      }}>
                        {getPriorityLabel(request.priority)}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>Bộ phận:</span> {request.departmentName}
                    </div>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>
                      Mã yêu cầu: #{request.id}
                    </div>
                  </div>
                  <div>
                    <span style={{
                      padding: '6px 16px',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: '#dcfce7',
                      color: '#166534'
                    }}>
                      ✓ Đã duyệt
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  padding: 16,
                  backgroundColor: '#f9fafb',
                  borderRadius: 8,
                  marginBottom: 16
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Số lượng cần tuyển</div>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{request.numberOfPositions} người</div>
                  </div>
                  {request.expectedStartDate && (
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Ngày dự kiến bắt đầu</div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{formatDate(request.expectedStartDate)}</div>
                    </div>
                  )}
                  {request.createdAt && (
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Ngày tạo</div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{formatDate(request.createdAt)}</div>
                    </div>
                  )}
                  {request.approvedAt && (
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Ngày duyệt</div>
                      <div style={{ fontWeight: 600, color: '#10b981' }}>{formatDate(request.approvedAt)}</div>
                    </div>
                  )}
                </div>

                {/* Justification */}
                {request.justification && (
                  <div style={{
                    padding: 12,
                    backgroundColor: '#eff6ff',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#1e40af',
                    marginBottom: 12
                  }}>
                    <span style={{ fontWeight: 600 }}>Lý do:</span> {request.justification}
                  </div>
                )}

                {/* Action Indicator */}
                <div style={{
                  padding: '10px 16px',
                  backgroundColor: '#dcfce7',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#166534',
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  ✅ Yêu cầu đã được phê duyệt — Bạn có thể bắt đầu tạo tin tuyển dụng
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
