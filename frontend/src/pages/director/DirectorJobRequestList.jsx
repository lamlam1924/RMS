import React, { useState, useEffect, useMemo, useRef } from "react";
import directorService from "../../services/directorService";
import { toast } from "../../utils";
import { useDirectorJobRequestActions } from "../../hooks/director/useDirectorJobRequestActions";
import {
  CheckCircle, XCircle, RotateCcw, Search, RefreshCw,
  Download, ChevronDown, X, FileSpreadsheet, File,
  CheckSquare, Square, Inbox, Hourglass, Layout,
  History, CalendarRange,
} from "lucide-react";

import CommonFilterTab from "../../components/common/CommonFilterTab";
import { exportToExcel, exportToPDF } from "../../components/director/job-requests/exportHelpers";
import JobRequestListItem from "../../components/director/job-requests/JobRequestListItem";
import JobRequestActionModal from "../../components/director/job-requests/JobRequestActionModal";
import JobRequestDetailPanel from "../../components/director/job-requests/JobRequestDetailPanel";

// ── Status code mapping ───────────────────────────────────────────────────

const STATUS_CODE_MAP = {
  pending:  "IN_REVIEW",
  approved: "APPROVED",
  rejected: "REJECTED",
  returned: "RETURNED",
};

// ── Filter tab definitions ────────────────────────────────────────────────

const FILTER_TABS = [
  { id: "all",      label: "Tất cả",     icon: <Inbox className="w-3 h-3" /> },
  { id: "pending",  label: "Chờ duyệt",  icon: <Hourglass className="w-3 h-3" /> },
  { id: "approved", label: "Đã duyệt",   icon: <CheckCircle className="w-3 h-3" /> },
  { id: "rejected", label: "Từ chối",     icon: <XCircle className="w-3 h-3" /> },
  { id: "returned", label: "Đã trả lại", icon: <RotateCcw className="w-3 h-3" /> },
];

// ── Priority filter definitions ───────────────────────────────────────────

// Compact chips
const PRIORITY_CHIPS = [
  { id: "urgent", label: "🔥 Khẩn",    activeClass: "bg-red-600 text-white border-red-600" },
  { id: "high",   label: "⚡ Cao",       activeClass: "bg-amber-500 text-white border-amber-500" },
  { id: "normal", label: "Bình thường", activeClass: "bg-slate-600 text-white border-slate-600" },
];

// ── Page size ─────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

// ═══════════════════════════════════════════════════════════════════════════

