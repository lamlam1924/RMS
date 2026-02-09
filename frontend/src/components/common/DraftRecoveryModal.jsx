import React from 'react';

/**
 * Modal to prompt user to restore draft data
 * @param {boolean} isOpen - Whether modal is open
 * @param {Date} timestamp - Timestamp when draft was saved
 * @param {Function} onRestore - Callback when user clicks restore
 * @param {Function} onDiscard - Callback when user clicks discard
 */
export default function DraftRecoveryModal({ isOpen, timestamp, onRestore, onDiscard }) {
  if (!isOpen) return null;

  const formatTimestamp = (date) => {
    if (!date) return 'Không rõ';
    
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 24) {
      return date.toLocaleString('vi-VN', { 
        dateStyle: 'short', 
        timeStyle: 'short' 
      });
    }
    
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return 'Vài giây trước';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
          Phát hiện bản nháp
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
          Chúng tôi tìm thấy một bản nháp đã lưu từ{' '}
          <span className="font-medium text-gray-900 dark:text-white">
            {formatTimestamp(timestamp)}
          </span>
          . Bạn có muốn khôi phục bản nháp này không?
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            Bỏ qua
          </button>
          <button
            onClick={onRestore}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors"
          >
            Khôi phục
          </button>
        </div>

        {/* Info note */}
        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
          Hệ thống tự động lưu nháp mỗi 30 giây
        </p>
      </div>
    </div>
  );
}
