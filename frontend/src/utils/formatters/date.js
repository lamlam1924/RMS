/**
 * Date utilities for handling date inputs
 */

/**
 * Safely convert date input to ISO string or null
 * @param {string} dateValue - Date string from input
 * @returns {string|null} ISO date string or null
 */
export const formatDateForAPI = (dateValue) => {
  if (!dateValue || dateValue.trim() === '') {
    return null;
  }
  return dateValue.trim();
};

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDateDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format date for input field (YYYY-MM-DD)
 * @param {string} dateString - ISO date string
 * @returns {string} Date in YYYY-MM-DD format for input[type="date"]
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

/**
 * Format datetime for display
 * @param {string} dateString - ISO datetime string
 * @returns {string} Formatted datetime
 */
export const formatDateTimeDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
