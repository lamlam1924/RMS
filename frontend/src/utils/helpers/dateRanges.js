/**
 * Date calculation utilities
 */

/**
 * Get minimum allowed date (2 weeks from today)
 */
export const getMinStartDate = () => {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 14);
  return minDate;
};

/**
 * Get maximum allowed date (1 year from today)
 */
export const getMaxStartDate = () => {
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  return maxDate;
};

/**
 * Get minimum allowed date as string (YYYY-MM-DD)
 */
export const getMinStartDateString = () => {
  return getMinStartDate().toISOString().split('T')[0];
};

/**
 * Get maximum allowed date as string (YYYY-MM-DD)
 */
export const getMaxStartDateString = () => {
  return getMaxStartDate().toISOString().split('T')[0];
};

/**
 * Check if date is in valid range
 */
export const isDateInValidRange = (dateString) => {
  if (!dateString) return true; // Optional field
  
  const date = new Date(dateString);
  const minDate = getMinStartDate();
  const maxDate = getMaxStartDate();
  
  return date >= minDate && date <= maxDate;
};

/**
 * Get today's date as string (YYYY-MM-DD)
 */
export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};
