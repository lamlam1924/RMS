/**
 * Reusable badge helper functions
 * Returns badge configuration objects (not JSX elements)
 */

/**
 * Priority badge config — 3 levels: 1=Khẩn cấp, 2=Cao, 3=Bình thường
 */
export const getPriorityBadge = (priority) => {
  const badges = {
    1: {
      label: 'Khẩn cấp',
      icon: '🔥',
      color: '#dc2626',
      bg: '#dc2626',
      dot: 'bg-red-600 dark:bg-red-500',
      className: 'rounded-md bg-red-600 dark:bg-red-500 text-white border border-red-700 dark:border-red-400 font-bold tracking-wide',
      tailwindColor: 'rounded-md bg-red-600 dark:bg-red-500 text-white border-red-700 dark:border-red-400 font-bold',
    },
    2: {
      label: 'Cao',
      icon: '⚡',
      color: '#b45309',
      bg: '#fbbf24',
      dot: 'bg-amber-500 dark:bg-amber-400',
      className: 'rounded-md bg-amber-400 dark:bg-amber-500 text-amber-950 dark:text-amber-950 border border-amber-500 dark:border-amber-400 font-semibold',
      tailwindColor: 'rounded-md bg-amber-400 dark:bg-amber-500 text-amber-950 border-amber-500 dark:border-amber-400 font-semibold',
    },
    3: {
      label: 'Bình thường',
      icon: '',
      color: '#475569',
      bg: '#e2e8f0',
      dot: 'bg-slate-400 dark:bg-slate-500',
      className: 'rounded-md bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-500',
      tailwindColor: 'rounded-md bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500',
    },
  };
  return badges[priority] || badges[3];
};

/**
 * Status badge config — keyed by status CODE
 */
export const getStatusBadge = (statusCode) => {
  const badges = {
    // --- Job Request ---
    // Status shape: rounded-full (pill) — phân biệt với priority rounded-md và SLA stripe
    'DRAFT':        { label: 'Nháp',                color: '#6b7280', bg: '#f3f4f6', className: 'rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600' },
    'SUBMITTED':    { label: 'Đã gửi',             color: '#2563eb', bg: '#dbeafe', className: 'rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' },
    'IN_REVIEW':    { label: 'Đang duyệt',         color: '#d97706', bg: '#fef3c7', className: 'rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700' },
    'APPROVED':     { label: 'Đã phê duyệt',       color: '#059669', bg: '#d1fae5', className: 'rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700' },
    'REJECTED':     { label: 'Từ chối',            color: '#dc2626', bg: '#fee2e2', className: 'rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700' },
    'RETURNED':     { label: 'Yêu cầu chỉnh sửa', color: '#ea580c', bg: '#ffedd5', className: 'rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700' },
    'CANCEL_PENDING': { label: 'Chờ duyệt hủy',        color: '#d97706', bg: '#fef3c7', className: 'rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700' },
    // --- Job Posting ---
    'PUBLISHED':    { label: 'Đang đăng tuyển',   color: '#0d9488', bg: '#ccfbf1', className: 'rounded-full bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700' },
    'CLOSED':       { label: 'Đã đóng',            color: '#6b7280', bg: '#f3f4f6', className: 'rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600' },
    // --- Application ---
    'APPLIED':      { label: 'Đã ứng tuyển',       color: '#2563eb', bg: '#dbeafe', className: 'rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' },
    'SCREENING':    { label: 'Sàng lọc',           color: '#7c3aed', bg: '#ede9fe', className: 'rounded-full bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700' },
    'INTERVIEWING': { label: 'Đang phỏng vấn',     color: '#4338ca', bg: '#e0e7ff', className: 'rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700' },
    'PASSED':       { label: 'Đạt',                color: '#059669', bg: '#d1fae5', className: 'rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700' },
    // --- Offer ---
    'SENT':         { label: 'Đã gửi offer',       color: '#0284c7', bg: '#e0f2fe', className: 'rounded-full bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700' },
    'ACCEPTED':     { label: 'Ứng viên đồng ý',    color: '#059669', bg: '#d1fae5', className: 'rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700' },
    'DECLINED':     { label: 'Ứng viên từ chối',   color: '#e11d48', bg: '#ffe4e6', className: 'rounded-full bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700' },
    // --- Interview ---
    'SCHEDULED':             { label: 'Đã lên lịch',              color: '#2563eb', bg: '#dbeafe', className: 'rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' },
    'CONFIRMED':             { label: 'Ứng viên xác nhận',        color: '#059669', bg: '#d1fae5', className: 'rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700' },
    'DECLINED_BY_CANDIDATE': { label: 'Ứng viên từ chối tham dự', color: '#dc2626', bg: '#fee2e2', className: 'rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700' },
    'RESCHEDULED':           { label: 'Đã dời lịch',              color: '#d97706', bg: '#fef3c7', className: 'rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700' },
    'COMPLETED':             { label: 'Hoàn thành',               color: '#059669', bg: '#d1fae5', className: 'rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700' },
    'CANCELLED':             { label: 'Đã huỷ',                   color: '#6b7280', bg: '#f3f4f6', className: 'rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600' },
  };
  return badges[statusCode] || badges['DRAFT'];
};

/**
 * Status badge config — keyed by Vietnamese STATUS NAME (from API currentStatus / status.Name)
 */
export const getStatusBadgeByName = (name) => {
  const nameMap = {
    'Nháp':                getStatusBadge('DRAFT'),
    'Đã gửi':             getStatusBadge('SUBMITTED'),
    'Đang duyệt':         getStatusBadge('IN_REVIEW'),
    'Đã phê duyệt':       getStatusBadge('APPROVED'),
    'Từ chối':            getStatusBadge('REJECTED'),
    'Yêu cầu chỉnh sửa': getStatusBadge('RETURNED'),
    'Chờ duyệt hủy':      getStatusBadge('CANCEL_PENDING'),
    'Đang đăng tuyển':    getStatusBadge('PUBLISHED'),
    'Đã đóng':            getStatusBadge('CLOSED'),
    'Đã ứng tuyển':       getStatusBadge('APPLIED'),
    'Sàng lọc':           getStatusBadge('SCREENING'),
    'Đang phỏng vấn':     getStatusBadge('INTERVIEWING'),
    'Đạt':                getStatusBadge('PASSED'),
    'Không đạt':          getStatusBadge('REJECTED'),
    'Đã gửi offer':       getStatusBadge('SENT'),
    'Ứng viên đồng ý':    getStatusBadge('ACCEPTED'),
    'Ứng viên từ chối':   getStatusBadge('DECLINED'),
  };
  return nameMap[name] || { label: name, color: '#6b7280', bg: '#f3f4f6', className: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600' };
};
