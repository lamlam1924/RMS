import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';

export default function HRManagerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingJobRequests: 0,
    totalApplications: 0,
    upcomingInterviews: 0,
    pendingOffers: 0,
    screeningApplications: 0,
    interviewingApplications: 0,
    activeJobPostings: 0,
    returnedJobRequestsCount: 0
  });

  const [staffWorkloads, setStaffWorkloads] = useState([]);
  const [staffKeyword, setStaffKeyword] = useState('');
  const [staffDepartmentFilter, setStaffDepartmentFilter] = useState('ALL');
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [selectedStaffDetail, setSelectedStaffDetail] = useState(null);
  const [staffDetailLoading, setStaffDetailLoading] = useState(false);
  const [staffDetailCache, setStaffDetailCache] = useState({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [statsResult, workloadResult, pendingManagerOffersResult] = await Promise.allSettled([
        hrService.statistics.getDashboard(),
        hrService.statistics.getStaffWorkload(),
        hrService.offers.getPendingHRManager()
      ]);

      if (statsResult.status === 'fulfilled') {
        const baseStats = statsResult.value || {};
        const pendingManagerOffers = pendingManagerOffersResult.status === 'fulfilled'
          ? (Array.isArray(pendingManagerOffersResult.value) ? pendingManagerOffersResult.value.length : 0)
          : (baseStats.pendingOffers || 0);

        setStats({
          ...baseStats,
          pendingOffers: pendingManagerOffers
        });
      } else {
        notify.error('Không thể tải thống kê tổng quan');
      }

      if (workloadResult.status === 'fulfilled') {
        const workload = Array.isArray(workloadResult.value) ? workloadResult.value : [];
        setStaffWorkloads(workload);

        const firstStaffId = workload[0]?.staffId;
        if (firstStaffId) {
          loadStaffDetail(firstStaffId, true);
        }
      } else {
        setStaffWorkloads([]);
        notify.error('Không thể tải dữ liệu theo dõi HR Staff');
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      notify.error(error?.message || 'Không thể tải dữ liệu dashboard');
      if (error?.message?.includes('đăng nhập') || error?.message?.includes('quyền')) {
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const normalize = (text) => (text || '').toString().toLowerCase().trim();

  const getDepartmentOptions = () => {
    if (!selectedStaffDetail) return [];
    const names = new Set();
    (selectedStaffDetail.pendingJobRequests || []).forEach((item) => {
      if (item?.departmentName) names.add(item.departmentName);
    });
    (selectedStaffDetail.pendingOffers || []).forEach((item) => {
      if (item?.departmentName) names.add(item.departmentName);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  };

  const getFilteredPendingJobRequests = () => {
    const list = selectedStaffDetail?.pendingJobRequests || [];
    if (staffDepartmentFilter === 'ALL') return list;
    return list.filter((item) => item.departmentName === staffDepartmentFilter);
  };

  const getFilteredPendingOffers = () => {
    const list = selectedStaffDetail?.pendingOffers || [];
    if (staffDepartmentFilter === 'ALL') return list;
    return list.filter((item) => item.departmentName === staffDepartmentFilter);
  };

  const getSummaryValue = (item, key) => Number(item?.[key] || 0);

  const getTotalDone = (item) => {
    if (item?.totalDone !== undefined) return Number(item.totalDone || 0);
    return (
      getSummaryValue(item, 'jobPostingsCreated') +
      getSummaryValue(item, 'offersCreated') +
      getSummaryValue(item, 'offersSentToCandidate') +
      getSummaryValue(item, 'offersSentToManager') +
      getSummaryValue(item, 'negotiationsHandled')
    );
  };

  const getTotalPending = (item) => {
    if (item?.totalPending !== undefined) return Number(item.totalPending || 0);
    return (
      getSummaryValue(item, 'assignedApprovedRequestsWithoutPosting') +
      getSummaryValue(item, 'acceptedDeclinedOffersPendingManager') +
      getSummaryValue(item, 'negotiatingOffersPendingAction')
    );
  };

  const loadStaffDetail = async (staffId, silent = false) => {
    setSelectedStaffId(staffId);

    if (staffDetailCache[staffId]) {
      setSelectedStaffDetail(staffDetailCache[staffId]);
      return;
    }

    try {
      if (!silent) setStaffDetailLoading(true);
      const detail = await hrService.statistics.getStaffWorkloadDetail(staffId, 20);
      setSelectedStaffDetail(detail);
      setStaffDetailCache((prev) => ({ ...prev, [staffId]: detail }));
    } catch (error) {
      notify.error(error?.message || 'Không thể tải chi tiết công việc của HR Staff');
    } finally {
      if (!silent) setStaffDetailLoading(false);
    }
  };

  const filteredStaffWorkloads = staffWorkloads.filter((item) => {
    if (!staffKeyword.trim()) return true;
    const keyword = normalize(staffKeyword);
    return (
      normalize(item.staffName).includes(keyword) ||
      normalize(item.staffEmail).includes(keyword)
    );
  });

  const selectedSummary = selectedStaffDetail?.summary;
  const departmentOptions = getDepartmentOptions();
  const pendingJobRequestsByDept = getFilteredPendingJobRequests();
  const pendingOffersByDept = getFilteredPendingOffers();

  useEffect(() => {
    if (staffDepartmentFilter === 'ALL') return;
    if (!departmentOptions.includes(staffDepartmentFilter)) {
      setStaffDepartmentFilter('ALL');
    }
  }, [staffDepartmentFilter, selectedStaffId]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Đang tải bảng điều khiển...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Bảng điều khiển Trưởng phòng Nhân sự
        </h1>
        <p style={{ color: '#6b7280' }}>
          Theo dõi tiến độ tuyển dụng và quản lý hiệu suất HR Staff.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        <div style={{ 
          background: 'white', 
          padding: 20, 
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            Yêu cầu tuyển dụng chờ xử lý
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>
            {stats.pendingJobRequests}
          </div>
          <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 8, cursor: 'pointer' }}
               onClick={() => navigate('/staff/hr-manager/job-requests')}>
            Xem chi tiết →
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: 20, 
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            Tổng hồ sơ ứng tuyển
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>
            {stats.totalApplications}
          </div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 8 }}>
            Sàng lọc: {stats.screeningApplications} • Phỏng vấn: {stats.interviewingApplications}
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: 20, 
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            Lịch phỏng vấn sắp tới
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>
            {stats.upcomingInterviews}
          </div>
          <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 8, cursor: 'pointer' }}
               onClick={() => navigate('/staff/hr-manager/interviews')}>
            Quản lý →
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: 20, 
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #8b5cf6'
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            Offer chờ HR Manager xử lý
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>
            {stats.pendingOffers}
          </div>
          <div style={{ fontSize: 12, color: '#8b5cf6', marginTop: 8, cursor: 'pointer' }}
               onClick={() => navigate('/staff/hr-manager/offers')}>
            Xem danh sách →
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: 20, 
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #ef4444'
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            Yêu cầu bị trả về
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>
            {stats.returnedJobRequestsCount}
          </div>
          <div style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>
            Cần trưởng bộ phận chỉnh sửa
          </div>
        </div>
      </div>

      {/* HR Staff Workload Monitoring */}
      <div style={{
        background: 'white',
        padding: 24,
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111827' }}>
              Theo dõi hiệu suất HR Staff
            </h2>
            <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>
              Quản lý đã làm gì và công việc còn tồn theo từng nhân sự.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              value={staffKeyword}
              onChange={(e) => setStaffKeyword(e.target.value)}
              placeholder="Lọc theo tên hoặc email HR Staff"
              style={{
                minWidth: 260,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                outline: 'none'
              }}
            />
            <select
              value={staffDepartmentFilter}
              onChange={(e) => setStaffDepartmentFilter(e.target.value)}
              style={{
                minWidth: 220,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                background: 'white'
              }}
              title="Lọc theo phòng ban trong panel chi tiết"
            >
              <option value="ALL">Phòng ban: Tất cả</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 12, color: '#475569', borderBottom: '1px solid #e5e7eb' }}>HR Staff</th>
                <th style={{ textAlign: 'right', padding: 12, fontSize: 12, color: '#475569', borderBottom: '1px solid #e5e7eb' }}>Đã làm</th>
                <th style={{ textAlign: 'right', padding: 12, fontSize: 12, color: '#475569', borderBottom: '1px solid #e5e7eb' }}>Tồn đọng</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 12, color: '#475569', borderBottom: '1px solid #e5e7eb' }}>Chi tiết nhanh</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaffWorkloads.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>
                    Không có HR Staff phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredStaffWorkloads.map((staff) => {
                  const selected = selectedStaffId === staff.staffId;
                  const totalDone = getTotalDone(staff);
                  const totalPending = getTotalPending(staff);
                  return (
                    <tr
                      key={staff.staffId}
                      onClick={() => loadStaffDetail(staff.staffId)}
                      style={{
                        cursor: 'pointer',
                        background: selected ? '#eff6ff' : 'white',
                        borderBottom: '1px solid #f1f5f9'
                      }}
                    >
                      <td style={{ padding: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{staff.staffName}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{staff.staffEmail}</div>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 40,
                          height: 28,
                          padding: '0 10px',
                          borderRadius: 999,
                          background: '#ecfdf3',
                          color: '#166534',
                          fontWeight: 700
                        }}>
                          {totalDone}
                        </span>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 40,
                          height: 28,
                          padding: '0 10px',
                          borderRadius: 999,
                          background: '#fef2f2',
                          color: '#991b1b',
                          fontWeight: 700
                        }}>
                          {totalPending}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: '#0f766e', background: '#ccfbf1', borderRadius: 999, padding: '4px 8px' }}>
                            Đăng tuyển: {staff.jobPostingsCreated || 0}
                          </span>
                          <span style={{ fontSize: 11, color: '#1d4ed8', background: '#dbeafe', borderRadius: 999, padding: '4px 8px' }}>
                            Offer tạo: {staff.offersCreated || 0}
                          </span>
                          <span style={{ fontSize: 11, color: '#14532d', background: '#dcfce7', borderRadius: 999, padding: '4px 8px' }}>
                            Đã gửi ứng viên: {staff.offersSentToCandidate || 0}
                          </span>
                          <span style={{ fontSize: 11, color: '#0f766e', background: '#ccfbf1', borderRadius: 999, padding: '4px 8px' }}>
                            Đã gửi quản lý: {staff.offersSentToManager || 0}
                          </span>
                          <span style={{ fontSize: 11, color: '#0c4a6e', background: '#e0f2fe', borderRadius: 999, padding: '4px 8px' }}>
                            Đã xử lý thương lượng: {staff.negotiationsHandled || 0}
                          </span>
                          <span style={{ fontSize: 11, color: '#9a3412', background: '#ffedd5', borderRadius: 999, padding: '4px 8px' }}>
                            Tồn JR chưa đăng: {staff.assignedApprovedRequestsWithoutPosting || 0}
                          </span>
                          <span style={{ fontSize: 11, color: '#9a3412', background: '#ffedd5', borderRadius: 999, padding: '4px 8px' }}>
                            Tồn phản hồi chưa gửi: {staff.acceptedDeclinedOffersPendingManager || 0}
                          </span>
                          <span style={{ fontSize: 11, color: '#9a3412', background: '#ffedd5', borderRadius: 999, padding: '4px 8px' }}>
                            Tồn thương lượng: {staff.negotiatingOffersPendingAction || 0}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16 }}>
          {!selectedStaffId && (
            <div style={{ color: '#64748b', fontSize: 13 }}>
              Chọn một HR Staff trong bảng để xem chi tiết công việc.
            </div>
          )}

          {selectedStaffId && staffDetailLoading && (
            <div style={{ color: '#64748b', fontSize: 13 }}>
              Đang tải chi tiết công việc...
            </div>
          )}

          {selectedStaffId && !staffDetailLoading && selectedStaffDetail && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 16
            }}>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: '#111827' }}>{selectedStaffDetail.staffName}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{selectedStaffDetail.staffEmail}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: '#f8fafc', borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Tổng công việc đã hoàn thành</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>
                      {getTotalDone(selectedSummary || {})}
                    </div>
                  </div>
                  <div style={{ background: '#fff1f2', borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Tổng công việc tồn đọng</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#b91c1c' }}>
                      {getTotalPending(selectedSummary || {})}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 700, color: '#111827', marginBottom: 10 }}>Job Request đang chờ</div>
                {pendingJobRequestsByDept.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Không có yêu cầu tuyển dụng đang chờ.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                    {pendingJobRequestsByDept.map((item) => (
                      <button
                        key={item.jobRequestId}
                        onClick={() => navigate(`/staff/hr-manager/job-requests/${item.jobRequestId}`)}
                        style={{
                          textAlign: 'left',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          background: '#f8fafc',
                          padding: 10,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                          JR #{item.jobRequestId} - {item.positionTitle}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{item.departmentName} • {item.currentStatus}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 700, color: '#111827', marginBottom: 10 }}>Offer đang chờ xử lý</div>
                {pendingOffersByDept.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Không có offer đang chờ xử lý.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                    {pendingOffersByDept.map((item) => (
                      <button
                        key={item.offerId}
                        onClick={() => navigate(`/staff/hr-manager/offers/${item.offerId}`)}
                        style={{
                          textAlign: 'left',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          background: '#fff7ed',
                          padding: 10,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#7c2d12' }}>
                          Offer #{item.offerId} - {item.candidateName}
                        </div>
                        <div style={{ fontSize: 12, color: '#9a3412' }}>
                          {item.positionTitle} • {item.departmentName} • {item.currentStatus}
                        </div>
                        <div style={{ fontSize: 11, color: '#b45309' }}>{item.pendingReason}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 700, color: '#111827', marginBottom: 10 }}>Hoạt động gần đây</div>
                {(selectedStaffDetail.recentActivities || []).length === 0 ? (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Chưa có hoạt động gần đây.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                    {(selectedStaffDetail.recentActivities || []).map((activity, idx) => (
                      <div
                        key={`${activity.entityType}-${activity.entityId}-${idx}`}
                        style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10, background: '#f8fafc' }}
                      >
                        <div style={{ fontSize: 12, color: '#1e293b', fontWeight: 600 }}>
                          [{activity.entityType}] #{activity.entityId} - {activity.action}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {activity.changedAt ? new Date(activity.changedAt).toLocaleString('vi-VN') : 'Không xác định'}
                        </div>
                        {activity.note ? (
                          <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{activity.note}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
