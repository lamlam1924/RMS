import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import deptManagerService from "../../services/deptManagerService";
import { useJobRequestActions } from "../../hooks/department-manager/useJobRequestActions";
import { formatVND } from "../../utils/formatters/currency";
import { formatDateDisplay } from "../../utils/formatters/date";
import { toast } from "../../utils";
import StatusHistoryTimeline from "../../components/common/StatusHistoryTimeline";
import StatCard from "../../components/common/StatCard";
import {
  ArrowLeft,
  Briefcase,
  FilePlus,
  Clock,
  Users,
  DollarSign,
  FileText,
  Send,
  Edit3,
  AlertCircle,
  Calendar,
} from "lucide-react";

/**
 * DeptManagerJobRequestDetail - Modern Edition
 * Chi tiết yêu cầu tuyển dụng với giao diện đồng nhất
 */
export default function DeptManagerJobRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobRequest, setJobRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitNote, setSubmitNote] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelNote, setCancelNote] = useState("");

  const {
    submit,
    reopen,
    cancel,
    loading: actionLoading,
    error: actionError,
  } = useJobRequestActions();

  useEffect(() => {
    loadJobRequest();
  }, [id]);

  const loadJobRequest = async () => {
    try {
      setLoading(true);
      const data = await deptManagerService.jobRequests.getById(id);
      setJobRequest(data);
    } catch (error) {
      console.error("Failed to load job request:", error);
      toast.error("Không thể tải dữ liệu yêu cầu!");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!jobRequest) return;
    await submit(jobRequest.id, submitNote, () => {
      toast.success("Đã gửi yêu cầu tuyển dụng thành công!");
      navigate("/staff/dept-manager/job-requests");
    });
    setShowSubmitModal(false);
  };

  const handleReopen = async () => {
    await reopen(id, () => {
      navigate(`/staff/dept-manager/job-requests/${id}/edit`);
    });
  };

  const handleCancel = async () => {
    if (!jobRequest) return;
    const status = jobRequest.statusCode;
    await cancel(jobRequest.id, cancelNote, () => {
      if (status === 'DRAFT' || status === 'RETURNED') {
        toast.success("Yêu cầu tuyển dụng đã được hủy.");
      } else {
        toast.success("Đã gửi yêu cầu hủy đến HR Manager để xem xét.");
      }
      navigate("/staff/dept-manager/job-requests");
    });
    setShowCancelModal(false);
  };

  const getPriorityStyle = (priority) => {
    if (priority === 1) return { label: "Khẩn cấp", color: "text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700", dot: "bg-red-500 dark:bg-red-400" };
    if (priority === 2) return { label: "Cao", color: "text-orange-700 dark:text-orange-200 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700", dot: "bg-orange-500 dark:bg-orange-400" };
    return { label: "Bình thường", color: "text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700", dot: "bg-blue-500 dark:bg-blue-400" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#f8fafc] dark:bg-slate-900">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-blue-50 dark:border-slate-700 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <span className="text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-[0.2em]">
          Đang tải...
        </span>
      </div>
    );
  }

  if (!jobRequest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f8fafc] dark:bg-slate-900">
        <div  className="text-6xl mb-6">🔍</div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Không tìm thấy yêu cầu</h2>
        <p className="text-slate-600 dark:text-slate-300 mt-2 font-medium">Yêu cầu tuyển dụng không tồn tại.</p>
        <button
          onClick={() => navigate("/staff/dept-manager/job-requests")}
          className="mt-8 px-8 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm shadow-sm active:scale-95"
        >
          Quay lại Danh sách
        </button>
      </div>
    );
  }

  const priorityStyle = getPriorityStyle(jobRequest?.priority || 3);
  const statusStyle = {
    DRAFT: { label: "Bản nháp", color: "text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600" },
    SUBMITTED: { label: "Đã gửi", color: "text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700" },
    IN_REVIEW: { label: "Đang duyệt", color: "text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700" },
    APPROVED: { label: "Đã phê duyệt", color: "text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700" },
    REJECTED: { label: "Từ chối", color: "text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700" },
    RETURNED: { label: "Yêu cầu sửa", color: "text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-700" },
    CANCEL_PENDING: { label: "Chờ duyệt hủy", color: "text-orange-700 dark:text-orange-200 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700" },
    CANCELLED: { label: "Đã hủy", color: "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600" },
  };

  const currentStatus = statusStyle[jobRequest?.statusCode] || statusStyle.DRAFT;
  // Always use the most recent history entry (sort desc by changedAt)
  const latestHistory = jobRequest?.statusHistory?.length
    ? [...jobRequest.statusHistory].sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))[0]
    : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Top accent */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 z-50"></div>

      {/* Background decorations */}
      <div className="fixed top-40 -right-20 w-80 h-80 bg-blue-50/40 dark:bg-blue-900/20 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/staff/dept-manager/job-requests")}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Chi tiết Yêu cầu Tuyển dụng
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider mt-1">
                MÃ SỐ: #{id}
              </p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border ${currentStatus.color} shadow-sm`}>
            {currentStatus.label}
          </span>
        </div>

        {/* Error Alert */}
        {actionError && (
          <div className="mb-8 rounded-3xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-5 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-red-600 dark:bg-red-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">✕</span>
            </div>
            <p className="text-sm font-bold text-red-900 dark:text-red-200">{actionError}</p>
          </div>
        )}

        {/* Return/Reject Alert */}
        {(jobRequest?.statusCode === "RETURNED" || jobRequest?.statusCode === "REJECTED") && (
          <div className={`mb-8 rounded-3xl border-2 p-6 ${
            jobRequest.statusCode === "RETURNED" 
              ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800" 
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                jobRequest.statusCode === "RETURNED" ? "bg-rose-600 dark:bg-rose-500" : "bg-red-600 dark:bg-red-500"
              }`}>
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-2 ${
                  jobRequest.statusCode === "RETURNED" ? "text-rose-900 dark:text-rose-100" : "text-red-900 dark:text-red-100"
                }`}>
                  {jobRequest.statusCode === "RETURNED" 
                    ? "⚠️ Yêu cầu cần chỉnh sửa" 
                    : "🚫 Yêu cầu bị từ chối"}
                </h3>
                <p className={`text-sm mb-4 font-medium ${
                  jobRequest.statusCode === "RETURNED" ? "text-rose-700 dark:text-rose-200" : "text-red-700 dark:text-red-200"
                }`}>
                  {jobRequest.statusCode === "RETURNED"
                    ? "Cấp trên yêu cầu bạn cập nhật lại thông tin."
                    : "Rất tiếc, yêu cầu này không được phê duyệt."}
                </p>
                {latestHistory?.comment && (
                  <div className="bg-white/70 dark:bg-slate-700/50 rounded-2xl p-4 border-l-4 border-rose-600 dark:border-rose-400">
                    <p className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider mb-2">
                      Phản hồi từ {latestHistory.changedByName}:
                    </p>
                    <p className="text-sm text-rose-800 dark:text-rose-100 font-medium italic">
                      "{latestHistory.comment}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/50 dark:bg-blue-900/20 rounded-full blur-3xl -mr-20 -mt-20"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 flex items-center justify-center shadow-md">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300 uppercase tracking-[0.2em]">
                      Vị trí tuyển dụng
                    </span>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                      {jobRequest?.positionTitle || "N/A"}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-8">
                  <StatCard
                    icon={<Users className="w-5 h-5" />}
                    label="Số lượng"
                    value={jobRequest?.quantity || 0}
                    unit="nhân sự"
                    tint="blue"
                  />
                  <StatCard
                    icon={<AlertCircle className="w-5 h-5" />}
                    label="Mức ưu tiên"
                    value={priorityStyle.label}
                    tint={jobRequest?.priority === 1 ? 'red' : jobRequest?.priority === 2 ? 'amber' : 'slate'}
                    badge={<div className={`w-2.5 h-2.5 rounded-full ${priorityStyle.dot}`}></div>}
                  />
                  <StatCard
                    icon={<DollarSign className="w-5 h-5" />}
                    label="Ngân sách"
                    value={formatVND(jobRequest?.budget)}
                    tint="green"
                  />
                  <StatCard
                    icon={<Calendar className="w-5 h-5" />}
                    label="Dự kiến bắt đầu"
                    value={formatDateDisplay(jobRequest?.expectedStartDate)}
                    tint="purple"
                  />
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-10"></div>

                <section>
                  <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                    Lý do yêu cầu tuyển dụng
                  </h3>
                  <div className="bg-slate-50/80 dark:bg-slate-700/50 rounded-3xl p-6 text-slate-800 dark:text-slate-100 text-sm leading-relaxed font-medium border border-slate-200 dark:border-slate-600">
                    {jobRequest?.reason || "Chưa có thông tin"}
                  </div>
                </section>

                {jobRequest?.jdFileUrl && (
                  <section className="mt-8">
                    <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-1 h-4 bg-emerald-600 dark:bg-emerald-400 rounded-full"></span>
                      Job Description
                    </h3>
                    <div className="space-y-4">
                      {jobRequest.jdFileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <div className="relative border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-700 shadow-sm">
                          <img
                            src={jobRequest.jdFileUrl}
                            alt="Job Description"
                            className="w-full h-auto max-h-[800px] object-contain"
                          />
                        </div>
                      ) : null}
                      <a
                        href={jobRequest.jdFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-5 bg-white dark:bg-slate-700 rounded-3xl border border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Mô tả công việc</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-300 font-bold uppercase tracking-tight">
                              ĐÃ ĐÍNH KÈM
                            </p>
                          </div>
                        </div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs group-hover:translate-x-1 transition-transform">
                          Xem tệp →
                        </span>
                      </a>
                    </div>
                  </section>
                )}

                {/* APPROVED: Next step info */}
                {jobRequest && jobRequest.statusCode === "APPROVED" && (
                  <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <div className="rounded-3xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-6 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-100 text-sm mb-1">
                          Yêu cầu đã được phê duyệt
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                          HR sẽ tiến hành tạo tin đăng tuyển dụng. Bạn có thể theo dõi tiến độ tuyển dụng tại mục <strong>Ứng viên</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CANCEL_PENDING: Frozen state panel */}
                {jobRequest && jobRequest.statusCode === "CANCEL_PENDING" && (
                  <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <div className="rounded-3xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-6 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500 dark:bg-orange-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg">⏳</span>
                      </div>
                      <div>
                        <p className="font-bold text-orange-900 dark:text-orange-100 text-sm mb-1">
                          Đang chờ HR xử lý yêu cầu hủy
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                          Bạn đã gửi yêu cầu hủy. Tất cả thao tác trên yêu cầu này bị tạm khóa cho đến khi HR Manager phê duyệt hoặc từ chối.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {jobRequest && jobRequest.statusCode === "DRAFT" && (
                  <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate(`/staff/dept-manager/job-requests/${id}/edit`)}
                      className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-700 border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-400 dark:hover:border-amber-500 transition-all font-bold text-sm shadow-sm active:scale-95"
                    >
                      <Edit3 className="w-5 h-5" />
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => { setSubmitNote(""); setShowSubmitModal(true); }}
                      disabled={actionLoading}
                      className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all font-bold text-sm shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                      {actionLoading ? "Đang gửi..." : "Gửi yêu cầu duyệt"}
                    </button>
                    <button
                      onClick={() => { setCancelNote(""); setShowCancelModal(true); }}
                      disabled={actionLoading}
                      className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all font-bold text-sm shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      Hủy yêu cầu
                    </button>
                  </div>
                )}

                {jobRequest && jobRequest.statusCode === "SUBMITTED" && (
                  <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => { setCancelNote(""); setShowCancelModal(true); }}
                      disabled={actionLoading}
                      className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-700 border border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-400 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-400 dark:hover:border-orange-500 transition-all font-bold text-sm shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      ↩ {actionLoading ? "Đang xử lý..." : "Rút lại yêu cầu"}
                    </button>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Rút lại sẽ gửi yêu cầu hủy đến HR Manager để phê duyệt.
                    </p>
                  </div>
                )}

                {jobRequest && jobRequest.statusCode === "RETURNED" && (
                  <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-3">
                    <button
                      onClick={handleReopen}
                      disabled={actionLoading}
                      className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-rose-600 to-red-600 dark:from-rose-500 dark:to-red-500 text-white rounded-2xl hover:from-rose-700 hover:to-red-700 dark:hover:from-rose-600 dark:hover:to-red-600 transition-all font-bold text-sm shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <Edit3 className="w-5 h-5" />
                      {actionLoading ? "Đang xử lý..." : "Tiếp tục chỉnh sửa"}
                    </button>
                    <button
                      onClick={() => { setCancelNote(""); setShowCancelModal(true); }}
                      disabled={actionLoading}
                      className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all font-bold text-sm shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      Hủy yêu cầu
                    </button>
                  </div>
                )}

                {/* REJECTED: Actions */}
                {jobRequest && jobRequest.statusCode === "REJECTED" && (
                  <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate("/staff/dept-manager/job-requests/new")}
                      className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-600 dark:to-slate-500 text-white rounded-2xl hover:from-slate-900 hover:to-slate-800 transition-all font-bold text-sm shadow-md active:scale-95"
                    >
                      <FilePlus className="w-5 h-5" />
                      Tạo yêu cầu mới
                    </button>
                    <button
                      onClick={() => navigate("/staff/dept-manager/job-requests")}
                      className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all font-bold text-sm shadow-sm active:scale-95"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Về danh sách
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Metadata & Timeline */}
          <div className="space-y-8">
            {/* Department Info */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-6 pb-3 border-b border-slate-200 dark:border-slate-700">
                Thông tin bộ phận
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-2xl border-2 border-blue-100 dark:border-blue-800">
                  {jobRequest?.departmentName?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-base">
                    {jobRequest?.requestedByName || "Bạn"}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-semibold">
                    {jobRequest?.departmentName || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Status History */}
            <StatusHistoryTimeline 
              statusHistory={jobRequest?.statusHistory} 
              title="Lịch sử trạng thái"
            />
          </div>
        </div>
      </div>

      <footer className="mt-16 text-center opacity-30">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.5em]">
          RMS • Recruitment Management System
        </p>
      </footer>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowSubmitModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Gửi yêu cầu tuyển dụng
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-10 space-y-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Yêu cầu sẽ được gửi đến <strong className="text-slate-900 dark:text-slate-100">HR Manager</strong> để thẩm định. Bạn có thể để lại ghi chú cho HR bên dưới.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                  Ghi chú gửi kèm (Tùy chọn)
                </label>
                <textarea
                  value={submitNote}
                  onChange={(e) => setSubmitNote(e.target.value)}
                  rows={4}
                  placeholder="VD: Nhân sự cần gấp cho dự án quý 2, đề nghị xem xét ưu tiên..."
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all resize-none"
                />
              </div>
            </div>
            <div className="px-10 pb-10 flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-all text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                disabled={actionLoading}
                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 transition-all text-sm shadow-xl shadow-blue-200 dark:shadow-blue-900/30 active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? "Đang gửi..." : "Xác nhận Gửi duyệt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {jobRequest?.statusCode === 'DRAFT' || jobRequest?.statusCode === 'RETURNED'
                  ? 'Hủy yêu cầu tuyển dụng'
                  : 'Rút lại yêu cầu tuyển dụng'}
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-10 space-y-6">
              {jobRequest?.statusCode === 'DRAFT' || jobRequest?.statusCode === 'RETURNED' ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Yêu cầu sẽ được <strong className="text-red-600 dark:text-red-400">hủy ngay lập tức</strong> và không thể khôi phục. Bạn có chắc chắn không?
                </p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Yêu cầu hủy sẽ được gửi đến <strong className="text-slate-900 dark:text-slate-100">HR Manager</strong> để xem xét. Trong thời gian chờ, yêu cầu sẽ bị khóa.
                </p>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                  Lý do hủy (Tùy chọn)
                </label>
                <textarea
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  rows={4}
                  placeholder="VD: Dự án bị trì hoãn, không cần tuyển dụng thêm..."
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-red-400 dark:focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 transition-all resize-none"
                />
              </div>
            </div>
            <div className="px-10 pb-10 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-all text-sm"
              >
                Quay lại
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold hover:from-red-700 hover:to-rose-700 transition-all text-sm shadow-xl shadow-red-200 dark:shadow-red-900/30 active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? 'Đang xử lý...' : (jobRequest?.statusCode === 'DRAFT' || jobRequest?.statusCode === 'RETURNED' ? 'Xác nhận Hủy' : 'Gửi yêu cầu hủy')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// StatCard is imported from components/common/StatCard
// Legacy stub kept for safety — remove after confirming no other usages
const _unusedStatCard = ({ icon, label, value, unit, tint = 'slate', badge }) => {
  const tintBg = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green:  'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    amber:  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    red:    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    slate:  'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600',
  };
  const tintIcon = {
    blue:   'text-blue-500 dark:text-blue-400',
    green:  'text-emerald-500 dark:text-emerald-400',
    purple: 'text-purple-500 dark:text-purple-400',
    amber:  'text-amber-500 dark:text-amber-400',
    red:    'text-red-500 dark:text-red-400',
    slate:  'text-slate-400 dark:text-slate-500',
  };
  const tintLabel = {
    blue:   'text-blue-500/80 dark:text-blue-400/80',
    green:  'text-emerald-500/80 dark:text-emerald-400/80',
    purple: 'text-purple-500/80 dark:text-purple-400/80',
    amber:  'text-amber-500/80 dark:text-amber-400/80',
    red:    'text-red-500/80 dark:text-red-400/80',
    slate:  'text-slate-500 dark:text-slate-400',
  };
  const tintValue = {
    blue:   'text-blue-700 dark:text-blue-300',
    green:  'text-emerald-700 dark:text-emerald-300',
    purple: 'text-purple-700 dark:text-purple-300',
    amber:  'text-amber-700 dark:text-amber-300',
    red:    'text-red-700 dark:text-red-300',
    slate:  'text-slate-700 dark:text-slate-200',
  };
  return (
    <div className={`rounded-2xl p-5 border ${tintBg[tint]} transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className={tintIcon[tint]}>{icon}</div>
        {badge}
      </div>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${tintLabel[tint]}`}>
        {label}
      </p>
      <div className="flex items-end gap-2">
        <p className={`text-xl font-bold tracking-tight ${tintValue[tint]}`}>
          {value}
        </p>
        {unit && (
          <span className={`text-[10px] font-bold uppercase mb-1 ${tintLabel[tint]}`}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};
