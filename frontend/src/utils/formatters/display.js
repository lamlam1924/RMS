/**
 * Date formatting utilities
 */
export const formatDate = (date, locale = 'vi-VN') => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString(locale);
};

export const formatDateTime = (date, locale = 'vi-VN') => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleString(locale);
};

export const formatDateRelative = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff === -1) return 'Tomorrow';
  if (diff < 7 && diff > 0) return `${diff} days ago`;
  if (diff > -7 && diff < 0) return `in ${Math.abs(diff)} days`;
  return formatDate(date);
};

/**
 * Returns a relative time string (e.g., "5 minutes ago", "2 hours ago")
 */
export const getTimeAgo = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - d) / 1000);

  if (diffInSeconds < 5) return 'Vừa xong';
  
  const seconds = diffInSeconds;
  if (seconds < 60) return `${seconds} giây trước`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} tuần trước`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  
  return formatDate(date);
};

/**
 * Currency formatting utilities
 */
export const formatCurrency = (amount, currency = 'VND', locale = 'vi-VN') => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: currency 
  }).format(amount);
};

export const formatNumber = (number, locale = 'vi-VN') => {
  if (number === null || number === undefined) return 'N/A';
  return new Intl.NumberFormat(locale).format(number);
};

/**
 * Time utilities
 */
export const formatTime = (date, locale = 'vi-VN') => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid time';
  return d.toLocaleTimeString(locale, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const getTimeBadge = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((d - now) / (1000 * 60 * 60 * 24));
  
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'TOMORROW';
  return null;
};
