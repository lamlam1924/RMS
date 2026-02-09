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
    expectedStartDate: initialData.expectedStartDate || '',
    jdFile: null
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
   * Handle file input change
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      jdFile: file
    }));
    
    // Clear error for jdFile if exists
    if (errors.jdFile) {
      setErrors(prev => ({ ...prev, jdFile: '' }));
    }
  };

  /**
   * Validate form fields with business rules
   */
  const validate = () => {
    const newErrors = validateJobRequestForm(formData);
    
    // Additional validation for JD file if required
    if (!formData.jdFile && !initialData.jdFileUrl) {
      // Optional: if JD is mandatory
      // newErrors.jdFile = 'Vui lòng đính kèm bản mô tả công việc (JD)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Build payload for API submission as FormData
   */
  const buildPayload = () => {
    const formDataObj = new FormData();
    
    // Ensure quantity is at least 1, default to 1 if NaN or empty
    const qty = parseInt(formData.quantity, 10);
    formDataObj.append('quantity', isNaN(qty) || qty < 1 ? 1 : qty);

    // Ensure priority is between 1-5, default to 3
    const prio = parseInt(formData.priority, 10);
    formDataObj.append('priority', isNaN(prio) || prio < 1 || prio > 5 ? 3 : prio);

    formDataObj.append('positionId', parseInt(formData.positionId, 10) || 0);
    formDataObj.append('reason', (formData.reason || '').trim());
    
    if (formData.budget) {
      formDataObj.append('budget', parseFloat(formData.budget));
    }
    
    const formattedDate = formatDateForAPI(formData.expectedStartDate);
    if (formattedDate) {
      formDataObj.append('expectedStartDate', formattedDate);
    }
    
    if (formData.jdFile) {
      formDataObj.append('jdFile', formData.jdFile);
    }

    return formDataObj;
  };

  return {
    formData,
    setFormData,
    errors,
    handleChange,
    handleFileChange,
    validate,
    buildPayload,
    setErrors
  };
};
