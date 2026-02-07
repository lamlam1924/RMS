import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import deptManagerService from '../../services/deptManagerService';
import { useJobRequestForm } from '../../hooks/department-manager/useJobRequestForm';
import { formatVND } from '../../utils/formatters/currency';
import { getMinStartDateString, getMaxStartDateString } from '../../utils/helpers/dateRanges';

/**
 * DeptManagerJobRequestCreate Component
 * Clean, maintainable component following Single Responsibility Principle
 * 
 * Responsibilities:
 * - UI Rendering
 * - User interaction orchestration  
 * - Navigation
 * 
 * Business logic delegated to:
 * - useJobRequestForm hook (form state & validation)
 * - deptManagerService (API calls)
 * - utils/currency (formatting)
 */
export default function DeptManagerJobRequestCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState([]);
  
  // Delegate form logic to custom hook
  const { formData, errors, handleChange, validate, buildPayload } = useJobRequestForm();

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      const data = await deptManagerService.jobRequests.getPositions();
      setPositions(data || []);
    } catch (error) {
      console.error('Failed to load positions:', error);
      alert('Failed to load positions. Please refresh the page.');
    }
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    
    // Skip validation for drafts
    if (!isDraft && !validate()) {
      return;
    }

    try {
      setLoading(true);
      const payload = buildPayload();
      const response = await deptManagerService.jobRequests.create(payload);
      
      // Auto-submit if not draft
      if (!isDraft && response?.id) {
        await deptManagerService.jobRequests.submit(response.id);
      }

      navigate('/staff/dept-manager/job-requests');
    } catch (error) {
      console.error('Failed to create job request:', error);
      const errorMessage = error.message || 'Failed to create job request. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Header onBack={() => navigate('/staff/dept-manager/job-requests')} />

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <PositionSelect 
            value={formData.positionId}
            options={positions}
            error={errors.positionId}
            onChange={handleChange}
          />

          <div className="grid grid-cols-2 gap-4">
            <QuantityInput
              value={formData.quantity}
              error={errors.quantity}
              onChange={handleChange}
            />
            <PriorityInput
              value={formData.priority}
              error={errors.priority}
              onChange={handleChange}
            />
          </div>

          <BudgetInput
            value={formData.budget}
            error={errors.budget}
            onChange={handleChange}
          />

          <ExpectedStartDateInput
            value={formData.expectedStartDate}
            error={errors.expectedStartDate}
            onChange={handleChange}
          />

          <ReasonTextarea
            value={formData.reason}
            error={errors.reason}
            onChange={handleChange}
          />

          <FormActions
            loading={loading}
            onCancel={() => navigate('/staff/dept-manager/job-requests')}
            onSaveDraft={(e) => handleSubmit(e, true)}
          />
        </form>

        <InfoBox />
      </div>
    </div>
  );
}

// ==================== Sub-components (Clean, Reusable) ====================

const Header = ({ onBack }) => (
  <div className="mb-8">
    <button
      onClick={onBack}
      className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2 transition-colors"
    >
      ← Back to Job Requests
    </button>
    <h1 className="text-3xl font-bold text-gray-900">Create New Job Request</h1>
    <p className="text-gray-600 mt-2">Fill in the details to request new hiring for your department</p>
  </div>
);

const PositionSelect = ({ value, options, error, onChange }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Position <span className="text-red-500">*</span>
    </label>
    <select
      name="positionId"
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
    >
      <option value="">Select a position</option>
      {options.map(pos => (
        <option key={pos.id} value={pos.id}>{pos.title}</option>
      ))}
    </select>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const QuantityInput = ({ value, error, onChange }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Quantity <span className="text-red-500">*</span>
    </label>
    <input
      type="number"
      name="quantity"
      value={value}
      onChange={onChange}
      min="1"
      max="50"
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    <p className="text-xs text-gray-500 mt-1">Range: 1-50 positions</p>
  </div>
);

const PriorityInput = ({ value, error, onChange }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Priority (1-5) <span className="text-red-500">*</span>
    </label>
    <input
      type="number"
      name="priority"
      value={value}
      onChange={onChange}
      min="1"
      max="5"
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    <p className="text-xs text-gray-500 mt-1">1 = Highest, 5 = Lowest</p>
  </div>
);

const BudgetInput = ({ value, error, onChange }) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Update display value when raw value changes and input is not focused
    if (!isFocused && value) {
      setDisplayValue(formatVND(value));
    } else if (!value) {
      setDisplayValue('');
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number when focused
    setDisplayValue(value || '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format when blur
    if (value) {
      setDisplayValue(formatVND(value));
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    // Only allow digits
    const cleaned = inputValue.replace(/\D/g, '');
    setDisplayValue(cleaned);
    // Pass clean value to parent
    onChange({ target: { name: 'budget', value: cleaned } });
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Budget (VND)
      </label>
      <div className="relative">
        <input
          type="text"
          name="budget"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="20000000"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {!isFocused && displayValue && (
          <div className="absolute right-3 top-2.5 text-gray-500 text-sm font-medium pointer-events-none">
            VND
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      <p className="text-xs text-gray-500 mt-1">
        Optional: Monthly salary 5,000,000 - 1,000,000,000 VND{!isFocused && value && ` (${formatVND(value)} VND)`}
      </p>
    </div>
  );
};

const ExpectedStartDateInput = ({ value, onChange, error }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Expected Start Date
    </label>
    <input
      type="date"
      name="expectedStartDate"
      value={value}
      onChange={onChange}
      min={getMinStartDateString()}
      max={getMaxStartDateString()}
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    <p className="text-xs text-gray-500 mt-1">
      Optional: Must be at least 2 weeks from today (realistic hiring timeline)
    </p>
  </div>
);

const ReasonTextarea = ({ value, error, onChange }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Reason for Request <span className="text-red-500">*</span>
    </label>
    <textarea
      name="reason"
      value={value}
      onChange={onChange}
      rows="4"
      maxLength={500}
      placeholder="Explain why this position is needed..."
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    <div className="flex justify-between text-xs text-gray-500 mt-1">
      <span>Minimum 20 characters</span>
      <span>{value?.length || 0}/500</span>
    </div>
  </div>
);

const FormActions = ({ loading, onCancel, onSaveDraft }) => (
  <div className="flex gap-3 pt-4 border-t">
    <button
      type="button"
      onClick={onCancel}
      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
      disabled={loading}
    >
      Cancel
    </button>
    <button
      type="button"
      onClick={onSaveDraft}
      className="flex-1 px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
      disabled={loading}
    >
      {loading ? 'Saving...' : 'Save as Draft'}
    </button>
    <button
      type="submit"
      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400"
      disabled={loading}
    >
      {loading ? 'Submitting...' : 'Submit Request'}
    </button>
  </div>
);

const InfoBox = () => (
  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
    <h3 className="font-semibold text-blue-900 mb-2">📝 Note:</h3>
    <ul className="text-sm text-blue-800 space-y-1">
      <li>• <strong>Save as Draft:</strong> You can save and edit later before submitting</li>
      <li>• <strong>Submit Request:</strong> Send directly to HR for approval</li>
      <li>• Once submitted, you cannot edit the request</li>
    </ul>
  </div>
);
