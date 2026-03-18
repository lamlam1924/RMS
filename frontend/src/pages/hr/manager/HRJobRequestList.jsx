import React, { useState, useEffect, useMemo } from "react";
import hrService from "../../../services/hrService";
import {
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  Layers,
  Send,
  CornerUpLeft,
  Clock,
  Inbox,
  XCircle,
} from "lucide-react";
import ActionBanners from "../../../components/common/ActionBanners";
import BulkActionBar, { BulkSelectAll } from "../../../components/common/BulkActionBar";
import HRJobRequestCard from "../../../components/hr/job-requests/HRJobRequestCard";
import ConfirmationModal, { BulkProgressModal } from "../../../components/common/ConfirmationModal";
import QuickReviewModal from "../../../components/hr/QuickReviewModal";
import CommonFilterTab from "../../../components/common/CommonFilterTab";
import CommonPagination from "../../../components/common/CommonPagination";
import StatCards from "../../../components/hr/job-requests/StatCards";
import { toast } from "../../../utils";

/**
 * HRJobRequestList Component - High Efficiency Edition
 * Quản lý danh sách yêu cầu cho HR Manager với tiêu chuẩn chuyên nghiệp
 */
export default function HRJobRequestList() {
  const [allJobRequests, setAllJobRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("needs_action");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({
    total: 0,
    completed: 0,
    succeeded: 0,
    failed: 0,
    processing: false,
    results: []
  });
  
  // Quick review state
  const [showQuickReview, setShowQuickReview] = useState(false);
  const [quickReviewId, setQuickReviewId] = useState(null);

  useEffect(() => {
    loadJobRequests();
  }, []);

  const loadJobRequests = async () => {
    try {
      setLoading(true);
      const allData = await hrService.jobRequests.getAll();
      setAllJobRequests(allData || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách:", error);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filter by tab
  const filterByTab = (list, key) => {
    switch (key) {
      case 'needs_action':   return list.filter(r => r.currentStatus === 'SUBMITTED');
      case 'in_review':      return list.filter(r => r.currentStatus === 'IN_REVIEW');
      case 'returned':       return list.filter(r => r.currentStatus === 'RETURNED');
      case 'approved':       return list.filter(r => r.currentStatus === 'APPROVED');
      case 'rejected':       return list.filter(r => r.currentStatus === 'REJECTED');
      case 'cancel_pending': return list.filter(r => r.currentStatus === 'CANCEL_PENDING');
      case 'cancelled':      return list.filter(r => r.currentStatus === 'CANCELLED');
      default:               return list.filter(r => r.currentStatus !== 'DRAFT');
    }
  };

  const filteredRequests = useMemo(() => {
    let list = filterByTab(allJobRequests, filter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(r =>
        r.positionTitle?.toLowerCase().includes(q) ||
        r.departmentName?.toLowerCase().includes(q) ||
        r.id?.toString().includes(q)
      );
    }
    if (priorityFilter !== "all") {
      if (priorityFilter === "urgent") list = list.filter(r => r.priority === 1);
      else if (priorityFilter === "high") list = list.filter(r => r.priority === 2);
      else if (priorityFilter === "normal") list = list.filter(r => r.priority >= 3 || !r.priority);
    }
    return list;
  }, [allJobRequests, filter, searchTerm, priorityFilter]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map(r => r.id)));
    }
  };

  const handleSelectOne = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk action handlers
  const handleBulkForward = () => {
    setConfirmAction({
      type: 'forward',
      title: 'Chuyển tiếp cho Director',
      message: `Bạn có chắc chắn muốn chuyển tiếp ${selectedIds.size} yêu cầu cho Director phê duyệt?`,
      confirmLabel: 'Chuyển tiếp',
      action: async () => {
        setShowConfirmModal(false);
        setShowProgressModal(true);
        setBulkProgress({ total: selectedIds.size, completed: 0, succeeded: 0, failed: 0, processing: true, results: [] });

        const ids = Array.from(selectedIds);
        const results = await hrService.jobRequests.bulkForward(ids, '');
        
        setBulkProgress({
          total: results.total,
          completed: results.total,
          succeeded: results.succeeded.length,
          failed: results.failed.length,
          processing: false,
          results: results.failed
        });

        if (results.succeeded.length > 0) {
          toast.success(`Đã chuyển tiếp ${results.succeeded.length} yêu cầu`);
          loadJobRequests();
          clearSelection();
        }
        
        if (results.failed.length > 0) {
          toast.error(`${results.failed.length} yêu cầu thất bại`);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const handleBulkReturn = () => {
    setConfirmAction({
      type: 'return',
      title: 'Trả lại cho Trưởng phòng',
      message: `Bạn có chắc chắn muốn trả lại ${selectedIds.size} yêu cầu cho Trưởng phòng chỉnh sửa?`,
      confirmLabel: 'Trả lại',
      action: async () => {
        setShowConfirmModal(false);
        setShowProgressModal(true);
        setBulkProgress({ total: selectedIds.size, completed: 0, succeeded: 0, failed: 0, processing: true, results: [] });

        const ids = Array.from(selectedIds);
        const results = await hrService.jobRequests.bulkReturn(ids, '');
        
        setBulkProgress({
          total: results.total,
          completed: results.total,
          succeeded: results.succeeded.length,
          failed: results.failed.length,
          processing: false,
          results: results.failed
        });

        if (results.succeeded.length > 0) {
          toast.success(`Đã trả lại ${results.succeeded.length} yêu cầu`);
          loadJobRequests();
          clearSelection();
        }
        
        if (results.failed.length > 0) {
          toast.error(`${results.failed.length} yêu cầu thất bại`);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const bulkActions = [
    {
      id: 'forward',
      label: 'Chuyển Director',
      icon: Send,
      color: 'green',
      onClick: handleBulkForward
    },
    {
      id: 'return',
      label: 'Trả lại',
      icon: CornerUpLeft,
      color: 'red',
      onClick: handleBulkReturn
    }
  ];

  const selectedRequests = useMemo(() => {
    return filteredRequests.filter(r => selectedIds.has(r.id)).map(r => ({
      id: r.id,
      title: r.positionTitle
    }));
  }, [filteredRequests, selectedIds]);

  // Stat counts — always from full unfiltered list
  const statCounts = useMemo(() => {
    const submitted     = allJobRequests.filter(r => r.currentStatus === 'SUBMITTED').length;
    const cancelPending = allJobRequests.filter(r => r.currentStatus === 'CANCEL_PENDING').length;
    const inReview      = allJobRequests.filter(r => r.currentStatus === 'IN_REVIEW').length;
    const approved      = allJobRequests.filter(r => r.currentStatus === 'APPROVED').length;
    const returned      = allJobRequests.filter(r => r.currentStatus === 'RETURNED').length;
    const rejected      = allJobRequests.filter(r => r.currentStatus === 'REJECTED').length;
    const cancelled     = allJobRequests.filter(r => r.currentStatus === 'CANCELLED').length;
    return {
      submitted,
      cancel_pending: cancelPending,
      cancelPending,
      in_review: inReview,
      inReview,
      approved,
      returned,
      rejected,
      cancelled,
      needs_action: submitted,
      needsAction: submitted,
      all: allJobRequests.filter(r => r.currentStatus !== 'DRAFT').length,
    };
  }, [allJobRequests]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  // Reset page khi filter hoặc search thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, priorityFilter]);

  // Danh sách tabs cho CommonFilterTab
  const filterTabs = [
    { id: "all",            label: "Tất cả",          icon: <Inbox className="w-3 h-3" /> },
    { id: "needs_action",   label: "Cần xử lý",       icon: <Send className="w-3 h-3" /> },
    { id: "cancel_pending", label: "Duyệt hủy",       icon: <AlertCircle className="w-3 h-3" /> },
    { id: "in_review",      label: "Chờ Director",    icon: <Clock className="w-3 h-3" /> },
    { id: "returned",       label: "Đã trả lại",      icon: <CornerUpLeft className="w-3 h-3" /> },
    { id: "approved",       label: "Đã duyệt",        icon: <CheckCircle className="w-3 h-3" /> },
    { id: "rejected",       label: "Từ chối",          icon: <AlertCircle className="w-3 h-3" /> },
    { id: "cancelled",      label: "Đã hủy",           icon: <XCircle className="w-3 h-3" /> },
  ];

  // Action banners — standardized shape for common/ActionBanners
  const banners = useMemo(() => {
    const result = [];
    if (statCounts.cancelPending > 0) result.push({
      id: 'cancel_pending',
      color: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30',
      iconBg: 'bg-orange-100 dark:bg-orange-900/60',
      iconColor: 'text-orange-600 dark:text-orange-400',
      icon: <AlertCircle className="w-4 h-4" />,
      text: `${statCounts.cancelPending} yêu cầu hủy đang chờ xử lý`,
      sub: 'Trưởng bộ phận đã gửi yêu cầu hủy — cần phê duyệt hoặc từ chối.',
      actionLabel: `Xem (${statCounts.cancelPending})`,
      filterTarget: 'cancel_pending',
    });
    if (statCounts.submitted > 0) result.push({
      id: 'submitted',
      color: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30',
      iconBg: 'bg-blue-100 dark:bg-blue-900/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
      icon: <Send className="w-4 h-4" />,
      text: `${statCounts.submitted} yêu cầu mới chờ thẩm định`,
      sub: 'Trưởng bộ phận đã gửi yêu cầu, đang chờ bạn xem xét.',
      actionLabel: `Xem (${statCounts.submitted})`,
      filterTarget: 'needs_action',
    });
    return result;
  }, [statCounts]);

  // Quick review handlers
  const handleOpenQuickReview = (e, id) => {
    e.stopPropagation();
    setQuickReviewId(id);
    setShowQuickReview(true);
  };

  const handleQuickReviewAction = async (id, actionType, note) => {
    try {
      if (actionType === 'forward') {
        await hrService.jobRequests.forwardToDirector(id, note);
        toast.success('Đã chuyển tiếp yêu cầu cho Director');
      } else if (actionType === 'return') {
        await hrService.jobRequests.returnToDeptManager(id, note);
        toast.success('Đã trả lại yêu cầu cho Trưởng phòng');
      }
      await loadJobRequests();
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra');
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      <div className="fixed top-20 -right-20 w-80 h-80 bg-blue-50/50 dark:bg-blue-900/20 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em]">
                Recruitment Management
              </span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Yêu cầu Tuyển dụng
            </h1>
            <p className="mt-2 text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-widest">
              Đang có {filteredRequests.length} hồ sơ cần theo dõi
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <StatCards
          statCounts={statCounts}
          currentFilter={filter}
          onFilterChange={setFilter}
        />

        {/* Action Banners */}
        <ActionBanners banners={banners} onFilterChange={setFilter} />

        {/* Search & Filters Section */}
        <div className="space-y-6 mb-10 animate-in fade-in duration-700 delay-100">
          {/* Filter Tabs */}
          <CommonFilterTab
            filters={filterTabs}
            statCounts={statCounts}
            currentFilter={filter}
            onFilterChange={setFilter}
          />

          {/* Priority Filters */}
          <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
            {[
              { id: "all",    label: "Tất cả ưu tiên" },
              { id: "urgent", label: "🔥 Khẩn cấp" },
              { id: "high",   label: "⚡ Cao" },
              { id: "normal", label: "Bình thường" },
            ].map(p => (
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

          {/* Search Bar */}
          <div className="flex gap-4 items-center">
            {filter === "needs_action" && filteredRequests.filter(r => r.status?.code === 'SUBMITTED').length > 0 && (
              <BulkSelectAll
                checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
                indeterminate={selectedIds.size > 0 && selectedIds.size < filteredRequests.length}
                onChange={handleSelectAll}
                totalCount={filteredRequests.length}
                selectedCount={selectedIds.size}
              />
            )}
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm vị trí, bộ phận, mã yêu cầu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 bg-white rounded-[2rem] p-8 border border-slate-50 shadow-sm animate-pulse"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-2xl mb-6"></div>
                <div className="h-6 bg-slate-50 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-slate-50 rounded w-1/2 mb-10"></div>
                <div className="h-12 bg-slate-50 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-32 bg-white dark:bg-slate-800 rounded-[3rem] border border-dashed border-slate-100 dark:border-slate-700 shadow-sm animate-in zoom-in duration-700">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-8">
              <FileText className="w-8 h-8 text-slate-200 dark:text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Trống trải quá...
            </h2>
            <p className="text-slate-400 dark:text-slate-500 mt-2 font-medium uppercase text-[10px] tracking-widest">
              {filter === "pending"
                ? "Mọi yêu cầu đã được xử lý xong!"
                : "Chưa có dữ liệu nào."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {paginatedRequests.map((request) => (
                <HRJobRequestCard
                  key={request.id}
                  request={request}
                  isSelected={selectedIds.has(request.id)}
                  onSelect={handleSelectOne}
                  onQuickReview={handleOpenQuickReview}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <CommonPagination
                totalPages={totalPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            )}
          </>
        )}
      </div>

      <footer className="mt-24 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] opacity-30">
          RMS Recruitment Excellence Engine
        </p>
      </footer>



      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={clearSelection}
        actions={bulkActions}
        loading={false}
      />

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmAction.action}
          title={confirmAction.title}
          message={confirmAction.message}
          type={confirmAction.type === 'forward' ? 'info' : 'warning'}
          confirmLabel={confirmAction.confirmLabel}
          itemCount={selectedIds.size}
          items={selectedRequests}
        />
      )}

      {/* Bulk Progress Modal */}
      <BulkProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="Đang xử lý hàng loạt"
        total={bulkProgress.total}
        completed={bulkProgress.completed}
        succeeded={bulkProgress.succeeded}
        failed={bulkProgress.failed}
        processing={bulkProgress.processing}
        results={bulkProgress.results}
      />

      {/* Quick Review Modal */}
      <QuickReviewModal
        isOpen={showQuickReview}
        onClose={() => {
          setShowQuickReview(false);
          setQuickReviewId(null);
        }}
        requestId={quickReviewId}
        onAction={handleQuickReviewAction}
        fetchDetails={hrService.jobRequests.getById}
      />

    </div>
  );
}




