import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import directorService from "../../services/directorService";
import { formatVND } from "../../utils/formatters/currency";
import { formatDateDisplay } from "../../utils/formatters/date";

/**
 * DirectorDashboard Component
 * Thiết kế cao cấp, hiện đại, tối giản nhưng đầy đủ thông tin chiến lược
 * Lấy cảm hứng từ phong cách LandingPageNew (Glassmorphism, Soft Shadows)
 */
const DirectorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingJobRequests: 0,
    pendingOffers: 0,
    urgentItems: 0,
    totalPending: 0,
  });
  const [recruitmentStats, setRecruitmentStats] = useState({
    totalApplications: 0,
    upcomingInterviews: 0,
    activeJobPostings: 0,
    returnedJobRequestsCount: 0,
  });
  const [departmentBreakdown, setDepartmentBreakdown] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [funnelData, setFunnelData] = useState([]);
  const [loadWarning, setLoadWarning] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setLoadWarning("");
      const [jobRequestsResult, offersResult, overviewResult, funnelResult] =
        await Promise.allSettled([
        directorService.jobRequests.getPending(),
        directorService.offers.getPending(),
        directorService.statistics.getRecruitmentOverview(),
        directorService.statistics.getRecruitmentFunnel(),
        ]);

      const errors = [];
      const jobRequests =
        jobRequestsResult.status === "fulfilled" ? jobRequestsResult.value : [];
      if (jobRequestsResult.status === "rejected") {
        errors.push("Không tải được yêu cầu tuyển dụng");
      }

      const offers = offersResult.status === "fulfilled" ? offersResult.value : [];
      if (offersResult.status === "rejected") {
        errors.push("Không tải được danh sách offer");
      }

      const overview =
        overviewResult.status === "fulfilled" ? overviewResult.value : {};
      if (overviewResult.status === "rejected") {
        errors.push("Không tải được báo cáo tổng quan");
      }

      const funnel = funnelResult.status === "fulfilled" ? funnelResult.value : [];
      if (funnelResult.status === "rejected") {
        errors.push("Không tải được dữ liệu funnel");
      }

      const urgentJobs = jobRequests.filter((jr) => jr.priority === 1);
      const urgentOffers = offers.filter((o) => o.priority === 1);

      // Dept Breakdown
      const deptMap = {};
      jobRequests.forEach((jr) => {
        if (!deptMap[jr.departmentName]) {
          deptMap[jr.departmentName] = {
            name: jr.departmentName,
            pending: 0,
            budget: 0,
          };
        }
        deptMap[jr.departmentName].pending++;
        deptMap[jr.departmentName].budget += jr.budget || 0;
      });

      const recentItems = [
        ...jobRequests.slice(0, 3).map((jr) => ({
          type: "Job Request",
          title: jr.positionTitle,
          department: jr.departmentName,
          priority: jr.priority,
          createdAt: jr.createdAt,
          id: jr.id,
        })),
        ...offers.slice(0, 2).map((o) => ({
          type: "Offer",
          title: o.candidateName,
          department: o.departmentName,
          priority: o.priority,
          createdAt: o.createdAt,
          id: o.id,
        })),
      ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setStats({
        pendingJobRequests: jobRequests.length,
        pendingOffers: offers.length,
        urgentItems: urgentJobs.length + urgentOffers.length,
        totalPending: jobRequests.length + offers.length,
      });
      setDepartmentBreakdown(Object.values(deptMap));
      setRecentActivity(recentItems);
      setUrgentRequests([...urgentJobs, ...urgentOffers]);
      setRecruitmentStats({
        totalApplications: overview.totalApplications || 0,
        upcomingInterviews: overview.upcomingInterviews || 0,
        activeJobPostings: overview.activeJobPostings || 0,
        returnedJobRequestsCount: overview.returnedJobRequestsCount || 0,
      });
      setFunnelData(Array.isArray(funnel) ? funnel : []);
      if (errors.length > 0) {
        setLoadWarning(`${errors.join(" • ")}. Các dữ liệu còn lại vẫn được hiển thị.`);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setLoadWarning("Có lỗi khi tải dữ liệu bảng điều khiển. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#fafbfc] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      <div className="fixed top-40 -left-20 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl opacity-60 -z-10"></div>
      <div className="fixed bottom-20 -right-20 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl opacity-60 -z-10"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <span className="text-blue-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-3 block px-1">
              Management Hub
            </span>
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Bảng Điều Khiển Chiến Lược
            </h1>
            <p className="mt-2 text-slate-400 font-semibold text-xs uppercase tracking-widest pl-1">
              Giám đốc • Tổng quan vận hành và phê duyệt
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/staff/director/job-requests")}
              className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
            >
              Yêu cầu
            </button>
            <button
              onClick={() => navigate("/staff/director/offers")}
              className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95"
            >
              Offer
            </button>
          </div>
        </div>

        {loadWarning && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {loadWarning}
          </div>
        )}

        {/* Highlight Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 animate-in fade-in duration-700 delay-100">
          <StatCard
            label="Yêu cầu chờ duyệt"
            value={stats.pendingJobRequests}
            icon="📋"
            color="blue"
          />
          <StatCard
            label="Offer chờ ký"
            value={stats.pendingOffers}
            icon="📄"
            color="indigo"
          />
          <StatCard
            label="Vấn đề khẩn cấp"
            value={stats.urgentItems}
            icon="🔥"
            color="red"
            isUrgent
          />
          <StatCard
            label="Tổng đầu việc"
            value={stats.totalPending}
            icon="📊"
            color="slate"
          />
        </div>

        {/* Recruitment Report Snapshot */}
        <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm mb-12 animate-in fade-in duration-700 delay-150">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              Báo cáo tuyển dụng tổng quan
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Chỉ xem cho Giám đốc
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MiniStat label="Hồ sơ ứng tuyển" value={recruitmentStats.totalApplications} />
            <MiniStat label="Phỏng vấn sắp tới" value={recruitmentStats.upcomingInterviews} />
            <MiniStat label="Tin tuyển dụng đang mở" value={recruitmentStats.activeJobPostings} />
            <MiniStat label="Yêu cầu bị trả lại" value={recruitmentStats.returnedJobRequestsCount} />
          </div>

          {funnelData.length > 0 && (
            <div className="mt-10 space-y-6">
              {funnelData.map((stage, idx) => {
                const maxCount = Math.max(...funnelData.map(d => d.count || 0), 1);
                const width = ((stage.count || 0) / maxCount) * 100;
                return (
                  <div key={idx} className="relative group/bar">
                    <div className="flex justify-between items-center mb-2 px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover/bar:text-blue-600 transition-colors">
                          {stage.stage || "N/A"}
                        </span>
                      </div>
                      <span className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg">
                        {stage.count || 0}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${width}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {funnelData.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
              Chưa có dữ liệu funnel trong thời điểm hiện tại.
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left/Middle: Core Insights */}
          <div className="lg:col-span-2 space-y-10 animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
            {/* Urgent Section */}
            {urgentRequests.length > 0 && (
              <section className="bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <span className="text-2xl">🚨</span> Ưu tiên xử lý ngay
                  </h2>
                  <span className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-100">
                    {urgentRequests.length} tin mới
                  </span>
                </div>
                <div className="space-y-4">
                  {urgentRequests.map((item, idx) => (
                    <UrgentRow
                      key={idx}
                      item={item}
                      onClick={() =>
                        navigate(
                          item.positionTitle
                              ? "/staff/director/job-requests"
                              : "/staff/director/offers",
                        )
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Department Analysis */}
            <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-10 px-2 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-slate-900 rounded-full"></span>
                Phân bổ theo Phòng ban
              </h2>
              {departmentBreakdown.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
                  Chưa có yêu cầu nào đang chờ duyệt theo phòng ban.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {departmentBreakdown.map((dept, idx) => (
                    <DeptProgress
                      key={idx}
                      dept={dept}
                      maxPending={stats.pendingJobRequests}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right: Recent & Feed */}
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
            <section className="bg-[#1e293b] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-300">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-10 border-b border-white/5 pb-4">
                Hoạt động Gần đây
              </h2>
              <div className="space-y-10 relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-white/5"></div>
                {recentActivity.length === 0 ? (
                  <div className="pl-10 text-sm text-slate-400">
                    Chưa có hoạt động gần đây để hiển thị.
                  </div>
                ) : (
                  recentActivity.map((activity, idx) => (
                    <ActivityItem
                      key={idx}
                      activity={activity}
                      isLast={idx === recentActivity.length - 1}
                      onClick={() =>
                        navigate(
                          activity.type === "Job Request"
                              ? "/staff/director/job-requests"
                              : "/staff/director/offers",
                        )
                      }
                    />
                  ))
                )}
              </div>
            </section>

            {/* Responsibilities */}
            <section className="bg-indigo-50/50 rounded-[2rem] p-8 border border-indigo-100/50">
              <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-6">
                Trách nhiệm chiến lược
              </h3>
              <div className="space-y-4">
                <FeaturePoint
                  title="Tối ưu Ngân sách"
                  desc="Thẩm định kỹ lưỡng chi phí tuyển dụng so với thị trường."
                />
                <FeaturePoint
                  title="Đảm bảo Chất lượng"
                  desc="Phê duyệt các vòng phỏng vấn cấp cao cuối cùng."
                />
                <FeaturePoint
                  title="Định hướng Nhân sự"
                  desc="Tuyển dụng bám sát kế hoạch phát triển của công ty."
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer className="mt-24 text-center pb-8 opacity-20">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">
          Executive Management System © 2026
        </p>
      </footer>
    </div>
  );
};

// Sub-components
const StatCard = ({ label, value, icon, color, isUrgent }) => {
  const colors = {
    blue: "bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-200/50 text-white",
    indigo: "bg-gradient-to-br from-slate-800 to-slate-900 shadow-slate-300/50 text-white",
    red: "bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-200/50 text-white",
    slate: "bg-white border border-slate-100 shadow-slate-100 text-slate-900",
  };

  return (
    <div
      className={`group rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 cursor-default relative overflow-hidden shadow-2xl ${colors[color]}`}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
            {icon}
          </div>
          {isUrgent && (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          )}
        </div>
        <div>
          <p className="text-5xl font-black mb-1 tracking-tighter tabular-nums">
            {value}
          </p>
          <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${color === "slate" ? "text-slate-400" : "text-white/70"}`}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
};

const UrgentRow = ({ item, onClick }) => (
  <div
    onClick={onClick}
    className="group flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-100 transition-all cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all flex items-center justify-center font-bold">
        {item.type === "Job Request" ? "JR" : "OF"}
      </div>
      <div>
        <h4 className="font-bold text-slate-900 text-[14px] group-hover:text-blue-600 transition-colors">
          {item.positionTitle || item.candidateName}
        </h4>
        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-tight">
          {item.departmentName || item.department}
        </p>
      </div>
    </div>
    <span className="text-blue-500 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
      XEM NGAY →
    </span>
  </div>
);

const MiniStat = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mt-1">
      {label}
    </div>
  </div>
);

const DeptProgress = ({ dept, maxPending }) => {
  const percentage = maxPending > 0 ? (dept.pending / maxPending) * 100 : 0;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <p className="text-[13px] font-bold text-slate-900">{dept.name}</p>
        <span className="text-[11px] font-bold text-blue-600">
          {dept.pending} ĐANG CHỜ
        </span>
      </div>
      <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
        <div
          className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">
        Tổng ngân sách dự kiến: {formatVND(dept.budget)}
      </p>
    </div>
  );
};

const ActivityItem = ({ activity, isLast, onClick }) => (
  <div onClick={onClick} className="relative pl-10 cursor-pointer group">
    <div className="absolute left-[9px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20 group-hover:scale-150 transition-transform"></div>
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
          {activity.type}
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${activity.priority === 1 ? "bg-red-500 text-white" : "bg-white/10 text-slate-400"}`}
        >
          Mức {activity.priority}
        </span>
      </div>
      <h4 className="font-bold text-[14px] text-white group-hover:text-blue-400 transition-colors mb-1">
        {activity.title}
      </h4>
      <p className="text-[11px] text-slate-500 font-medium">
        {activity.department} • {formatDateDisplay(activity.createdAt)}
      </p>
    </div>
  </div>
);

const FeaturePoint = ({ title, desc }) => (
  <div className="flex items-start gap-3">
    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
    <div>
      <p className="font-bold text-slate-900 text-[12px]">{title}</p>
      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
        {desc}
      </p>
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#fafbfc]">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-slate-50 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
    </div>
    <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
      Đang nạp dữ liệu quản trị...
    </span>
  </div>
);

export default DirectorDashboard;
