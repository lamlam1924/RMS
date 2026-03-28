import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import directorService from "../../services/directorService";
import { formatVND } from "../../utils/formatters/currency";
import { formatDateDisplay } from "../../utils/formatters/date";

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingJobRequests: 0,
    pendingOffers: 0,
    urgentItems: 0,
    totalPending: 0,
  });
  const [pendingBreakdown, setPendingBreakdown] = useState({
    urgentJobRequests: 0,
    highJobRequests: 0,
    normalJobRequests: 0,
    pendingOffers: 0,
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
      const highJobs = jobRequests.filter((jr) => jr.priority === 2);
      const normalJobs = jobRequests.filter((jr) => jr.priority === 3);

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

      const sortedJobRequests = [...jobRequests].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      const sortedOffers = [...offers].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      const recentItems = [
        ...sortedJobRequests.slice(0, 3).map((jr) => ({
          type: "Job Request",
          title: jr.positionTitle,
          department: jr.departmentName,
          priority: jr.priority,
          createdAt: jr.createdAt,
          id: jr.id,
        })),
        ...sortedOffers.slice(0, 2).map((o) => ({
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
      setPendingBreakdown({
        urgentJobRequests: urgentJobs.length,
        highJobRequests: highJobs.length,
        normalJobRequests: normalJobs.length,
        pendingOffers: offers.length,
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
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Director Workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Dashboard Giám đốc
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi các yêu cầu và offer đang chờ phê duyệt.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/staff/director/job-requests")}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100"
            >
              Xem yêu cầu
            </button>
            <button
              onClick={() => navigate("/staff/director/offers")}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-100"
            >
              Xem offer
            </button>
          </div>
        </div>
        </div>

        {loadWarning && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {loadWarning}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Yêu cầu chờ duyệt"
            value={stats.pendingJobRequests}
            tone="blue"
            icon="📋"
          />
          <StatCard
            label="Offer chờ ký"
            value={stats.pendingOffers}
            tone="indigo"
            icon="📝"
          />
          <StatCard
            label="Vấn đề khẩn cấp"
            value={stats.urgentItems}
            tone="red"
            icon="⚠️"
          />
          <StatCard
            label="Tổng đầu việc"
            value={stats.totalPending}
            tone="slate"
            icon="📊"
          />
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-blue-900">Nguồn số liệu đang chờ xử lý</h2>
            <span className="text-xs text-slate-500">Realtime từ API Director</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="JR mức 1 (khẩn)" value={pendingBreakdown.urgentJobRequests} />
            <MiniStat label="JR mức 2 (cao)" value={pendingBreakdown.highJobRequests} />
            <MiniStat label="JR mức 3 (thường)" value={pendingBreakdown.normalJobRequests} />
            <MiniStat label="Offer chờ duyệt" value={pendingBreakdown.pendingOffers} />
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-indigo-900">Báo cáo tuyển dụng tổng quan</h2>
            <span className="text-xs text-slate-500">Dữ liệu chỉ xem</span>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat label="Hồ sơ ứng tuyển" value={recruitmentStats.totalApplications} />
            <MiniStat label="Phỏng vấn sắp tới" value={recruitmentStats.upcomingInterviews} />
            <MiniStat label="Tin tuyển dụng đang mở" value={recruitmentStats.activeJobPostings} />
            <MiniStat label="Yêu cầu bị trả lại" value={recruitmentStats.returnedJobRequestsCount} />
          </div>

          {funnelData.length > 0 && (
            <div className="space-y-4">
              {funnelData.map((stage, idx) => {
                const maxCount = Math.max(...funnelData.map(d => d.count || 0), 1);
                const width = ((stage.count || 0) / maxCount) * 100;
                return (
                  <div key={idx}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{stage.stage || "N/A"}</span>
                      <span className="font-semibold text-slate-900">{stage.count || 0}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {funnelData.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Chưa có dữ liệu funnel trong thời điểm hiện tại.
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-rose-900">Cần ưu tiên xử lý</h2>
              <span className="text-sm text-slate-500">{urgentRequests.length} mục</span>
            </div>
            {urgentRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Hiện không có mục khẩn cấp.
              </div>
            ) : (
              <div className="space-y-3">
                {urgentRequests.slice(0, 8).map((item, idx) => (
                  <SimpleRow
                    key={idx}
                    title={item.positionTitle || item.candidateName}
                    subtitle={item.departmentName || item.department}
                    extra={item.priority ? `Mức ${item.priority}` : ""}
                    onClick={() =>
                      navigate(item.positionTitle ? "/staff/director/job-requests" : "/staff/director/offers")
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-emerald-900">Phân bổ theo phòng ban</h2>
            {departmentBreakdown.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Chưa có yêu cầu chờ duyệt theo phòng ban.
              </div>
            ) : (
              <div className="space-y-3">
                {departmentBreakdown.map((dept, idx) => (
                  <DeptProgress key={idx} dept={dept} maxPending={stats.pendingJobRequests} />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-3 text-base font-semibold text-violet-900">Hoạt động gần đây</h2>
            {recentActivity.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Chưa có hoạt động gần đây để hiển thị.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, idx) => (
                  <SimpleRow
                    key={idx}
                    title={`${activity.type}: ${activity.title}`}
                    subtitle={`${activity.department} • ${formatDateDisplay(activity.createdAt)}`}
                    extra={activity.priority ? `Mức ${activity.priority}` : ""}
                    onClick={() =>
                      navigate(activity.type === "Job Request" ? "/staff/director/job-requests" : "/staff/director/offers")
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, tone = "slate", icon = "📌" }) => {
  const styles = {
    blue: "border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-900",
    indigo: "border-indigo-200 bg-gradient-to-br from-indigo-50 to-white text-indigo-900",
    red: "border-rose-200 bg-gradient-to-br from-rose-50 to-white text-rose-900",
    slate: "border-slate-200 bg-gradient-to-br from-slate-50 to-white text-slate-900",
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow ${styles[tone] || styles.slate}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white bg-white/80 text-base">
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
};

const MiniStat = ({ label, value }) => (
  <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white px-3 py-3">
    <p className="text-xl font-semibold text-blue-900">{value}</p>
    <p className="mt-1 text-xs text-blue-700">{label}</p>
  </div>
);

const SimpleRow = ({ title, subtitle, extra, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
  >
    <div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{extra}</span>
  </button>
);

const DeptProgress = ({ dept, maxPending }) => {
  const percentage = maxPending > 0 ? (dept.pending / maxPending) * 100 : 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">{dept.name}</p>
        <span className="text-xs text-slate-600">{dept.pending} chờ duyệt</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-600" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">Ngân sách: {formatVND(dept.budget)}</p>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
  </div>
);

export default DirectorDashboard;
