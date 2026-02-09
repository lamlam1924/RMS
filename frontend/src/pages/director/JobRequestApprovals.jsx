import React, { useState, useEffect, useMemo } from "react";
import directorService from "../../services/directorService";
import { formatVND } from "../../utils/formatters/currency";
import { formatDateDisplay } from "../../utils/formatters/date";
import { toast } from "../../utils";
import { useDirectorJobRequestActions } from "../../hooks/director/useDirectorJobRequestActions";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  ChevronRight,
  FileText,
  RefreshCw,
  Layout,
  List as ListIcon,
  AlertCircle,
  Clock,
  Briefcase,
  ChevronDown,
  CheckSquare,
  Square,
} from "lucide-react";

/**
 * JobRequestApprovals Component - High Efficiency Edition
 * Giao diện phê duyệt Split-View chuyên nghiệp dành cho Giám đốc
 */
export default function JobRequestApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const { approve, reject, returnRequest, loading: actionLoading } = useDirectorJobRequestActions();
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(""); // 'approve', 'reject', 'return'
  const [comment, setComment] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (selectedRequestId) {
      loadRequestDetail(selectedRequestId);
    }
  }, [selectedRequestId]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await directorService.jobRequests.getPending();
      setRequests(data || []);
      if (data && data.length > 0 && !selectedRequestId) {
        setSelectedRequestId(data[0].id);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách phê duyệt:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRequestDetail = async (id) => {
    try {
      setDetailLoading(true);
      const detail = await directorService.jobRequests.getDetail(id);
      setSelectedRequestDetail(detail);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết yêu cầu:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const selectedRequest = useMemo(
    () => requests.find((r) => r.id === selectedRequestId),
    [requests, selectedRequestId],
  );

  const departments = useMemo(
    () => ["all", ...new Set(requests.map((r) => r.departmentName))],
    [requests],
  );

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const title = req.positionTitle || "";
      const idStr = req.id ? req.id.toString() : "";
      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idStr.includes(searchTerm);
      const matchesDept =
        filterDept === "all" || req.departmentName === filterDept;
      return matchesSearch && matchesDept;
    });
  }, [requests, searchTerm, filterDept]);

  const toggleSelectAll = () => {
    if (
      selectedIds.length === filteredRequests.length &&
      filteredRequests.length > 0
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRequests.map((r) => r.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBatchOperation = (type) => {
    if (selectedIds.length === 0) return;
    setActionType(type);
    setComment("");
    setShowActionModal(true);
  };

  const executeAction = async () => {
    if (
      (actionType === "reject" || actionType === "return") &&
      !comment.trim()
    ) {
      toast.error("Vui lòng nhập lý do để các bộ phận liên quan được biết.");
      return;
    }

    const idsToProcess =
      selectedIds.length > 0 ? selectedIds : [selectedRequestId];

    try {
      if (actionType === "approve") {
        await approve(idsToProcess, comment, () => {
          toast.success(`Đã phê duyệt thành công ${idsToProcess.length} yêu cầu.`);
          setShowActionModal(false);
          setSelectedIds([]);
          loadRequests();
        });
      } else if (actionType === "reject") {
        await reject(idsToProcess, comment, () => {
          toast.success(`Đã từ chối thành công ${idsToProcess.length} yêu cầu.`);
          setShowActionModal(false);
          setSelectedIds([]);
          loadRequests();
        });
      } else if (actionType === "return") {
        await returnRequest(idsToProcess, comment, () => {
          toast.success(`Đã trả lại thành công ${idsToProcess.length} yêu cầu.`);
          setShowActionModal(false);
          setSelectedIds([]);
          loadRequests();
        });
      }
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi thực hiện thao tác.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-slate-900 overflow-hidden transition-colors">
      {/* Header / Top Bar */}
      <header className="h-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-2xl shadow-md">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Duyệt Tuyển dụng Siêu tốc
            </h1>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-widest">
              {requests.length} YÊU CẦU ĐANG CHỜ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-1.5 rounded-2xl animate-in fade-in slide-in-from-right-4 shadow-sm">
              <span className="px-3 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase">
                Đã chọn {selectedIds.length}
              </span>
              <button
                onClick={() => handleBatchOperation("approve")}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
              >
                <CheckCircle className="w-4 h-4" /> Duyệt
              </button>
              <button
                onClick={() => handleBatchOperation("return")}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
              >
                <RotateCcw className="w-4 h-4" /> Sửa
              </button>
              <button
                onClick={() => handleBatchOperation("reject")}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-100"
              >
                <XCircle className="w-4 h-4" /> Từ chối
              </button>
            </div>
          )}

          <button
            onClick={loadRequests}
            className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all group"
          >
            <RefreshCw
              className={`w-5 h-5 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
            />
          </button>
        </div>
      </header>

      {/* Main Content Area: Split-View */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: List */}
        <div className="w-[380px] border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col shrink-0 shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm mã, vị trí..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-600 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setFilterDept(dept)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border transition-all ${
                    filterDept === dept
                      ? "bg-slate-900 dark:bg-slate-700 border-slate-900 dark:border-slate-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {dept === "all" ? "Tất cả" : dept}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between px-1">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {selectedIds.length === filteredRequests.length &&
                filteredRequests.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Chọn tất cả
              </button>
              <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">
                {filteredRequests.length} Kết quả
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-slate-50 dark:bg-slate-700 rounded-3xl animate-pulse"
                  ></div>
                ))}
              </div>
            ) : filteredRequests.length > 0 ? (
              <div className="p-3 space-y-1">
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    className={`group relative p-4 rounded-[1.5rem] cursor-pointer transition-all border ${
                      selectedRequestId === req.id
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 shadow-sm"
                        : "bg-white dark:bg-slate-750 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(req.id);
                        }}
                        className="mt-1 shrink-0"
                      >
                        {selectedIds.includes(req.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-200 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                            #{req.id}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase border ${
                              req.priority === 1
                                ? "text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700"
                                : req.priority === 2
                                ? "text-orange-700 dark:text-orange-200 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700"
                                : "text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700"
                            }`}
                          >
                            {req.priority === 1 ? "Khẩn cấp" : req.priority === 2 ? "Cao" : "Bình thường"}
                          </span>
                        </div>
                        <h3
                          className={`text-sm font-bold truncate ${selectedRequestId === req.id ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-slate-100"}`}
                        >
                          {req.positionTitle}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">
                          <Briefcase className="w-3 h-3" />
                          <span className="truncate">{req.departmentName}</span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 mt-6 transition-transform ${selectedRequestId === req.id ? "text-blue-400 dark:text-blue-300 translate-x-1" : "text-slate-200 dark:text-slate-600 group-hover:translate-x-1"}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <Search className="w-12 h-12 text-slate-100 dark:text-slate-700 mb-4" />
                <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">
                  Không tìm thấy yêu cầu
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Details */}
        <div className="flex-1 bg-white dark:bg-slate-800 overflow-y-auto custom-scrollbar relative">
          {!loading && !detailLoading && selectedRequestDetail ? (
            <div className="max-w-4xl p-12">
              <div className="flex items-start justify-between mb-12">
                <div className="flex-1 pr-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-blue-200 dark:border-blue-700 shadow-sm">
                      Đang xử lý
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-sm font-semibold tracking-widest">
                      ID: #{selectedRequestDetail.id}
                    </span>
                  </div>
                  <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
                    {selectedRequestDetail.positionTitle}
                  </h2>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {selectedRequestDetail.departmentName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {formatDateDisplay(selectedRequestDetail.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[240px]">
                  <button
                    onClick={() => {
                      setSelectedIds([]);
                      setActionType("approve");
                      setComment("");
                      setShowActionModal(true);
                    }}
                    className="flex items-center justify-center gap-3 px-8 py-3.5 bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-md active:scale-95 text-center w-full"
                  >
                    <CheckCircle className="w-4 h-4" /> Phê duyệt ngay
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedIds([]);
                        setActionType("return");
                        setComment("");
                        setShowActionModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all shadow-sm"
                    >
                      <RotateCcw className="w-4 h-4" /> Sửa
                    </button>
                    <button
                      onClick={() => {
                        setSelectedIds([]);
                        setActionType("reject");
                        setComment("");
                        setShowActionModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-slate-700 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all shadow-sm"
                    >
                      <XCircle className="w-4 h-4" /> Từ chối
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
                <DetailItem
                  label="Số lượng tuyển"
                  value={selectedRequestDetail.quantity}
                  unit="Người"
                  icon={<ListIcon className="w-4 h-4" />}
                />
                <DetailItem
                  label="Ngân sách dự kiến"
                  value={formatVND(selectedRequestDetail.budget)}
                  color="text-emerald-600"
                />
                <DetailItem
                  label="Mức độ ưu tiên"
                  value={
                    selectedRequestDetail.priority === 1
                      ? "Khẩn cấp"
                      : selectedRequestDetail.priority === 2
                      ? "Cao"
                      : "Bình thường"
                  }
                  status={selectedRequestDetail.priority <= 2 ? "urgent" : "normal"}
                  priorityLevel={selectedRequestDetail.priority}
                />
                <DetailItem
                  label="Dự kiến bắt đầu"
                  value={formatDateDisplay(selectedRequestDetail.expectedStartDate)}
                  icon={<Clock className="w-3 h-3" />}
                />
              </div>

              <div className="space-y-12">
                <section>
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <span className="w-6 h-[1px] bg-slate-200 dark:bg-slate-700"></span> Lý do đề
                    xuất từ bộ phận
                  </h3>
                  <div className="bg-slate-50/50 dark:bg-slate-700/50 rounded-3xl p-8 text-slate-700 dark:text-slate-200 leading-relaxed font-medium italic border border-slate-200 dark:border-slate-600 shadow-sm">
                    "{selectedRequestDetail.reason}"
                  </div>
                </section>

                <section>
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <span className="w-6 h-[1px] bg-slate-200 dark:bg-slate-700"></span> Hồ sơ kèm
                    theo
                  </h3>
                  {selectedRequestDetail.jdFileUrl ? (
                    <a
                      href={selectedRequestDetail.jdFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-6 bg-white dark:bg-slate-750 rounded-3xl border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                          <FileText className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            Job Description (JD)
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                            TÀI LIỆU CHÍNH THỨC
                          </p>
                        </div>
                      </div>
                      <div className="px-5 py-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase group-hover:bg-blue-600 group-hover:text-white transition-all">
                        Xem tệp
                      </div>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-slate-400 dark:text-slate-500">
                      <AlertCircle className="w-8 h-8 mb-3 opacity-30" />
                      <p className="font-bold text-xs uppercase tracking-widest">
                        Không đính kèm văn bản
                      </p>
                    </div>
                  )}
                </section>

                <section className="bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-10 text-white shadow-md relative overflow-hidden border border-slate-800 dark:border-slate-700">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
                  <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-white/10 pb-4">
                    Nhận xét từ phòng Nhân sự (HR)
                  </h3>
                  <div className="text-lg leading-relaxed font-semibold italic text-slate-100 dark:text-slate-200">
                    {selectedRequestDetail.hrNote
                      ? `"${selectedRequestDetail.hrNote}"`
                      : "Không có lưu ý đặc biệt từ phía HR."}
                  </div>
                </section>

                <section>
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <span className="w-6 h-[1px] bg-slate-200 dark:bg-slate-700"></span> Thông tin người yêu cầu
                  </h3>
                  <div className="bg-white dark:bg-slate-750 rounded-3xl p-8 border border-slate-200 dark:border-slate-600 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-2xl">
                        {selectedRequestDetail.requestedByName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                          {selectedRequestDetail.requestedByName}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                          {selectedRequestDetail.requestedByEmail}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-tight mt-1">
                          {selectedRequestDetail.departmentName}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {selectedRequestDetail.approvalHistory && selectedRequestDetail.approvalHistory.length > 0 && (
                  <section>
                    <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <span className="w-6 h-[1px] bg-slate-200 dark:bg-slate-700"></span> Lịch sử phê duyệt
                    </h3>
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-md border border-slate-200 dark:border-slate-700">
                      <div className="space-y-8 relative">
                        <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"></div>

                        {selectedRequestDetail.approvalHistory.map((history, idx) => (
                          <div key={idx} className="relative pl-12">
                            <div
                              className={`absolute left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 z-10 transition-all ${idx === 0 ? "bg-blue-500 scale-125 ring-4 ring-blue-500/20" : "bg-slate-400 dark:bg-slate-500 opacity-50"}`}
                            ></div>
                            <p
                              className={`text-[13px] font-bold tracking-tight ${idx === 0 ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
                            >
                              {history.statusName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[11px] text-slate-500 dark:text-slate-500 font-medium uppercase">
                                {formatDateDisplay(history.changedAt)}
                              </p>
                              <span className="text-slate-400 dark:text-slate-600">•</span>
                              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                                {history.changedByName}
                              </p>
                              {history.changedByRole && (
                                <>
                                  <span className="text-slate-400 dark:text-slate-600">•</span>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-500 font-medium uppercase">
                                    {history.changedByRole}
                                  </p>
                                </>
                              )}
                            </div>
                            {history.comment && (
                              <div className="mt-3 text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic border-l-2 border-slate-300 dark:border-white/10 pl-3 py-1 bg-slate-50 dark:bg-white/5 rounded-r-xl">
                                "{history.comment}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 animate-in fade-in duration-700">
              <div className="w-32 h-32 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-8">
                <Layout className="w-12 h-12 text-slate-200 dark:text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Sẵn sàng thẩm định
              </h2>
              <p className="text-slate-400 dark:text-slate-500 max-w-sm font-medium">
                Chọn một yêu cầu tuyển dụng từ danh sách bên trái để xem chi
                tiết và thực hiện phê duyệt nhanh.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => !actionLoading && setShowActionModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-[3rem] shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-12 text-center">
              <div
                className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 ${
                  actionType === "approve"
                    ? "bg-emerald-50 text-emerald-600"
                    : actionType === "return"
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-red-50 text-red-600"
                }`}
              >
                {actionType === "approve" ? (
                  <CheckCircle className="w-10 h-10" />
                ) : actionType === "return" ? (
                  <RotateCcw className="w-10 h-10" />
                ) : (
                  <XCircle className="w-10 h-10" />
                )}
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                {actionType === "approve"
                  ? "Xác nhận Phê duyệt"
                  : actionType === "reject"
                    ? "Xác nhận Từ chối"
                    : "Yêu cầu Chỉnh sửa"}
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 px-4 font-medium leading-relaxed">
                {selectedIds.length > 0
                  ? `Bạn đang áp dụng hành động này cho ${selectedIds.length} yêu cầu được chọn.`
                  : "Bạn đang thẩm định cho yêu cầu tuyển dụng này."}
              </p>

              <div className="space-y-4 text-left mb-10">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">
                  Ý kiến phản hồi (Tùy chọn)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="4"
                  placeholder="Nhập ý kiến hoặc lời nhắc tại đây..."
                  className="elegant-textarea dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={executeAction}
                  disabled={actionLoading}
                  className={`w-full py-4 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-md active:scale-95 disabled:opacity-50 transition-all ${
                    actionType === "approve"
                      ? "bg-slate-900 shadow-slate-200"
                      : actionType === "reject"
                        ? "bg-red-600 shadow-red-100"
                        : "bg-indigo-600 shadow-indigo-100"
                  }`}
                >
                  {actionLoading
                    ? "Đang xử lý..."
                    : `Xác nhận ${actionType === "approve" ? "Phê duyệt" : actionType === "return" ? "Yêu cầu sửa" : "Từ chối"}`}
                </button>
                <button
                  onClick={() => setShowActionModal(false)}
                  disabled={actionLoading}
                  className="w-full py-4 text-slate-400 dark:text-slate-500 font-bold rounded-2xl text-[10px] uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .elegant-textarea {
          width: 100%;
          padding: 1.25rem;
          background-color: #f8fafc;
          border: 1.5px solid #f1f5f9;
          border-radius: 1.5rem;
          color: #1e293b;
          font-size: 0.875rem;
          font-weight: 600;
          outline: none;
          transition: all 0.2s;
          resize: none;
        }
        .elegant-textarea:focus {
          border-color: #cbd5e1;
          background-color: #fff;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #e2e8f0;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// Sub-components
const DetailItem = ({
  label,
  value,
  unit,
  icon,
  color = "text-slate-900 dark:text-slate-100",
  status = "",
  priorityLevel = null,
}) => {
  const getPriorityStyle = (priority) => {
    if (priority === 1) return { label: "Khẩn cấp", color: "text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700", dot: "bg-red-500 dark:bg-red-400" };
    if (priority === 2) return { label: "Cao", color: "text-orange-700 dark:text-orange-200 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700", dot: "bg-orange-500 dark:bg-orange-400" };
    return { label: "Bình thường", color: "text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700", dot: "bg-blue-500 dark:bg-blue-400" };
  };
  
  const priorityStyle = priorityLevel ? getPriorityStyle(priorityLevel) : null;
  
  return (
    <div className="bg-slate-50/50 dark:bg-slate-700/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        {icon && <span className="opacity-50">{icon}</span>}
        {label}
      </p>
      {priorityStyle ? (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border ${priorityStyle.color}`}>
          <span className={`w-2 h-2 rounded-full ${priorityStyle.dot} ${priorityLevel <= 2 ? 'animate-pulse' : ''}`}></span>
          {priorityStyle.label}
        </span>
      ) : (
        <div className="flex items-end gap-1.5">
          <p className={`text-lg font-bold tracking-tight ${color}`}>{value}</p>
          {unit && (
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase relative -top-1">
              {unit}
            </span>
          )}
          {status === "urgent" && (
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse relative -top-1"></span>
          )}
        </div>
      )}
    </div>
  );
};
