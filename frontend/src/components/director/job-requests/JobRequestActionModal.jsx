import React from "react";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";

/**
 * Confirmation modal for approve / reject / return actions.
 *
 * Props:
 *   actionType   – "approve" | "reject" | "return"
 *   comment      – current textarea value
 *   onCommentChange – setter for comment
 *   onConfirm    – confirm button handler
 *   onCancel     – cancel / close handler
 *   isLoading    – disables buttons while request is in-flight
 *   batchCount   – number of bulk-selected requests (0 = single request)
 */
export default function JobRequestActionModal({
  actionType,
  comment,
  onCommentChange,
  onConfirm,
  onCancel,
  isLoading,
  batchCount,
}) {
  const ACTION_CONFIG = {
    approve: {
      title: "Xác nhận Phê duyệt",
      icon: <CheckCircle className="w-8 h-8" />,
      iconBg: "bg-emerald-50 text-emerald-600",
      btnCls: "bg-slate-900 hover:bg-slate-800",
      placeholder: "Nhập ý kiến hoặc lời nhắc... (tuỳ chọn)",
      commentLabel: "Ý kiến phản hồi (Tuỳ chọn)",
    },
    reject: {
      title: "Xác nhận Từ chối",
      icon: <XCircle className="w-8 h-8" />,
      iconBg: "bg-red-50 text-red-600",
      btnCls: "bg-red-600 hover:bg-red-700",
      placeholder: "Nhập lý do để các bộ phận liên quan được biết...",
      commentLabel: "Lý do từ chối (Bắt buộc)",
    },
    return: {
      title: "Yêu cầu Chỉnh sửa",
      icon: <RotateCcw className="w-8 h-8" />,
      iconBg: "bg-indigo-50 text-indigo-600",
      btnCls: "bg-indigo-600 hover:bg-indigo-700",
      placeholder: "Nhập nội dung cần chỉnh sửa...",
      commentLabel: "Nội dung yêu cầu chỉnh sửa (Bắt buộc)",
    },
  };

  const cfg = ACTION_CONFIG[actionType] ?? ACTION_CONFIG.approve;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
        onClick={() => !isLoading && onCancel()}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8">
          {/* Icon */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${cfg.iconBg}`}
          >
            {cfg.icon}
          </div>

          {/* Title & description */}
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
            {cfg.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
            {batchCount > 0
              ? `Áp dụng cho ${batchCount} yêu cầu được chọn.`
              : "Áp dụng cho yêu cầu đang xem."}
          </p>

          {/* Comment textarea */}
          <div className="mb-6">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
              {cfg.commentLabel}
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder={cfg.placeholder}
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 text-[0.9375rem] font-semibold outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-900/5 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full py-3.5 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 ${cfg.btnCls}`}
            >
              {isLoading ? "Đang xử lý..." : cfg.title}
            </button>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="w-full py-3 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
