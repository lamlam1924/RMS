import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import deptManagerService from '../../services/deptManagerService';
import { formatVND } from '../../utils/formatters/currency';
import { formatDateForInput } from '../../utils/formatters/date';
import { getMinStartDateString, getMaxStartDateString } from '../../utils/helpers/dateRanges';
import { validateJobRequestForm } from '../../utils/validators/jobRequest';

/**
 * DeptManagerJobRequestEdit Component
 * Edit existing job request (only DRAFT status)
 */
export default function DeptManagerJobRequestEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [positions, setPositions] = useState([]);
  const [formData, setFormData] = useState({
    positionId: '',
    quantity: 1,
    priority: 3,
    budget: '',
    budgetDisplay: '',
    reason: '',
    expectedStartDate: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobRequestData, positionsData] = await Promise.all([
        deptManagerService.jobRequests.getById(id),
        deptManagerService.jobRequests.getPositions()
      ]);
      
      // Check if can edit (only DRAFT)
      if (jobRequestData.statusCode !== 'DRAFT') {
        alert('Only draft job requests can be edited');
        navigate(`/staff/dept-manager/job-requests/${id}`);
        return;
      }

      // Set positions
      setPositions(positionsData || []);

      // Populate form with existing data
      setFormData({
        positionId: jobRequestData.positionId || '',
        quantity: jobRequestData.quantity || 1,
        priority: jobRequestData.priority || 3,
        budget: jobRequestData.budget ? jobRequestData.budget.toString() : '',
        reason: jobRequestData.reason || '',
        expectedStartDate: jobRequestData.expectedStartDate ? formatDateForInput(jobRequestData.expectedStartDate) : ''
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load job request. Please try again.');
      navigate('/staff/dept-manager/job-requests');
    } finally {
      setLoading(false);
    }
  };

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

  const validate = () => {
    const newErrors = validateJobRequestForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e, shouldSubmit = false) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      
      // Build update payload (without positionId)
      const payload = {
        quantity: parseInt(formData.quantity, 10),
        priority: parseInt(formData.priority, 10),
        budget: formData.budget ? parseFloat(formData.budget) : null,
        reason: formData.reason.trim(),
        expectedStartDate: formData.expectedStartDate || null
      };

      const response = await deptManagerService.jobRequests.update(id, payload);

      // Auto-submit if requested
      if (shouldSubmit) {
        await deptManagerService.jobRequests.submit(id);
        alert('Job request updated and submitted successfully!');
      } else {
        alert('Job request updated successfully!');
      }

      navigate('/staff/dept-manager/job-requests');
    } catch (error) {
      console.error('Failed to update job request:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update job request. Please try again.';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading job request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!formData.positionId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Header onBack={() => navigate('/staff/dept-manager/job-requests')} />

        {/* Form */}
        <form onSubmit={(e) => handleUpdate(e, false)} className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <PositionSelect 
            value={formData.positionId}
            options={positions}
            error={errors.positionId}
            disabled={true}
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
            loading={saving}
            onCancel={() => navigate('/staff/dept-manager/job-requests')}
            onSaveAndSubmit={(e) => handleUpdate(e, true)}
          />
        </form>

        <InfoBox />
      </div>
    </div>
  );
}

// ==================== Sub-components (Reusable) ====================

const Header = ({ onBack }) => (
  <div className="mb-8">
    <button
      onClick={onBack}
      className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2 transition-colors"
    >
      ← Back to Job Requests
    </button>
    <h1 className="text-3xl font-bold text-gray-900">Edit Job Request</h1>
    <p className="text-gray-600 mt-2">Update the details of your draft job request</p>
  </div>
);

const PositionSelect = ({ value, options, error, disabled = false }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Position <span className="text-red-500">*</span>
      {disabled && <span className="text-gray-500 font-normal ml-2">(Cannot be changed)</span>}
    </label>
    <select
      name="positionId"
      value={value}
      disabled={disabled}
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : ''
      } ${error ? 'border-red-500' : 'border-gray-300'}`}
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
    <p className="text-xs text-gray-500 mt-1">Maximum 50 positions per request</p>
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

const ExpectedStartDateInput = ({ value, error, onChange }) => (
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
      Reason <span className="text-red-500">*</span>
    </label>
    <textarea
      name="reason"
      value={value}
      onChange={onChange}
      rows={4}
      maxLength={500}
      placeholder="Explain why this hiring is needed..."
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
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

const FormActions = ({ loading, onCancel, onSaveAndSubmit }) => (
  <div className="flex gap-3 pt-4 border-t">
    <button
      type="button"
      onClick={onCancel}
      disabled={loading}
      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading}
      className="flex-1 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
    >
      {loading ? 'Saving...' : 'Save Draft'}
    </button>
    <button
      type="button"
      onClick={onSaveAndSubmit}
      disabled={loading}
      className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
    >
      {loading ? 'Submitting...' : 'Save & Submit'}
    </button>
  </div>
);

const InfoBox = () => (
  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <h3 className="text-sm font-semibold text-blue-900 mb-2">📌 Notes:</h3>
    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
      <li>Position cannot be changed after creation</li>
      <li>Save Draft: Keep as draft for later editing</li>
      <li>Save & Submit: Update and submit for approval immediately</li>
      <li>Once submitted, you cannot edit anymore</li>
    </ul>
  </div>
);
