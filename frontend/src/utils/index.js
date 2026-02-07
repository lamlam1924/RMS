/**
 * Central export for all utility functions
 * Organized by functionality for better maintainability
 */

// Validators - Form and input validation
export {
  validateQuantity,
  validatePriority,
  validateBudget,
  validateExpectedStartDate,
  validateReason,
  validateRequired,
  validateJobRequestForm
} from './validators/jobRequest';

// Helpers - Date calculations and ranges
export {
  getMinStartDate,
  getMaxStartDate,
  getMinStartDateString,
  getMaxStartDateString,
  isDateInValidRange,
  getTodayString
} from './helpers/dateRanges';

// Helpers - Badge utilities
export {
  getBadgeColor
} from './helpers/badge';

// Formatters - Currency formatting
export {
  formatVND,
  parseVND,
  formatVNDAbbreviated,
  validateVNDAmount
} from './formatters/currency';

// Formatters - Date formatting
export {
  formatDateForAPI,
  formatDateForInput,
  formatDateDisplay,
  formatDateTimeDisplay
} from './formatters/date';

// Formatters - Display formatters
export {
  formatDate,
  formatDateTime,
  formatDateRelative
} from './formatters/display';
