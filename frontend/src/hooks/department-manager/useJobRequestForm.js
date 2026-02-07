import { useState, useEffect } from 'react';
import { formatVND } from '../../utils/formatters/currency';
import { formatDateForAPI } from '../../utils/formatters/date';
import { validateJobRequestForm } from '../../utils/validators/jobRequest';

/**
 * Custom hook for managing job request form state and logic
 */
export const useJobRequestForm = (initialData = {}) => {
  const [formData, setFormData] = useState({
    positionId: initialData.positionId || '',
    quantity: initialData.quantity || 1,
    priority: initialData.priority || 3,
    budget: initialData.budget || '',
    reason: initialData.reason || '',
    expectedStartDate: initialData.expectedStartDate || ''
  });
  
  const [errors, setErrors] = useState({});

  // Re-initialize form data when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        positionId: initialData.positionId || '',
        quantity: initialData.quantity || 1,
        priority: initialData.priority || 3,
        budget: initialData.budget || '',
        reason: initialData.reason || '',
        expectedStartDate: initialData.expectedStartDate || ''
      });
    }
  }, [initialData]);

  /**
   * Handle input change with special handling for budget
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'budget') {
      // Keep only digits for budget
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        budget: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Validate form fields with business rules
   */
  const validate = () => {
    const newErrors = validateJobRequestForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Build payload for API submission
   */
  const buildPayload = () => {
    const payload = {
      positionId: parseInt(formData.positionId, 10),
      quantity: parseInt(formData.quantity, 10),
      priority: parseInt(formData.priority, 10),
      budget: formData.budget ? parseFloat(formData.budget) : null,
      reason: formData.reason.trim()
    };

    // Only include expectedStartDate if it has a value
    const formattedDate = formatDateForAPI(formData.expectedStartDate);
    if (formattedDate) {
      payload.expectedStartDate = formattedDate;
    }

    return payload;
  };

  return {
    formData,
    errors,
    handleChange,
    validate,
    buildPayload,
    setErrors
  };
};
