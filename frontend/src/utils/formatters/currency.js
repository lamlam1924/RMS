/**
 * Currency formatting utilities for VND
 */

/**
 * Format number to VND currency string with thousand separators
 * @param {number|string} value - The numeric value to format
 * @returns {string} Formatted currency string (e.g., "20,000,000")
 */
export const formatVND = (value) => {
  if (!value) return '';
  // Always clean the value first to remove any existing commas or non-digits
  const cleanValue = String(value).replace(/\D/g, '');
  if (!cleanValue) return '';
  // Then apply thousand separators
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Parse formatted currency string to numeric value
 * @param {string} value - The formatted currency string
 * @returns {string} Numeric value without separators
 */
export const parseVND = (value) => {
  return value.replace(/[^\d]/g, '');
};

/**
 * Format VND to abbreviated form (e.g., 20M, 1.5B)
 * @param {number} value - The numeric value
 * @returns {string} Abbreviated format
 */
export const formatVNDAbbreviated = (value) => {
  if (!value) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  return formatVND(num);
};

/**
 * Validate VND amount
 * @param {string} value - The value to validate
 * @param {number} minAmount - Minimum allowed amount
 * @returns {Object} Validation result with isValid and error message
 */
export const validateVNDAmount = (value, minAmount = 1000000) => {
  if (!value || value.trim() === '') {
    return { isValid: true, error: null }; // Optional field
  }
  
  const numericValue = parseFloat(value);
  
  if (isNaN(numericValue)) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }
  
  if (numericValue < minAmount) {
    return { 
      isValid: false, 
      error: `Budget should be at least ${formatVND(minAmount)} VND` 
    };
  }
  
  return { isValid: true, error: null };
};
