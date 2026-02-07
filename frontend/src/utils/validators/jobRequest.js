/**
 * Validation utilities for form inputs
 */

/**
 * Validate quantity input (1-50)
 */
export const validateQuantity = (value) => {
  const num = parseInt(value);
  if (isNaN(num) || num < 1) {
    return 'Quantity must be at least 1';
  }
  if (num > 50) {
    return 'Maximum 50 positions per request';
  }
  return null;
};

/**
 * Validate priority input (1-5)
 */
export const validatePriority = (value) => {
  const num = parseInt(value);
  if (isNaN(num) || num < 1 || num > 5) {
    return 'Priority must be between 1 and 5';
  }
  return null;
};

/**
 * Validate budget (5M - 1B VND)
 */
export const validateBudget = (value) => {
  if (!value) return null; // Optional field
  
  const num = parseFloat(value.replace(/,/g, ''));
  if (isNaN(num)) {
    return 'Invalid budget format';
  }
  if (num < 5000000) {
    return 'Budget must be at least 5,000,000 VND';
  }
  if (num > 1000000000) {
    return 'Budget cannot exceed 1,000,000,000 VND';
  }
  return null;
};

/**
 * Validate expected start date (2 weeks min, 1 year max from today)
 */
export const validateExpectedStartDate = (dateString) => {
  if (!dateString) return null; // Optional field
  
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate min date (2 weeks from today)
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 14);
  
  // Calculate max date (1 year from today)
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  
  if (selectedDate < minDate) {
    return 'Expected start date must be at least 2 weeks from today (realistic hiring timeline)';
  }
  if (selectedDate > maxDate) {
    return 'Expected start date cannot be more than 1 year from today';
  }
  return null;
};

/**
 * Validate reason text (20-500 characters)
 */
export const validateReason = (value) => {
  if (!value || value.trim().length === 0) {
    return 'Reason is required';
  }
  if (value.trim().length < 20) {
    return 'Reason must be at least 20 characters';
  }
  if (value.length > 500) {
    return 'Reason cannot exceed 500 characters';
  }
  return null;
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && value.trim().length === 0)) {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validate job request form data
 */
export const validateJobRequestForm = (formData) => {
  const errors = {};

  // Required fields
  const positionError = validateRequired(formData.positionId, 'Position');
  if (positionError) errors.positionId = positionError;

  const quantityError = validateQuantity(formData.quantity);
  if (quantityError) errors.quantity = quantityError;

  const priorityError = validatePriority(formData.priority);
  if (priorityError) errors.priority = priorityError;

  const reasonError = validateReason(formData.reason);
  if (reasonError) errors.reason = reasonError;

  // Optional fields with validation
  const budgetError = validateBudget(formData.budget);
  if (budgetError) errors.budget = budgetError;

  const dateError = validateExpectedStartDate(formData.expectedStartDate);
  if (dateError) errors.expectedStartDate = dateError;

  return errors;
};
