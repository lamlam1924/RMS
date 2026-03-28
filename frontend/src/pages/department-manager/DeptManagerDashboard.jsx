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

      const sortedJobRequests = [...jobRequests].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      const sortedInterviews = [...interviews].sort(
        (a, b) => new Date(a.startTime) - new Date(b.startTime),
      );

      setRecentJobRequests(sortedJobRequests.slice(0, 5));
      setUpcomingInterviews(sortedInterviews.slice(0, 5));
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
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Department Manager Workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Dashboard Trưởng Bộ Phận
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý yêu cầu tuyển dụng và lịch phỏng vấn của bộ phận.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/staff/dept-manager/job-requests/new')}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100"
            >
              Tạo yêu cầu mới
            </button>
            <button
              onClick={() => navigate('/staff/dept-manager/job-requests')}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100"
            >
              Quản lý yêu cầu
            </button>
            <button
              onClick={() => navigate('/staff/interviews')}
              className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 transition hover:-translate-y-0.5 hover:bg-violet-100"
            >
              Lịch phỏng vấn
            </button>
          </div>
        </div>
      </div>

      {loadWarning && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {loadWarning}
        </div>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-blue-900">
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
            <div className="p-10 text-center text-gray-500">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-sm">Chưa có yêu cầu tuyển dụng</div>
              <div className="text-xs text-gray-400 mt-1">Dữ liệu sẽ hiển thị khi bộ phận tạo yêu cầu mới</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentJobRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => navigate(`/staff/dept-manager/job-requests/${request.id}`)}
                  className="p-4 hover:bg-blue-50/60 cursor-pointer transition-all border-l-4 border-transparent hover:border-blue-600"
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-violet-900">
                Lịch phỏng vấn sắp tới
              </h2>
              <button
                onClick={() => navigate('/staff/interviews')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Xem tất cả →
              </button>
            </div>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <div className="text-4xl mb-3">📅</div>
              <div className="text-sm">Chưa có lịch phỏng vấn sắp tới</div>
              <div className="text-xs text-gray-400 mt-1">Khi có lịch mới, thông tin sẽ xuất hiện tại đây</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  onClick={() => navigate(`/staff/interviews/${interview.id}`)}
                  className="p-4 hover:bg-violet-50/60 cursor-pointer transition-all border-l-4 border-transparent hover:border-violet-600"
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
    </div>
  );
};

const StatCard = ({ label, value, icon, description, color, highlight }) => {
  const themes = {
    emerald: {
      card: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white text-emerald-900",
      badge: "bg-emerald-100 text-emerald-700",
      icon: "bg-emerald-100 text-emerald-700",
    },
    amber: {
      card: "border-amber-200 bg-gradient-to-br from-amber-50 to-white text-amber-900",
      badge: "bg-amber-100 text-amber-700",
      icon: "bg-amber-100 text-amber-700",
    },
    blue: {
      card: "border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-900",
      badge: "bg-blue-100 text-blue-700",
      icon: "bg-blue-100 text-blue-700",
    },
    violet: {
      card: "border-violet-200 bg-gradient-to-br from-violet-50 to-white text-violet-900",
      badge: "bg-violet-100 text-violet-700",
      icon: "bg-violet-100 text-violet-700",
    },
  };

  const theme = themes[color] || themes.blue;
  
  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow ${theme.card}`}>
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg ${theme.icon}`}>
          {icon}
        </span>
        <span className="text-3xl font-bold tracking-tight">{value}</span>
      </div>
      <div>
        <div className="text-sm font-semibold tracking-tight">{label}</div>
        <div className="text-[11px] text-slate-600 mt-1 font-medium">{description}</div>
      </div>
      {highlight && (
        <div className="mt-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.badge}`}>
            Cần theo dõi
          </span>
        </div>
      )}
    </div>
  );
};

export default DeptManagerDashboard;
