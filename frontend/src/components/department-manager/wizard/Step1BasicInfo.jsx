import React, { useEffect, useState } from 'react';
import { Briefcase, AlertCircle } from 'lucide-react';
import { getMinStartDateString, getMaxStartDateString } from '../../../utils/helpers/dateRanges';
import { getPrioritySuggestion, validateQuantity, estimateHiringTimeline } from '../../../utils/helpers/smartHelpers';
import SmartHelper, { TimelineEstimator } from '../../common/SmartHelper';

/**
 * Step1BasicInfo - Wizard Step 1: Basic Information
 * Position, Priority, Quantity, Expected Start Date
 */
export default function Step1BasicInfo({ formData, errors, handleChange, positions, isEdit = false }) {
  const [quantityValidation, setQuantityValidation] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [prioritySuggestion, setPrioritySuggestion] = useState(null);

  // Validate quantity when it changes
  useEffect(() => {
    if (formData.quantity && formData.priority) {
      const validation = validateQuantity(formData.quantity, formData.priority);
      setQuantityValidation(validation);
      
      const timelineEst = estimateHiringTimeline(formData.priority, formData.quantity);
      setTimeline(timelineEst);
    }
  }, [formData.quantity, formData.priority]);

  // Suggest priority based on reason and date
  useEffect(() => {
    if (formData.reason && formData.expectedStartDate) {
      const suggested = getPrioritySuggestion(formData.reason, formData.expectedStartDate);
      if (suggested !== formData.priority) {
        setPrioritySuggestion(suggested);
      } else {
        setPrioritySuggestion(null);
      }
    }
  }, [formData.reason, formData.expectedStartDate]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Thông tin cơ bản
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Vị trí và yêu cầu tuyển dụng
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Position */}
        <FormInput
          label="Vị trí công việc"
          error={errors.positionId}
          required
          hint={isEdit ? '🔒 Vị trí không thể thay đổi sau khi tạo' : 'Chọn vị trí cần tuyển dụng'}
        >
          <select
            name="positionId"
            value={formData.positionId}
            onChange={handleChange}
            disabled={isEdit}
            className={`elegant-select${isEdit ? ' opacity-60 cursor-not-allowed' : ''}`}
          >
            <option value="">Chọn vị trí...</option>
            {positions.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.title}
              </option>
            ))}
          </select>
        </FormInput>

        {/* Priority */}
        <FormInput
          label="Độ ưu tiên"
          error={errors.priority}
          subLabel="1 (Khẩn cấp) → 2 (Cao) → 3 (Bình thường)"
          required
          hint="Mức độ khẩn cấp của yêu cầu"
        >
          <div className="space-y-3">
            <div className="flex gap-3">
              {[
                { value: 1, label: '1', color: 'red' },
                { value: 2, label: '2', color: 'orange' },
                { value: 3, label: '3', color: 'blue' }
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() =>
                    handleChange({
                      target: { name: "priority", value: p.value },
                    })
                  }
                  className={`flex-1 h-14 rounded-xl text-sm font-bold transition-all border-2 ${
                    formData.priority == p.value
                      ? p.color === 'red'
                        ? "bg-red-600 dark:bg-red-500 border-red-600 dark:border-red-500 text-white shadow-lg shadow-red-200 dark:shadow-red-900 scale-105"
                        : p.color === 'orange'
                        ? "bg-orange-600 dark:bg-orange-500 border-orange-600 dark:border-orange-500 text-white shadow-lg shadow-orange-200 dark:shadow-orange-900 scale-105"
                        : "bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900 scale-105"
                      : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {prioritySuggestion && (
              <SmartHelper
                type="suggestion"
                message={`Đề xuất độ ưu tiên: ${prioritySuggestion} dựa trên lý do và ngày bắt đầu`}
                compact
              />
            )}
          </div>
        </FormInput>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Quantity */}
        <FormInput
          label="Số lượng cần tuyển"
          error={errors.quantity}
          required
          hint="Số nhân sự cần tuyển cho vị trí này"
        >
          <div className="relative group">
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              max="50"
              className="elegant-input"
              placeholder="Số lượng (vd: 2)"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none">
              Nhân sự
            </span>
          </div>
          {quantityValidation && quantityValidation.message && (
            <SmartHelper
              type={quantityValidation.type}
              message={quantityValidation.message}
              compact
            />
          )}
        </FormInput>

        {/* Expected Start Date */}
        <FormInput
          label="Ngày bắt đầu mong muốn"
          error={errors.expectedStartDate}
          required
          hint="Ngày dự kiến nhân viên mới bắt đầu làm việc"
        >
          <input
            type="date"
            name="expectedStartDate"
            value={formData.expectedStartDate}
            onChange={handleChange}
            min={getMinStartDateString()}
            max={getMaxStartDateString()}
            className="elegant-input appearance-none"
          />
        </FormInput>
      </div>

      {/* Timeline Estimator */}
      {timeline && formData.quantity && formData.priority && (
        <TimelineEstimator timeline={timeline} />
      )}
    </div>
  );
}

/**
 * FormInput Component - Reusable form field wrapper
 */
function FormInput({ label, subLabel, error, children, required, hint }) {
  return (
    <div className="group">
      <div className="flex justify-between items-end mb-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {subLabel && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">
            {subLabel}
          </span>
        )}
      </div>
      {children}
      {error && (
        <div className="flex items-center gap-2 mt-2 px-1 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-3 h-3 text-red-500" />
          <p className="text-red-500 dark:text-red-400 text-[11px] font-bold">
            {error}
          </p>
        </div>
      )}
      {hint && !error && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 px-1">
          {hint}
        </p>
      )}
    </div>
  );
}

/* Global Styles for elegant inputs */
export const wizardStyles = `
  .elegant-input,
  .elegant-select,
  .elegant-textarea {
    width: 100%;
    padding: 0.875rem 1.25rem;
    background-color: #fcfdfe;
    border: 1.5px solid #edf1f7;
    border-radius: 1rem;
    color: #1e293b;
    font-size: 0.9375rem;
    font-weight: 600;
    outline: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .dark .elegant-input,
  .dark .elegant-select,
  .dark .elegant-textarea {
    background-color: rgb(51, 65, 85);
    border-color: rgb(71, 85, 105);
    color: rgb(226, 232, 240);
  }
  
  .elegant-input:focus,
  .elegant-select:focus,
  .elegant-textarea:focus {
    background-color: #ffffff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }
  
  .dark .elegant-input:focus,
  .dark .elegant-select:focus,
  .dark .elegant-textarea:focus {
    background-color: rgb(30, 41, 59);
    border-color: rgb(59, 130, 246);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  }
  
  .elegant-input::placeholder {
    color: #94a3b8;
    font-weight: 500;
  }
  
  .dark .elegant-input::placeholder {
    color: rgb(100, 116, 139);
  }
  
  .elegant-textarea {
    resize: none;
  }
`;
