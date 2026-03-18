import React from 'react';

/**
 * Component to display draft auto-save status
 * @param {Date} lastSaved - Timestamp of last save
 * @param {boolean} saving - Whether currently saving
 */
export default function DraftIndicator({ lastSaved, saving = false }) {
  const getTimeAgo = (date) => {
    if (!date) return null;

    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 10) return 'vừa xong';
    if (seconds < 60) return `${seconds} giây trước`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    
    return date.toLocaleString('vi-VN');
  };

  if (saving) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
        <span>Đang lưu nháp...</span>
      </div>
    );
  }

  if (!lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
        <span>Chưa lưu nháp</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>Đã lưu nháp {getTimeAgo(lastSaved)}</span>
    </div>
  );
}
