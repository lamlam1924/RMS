/**
 * Reusable badge helper functions
 * Returns badge configuration objects (not JSX elements)
 */

export const getPriorityBadge = (priority) => {
  const badges = {
    1: { 
      label: 'Urgent', 
      color: '#ef4444', 
      bg: '#fee2e2',
      className: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
    },
    2: { 
      label: 'High', 
      color: '#f97316', 
      bg: '#ffedd5',
      className: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700'
    },
    3: { 
      label: 'Normal', 
      color: '#3b82f6', 
      bg: '#dbeafe',
      className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
    },
    4: { 
      label: 'Low', 
      color: '#6b7280', 
      bg: '#f3f4f6',
      className: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
    },
    5: { 
      label: 'Very Low', 
      color: '#6b7280', 
      bg: '#f9fafb',
      className: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
    },
  };
  return badges[priority] || badges[3];
};

export const getStatusBadge = (statusCode) => {
  const badges = {
    'DRAFT': { label: 'Draft', color: '#6b7280', bg: '#f3f4f6' },
    'SUBMITTED': { label: 'Submitted', color: '#3b82f6', bg: '#dbeafe' },
    'IN_REVIEW': { label: 'In Review', color: '#f59e0b', bg: '#fef3c7' },
    'APPROVED': { label: 'Approved', color: '#10b981', bg: '#d1fae5' },
    'REJECTED': { label: 'Rejected', color: '#ef4444', bg: '#fee2e2' },
    'SCHEDULED': { label: 'Scheduled', color: '#3b82f6', bg: '#dbeafe' },
    'COMPLETED': { label: 'Completed', color: '#10b981', bg: '#d1fae5' },
    'CANCELLED': { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' },
    'RETURNED': { label: 'Cần chỉnh sửa', color: '#dc2626', bg: '#fee2e2' },
  };

  return badges[statusCode] || badges['DRAFT'];
};
