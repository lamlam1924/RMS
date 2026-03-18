import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import deptManagerService from "../../services/deptManagerService";
import { calculateDaysPending } from "../../utils/helpers/dateUtils";
import {
  Plus,
  Search,
  Briefcase,
  Clock,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  FilePlus,
  FileText,
  CheckCircle2,
  Inbox,
  RotateCcw,
  Hourglass,
} from "lucide-react";
import StatCards from "../../components/department-manager/job-requests/StatCards";
import ActionBanners from "../../components/common/ActionBanners";
import JobRequestCard from "../../components/department-manager/job-requests/JobRequestCard";

/**
 * DeptManagerJobRequestList Component - Refined Edition
 * Quản lý yêu cầu tuyển dụng cho Trưởng bộ phận với giao diện đồng bộ
 */
export default function DeptManagerJobRequestList() {
  const navigate = useNavigate();
  const [jobRequests, setJobRequests] = useState([]);
  const [allJobRequests, setAllJobRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    loadJobRequests();
  }, [filter]);

  const loadJobRequests = async () => {
    try {
      setLoading(true);
      const data = await deptManagerService.jobRequests.getAll();
      const all = data || [];
      setAllJobRequests(all);

      let filtered = all;
      if (filter === "draft") {
        filtered = all.filter((jr) => jr.statusCode === "DRAFT");
      } else if (filter === "pending") {
        filtered = all.filter((jr) =>
          ["SUBMITTED", "IN_REVIEW"].includes(jr.statusCode)
        );
      } else if (filter === "approved") {
        filtered = all.filter((jr) => jr.statusCode === "APPROVED");
      } else if (filter === "returned") {
        filtered = all.filter((jr) => jr.statusCode === "RETURNED");
      } else if (filter === "cancel_pending") {
        filtered = all.filter((jr) => jr.statusCode === "CANCEL_PENDING");
      } else if (filter === "cancelled") {
        filtered = all.filter((jr) => jr.statusCode === "CANCELLED");
      } else if (filter === "rejected") {
        filtered = all.filter((jr) => jr.statusCode === "REJECTED");
      }

      setJobRequests(filtered);
    } catch (error) {
      console.error("Failed to load job requests:", error);
    } finally {
      setLoading(false);
    }
  };;

  const filteredRequests = useMemo(() => {
    let filtered = jobRequests.filter(
      (req) =>
        req.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.id.toString().includes(searchTerm),
    );

    // Filter by priority
    if (priorityFilter !== "all") {
      if (priorityFilter === "urgent") filtered = filtered.filter(r => r.priority === 1);
      else if (priorityFilter === "high") filtered = filtered.filter(r => r.priority === 2);
      else if (priorityFilter === "normal") filtered = filtered.filter(r => r.priority >= 3 || !r.priority);
    }

    return filtered;
  }, [jobRequests, searchTerm, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  // Reset page when filter changes  
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, priorityFilter]);

  // Stat counts (always from full unfiltered list)
  const statCounts = useMemo(() => ({
    draft:      allJobRequests.filter(jr => jr.statusCode === "DRAFT").length,
    returned:   allJobRequests.filter(jr => jr.statusCode === "RETURNED").length,
    processing: allJobRequests.filter(jr => ["SUBMITTED","IN_REVIEW","CANCEL_PENDING"].includes(jr.statusCode)).length,
    approved:   allJobRequests.filter(jr => jr.statusCode === "APPROVED").length,
    // per-tab counts
    pending:      allJobRequests.filter(jr => ["SUBMITTED","IN_REVIEW"].includes(jr.statusCode)).length,
    cancelPending: allJobRequests.filter(jr => jr.statusCode === "CANCEL_PENDING").length,
    cancelled:    allJobRequests.filter(jr => jr.statusCode === "CANCELLED").length,
    rejected:     allJobRequests.filter(jr => jr.statusCode === "REJECTED").length,
    all:          allJobRequests.length,
  }), [allJobRequests]);

  // Action banners
  const allBanners = useMemo(() => {
    const banners = [];
    if (statCounts.returned > 0) {
      banners.push({
        id: "returned",
        priority: 1,
        color: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
        iconBg: "bg-orange-100 dark:bg-orange-900/60",
        iconColor: "text-orange-600 dark:text-orange-400",
        icon: <RotateCcw className="w-4 h-4" />,
        text: `${statCounts.returned} yêu cầu bị trả về — cần chỉnh sửa theo phản hồi HR`,
        actionLabel: `Xem (${statCounts.returned})`,
        filterTarget: "returned",
      });
    }
    const oldDrafts = allJobRequests.filter(
      jr => jr.statusCode === "DRAFT" && calculateDaysPending(jr.createdAt) > 1
    ).length;
    if (oldDrafts > 0) {
      banners.push({
        id: "old_draft",
        priority: 2,
        color: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
        iconBg: "bg-amber-100 dark:bg-amber-900/60",
        iconColor: "text-amber-600 dark:text-amber-400",
        icon: <FileText className="w-4 h-4" />,
        text: `${oldDrafts} bản nháp chưa gửi duyệt hơn 1 ngày`,
        actionLabel: `Xem (${oldDrafts})`,
        filterTarget: "draft",
      });
    }
    if (statCounts.cancelPending > 0) {
      banners.push({
        id: "cancel_pending",
        priority: 3,
        color: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
        iconBg: "bg-blue-100 dark:bg-blue-900/60",
        iconColor: "text-blue-600 dark:text-blue-400",
        icon: <Hourglass className="w-4 h-4" />,
        text: `${statCounts.cancelPending} yêu cầu hủy đang chờ HR xử lý`,
        actionLabel: `Xem (${statCounts.cancelPending})`,
        filterTarget: "cancel_pending",
      });
    }
    return banners;
  }, [allJobRequests, statCounts]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      <div className="fixed top-40 -left-20 w-80 h-80 bg-blue-50/40 dark:bg-blue-900/20 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-600 rounded-2xl shadow-md">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                Department Portal
              </span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Quản lý Tuyển dụng
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-widest">
              {filteredRequests.length} yêu cầu trong hệ thống
            </p>
          </div>

          <button
            onClick={() => navigate("/staff/dept-manager/job-requests/new")}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">
              Tạo yêu cầu mới
            </span>
          </button>
        </div>

        {/* === ROW 1: Stat Cards === */}
        <StatCards
          statCounts={statCounts}
          currentFilter={filter}
          onFilterChange={setFilter}
        />

        {/* === ROW 2: Action Banners === */}
        <ActionBanners banners={allBanners} onFilterChange={setFilter} />

        {/* Search & Filters */}
        <div className="space-y-6 mb-10 animate-in fade-in duration-700 delay-100">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
              {[
                { id: "all",            label: "Tất cả",       icon: <Inbox className="w-3 h-3" />,                    count: statCounts.all },
                { id: "draft",          label: "Bản nháp",     icon: <FileText className="w-3 h-3" />,                  count: statCounts.draft },
                { id: "pending",        label: "Đang chờ",     icon: <Clock className="w-3 h-3" />,                     count: statCounts.pending },
                { id: "approved",       label: "Đã duyệt",     icon: <CheckCircle2 className="w-3 h-3" />,              count: statCounts.approved },
                { id: "returned",       label: "Bị trả",       icon: <span className="text-[10px]">↩</span>,            count: statCounts.returned },
                { id: "cancel_pending", label: "Chờ duyệt hủy", icon: <span className="text-[10px]">⏳</span>,           count: statCounts.cancelPending },
                { id: "cancelled",      label: "Đã hủy",        icon: <span className="text-[10px]">×</span>,             count: statCounts.cancelled },
                { id: "rejected",       label: "Từ chối",        icon: <span className="text-[10px]">🚫</span>,            count: statCounts.rejected },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                    filter === f.id
                      ? "bg-slate-900 dark:bg-slate-700 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {f.icon} {f.label}
                  {f.count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                      filter === f.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Priority Filters */}
            <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
              {[
                { id: "all", label: "Tất cả ưu tiên" },
                { id: "urgent", label: "🔥 Khẩn cấp" },
                { id: "high", label: "⚡ Cao" },
                { id: "normal", label: "Bình thường" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriorityFilter(p.id)}
                  className={`px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                    priorityFilter === p.id
                      ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm vị trí, mã yêu cầu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 border border-slate-50 dark:border-slate-700 animate-pulse"
              ></div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-32 bg-white dark:bg-slate-800 rounded-[3rem] border border-dashed border-slate-100 dark:border-slate-700 shadow-sm animate-in zoom-in duration-700">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-8">
              <FilePlus className="w-8 h-8 text-slate-200 dark:text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Chưa có yêu cầu nào
            </h2>
            <p className="text-slate-400 dark:text-slate-500 mt-2 font-medium">
              {filter === "all"
                ? "Bắt đầu bằng việc khởi tạo yêu cầu tuyển dụng đầu tiên."
                : "Không có yêu cầu nào phù hợp."}
            </p>
            {filter === "all" && (
              <button
                onClick={() => navigate("/staff/dept-manager/job-requests/new")}
                className="mt-10 px-10 py-4 bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md hover:bg-slate-800 dark:hover:bg-slate-600 transition-all active:scale-95"
              >
                Khởi tạo ngay
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {paginatedRequests.map((request) => (
                <JobRequestCard key={request.id} request={request} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-16">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-12 h-12 rounded-2xl text-sm font-bold transition-all ${
                        currentPage === i + 1
                          ? 'bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-600 text-white shadow-md'
                          : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="mt-24 text-center select-none opacity-30">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.5em]">
          RMS • Recruitment Innovation System
        </p>
      </footer>
    </div>
  );
}