export default function DirectorJobRequestList() {
  // ── Data state ───────────────────────────────────────────────────────────
  const [pendingRequests, setPendingRequests] = useState([]);
  const [processedRequests, setProcessedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Detail panel ─────────────────────────────────────────────────────────
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  // ── Pagination ───────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── Selection + actions ──────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState([]);
  const {
    approve,
    reject,
    returnRequest,
    loading: actionLoading,
  } = useDirectorJobRequestActions();
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [comment, setComment] = useState("");

  // ── Export dropdown ──────────────────────────────────────────────────────
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target))
        setShowExport(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Data loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    loadAllRequests();
  }, []);

  useEffect(() => {
    if (selectedRequestId) loadRequestDetail(selectedRequestId);
  }, [selectedRequestId]);

  // Reset selection and page when filters change
  useEffect(() => {
    setSelectedRequestId(null);
    setSelectedRequestDetail(null);
    setSelectedIds([]);
    setCurrentPage(1);
  }, [activeTab, searchTerm, priorityFilter, filterDept, dateFrom, dateTo]);

  const loadAllRequests = async () => {
    try {
      setLoading(true);
      const [pendingData, processedData] = await Promise.all([
        directorService.jobRequests.getPending(),
        directorService.jobRequests.getProcessed(),
      ]);
      setPendingRequests(pendingData || []);
      setProcessedRequests(processedData || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách:", err);
      toast.error("Không thể tải danh sách yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  const loadRequestDetail = async (id) => {
    try {
      setDetailLoading(true);
      const detail = await directorService.jobRequests.getDetail(id);
      setSelectedRequestDetail(detail);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Computed values ──────────────────────────────────────────────────────

  const allRequests = useMemo(
    () => [...pendingRequests, ...processedRequests],
    [pendingRequests, processedRequests]
  );

  // Stat counts for CommonFilterTab badges
  const statCounts = useMemo(() => ({
    all:      allRequests.length,
    pending:  pendingRequests.length,
    approved: processedRequests.filter((r) => r.currentStatusCode === "APPROVED").length,
    rejected: processedRequests.filter((r) => r.currentStatusCode === "REJECTED").length,
    returned: processedRequests.filter((r) => r.currentStatusCode === "RETURNED").length,
  }), [allRequests, pendingRequests, processedRequests]);

  // Current list based on active tab
  const currentList = useMemo(() => {
    if (activeTab === "all") return allRequests;
    if (activeTab === "pending") return pendingRequests;
    const code = STATUS_CODE_MAP[activeTab];
    return processedRequests.filter((r) => r.currentStatusCode === code);
  }, [activeTab, allRequests, pendingRequests, processedRequests]);

  // Department options (dynamic from currentList)
  const departments = useMemo(() => {
    const deptSet = new Set(currentList.map((r) => r.departmentName).filter(Boolean));
    return ["all", ...Array.from(deptSet).sort()];
  }, [currentList]);

  // Filtered + searched requests
  const filteredRequests = useMemo(() => {
    return currentList.filter((req) => {
      // Search filter
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        req.positionTitle?.toLowerCase().includes(term) ||
        req.id?.toString().includes(term) ||
        req.departmentName?.toLowerCase().includes(term) ||
        req.requestedByName?.toLowerCase().includes(term);

      // Department filter
      const matchDept = filterDept === "all" || req.departmentName === filterDept;

      // Priority filter
      let matchPriority = true;
      if (priorityFilter === "urgent") matchPriority = req.priority === 1;
      else if (priorityFilter === "high") matchPriority = req.priority === 2;
      else if (priorityFilter === "normal") matchPriority = req.priority >= 3 || !req.priority;

      // Date filter — normalize to date-only (YYYY-MM-DD) comparison to avoid timezone issues
      let matchDate = true;
      if (dateFrom || dateTo) {
        const reqDateStr = req.createdAt ? req.createdAt.slice(0, 10) : null;
        if (reqDateStr) {
          if (dateFrom && reqDateStr < dateFrom) matchDate = false;
          if (dateTo && reqDateStr > dateTo) matchDate = false;
        } else {
          matchDate = false;
        }
      }

      return matchSearch && matchDept && matchPriority && matchDate;
    });
  }, [currentList, searchTerm, filterDept, priorityFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  const isPendingTab = activeTab === "pending";
  // isReadOnly → dựa trên status của request đang chọn, không phải tab
  // IN_REVIEW = HR đã chuyển tiếp lên Director → Director có thể phê duyệt
  const selectedIsActionable = selectedRequestDetail?.currentStatusCode === "IN_REVIEW";
  const isReadOnly = !selectedIsActionable;
  const hasDateFilter = dateFrom || dateTo;
  const hasActiveFilters = searchTerm || priorityFilter !== "all" || filterDept !== "all" || hasDateFilter;

  // ── Selection helpers ────────────────────────────────────────────────────

  const toggleSelectAll = () =>
    setSelectedIds(
      selectedIds.length === paginatedRequests.length && paginatedRequests.length > 0
        ? []
        : paginatedRequests.map((r) => r.id)
    );

  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  // ── Action handlers ──────────────────────────────────────────────────────

  const openAction = (type) => {
    setActionType(type);
    setComment("");
    setShowActionModal(true);
  };

  const executeAction = async () => {
    if ((actionType === "reject" || actionType === "return") && !comment.trim()) {
      toast.error("Vui lòng nhập lý do.");
      return;
    }
    const ids = selectedIds.length > 0 ? selectedIds : [selectedRequestId];
    const after = () => {
      setShowActionModal(false);
      setSelectedIds([]);
      loadAllRequests();
    };
    try {
      if (actionType === "approve") {
        await approve(ids, comment, () => {
          toast.success(`Đã phê duyệt ${ids.length} yêu cầu.`);
          after();
        });
      } else if (actionType === "reject") {
        await reject(ids, comment, () => {
          toast.success(`Đã từ chối ${ids.length} yêu cầu.`);
          after();
        });
      } else {
        await returnRequest(ids, comment, () => {
          toast.success(`Đã trả lại ${ids.length} yêu cầu.`);
          after();
        });
      }
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra.");
    }
  };

  const activeTabLabel = FILTER_TABS.find((t) => t.id === activeTab)?.label ?? "Tất cả";

  const clearAllFilters = () => {
    setSearchTerm("");
    setPriorityFilter("all");
    setFilterDept("all");
    setDateFrom("");
    setDateTo("");
    setShowDateFilter(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-slate-900 overflow-hidden transition-colors">

      {/* ═══ HEADER ═══ */}
      <header className="h-[68px] bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              Duyệt Yêu cầu Tuyển dụng
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {statCounts.pending} chờ duyệt &bull; {statCounts.approved + statCounts.rejected + statCounts.returned} đã xử lý
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Batch action buttons — visible when items selected on pending tab */}
          {isPendingTab && selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-1 rounded-xl animate-in fade-in slide-in-from-right-4">
              <span className="px-2 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Đã chọn {selectedIds.length}
              </span>
              <button
                onClick={() => openAction("approve")}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-all"
              >
                <CheckCircle className="w-3 h-3" /> Duyệt
              </button>
              <button
                onClick={() => openAction("return")}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-all"
              >
                <RotateCcw className="w-3 h-3" /> Trả lại
              </button>
              <button
                onClick={() => openAction("reject")}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 transition-all"
              >
                <XCircle className="w-3 h-3" /> Từ chối
              </button>
            </div>
          )}

          {/* Export dropdown */}
          {/* <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExport((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-650 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => { exportToExcel(filteredRequests, activeTabLabel); setShowExport(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Xuất Excel (.xlsx)
                </button>
                <div className="border-t border-slate-100 dark:border-slate-700" />
                <button
                  onClick={() => { exportToPDF(filteredRequests, activeTabLabel); setShowExport(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <File className="w-4 h-4 text-red-500" /> Xuất PDF (.pdf)
                </button>
              </div>
            )}
          </div> */}

          {/* Refresh button */}
          <button
            onClick={loadAllRequests}
            title="Tải lại"
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
          </button>
        </div>
      </header>

      {/* ═══ STATUS FILTER TABS ═══ */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 shrink-0">
        <CommonFilterTab
          filters={FILTER_TABS}
          statCounts={statCounts}
          currentFilter={activeTab}
          onFilterChange={setActiveTab}
        />
      </div>

      {/* ═══ MAIN CONTENT — Split Panel ═══ */}
      <main className="flex flex-1 overflow-hidden">

        {/* ─── Left sidebar: list ─── */}
        <div className="w-[380px] border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col shrink-0">

          {/* Filters area */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm vị trí, mã YC, phòng ban..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Row 2: Department dropdown (full width) */}
            <div className="relative">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className={`w-full appearance-none px-3 py-2 pr-7 bg-slate-50 dark:bg-slate-700 border rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all ${
                  filterDept !== "all"
                    ? "border-blue-400 text-blue-700 dark:text-blue-300 dark:border-blue-500"
                    : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                }`}
              >
                <option value="all">Tất cả phòng ban</option>
                {departments.filter((d) => d !== "all").map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Row 3: Priority chips (toggle) + Date button */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">UT:</span>
              {PRIORITY_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setPriorityFilter((v) => v === chip.id ? "all" : chip.id)}
                  className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all shrink-0 ${
                    priorityFilter === chip.id
                      ? chip.activeClass
                      : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {chip.label}
                </button>
              ))}

              {/* spacer */}
              <span className="flex-1" />

              {/* Date filter toggle */}
              <button
                onClick={() => setShowDateFilter((v) => !v)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all shrink-0 max-w-[120px] ${
                  hasDateFilter
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <CalendarRange className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {hasDateFilter
                    ? `${dateFrom ? dateFrom.slice(5).replace("-", "/") : "…"}→${dateTo ? dateTo.slice(5).replace("-", "/") : "…"}`
                    : "Ngày"}
                </span>
                {hasDateFilter && (
                  <X
                    className="w-3 h-3 shrink-0"
                    onClick={(e) => { e.stopPropagation(); setDateFrom(""); setDateTo(""); }}
                  />
                )}
              </button>
            </div>

            {/* Date range inputs (collapsible) */}
            {showDateFilter && (
              <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>
            )}

            {/* Select all + count row */}
            <div className="flex items-center justify-between">
              {isPendingTab ? (
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase hover:text-blue-600 transition-colors"
                >
                  {selectedIds.length === paginatedRequests.length && paginatedRequests.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  Chọn tất cả
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-700 uppercase transition-colors"
                  >
                    Xoá lọc
                  </button>
                )}
                <span className="text-[10px] font-bold text-slate-400">
                  {filteredRequests.length} kết quả
                </span>
              </div>
            </div>
          </div>

          {/* Request list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-slate-50 dark:bg-slate-700/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : paginatedRequests.length > 0 ? (
              <div className="p-3 space-y-1">
                {paginatedRequests.map((req) => (
                  <JobRequestListItem
                    key={req.id}
                    request={req}
                    isSelected={selectedRequestId === req.id}
                    isChecked={selectedIds.includes(req.id)}
                    isPendingTab={isPendingTab}
                    onSelect={() => setSelectedRequestId(req.id)}
                    onCheck={() => toggleSelect(req.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4">
                  <History className="w-7 h-7 text-slate-300 dark:text-slate-500" />
                </div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                  {hasActiveFilters ? "Không tìm thấy kết quả" : "Không có yêu cầu nào"}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-3 text-xs text-blue-500 font-semibold hover:text-blue-700 transition-colors"
                  >
                    Xoá tất cả bộ lọc
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination — at the bottom of sidebar */}
          {totalPages > 1 && (
            <div className="border-t border-slate-200 dark:border-slate-700 py-3 px-4 shrink-0 bg-white dark:bg-slate-800">
              <div className="flex items-center justify-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs"
                >
                  ‹
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${
                      currentPage === i + 1
                        ? "bg-slate-900 dark:bg-slate-600 text-white shadow-sm"
                        : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Right panel: detail ─── */}
        <div className="flex-1 bg-[#f8fafc] dark:bg-slate-900 overflow-y-auto custom-scrollbar">
          {detailLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selectedRequestDetail ? (
            <JobRequestDetailPanel
              detail={selectedRequestDetail}
              isReadOnly={isReadOnly}
              onApprove={() => { setSelectedIds([]); openAction("approve"); }}
              onReturn={() => { setSelectedIds([]); openAction("return"); }}
              onReject={() => { setSelectedIds([]); openAction("reject"); }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-16 animate-in fade-in">
              <div className="w-28 h-28 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                <Layout className="w-10 h-10 text-slate-200 dark:text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                {isPendingTab ? "Sẵn sàng thẩm định" : activeTab === "all" ? "Chọn một yêu cầu" : "Xem lịch sử xử lý"}
              </h2>
              <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs">
                Chọn một yêu cầu từ danh sách để xem chi tiết và lịch sử.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ═══ ACTION MODAL ═══ */}
      {showActionModal && (
        <JobRequestActionModal
          actionType={actionType}
          comment={comment}
          onCommentChange={setComment}
          onConfirm={executeAction}
          onCancel={() => setShowActionModal(false)}
          isLoading={actionLoading}
          batchCount={selectedIds.length}
        />
      )}

      {/* ═══ Custom scrollbar styles ═══ */}
      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 8px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
