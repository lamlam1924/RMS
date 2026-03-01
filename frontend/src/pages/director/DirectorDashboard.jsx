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
  const [departmentBreakdown, setDepartmentBreakdown] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const [jobRequests, offers] = await Promise.all([
        directorService.jobRequests.getPending(),
        directorService.offers.getPending(),
      ]);

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
    } catch (err) {
      console.error("Dashboard error:", err);
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
              onClick={() => navigate("/director/job-requests")}
              className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
            >
              Yêu cầu
            </button>
            <button
              onClick={() => navigate("/director/offers")}
              className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95"
            >
              Offer
            </button>
          </div>
        </div>

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
                            ? `/director/job-requests/${item.id}`
                            : `/director/offers/${item.id}`,
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {departmentBreakdown.map((dept, idx) => (
                  <DeptProgress
                    key={idx}
                    dept={dept}
                    maxPending={stats.pendingJobRequests}
                  />
                ))}
              </div>
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
                {recentActivity.map((activity, idx) => (
                  <ActivityItem
                    key={idx}
                    activity={activity}
                    isLast={idx === recentActivity.length - 1}
                    onClick={() =>
                      navigate(
                        activity.type === "Job Request"
                          ? `/director/job-requests/${activity.id}`
                          : `/director/offers/${activity.id}`,
                      )
                    }
                  />
                ))}
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
    blue: "bg-blue-600 shadow-blue-100",
    indigo: "bg-[#1e293b] shadow-slate-200",
    red: "bg-red-600 shadow-red-100",
    slate: "bg-white border border-slate-100 shadow-slate-50 text-slate-900",
  };

  return (
    <div
      className={`group rounded-[2rem] p-8 transition-all hover:-translate-y-1.5 cursor-default relative overflow-hidden ${colors[color]}`}
    >
      {color !== "slate" && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125 duration-700"></div>
      )}
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="text-3xl mb-6">{icon}</div>
        <div>
          <p
            className={`text-4xl font-bold mb-1 ${color === "slate" ? "text-slate-900" : "text-white"}`}
          >
            {value}
          </p>
          <p
            className={`text-[10px] font-bold uppercase tracking-widest ${color === "slate" ? "text-slate-400" : "text-white/60"}`}
          >
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
