import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import hrService from "../../../services/hrService";
import { formatVND } from "../../../utils/formatters/currency";
import { formatDateDisplay } from "../../../utils/formatters/date";
import { toast } from "../../../utils";
import StatusHistoryTimeline from "../../../components/common/StatusHistoryTimeline";
import { useHRJobRequestActions } from "../../../hooks/hr/manager/useHRJobRequestActions";

/**
 * HRJobRequestDetail Component
 * Thiết kế tinh tế, tối giản với bố cục 2 cột chuyên nghiệp
 * Hỗ trợ hiển thị JD, lịch sử trạng thái và các thao tác phê duyệt
 */
export default function HRJobRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobRequest, setJobRequest] = useState(null);
  const { forward, returnRequest, loading: actionLoading, error: actionError } = useHRJobRequestActions();

  // Modal states
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    loadJobRequest();
  }, [id]);

  const loadJobRequest = async () => {
    try {
      setLoading(true);
      const data = await hrService.jobRequests.getById(id);
      setJobRequest(data);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết yêu cầu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleForward = async () => {
    try {
      await forward(id, note, () => {
        toast.success("Đã chuyển yêu cầu đến Giám đốc thành công!");
        navigate("/staff/hr-manager/job-requests");
      });
    } catch (error) {
      toast.error(actionError || "Lỗi khi chuyển yêu cầu.");
    } finally {
      setShowForwardModal(false);
    }
  };

  const handleReturn = async () => {
    if (!note.trim()) {
      toast.error("Vui lòng nhập lý do trả lại để Trưởng phòng ban chỉnh sửa.");
      return;
    }
    try {
      await returnRequest(id, note, () => {
        toast.success("Đã trả lại yêu cầu cho Trưởng phòng ban thành công!");
        navigate("/staff/hr-manager/job-requests");
      });
    } catch (error) {
      toast.error(actionError || "Lỗi khi trả về yêu cầu.");
    } finally {
      setShowReturnModal(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!jobRequest) return <NotFound />;

  const statusMap = {
    DRAFT: {
      label: "Bản nháp",
      color: "text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600",
    },
    SUBMITTED: {
      label: "Chờ thẩm định",
      color: "text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700",
    },
    IN_REVIEW: {
      label: "Chờ Giám đốc duyệt",
      color: "text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700",
    },
    APPROVED: {
      label: "Đã phê duyệt",
      color: "text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700",
    },
    REJECTED: {
      label: "Từ chối",
      color: "text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700",
    },
    RETURNED: {
      label: "Đã trả lại",
      color: "text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-700",
    },
  };

  const currentStatus = statusMap[jobRequest.status?.code] || {
    label: jobRequest.status?.description,
    color: "text-slate-400 bg-slate-50 border-slate-100",
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Fixed top accent line */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 z-50"></div>

      <div className="max-w-6xl mx-auto">
        {/* Navigation & Status Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/staff/hr-manager/job-requests")}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95"
            >
              ←
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Chi tiết Yêu cầu
                </h1>
                <span
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border shadow-sm ${currentStatus.color}`}
                >
                  {currentStatus.label}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs font-semibold mt-1 tracking-tight uppercase">
                MÃ YÊU CẦU: #{jobRequest.id}
              </p>
            </div>
          </div>

          {/* Action Buttons Based on Status */}
          {jobRequest.status?.code === "SUBMITTED" && (
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => {
                  setNote("");
                  setShowReturnModal(true);
                }}
                className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-xs shadow-sm"
              >
                Trả lại chỉnh sửa
              </button>
              <button
                onClick={() => {
                  setNote("");
                  setShowForwardModal(true);
                }}
                className="flex-1 md:flex-none px-8 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-all text-xs shadow-xl shadow-slate-200 dark:shadow-slate-900/50 active:scale-95"
              >
                Trình Giám đốc duyệt
              </button>
            </div>
          )}

          {jobRequest.status?.code === "IN_REVIEW" && (
            <div className="flex gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
                <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse"></div>
                <span className="text-amber-700 dark:text-amber-200 font-bold text-xs">
                  Đang chờ Giám đốc phê duyệt
                </span>
              </div>
            </div>
          )}

          {jobRequest.status?.code === "APPROVED" && (
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => navigate(`/staff/hr-manager/job-postings/create?jobRequestId=${jobRequest.id}`)}
                className="flex-1 md:flex-none px-8 py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white font-bold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all text-xs shadow-xl shadow-emerald-200 dark:shadow-emerald-900/50 active:scale-95"
              >
                ✓ Tạo Job Posting
              </button>
            </div>
          )}

          {jobRequest.status?.code === "RETURNED" && (
            <div className="flex gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700">
                <span className="text-rose-700 dark:text-rose-200 font-bold text-xs">
                  ↩ Đã trả về bộ phận để chỉnh sửa
                </span>
              </div>
            </div>
          )}

          {jobRequest.status?.code === "REJECTED" && (
            <div className="flex gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
                <span className="text-red-700 dark:text-red-200 font-bold text-xs">
                  ✕ Yêu cầu đã bị từ chối
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: CORE INFO */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Card */}
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-200 dark:border-slate-700 relative overflow-hidden transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 dark:bg-blue-900/20 rounded-full blur-3xl -mr-16 -mt-16"></div>

              <section className="relative z-10">
                <div className="mb-10">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-3 block px-1">
                    Vị trí yêu cầu
                  </span>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {jobRequest.positionTitle}
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                  <StatItem
                    label="Số lượng"
                    value={jobRequest.quantity}
                    unit="nhân sự"
                  />
                  <StatItem
                    label="Ưu tiên"
                    value={`Mức ${jobRequest.priority}`}
                    isPriority
                    priority={jobRequest.priority}
                  />
                  <StatItem
                    label="Ngân sách"
                    value={formatVND(jobRequest.budget)}
                  />
                  <StatItem
                    label="Bắt đầu"
                    value={formatDateDisplay(jobRequest.expectedStartDate)}
                  />
                </div>
              </section>

              <div className="h-px bg-slate-100 dark:bg-slate-700 my-10 relative z-10"></div>

              <section className="relative z-10">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1 h-3 bg-blue-500 dark:bg-blue-400 rounded-full"></span>
                  Lý do tuyển dụng
                </h3>
                <div className="bg-slate-50/80 dark:bg-slate-700/50 rounded-3xl p-6 text-slate-700 dark:text-slate-200 text-[14px] leading-relaxed font-medium border border-slate-200 dark:border-slate-600 italic">
                  "{jobRequest.reason}"
                </div>
              </section>

              <section className="mt-10 relative z-10">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full"></span>
                  Mô tả công việc (JD)
                </h3>
                {jobRequest.jdFileUrl ? (
                  <a
                    href={jobRequest.jdFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-5 bg-white dark:bg-slate-750 rounded-3xl border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                        📄
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-[13px]">
                          Bản Job Description đầy đủ
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-tight">
                          ĐÃ ĐÍNH KÈM TỪ BỘ PHẬN
                        </p>
                      </div>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs group-hover:translate-x-1 transition-transform tracking-tight">
                      Mở tệp →
                    </span>
                  </a>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-slate-400 dark:text-slate-500 font-bold text-xs italic">
                    Chưa có bản mô tả công việc cụ thể.
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* RIGHT: METADATA & HISTORY */}
          <div className="space-y-8 text-center sm:text-left">
            {/* Requester Info */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 px-1 border-b border-slate-100 dark:border-slate-700 pb-3">
                Phòng ban yêu cầu
              </h3>
              <div className="flex items-center gap-4 px-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
                  {jobRequest.departmentName?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">
                    {jobRequest.requestedByName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-tight">
                    {jobRequest.departmentName}
                  </p>
                </div>
              </div>
            </div>

            {/* History Timeline */}
            <StatusHistoryTimeline 
              statusHistory={jobRequest.statusHistory} 
              title="Lịch sử quy trình"
            />
          </div>
        </div>
      </div>

      {/* MODALS */}
      <Modal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        title="Trình Giám đốc phê duyệt"
        onConfirm={handleForward}
        loading={actionLoading}
        confirmLabel="Xác nhận Trình duyệt"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Bạn đang chuyển tiếp yêu cầu của{" "}
            <strong className="text-slate-900 font-bold">
              {jobRequest.departmentName}
            </strong>{" "}
            cho Giám đốc thẩm định cuối cùng.
          </p>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Lời nhắn gửi Director (Tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows="4"
              placeholder="Ví dụ: Yêu cầu phù hợp với kế hoạch nhân sự quý 1, đã kiểm tra ngân sách..."
              className="elegant-textarea"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="Yêu cầu chỉnh sửa Hồ sơ"
        onConfirm={handleReturn}
        loading={actionLoading}
        confirmLabel="Gửi lại bộ phận"
        variant="indigo"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-500 font-medium">
            Mô tả rõ những điểm cần thay đổi để Trưởng bộ phận có thể hoàn thiện
            lại yêu cầu đúng quy định.
          </p>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Lý do & Hướng dẫn (Bắt buộc)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows="4"
              placeholder="VD: Thiếu tệp JD chi tiết, Ngân sách vượt định mức..."
              className="elegant-textarea border-indigo-100 focus:border-indigo-600 focus:ring-indigo-600/10"
            />
          </div>
        </div>
      </Modal>

      <style jsx="true">{`
        .elegant-textarea {
          width: 100%;
          padding: 1rem 1.25rem;
          background-color: #fcfdfe;
          border: 1.5px solid #edf1f7;
          border-radius: 1.25rem;
          color: #1e293b;
          font-size: 0.875rem;
          font-weight: 600;
          outline: none;
          transition: all 0.2s;
          resize: none;
        }
        .elegant-textarea:focus {
          background-color: #fff;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05);
        }
      `}</style>
    </div>
  );
}

// Sub-components
const StatItem = ({ label, value, unit, isPriority, priority }) => {
  const getPriorityStyle = (priority) => {
    if (priority === 1) return { label: "Khẩn cấp", color: "text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700", dot: "bg-red-500 dark:bg-red-400" };
    if (priority === 2) return { label: "Cao", color: "text-orange-700 dark:text-orange-200 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700", dot: "bg-orange-500 dark:bg-orange-400" };
    return { label: "Bình thường", color: "text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700", dot: "bg-blue-500 dark:bg-blue-400" };
  };
  
  const priorityStyle = isPriority ? getPriorityStyle(priority || 3) : null;
  
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 px-0.5">
        {label}
      </p>
      {isPriority && priorityStyle ? (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border ${priorityStyle.color}`}>
          <span className={`w-2 h-2 rounded-full ${priorityStyle.dot} ${priority <= 2 ? 'animate-pulse' : ''}`}></span>
          {priorityStyle.label}
        </span>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
              {unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmLabel,
  loading,
  variant = "blue",
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-10">{children}</div>
        <div className="p-10 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl border border-slate-100 text-slate-400 font-bold hover:bg-slate-50 hover:text-slate-600 transition-all text-sm"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-[2] py-4 rounded-2xl text-white font-bold transition-all text-sm shadow-xl active:scale-95 disabled:opacity-50 ${
              variant === "blue"
                ? "bg-slate-900 hover:bg-slate-800 shadow-slate-200"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
            }`}
          >
            {loading ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#fafbfc]">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-blue-50 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
    </div>
    <span className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] animate-pulse">
      Đang nạp dữ liệu...
    </span>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fafbfc]">
    <div className="text-6xl mb-6">🔍</div>
    <h2 className="text-2xl font-black text-slate-900">Không tìm thấy Hồ sơ</h2>
    <p className="text-slate-500 mt-2 font-medium">
      Yêu cầu có thể đã bị xóa hoặc đường dẫn không chính xác.
    </p>
    <button
      onClick={() => window.history.back()}
      className="mt-8 px-8 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all active:scale-95 text-sm"
    >
      Quay lại
    </button>
  </div>
);
