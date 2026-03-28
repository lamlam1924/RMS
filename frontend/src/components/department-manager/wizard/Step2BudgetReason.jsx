import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { analyzeBudgetCompetitiveness, getReasonSuggestions } from '../../../utils/helpers/smartHelpers';
import SmartHelper, { SmartSuggestionList } from '../../common/SmartHelper';

/**
 * Step2BudgetReason - Wizard Step 2: Budget & Justification
 * Budget estimation and request reason
 */
export default function Step2BudgetReason({ formData, errors, handleChange, positions }) {
  const [budgetDisplay, setBudgetDisplay] = useState('');
  const [isBudgetFocused, setIsBudgetFocused] = useState(false);
  const [budgetAnalysis, setBudgetAnalysis] = useState(null);
  const [reasonSuggestions, setReasonSuggestions] = useState([]);

  // Get position title for smart helpers
  const selectedPosition = positions?.find(p => p.id == formData.positionId);
  const positionTitle = selectedPosition?.title || '';

  // Update display value when formData.budget changes and input is not focused
  useEffect(() => {
    if (!isBudgetFocused && formData.budget) {
      setBudgetDisplay(formatCurrency(formData.budget));
    } else if (!formData.budget) {
      setBudgetDisplay('');
    }
  }, [formData.budget, isBudgetFocused]);

  // Analyze budget competitiveness
  useEffect(() => {
    if (formData.budget && positionTitle) {
      const analysis = analyzeBudgetCompetitiveness(formData.budget, positionTitle);
      setBudgetAnalysis(analysis);
    } else {
      setBudgetAnalysis(null);
    }
  }, [formData.budget, positionTitle]);

  // Generate reason suggestions
  useEffect(() => {
    if (positionTitle) {
      const suggestions = getReasonSuggestions({ ...formData, positionTitle });
      setReasonSuggestions(suggestions);
    }
  }, [positionTitle, formData.expectedStartDate]);
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Ngân sách & lý do
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ước tính chi phí và lý do tuyển dụng
          </p>
        </div>
      </div>

      {/* Budget Input */}
      <FormInput
        label="Ngân sách dự kiến (VND)"
        error={errors.budget}
        required
        hint="Mức lương ước tính cho vị trí này (tính theo tháng)"
      >
        <div className="relative group">
          <input
            type="text"
            name="budget"
            value={isBudgetFocused ? (formData.budget || '') : budgetDisplay}
            onFocus={() => {
              setIsBudgetFocused(true);
              setBudgetDisplay(formData.budget || '');
            }}
            onBlur={() => {
              setIsBudgetFocused(false);
              if (formData.budget) {
                setBudgetDisplay(formatCurrency(formData.budget));
              }
            }}
            onChange={(e) => {
              const rawValue = e.target.value.replace(/\D/g, '');
              setBudgetDisplay(rawValue);
              handleChange({
                target: { name: 'budget', value: rawValue }
              });
            }}
            className="elegant-input pr-20"
            placeholder="Vd: 15000000"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors pointer-events-none">
            VND/tháng
          </span>
        </div>
        {formData.budget && !errors.budget && (
          <>
            <BudgetHelper amount={formData.budget} />
            {budgetAnalysis && budgetAnalysis.level !== 'none' && (
              <SmartHelper
                type={budgetAnalysis.level === 'optimal' || budgetAnalysis.level === 'acceptable' ? 'success' : 'warning'}
                message={budgetAnalysis.message}
                suggestion={budgetAnalysis.suggestion}
              />
            )}
          </>
        )}
      </FormInput>

      {/* Reason Input */}
      <FormInput
        label="Lý do tuyển dụng"
        error={errors.reason}
        required
        hint="Giải thích nhu cầu tuyển dụng (tối thiểu 20 ký tự)"
      >
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          rows="6"
          className="elegant-textarea"
          placeholder="VD: Dự án mở rộng thị trường miền Nam cần thêm 2 Backend Developer với kinh nghiệm về microservices và cloud infrastructure..."
        />
        <CharacterCount current={formData.reason?.length || 0} min={20} />
        
        {/* Reason Suggestions */}
        {reasonSuggestions.length > 0 && !formData.reason && (
          <SmartSuggestionList
            title="Gợi ý mẫu lý do tuyển dụng"
            suggestions={reasonSuggestions}
            onSelect={(suggestion) => {
              handleChange({
                target: { name: 'reason', value: suggestion }
              });
            }}
          />
        )}
      </FormInput>
    </div>
  );
}

/**
 * FormInput Component - Reusable form field wrapper
 */
function FormInput({ label, error, children, required, hint }) {
  return (
    <div className="group">
      <div className="flex justify-between items-end mb-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
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

/**
 * Budget Helper Component - Shows estimated annual cost and budget category
 */
function BudgetHelper({ amount }) {
  const monthly = parseInt(amount) || 0;
  const annual = monthly * 12;
  const category = getBudgetCategory(monthly);

  return (
    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Tổng năm
          </span>
        </div>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(annual.toString())} VND
        </p>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:col-span-2">
        <div className="flex items-center gap-2 mb-1">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Phân loại
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${category.className}`}>
            {category.label}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {category.range}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Character Count Component - Shows character count with progress
 */
function CharacterCount({ current, min }) {
  const progress = (current / min) * 100;
  const isValid = current >= min;

  return (
    <div className="mt-2 px-1">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] font-semibold ${
          isValid 
            ? 'text-emerald-600 dark:text-emerald-400' 
            : 'text-slate-400 dark:text-slate-500'
        }`}>
          {current} / {min} ký tự
        </span>
        {isValid && (
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            ✓ Đủ độ dài
          </span>
        )}
      </div>
      <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            isValid 
              ? 'bg-emerald-500' 
              : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Format Currency - Adds thousand separators
 */
function formatCurrency(value) {
  if (!value) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Get Budget Category - Categorizes budget into ranges
 */
function getBudgetCategory(monthly) {
  if (monthly < 10000000) {
    return {
      label: 'Junior',
      range: '< 10 triệu',
      className: 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300'
    };
  } else if (monthly < 20000000) {
    return {
      label: 'Middle',
      range: '10-20 triệu',
      className: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
    };
  } else if (monthly < 35000000) {
    return {
      label: 'Senior',
      range: '20-35 triệu',
      className: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
    };
  } else if (monthly < 50000000) {
    return {
      label: 'Lead/Expert',
      range: '35-50 triệu',
      className: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
    };
  } else {
    return {
      label: 'Executive',
      range: '> 50 triệu',
      className: 'bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-700 dark:text-fuchsia-300'
    };
  }
}
