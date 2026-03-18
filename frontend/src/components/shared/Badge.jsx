import React from 'react';

/**
 * Priority Badge Component
 */
export const PriorityBadge = ({ priority }) => {
  const styles = {
    1: { bg: '#fee2e2', color: '#991b1b', label: 'Urgent' },
    2: { bg: '#fef3c7', color: '#92400e', label: 'High' },
    3: { bg: '#e0e7ff', color: '#3730a3', label: 'Normal' }
  };
  
  const style = styles[priority] || styles[3];
  
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      backgroundColor: style.bg,
      color: style.color
    }}>
      {style.label}
    </span>
  );
};

/**
 * Status Badge Component
 */
export const StatusBadge = ({ statusId, statusName, color }) => {
  // Color mapping for common status IDs
  const defaultColors = {
    // Job Requests
    1: '#6b7280',   // DRAFT
    2: '#3b82f6',   // SUBMITTED
    3: '#f59e0b',   // IN_REVIEW
    4: '#10b981',   // APPROVED
    5: '#ef4444',   // REJECTED
    
    // Applications
    9: '#06b6d4',   // APPLIED
    10: '#f59e0b',  // SCREENING
    11: '#8b5cf6',  // INTERVIEWING
    12: '#10b981',  // PASSED
    13: '#ef4444',  // REJECTED
    
    // Offers
    14: '#6b7280',  // DRAFT
    15: '#f59e0b',  // IN_REVIEW
    16: '#10b981',  // APPROVED
    17: '#ef4444',  // REJECTED
    18: '#3b82f6',  // SENT
    19: '#10b981',  // ACCEPTED
    20: '#ef4444',  // DECLINED
  };
  
  const badgeColor = color || defaultColors[statusId] || '#6b7280';
  
  return (
    <span style={{
      padding: '4px 12px',
      backgroundColor: `${badgeColor}20`,
      color: badgeColor,
      borderRadius: 16,
      fontSize: 12,
      fontWeight: 500
    }}>
      {statusName}
    </span>
  );
};

/**
 * Interview Type Badge
 */
export const InterviewTypeBadge = ({ type }) => {
  const styles = {
    'Phone': { bg: '#dbeafe', color: '#1e40af', icon: '📞' },
    'Video': { bg: '#e0e7ff', color: '#4338ca', icon: '📹' },
    'In-Person': { bg: '#fef3c7', color: '#92400e', icon: '🏢' },
    'Technical': { bg: '#f3e8ff', color: '#6b21a8', icon: '💻' }
  };
  
  const style = styles[type] || { bg: '#f3f4f6', color: '#374151', icon: '📝' };
  
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 500,
      backgroundColor: style.bg,
      color: style.color,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }}>
      <span>{style.icon}</span>
      <span>{type}</span>
    </span>
  );
};

/**
 * Time Badge (TODAY/TOMORROW)
 */
export const TimeBadge = ({ label }) => {
  const styles = {
    'TODAY': { bg: '#fef3c7', color: '#92400e' },
    'TOMORROW': { bg: '#dbeafe', color: '#1e40af' }
  };
  
  const style = styles[label] || { bg: '#f3f4f6', color: '#374151' };
  
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 700,
      backgroundColor: style.bg,
      color: style.color,
      letterSpacing: '0.5px'
    }}>
      {label}
    </span>
  );
};

/**
 * Generic Badge Component
 */
export const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md' 
}) => {
  const variants = {
    default: { bg: '#f3f4f6', color: '#374151' },
    primary: { bg: '#dbeafe', color: '#1e40af' },
    success: { bg: '#d1fae5', color: '#065f46' },
    warning: { bg: '#fef3c7', color: '#92400e' },
    danger: { bg: '#fee2e2', color: '#991b1b' },
    info: { bg: '#e0e7ff', color: '#3730a3' }
  };
  
  const sizes = {
    sm: { padding: '2px 6px', fontSize: 10 },
    md: { padding: '4px 12px', fontSize: 12 },
    lg: { padding: '6px 16px', fontSize: 14 }
  };
  
  const variantStyle = variants[variant] || variants.default;
  const sizeStyle = sizes[size] || sizes.md;
  
  return (
    <span style={{
      ...sizeStyle,
      backgroundColor: variantStyle.bg,
      color: variantStyle.color,
      borderRadius: 16,
      fontWeight: 500,
      display: 'inline-block'
    }}>
      {children}
    </span>
  );
};
