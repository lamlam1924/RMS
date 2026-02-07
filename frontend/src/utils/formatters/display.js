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
