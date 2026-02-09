import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import hrService from "../../../services/hrService";
import { formatVND } from "../../../utils/formatters/currency";
import { formatDateDisplay } from "../../../utils/formatters/date";
import {
  Search,
  Filter,
  Briefcase,
  Clock,
  ChevronRight,
  RefreshCw,
  FileText,
  AlertCircle,
  MoreVertical,
  Layers,
  Send,
  CornerUpLeft,
  Eye,
} from "lucide-react";
import SLABadge from "../../../components/common/SLABadge";
import BulkActionBar, { BulkSelectCheckbox, BulkSelectAll } from "../../../components/common/BulkActionBar";
import ConfirmationModal, { BulkProgressModal } from "../../../components/common/ConfirmationModal";
import QuickReviewModal from "../../../components/hr/QuickReviewModal";
import { toast } from "../../../utils";

/**
 * HRJobRequestList Component - High Efficiency Edition
 * Quản lý danh sách yêu cầu cho HR Manager với tiêu chuẩn chuyên nghiệp
 */
export default function HRJobRequestList() {
  const navigate = useNavigate();
  const [jobRequests, setJobRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // 'pending', 'all', 'in_review', 'returned', 'approved', 'rejected'
  const [searchTerm, setSearchTerm] = useState("");
  
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
  }, [filter]);

  const loadJobRequests = async () => {
    try {
      setLoading(true);
      let data;
      
      if (filter === "pending") {
        data = await hrService.jobRequests.getPending();
      } else if (filter === "all") {
        data = await hrService.jobRequests.getAll();
      } else {
        // Gọi API theo status code: in_review, returned, approved, rejected
        const statusMap = {
          'in_review': 'IN_REVIEW',
          'returned': 'RETURNED',
          'approved': 'APPROVED',
          'rejected': 'REJECTED'
        };
        const statusCode = statusMap[filter];
        if (statusCode) {
          data = await hrService.jobRequests.getByStatus(statusCode);
        } else {
          data = await hrService.jobRequests.getAll();
        }
      }
      
      setJobRequests(data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    // Không cần filter nữa vì đã filter từ backend
    return jobRequests.filter(
      (req) =>
        req.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.id.toString().includes(searchTerm),
    );
  }, [jobRequests, searchTerm]);

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
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      <div className="fixed top-20 -right-20 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl -z-10"></div>

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
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Yêu cầu Tuyển dụng
            </h1>
            <p className="mt-2 text-slate-400 font-semibold text-xs uppercase tracking-widest">
              Đang có {jobRequests.length} hồ sơ cần theo dõi
            </p>
          </div>
        </div>

        {/* Search & Filters Section */}
        <div className="space-y-6 mb-10 animate-in fade-in duration-700 delay-100">
          {/* Filter Tabs */}
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            <TabButton
              active={filter === "pending"}
              onClick={() => setFilter("pending")}
              label="CHỜ XỬ LÝ"
            />
            <TabButton
              active={filter === "in_review"}
              onClick={() => setFilter("in_review")}
              label="CHỜ DIRECTOR"
              icon="🔍"
            />
            <TabButton
              active={filter === "returned"}
              onClick={() => setFilter("returned")}
              label="ĐÃ TRẢ LẠI"
              icon="↩"
            />
            <TabButton
              active={filter === "approved"}
              onClick={() => setFilter("approved")}
              label="ĐÃ DUYỆT"
              icon="✓"
            />
            <TabButton
              active={filter === "rejected"}
              onClick={() => setFilter("rejected")}
              label="TỪ CHỐI"
              icon="✕"
            />
            <TabButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="TẤT CẢ"
            />
          </div>

          {/* Search Bar */}
          <div className="flex gap-4 items-center">
            {filter === "pending" && filteredRequests.length > 0 && (
              <BulkSelectAll
                checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
                indeterminate={selectedIds.size > 0 && selectedIds.size < filteredRequests.length}
                onChange={handleSelectAll}
                totalCount={filteredRequests.length}
                selectedCount={selectedIds.size}
              />
            )}
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm kiếm vị trí, bộ phận, mã yêu cầu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
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
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-100 shadow-sm animate-in zoom-in duration-700">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <FileText className="w-8 h-8 text-slate-200" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Trống trải quá...
            </h2>
            <p className="text-slate-400 mt-2 font-medium uppercase text-[10px] tracking-widest">
              {filter === "pending"
                ? "Mọi yêu cầu đã được xử lý xong!"
                : "Chưa có dữ liệu nào."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {filteredRequests.map((request) => {
              const isSelected = selectedIds.has(request.id);
              const canSelect = filter === "pending";
              
              return (
                <div
                  key={request.id}
                  onClick={() => {
                    if (!canSelect) {
                      navigate(`/staff/hr-manager/job-requests/${request.id}`);
                    }
                  }}
                  className={`group relative bg-white rounded-[2.5rem] p-10 border shadow-sm hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all cursor-pointer overflow-hidden ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-100'
                  }`}
                >
                  {/* Selection Checkbox */}
                  {canSelect && (
                    <div className="absolute top-6 left-6 z-20">
                      <BulkSelectCheckbox
                        checked={isSelected}
                        onChange={() => handleSelectOne(request.id)}
                      />
                    </div>
                  )}

                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div 
                        onClick={(e) => {
                          if (canSelect) {
                            e.stopPropagation();
                            navigate(`/staff/hr-manager/job-requests/${request.id}`);
                          }
                        }}
                        className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all flex items-center justify-center font-bold text-xl shadow-sm"
                      >
                        {request.positionTitle.charAt(0)}
                      </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                          request.statusId === 21
                            ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                            : "bg-slate-50 text-slate-500 border-slate-100"
                        }`}
                      >
                        {request.currentStatus}
                      </span>
                      {request.priority <= 2 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-500 rounded-md animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-[8px] font-bold uppercase tracking-tighter">
                            Urgent
                          </span>
                        </div>
                      )}
                      {/* SLA Badge */}
                      <SLABadge 
                        createdDate={request.createdAt} 
                        priority={request.priority} 
                        status={request.currentStatus}
                        size="sm"
                        showTime={false}
                      />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 truncate group-hover:text-blue-600 transition-colors">
                    {request.positionTitle}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-10">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{request.departmentName}</span>
                    <span className="mx-1 opacity-30">•</span>
                    <span>#{request.id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-8 border-t border-slate-50">
                    <div>
                      <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <ListIcon className="w-3 h-3" /> Số lượng
                      </p>
                      <p className="font-bold text-slate-800 text-[16px]">
                        {request.quantity}{" "}
                        <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">
                          Nhân sự
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mb-1.5">
                        Ngân sách
                      </p>
                      <p className="font-bold text-emerald-600 text-[16px] truncate">
                        {formatVND(request.budget)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {formatDateDisplay(request.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Quick Review Button */}
                      {canSelect && (
                        <button
                          onClick={(e) => handleOpenQuickReview(e, request.id)}
                          className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                          title="Đánh giá nhanh"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <div 
                        onClick={(e) => {
                          if (canSelect) {
                            e.stopPropagation();
                            navigate(`/staff/hr-manager/job-requests/${request.id}`);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:translate-x-1 transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
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

// TabButton component
const TabButton = ({ active, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${
      active
        ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
    }`}
  >
    {icon && <span className="text-xs">{icon}</span>}
    {label}
  </button>
);

// Icon helper for consistency
const ListIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);
