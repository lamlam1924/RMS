import React, { useState, useEffect } from 'react';
import WizardProgress from '../../common/WizardProgress';
import Step1BasicInfo from './Step1BasicInfo';
import Step2BudgetReason from './Step2BudgetReason';
import Step3JobDescription from './Step3JobDescription';
import Step4Review from './Step4Review';
import { Loader2 } from 'lucide-react';

/**
 * JobRequestWizard - Multi-step wizard for job request creation
 * Manages 4 steps: Basic Info → Budget/Reason → JD Upload → Review
 */
export default function JobRequestWizard({
  formData,
  errors,
  loading,
  positions,
  handleChange,
  handleSubmit,
  handleSaveDraft,
  handleFileChange
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Wizard Steps Configuration
  const steps = [
    {
      id: 1,
      title: 'Thông tin cơ bản',
      description: 'Vị trí và yêu cầu',
      component: Step1BasicInfo
    },
    {
      id: 2,
      title: 'Ngân sách & lý do',
      description: 'Chi phí và mục đích',
      component: Step2BudgetReason
    },
    {
      id: 3,
      title: 'Job Description',
      description: 'File mô tả công việc',
      component: Step3JobDescription
    },
    {
      id: 4,
      title: 'Xác nhận',
      description: 'Kiểm tra và gửi',
      component: Step4Review
    }
  ];

  // Validate current step
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return !errors.positionId && !errors.priority && !errors.quantity && !errors.expectedStartDate &&
          formData.positionId && formData.priority && formData.quantity && formData.expectedStartDate;
      case 2:
        return !errors.budget && !errors.reason &&
          formData.budget && formData.reason && formData.reason.length >= 20;
      case 3:
        return !errors.jdFile && formData.jdFile;
      case 4:
        return true; // Review step has no validation
      default:
        return false;
    }
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle step click (allow navigation to completed steps)
  const handleStepClick = (stepId) => {
    if (stepId <= currentStep || completedSteps.has(stepId - 1)) {
      setCurrentStep(stepId);
    }
  };

  // Check if current step is valid
  const isCurrentStepValid = validateStep(currentStep);

  // Current step component
  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="space-y-8">
      {/* Wizard Progress */}
      <WizardProgress
        currentStep={currentStep}
        steps={steps.map(s => ({
          id: s.id,
          title: s.title,
          description: s.description,
          completed: completedSteps.has(s.id) || s.id < currentStep
        }))}
        onStepClick={handleStepClick}
        allowSkip={false}
      />

      {/* Step Content */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 md:p-12">
        <CurrentStepComponent
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          handleFileChange={handleFileChange}
          positions={positions}
        />

        {/* Navigation Buttons */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          {currentStep < 4 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-4 px-6 rounded-2xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                >
                  ← Quay lại
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!isCurrentStepValid}
                className={`py-4 px-6 rounded-2xl font-bold transition-all active:scale-[0.98] ${
                  currentStep === 1 ? 'md:col-span-2' : ''
                } ${
                  isCurrentStepValid
                    ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 shadow-xl shadow-blue-200 dark:shadow-blue-900'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                Tiếp theo →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="py-4 px-6 rounded-2xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
              >
                ← Quay lại
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading}
                className="py-4 px-6 rounded-2xl border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-950 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                💾 Lưu nháp
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-bold hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 shadow-xl shadow-blue-200 dark:shadow-blue-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  '✓ Gửi yêu cầu'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Step Hints */}
      <StepHints currentStep={currentStep} />
    </div>
  );
}

/**
 * Step Hints - Shows helpful hints for each step
 */
function StepHints({ currentStep }) {
  const hints = {
    1: [
      'Chọn vị trí phù hợp với nhu cầu của bộ phận', 
      '💡 Độ ưu tiên sẽ được gợi ý tự động dựa trên thời gian bắt đầu', 
      '📊 Xem timeline dự kiến tuyển dụng ngay sau khi chọn số lượng'
    ],
    2: [
      '💰 Ngân sách được phân tích tự động theo vị trí và thị trường', 
      '✨ Click vào gợi ý mẫu để nhanh chóng điền lý do tuyển dụng', 
      '🎯 Budget helper hiển thị mức cạnh tranh và phân loại seniority'
    ],
    3: [
      'File JD nên bao gồm mô tả chi tiết công việc', 
      'Hỗ trợ: PDF, DOC, DOCX, PNG, JPG', 
      'Kích thước tối đa: 10MB'
    ],
    4: [
      'Kiểm tra kỹ thông tin trước khi gửi', 
      'Sau khi gửi không thể chỉnh sửa', 
      'Bạn có thể theo dõi tiến độ sau khi gửi'
    ]
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
      <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
        <span className="text-lg">💡</span>
        Gợi ý cho bước này
      </h4>
      <ul className="space-y-2">
        {hints[currentStep]?.map((hint, index) => (
          <li key={index} className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
            <span>{hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
