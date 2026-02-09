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
  getPriorityBadge,
  getStatusBadge
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

// Helpers - Toast notifications
export { default as toast } from './helpers/toast';

// Helpers - SLA calculations and status
export {
  SLA_CONFIG,
  SLA_STATUS,
  calculateSLADeadline,
  calculateRemainingTime,
  getSLAStatus,
  formatRemainingTime,
  getSLAStyle,
  isApproachingDeadline,
  getSLASummary
} from './helpers/sla';

// Helpers - Smart suggestions and analysis
export {
  getBudgetSuggestion,
  analyzeBudgetCompetitiveness,
  getPrioritySuggestion,
  validateQuantity as validateQuantitySmart,
  getExampleJD,
  getReasonSuggestions,
  estimateHiringTimeline,
  getSmartValidationInsights
} from './helpers/smartHelpers';
