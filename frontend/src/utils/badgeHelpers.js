/**
 * Reusable badge helper functions
 * Returns badge configuration objects (not JSX elements)
 */

export const getPriorityBadge = (priority) => {
  const badges = {
    1: { label: 'Urgent', color: '#ef4444', bg: '#fee2e2' },
    2: { label: 'High', color: '#f97316', bg: '#ffedd5' },
    3: { label: 'Normal', color: '#3b82f6', bg: '#dbeafe' },
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
  };
  return badges[statusCode] || badges['DRAFT'];
};
