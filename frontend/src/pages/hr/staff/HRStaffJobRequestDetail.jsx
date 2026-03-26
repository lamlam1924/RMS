import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';
import { 
  ArrowLeft, 
  Briefcase, 
  Calendar, 
  Users, 
  FileText, 
  Clock,
  CheckCircle,
  Building2
} from 'lucide-react';

/**
 * HRStaffJobRequestDetail - Chi tiết yêu cầu tuyển dụng cho HR Staff
 */
export default function HRStaffJobRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobRequest, setJobRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobRequest();
  }, [id]);

  const loadJobRequest = async () => {
    try {
      setLoading(true);
      const data = await hrService.jobRequests.getById(id);
      setJobRequest(data);
    } catch (error) {
      console.error('Failed to load job request:', error);
      notify.error(error.message || 'Không thể tải thông tin yêu cầu tuyển dụng');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: '#6b7280' }}>Đang tải...</div>
      </div>
    );
  }

  if (!jobRequest) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: '#ef4444' }}>Không tìm thấy yêu cầu tuyển dụng</div>
      </div>
    );
  }

  const priorityStyle = getPriorityColor(jobRequest.priority);

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/staff/hr-staff/job-requests')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            color: '#374151',
            cursor: 'pointer',
            marginBottom: 16
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Quay lại danh sách
        </button>

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
            Chi tiết Yêu cầu Tuyển dụng
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              {jobRequest.positionTitle}
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              Mã yêu cầu: #{jobRequest.id}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              padding: '6px 16px',
              borderRadius: 16,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: priorityStyle.bg,
              color: priorityStyle.color
            }}>
              {getPriorityLabel(jobRequest.priority)}
            </span>
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
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Basic Information */}
          <div style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
              Thông tin cơ bản
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Building2 style={{ width: 16, height: 16, color: '#6b7280' }} />
                  <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Bộ phận</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                  {jobRequest.departmentName}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Users style={{ width: 16, height: 16, color: '#6b7280' }} />
                  <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Số lượng</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                  {jobRequest.numberOfPositions} người
                </div>
              </div>
              {jobRequest.expectedStartDate && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Calendar style={{ width: 16, height: 16, color: '#6b7280' }} />
                    <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Ngày dự kiến bắt đầu</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                    {formatDate(jobRequest.expectedStartDate)}
                  </div>
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Clock style={{ width: 16, height: 16, color: '#6b7280' }} />
                  <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Ngày tạo</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                  {formatDate(jobRequest.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Job Description */}
          {jobRequest.jobDescription && (
            <div style={{
              backgroundColor: 'white',
              padding: 24,
              borderRadius: 12,
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
                Mô tả công việc
              </h2>
              <div style={{
                fontSize: 14,
                color: '#374151',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}>
                {jobRequest.jobDescription}
              </div>
            </div>
          )}

          {/* Requirements */}
          {jobRequest.requirements && (
            <div style={{
              backgroundColor: 'white',
              padding: 24,
              borderRadius: 12,
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
                Yêu cầu ứng viên
              </h2>
              <div style={{
                fontSize: 14,
                color: '#374151',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}>
                {jobRequest.requirements}
              </div>
            </div>
          )}

          {/* Justification */}
          {jobRequest.justification && (
            <div style={{
              backgroundColor: 'white',
              padding: 24,
              borderRadius: 12,
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
                Lý do tuyển dụng
              </h2>
              <div style={{
                fontSize: 14,
                color: '#374151',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}>
                {jobRequest.justification}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Action Card */}
          <div style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
              Hành động
            </h3>
            <button
              onClick={() => navigate('/staff/hr-staff/job-postings/new', { 
                state: { jobRequestId: jobRequest.id, jobRequest } 
              })}
              style={{
                width: '100%',
                padding: '12px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              Tạo tin tuyển dụng
            </button>
            <div style={{
              padding: 12,
              backgroundColor: '#eff6ff',
              borderRadius: 8,
              fontSize: 13,
              color: '#1e40af',
              lineHeight: 1.5
            }}>
              💡 Yêu cầu này đã được phê duyệt. Bạn có thể tạo tin tuyển dụng để bắt đầu thu hút ứng viên.
            </div>
          </div>

          {/* Status Timeline */}
          <div style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
              Trạng thái
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {jobRequest.approvedAt && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#dcfce7',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <CheckCircle style={{ width: 16, height: 16, color: '#10b981' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                      Đã phê duyệt
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                      {formatDate(jobRequest.approvedAt)}
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  backgroundColor: '#dbeafe',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText style={{ width: 16, height: 16, color: '#3b82f6' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    Yêu cầu được tạo
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {formatDate(jobRequest.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {jobRequest.createdByName && (
            <div style={{
              backgroundColor: 'white',
              padding: 24,
              borderRadius: 12,
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
                Thông tin thêm
              </h3>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                Người tạo yêu cầu
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                {jobRequest.createdByName}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
