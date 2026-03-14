import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import deptManagerService from "../../services/deptManagerService";
import { LoadingSpinner } from "../../components/shared";
import { getPriorityBadge, getStatusBadge } from "../../utils/helpers/badge";

const DeptManagerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    myJobRequests: 0,
    pendingApproval: 0,
    upcomingInterviews: 0,
    activeCandidates: 0,
  });
  const [recentJobRequests, setRecentJobRequests] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [loadWarning, setLoadWarning] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      setLoadWarning("");
      const [statsResult, requestsResult, interviewsResult] = await Promise.allSettled([
        deptManagerService.dashboard.getStats(),
        deptManagerService.jobRequests.getAll(),
        deptManagerService.interviews.getUpcoming(),
      ]);

      const errors = [];
      const statsData = statsResult.status === "fulfilled" ? statsResult.value : {};
      if (statsResult.status === "rejected") {
        errors.push("Không tải được thống kê phòng ban");
      }

      const jobRequests =
        requestsResult.status === "fulfilled" ? requestsResult.value : [];
      if (requestsResult.status === "rejected") {
        errors.push("Không tải được danh sách yêu cầu tuyển dụng");
      }

      const interviews =
        interviewsResult.status === "fulfilled" ? interviewsResult.value : [];
      if (interviewsResult.status === "rejected") {
        errors.push("Không tải được lịch phỏng vấn");
      }

      setStats({
        myJobRequests: statsData.myJobRequests || 0,
        pendingApproval: statsData.pendingApproval || 0,
        upcomingInterviews: statsData.upcomingInterviews || 0,
        activeCandidates: statsData.activeCandidates || 0,
      });

      setRecentJobRequests(jobRequests.slice(0, 5));
      setUpcomingInterviews(interviews.slice(0, 5));
      if (errors.length > 0) {
        setLoadWarning(`${errors.join(" • ")}. Các phần còn lại vẫn được hiển thị.`);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setLoadWarning("Có lỗi khi tải dữ liệu dashboard. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  if (loading) {
    return <LoadingSpinner message="Đang tải dashboard..." />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Trưởng Bộ Phận
        </h1>
        <p className="text-gray-600">
          Quản lý yêu cầu tuyển dụng và lịch phỏng vấn của bộ phận
        </p>
      </div>

      {loadWarning && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {loadWarning}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          label="Yêu cầu của tôi" 
          value={stats.myJobRequests} 
          icon="📋" 
          description="Tổng số yêu cầu đã tạo"
          color="emerald"
        />
        <StatCard 
          label="Đang chờ duyệt" 
          value={stats.pendingApproval} 
          icon="⏳" 
          description="Đang chờ xem xét"
          color="amber"
          highlight={stats.pendingApproval > 0}
        />
        <StatCard 
          label="Phỏng vấn sắp tới" 
          value={stats.upcomingInterviews} 
          icon="📅" 
          description="Lịch trong tuần này"
          color="blue"
        />
        <StatCard 
          label="Ứng viên đang xử lý" 
          value={stats.activeCandidates} 
          icon="👥" 
          description="Đang trong quy trình"
          color="violet"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Thao tác nhanh
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/staff/dept-manager/job-requests/new')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo yêu cầu tuyển dụng
          </button>
          <button
            onClick={() => navigate('/staff/dept-manager/job-requests')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all border border-gray-300 font-medium"
          >
            📋 Xem tất cả yêu cầu
          </button>
          <button
            onClick={() => navigate('/staff/dept-manager/interviews')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all border border-gray-300 font-medium"
          >
            📅 Lịch phỏng vấn của tôi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Job Requests */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Yêu cầu tuyển dụng gần đây
              </h2>
              <button
                onClick={() => navigate('/staff/dept-manager/job-requests')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Xem tất cả →
              </button>
            </div>
          </div>

          {recentJobRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-5xl mb-3">📋</div>
              <div className="text-sm">Chưa có yêu cầu tuyển dụng</div>
              <div className="text-xs text-gray-400 mt-1">Dữ liệu sẽ hiển thị khi bộ phận tạo yêu cầu mới</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentJobRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => navigate(`/staff/dept-manager/job-requests/${request.id}`)}
                  className="p-4 hover:bg-blue-50 cursor-pointer transition-all border-l-4 border-transparent hover:border-blue-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-gray-900 text-sm flex-1">
                      {request.positionTitle}
                    </div>
                    {(() => {
                      const badge = getPriorityBadge(request.priority);
                      return (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold ml-2" style={{ backgroundColor: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Số lượng: {request.quantity} • Ngân sách: {request.budget ? `${(request.budget / 1000000).toFixed(0)}M VNĐ` : 'N/A'}
                  </div>
                  <div className="flex items-center justify-between">
                    {(() => {
                      const badge = getStatusBadge(request.statusCode);
                      return (
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-gray-400">
                      {formatDate(request.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Lịch phỏng vấn sắp tới
              </h2>
              <button
                onClick={() => navigate('/staff/dept-manager/interviews')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Xem tất cả →
              </button>
            </div>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-5xl mb-3">📅</div>
              <div className="text-sm">Chưa có lịch phỏng vấn sắp tới</div>
              <div className="text-xs text-gray-400 mt-1">Khi có lịch mới, thông tin sẽ xuất hiện tại đây</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  onClick={() => navigate(`/staff/dept-manager/interviews/${interview.id}`)}
                  className="p-4 hover:bg-purple-50 cursor-pointer transition-all border-l-4 border-transparent hover:border-purple-600"
                >
                  <div className="font-semibold text-gray-900 text-sm mb-2">
                    {interview.candidateName}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Vị trí: {interview.positionTitle}
                  </div>
                  <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                    <span>📅</span>
                    <span>{formatDateTime(interview.startTime)}</span>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <span>📍</span>
                    <span className="truncate">{interview.location || interview.meetingLink || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, description, color, highlight }) => {
  const themes = {
    emerald: "from-emerald-500 to-emerald-600 text-emerald-50",
    amber: "from-amber-500 to-amber-600 text-amber-50",
    blue: "from-blue-500 to-blue-600 text-blue-50",
    violet: "from-violet-500 to-violet-600 text-violet-50",
  };
  
  return (
    <div className={`bg-gradient-to-br ${themes[color]} rounded-2xl p-6 text-white shadow-lg shadow-${color}-100/50 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-4xl drop-shadow-md">{icon}</span>
          <span className="text-3xl font-black">{value}</span>
        </div>
        <div className="text-white text-sm font-bold tracking-tight">{label}</div>
        <div className="text-white/70 text-[11px] mt-1 font-medium">{description}</div>
      </div>
      {highlight && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full animate-ping"></div>
      )}
    </div>
  );
};

export default DeptManagerDashboard;
