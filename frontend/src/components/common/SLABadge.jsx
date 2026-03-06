import React, { useState, useEffect } from 'react';
import { getSLAStatus, formatRemainingTime, getSLAStyle, SLA_STATUS } from '../../utils/helpers/sla';

/**
 * SLABadge Component
 * Displays SLA status with color coding and countdown timer
 * @param {Date|string} createdDate - When the request was created
 * @param {number} priority - Priority level (1-5)
 * @param {string} status - Request status
 * @param {boolean} showTime - Show remaining time countdown (default: true)
 * @param {string} size - Badge size: 'sm', 'md', 'lg' (default: 'md')
 */
export default function SLABadge({ 
  createdDate, 
  priority, 
  status, 
  showTime = true,
  size = 'md'
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update timer every minute for real-time countdown
  useEffect(() => {
    if (!showTime) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [showTime]);

  if (!createdDate || !priority) {
    return null;
  }

  const slaData = getSLAStatus(createdDate, priority, status);
  const styles = getSLAStyle(slaData.status);

  // Size configurations
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="inline-flex items-center gap-2">
      {/* SLA Badge */}
      {/* SLA shape: left-border stripe (border-l-[3px] rounded-r-md) — phân biệt với priority rounded-md và status rounded-full */}
      <span
        className={`
          inline-flex items-center gap-1.5
          border-l-[3px] rounded-r-md rounded-l-none
          ${styles.borderColor} ${styles.bgColor} ${styles.textColor}
          ${sizeClasses[size]} font-semibold
          transition-all duration-300
        `}
      >
        <span className={iconSizes[size]}>{styles.icon}</span>
        <span>{styles.label}</span>
      </span>

      {/* Time Remaining */}
      {showTime && slaData.status !== SLA_STATUS.COMPLETED && (
        <span
          className={`
            ${sizeClasses[size]} font-medium
            ${styles.textColor}
          `}
        >
          {formatRemainingTime(slaData.remainingMs)}
        </span>
      )}
    </div>
  );
}

/**
 * SLAIndicator Component
 * Minimal indicator dot for compact views
 */
export function SLAIndicator({ createdDate, priority, status }) {
  if (!createdDate || !priority) {
    return null;
  }

  const slaData = getSLAStatus(createdDate, priority, status);
  const styles = getSLAStyle(slaData.status);

  return (
    <div 
      className={`
        w-2.5 h-2.5 rounded-full
        ${styles.bgColor.replace('100', '500').replace('900', '500')}
      `}
      title={`SLA: ${styles.label}`}
    />
  );
}

/**
 * SLAProgressBar Component
 * Visual progress bar showing time remaining
 */
export function SLAProgressBar({ createdDate, priority, status }) {
  if (!createdDate || !priority) {
    return null;
  }

  const slaData = getSLAStatus(createdDate, priority, status);
  const styles = getSLAStyle(slaData.status);

  if (slaData.status === SLA_STATUS.COMPLETED) {
    return null;
  }

  const progress = Math.min(100, Math.max(0, slaData.percentRemaining));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className={`text-xs font-semibold ${styles.textColor}`}>
          {styles.label}
        </span>
        <span className={`text-xs font-medium ${styles.textColor}`}>
          {formatRemainingTime(slaData.remainingMs)}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${styles.bgColor.replace('100', '500').replace('900', '500')} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
