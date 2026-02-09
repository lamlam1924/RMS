import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Info, Loader } from 'lucide-react';

/**
 * ConfirmationModal Component
 * Modal for confirming bulk actions with progress tracking
 * @param {boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Callback when modal closes
 * @param {Function} onConfirm - Callback when user confirms action
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {string} type - Modal type: 'warning', 'danger', 'info', 'success'
 * @param {string} confirmLabel - Label for confirm button (default: "Xác nhận")
 * @param {string} cancelLabel - Label for cancel button (default: "Hủy")
 * @param {number} itemCount - Number of items affected
 * @param {Array} items - Array of item details to show
 * @param {boolean} showProgress - Show progress bar during action
 * @param {number} progress - Progress percentage (0-100)
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận hành động",
  message = "Bạn có chắc chắn muốn thực hiện hành động này?",
  type = "warning",
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  itemCount = 0,
  items = [],
  showProgress = false,
  progress = 0,
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const typeConfig = {
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-yellow-100 dark:bg-yellow-900',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600',
    },
    danger: {
      icon: XCircle,
      iconBg: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-600 dark:text-red-400',
      buttonBg: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
    },
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400',
      buttonBg: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
    },
  };

  const config = typeConfig[type] || typeConfig.warning;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              {itemCount > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {itemCount} mục sẽ bị ảnh hưởng
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {message}
          </p>

          {/* Item List */}
          {items.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-900 rounded-xl p-3 space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 py-1"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <span className="font-semibold">#{item.id}</span>
                  <span className="truncate flex-1">{item.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          {showProgress && loading && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Đang xử lý...
                </span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`
              flex-1 px-4 py-3 rounded-xl font-semibold text-sm text-white
              ${config.buttonBg}
              transition-all disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            `}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * BulkProgressModal Component
 * Modal showing progress of bulk operation with results
 */
export function BulkProgressModal({
  isOpen,
  onClose,
  title = "Đang xử lý",
  total = 0,
  completed = 0,
  succeeded = 0,
  failed = 0,
  processing = true,
  results = [],
}) {
  if (!isOpen) return null;

  const progress = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = completed >= total && !processing;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
            {isComplete ? "Hoàn thành" : title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isComplete
              ? `Đã xử lý ${total} mục`
              : `Đang xử lý ${completed}/${total} mục...`}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Tiến độ
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {completed}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                Đã xử lý
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {succeeded}
              </div>
              <div className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mt-1">
                Thành công
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                {failed}
              </div>
              <div className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mt-1">
                Thất bại
              </div>
            </div>
          </div>

          {/* Results List (if complete and has failures) */}
          {isComplete && failed > 0 && results.length > 0 && (
            <div className="max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-900 rounded-xl p-3 space-y-2">
              <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                Các mục thất bại:
              </div>
              {results
                .filter((r) => !r.success)
                .map((result, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 py-1"
                  >
                    <XCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold">#{result.id}</div>
                      <div className="text-red-600 dark:text-red-400">{result.error}</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {isComplete && (
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
