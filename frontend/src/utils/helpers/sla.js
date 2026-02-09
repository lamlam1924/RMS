/**
 * SLA (Service Level Agreement) Utility Functions
 * Handles SLA calculation, status determination, and time formatting
 */

/**
 * SLA Configuration
 * Default SLA times in hours based on priority
 */
export const SLA_CONFIG = {
  1: 24,   // Priority 1 (Urgent): 24 hours
  2: 48,   // Priority 2 (High): 48 hours
  3: 72,   // Priority 3 (Medium): 72 hours
  4: 96,   // Priority 4 (Normal): 96 hours
  5: 120,  // Priority 5 (Low): 120 hours
};

/**
 * SLA Status Types
 */
export const SLA_STATUS = {
  ON_TIME: 'on_time',      // > 25% time remaining
  WARNING: 'warning',      // 10-25% time remaining
  CRITICAL: 'critical',    // < 10% time remaining
  OVERDUE: 'overdue',      // Past deadline
  COMPLETED: 'completed',  // Request completed
};

/**
 * Calculate SLA deadline from created date and priority
 * @param {Date|string} createdDate - When the request was created
 * @param {number} priority - Priority level (1-5)
 * @returns {Date} - SLA deadline
 */
export function calculateSLADeadline(createdDate, priority) {
  const created = new Date(createdDate);
  const slaHours = SLA_CONFIG[priority] || SLA_CONFIG[3]; // Default to medium priority
  
  const deadline = new Date(created);
  deadline.setHours(deadline.getHours() + slaHours);
  
  return deadline;
}

/**
 * Calculate remaining time until SLA deadline
 * @param {Date|string} deadline - SLA deadline
 * @returns {number} - Milliseconds remaining (negative if overdue)
 */
export function calculateRemainingTime(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  
  return deadlineDate - now;
}

/**
 * Determine SLA status based on remaining time and completion status
 * @param {Date|string} createdDate - When request was created
 * @param {number} priority - Priority level (1-5)
 * @param {string} status - Request status (e.g., 'Approved', 'Rejected', 'Pending')
 * @returns {Object} - { status, deadline, remainingMs, percentRemaining }
 */
export function getSLAStatus(createdDate, priority, status) {
  // If request is in final state, mark as completed
  const finalStates = ['Approved', 'Rejected', 'Completed', 'Posted'];
  if (finalStates.includes(status)) {
    return {
      status: SLA_STATUS.COMPLETED,
      deadline: null,
      remainingMs: null,
      percentRemaining: 100,
    };
  }

  const deadline = calculateSLADeadline(createdDate, priority);
  const remainingMs = calculateRemainingTime(deadline);
  
  // Calculate total SLA time
  const totalMs = SLA_CONFIG[priority] * 60 * 60 * 1000;
  const percentRemaining = (remainingMs / totalMs) * 100;

  let slaStatus;
  if (remainingMs < 0) {
    slaStatus = SLA_STATUS.OVERDUE;
  } else if (percentRemaining <= 10) {
    slaStatus = SLA_STATUS.CRITICAL;
  } else if (percentRemaining <= 25) {
    slaStatus = SLA_STATUS.WARNING;
  } else {
    slaStatus = SLA_STATUS.ON_TIME;
  }

  return {
    status: slaStatus,
    deadline,
    remainingMs,
    percentRemaining: Math.max(0, percentRemaining),
  };
}

/**
 * Format remaining time to human-readable string
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} - Formatted time (e.g., "2h 30m", "3 ngày")
 */
export function formatRemainingTime(milliseconds) {
  if (!milliseconds || milliseconds < 0) {
    const absMs = Math.abs(milliseconds);
    return `Quá hạn ${formatPositiveTime(absMs)}`;
  }

  return formatPositiveTime(milliseconds);
}

/**
 * Format positive time duration
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} - Formatted time
 */
function formatPositiveTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days} ngày ${remainingHours}h` : `${days} ngày`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes} phút`;
  }

  return 'Dưới 1 phút';
}

/**
 * Get SLA style configuration for badge/UI
 * @param {string} slaStatus - SLA status from SLA_STATUS
 * @returns {Object} - { bgColor, textColor, icon, label }
 */
export function getSLAStyle(slaStatus) {
  const styles = {
    [SLA_STATUS.ON_TIME]: {
      bgColor: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-green-700 dark:text-green-300',
      borderColor: 'border-green-200 dark:border-green-700',
      icon: '✓',
      label: 'Đúng hạn',
    },
    [SLA_STATUS.WARNING]: {
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      borderColor: 'border-yellow-200 dark:border-yellow-700',
      icon: '⚠',
      label: 'Cảnh báo',
    },
    [SLA_STATUS.CRITICAL]: {
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      textColor: 'text-orange-700 dark:text-orange-300',
      borderColor: 'border-orange-200 dark:border-orange-700',
      icon: '⏰',
      label: 'Khẩn cấp',
    },
    [SLA_STATUS.OVERDUE]: {
      bgColor: 'bg-red-100 dark:bg-red-900',
      textColor: 'text-red-700 dark:text-red-300',
      borderColor: 'border-red-200 dark:border-red-700',
      icon: '🔥',
      label: 'Quá hạn',
    },
    [SLA_STATUS.COMPLETED]: {
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      textColor: 'text-gray-600 dark:text-gray-400',
      borderColor: 'border-gray-200 dark:border-gray-600',
      icon: '✓',
      label: 'Hoàn thành',
    },
  };

  return styles[slaStatus] || styles[SLA_STATUS.ON_TIME];
}

/**
 * Check if request is approaching SLA deadline
 * @param {Date|string} createdDate - When request was created
 * @param {number} priority - Priority level (1-5)
 * @returns {boolean} - True if within warning/critical threshold
 */
export function isApproachingDeadline(createdDate, priority) {
  const { status } = getSLAStatus(createdDate, priority, 'Pending');
  return status === SLA_STATUS.WARNING || status === SLA_STATUS.CRITICAL || status === SLA_STATUS.OVERDUE;
}

/**
 * Get SLA summary for dashboard/statistics
 * @param {Array} requests - Array of job requests
 * @returns {Object} - { onTime, warning, critical, overdue, completed, total }
 */
export function getSLASummary(requests) {
  const summary = {
    onTime: 0,
    warning: 0,
    critical: 0,
    overdue: 0,
    completed: 0,
    total: requests.length,
  };

  requests.forEach(request => {
    const { status } = getSLAStatus(
      request.createdAt || request.createdDate,
      request.priority,
      request.status
    );

    switch (status) {
      case SLA_STATUS.ON_TIME:
        summary.onTime++;
        break;
      case SLA_STATUS.WARNING:
        summary.warning++;
        break;
      case SLA_STATUS.CRITICAL:
        summary.critical++;
        break;
      case SLA_STATUS.OVERDUE:
        summary.overdue++;
        break;
      case SLA_STATUS.COMPLETED:
        summary.completed++;
        break;
    }
  });

  return summary;
}
