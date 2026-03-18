import React, { useState, useEffect, useRef } from 'react';
import WizardProgress from '../../common/WizardProgress';
import Step1BasicInfo from './Step1BasicInfo';
import Step2BudgetReason from './Step2BudgetReason';
import Step3JobDescription from './Step3JobDescription';
import Step4Review from './Step4Review';
import { Loader2, Send, X } from 'lucide-react';

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
  handleFileChange,
  initialJdUrl = null,
  isEdit = false,
  jobRequestId = null,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [submitNote, setSubmitNote] = useState('');

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
        return !errors.jdFile && (formData.jdFile || !!initialJdUrl);
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
          initialJdUrl={initialJdUrl}
          jobRequestId={jobRequestId}
          isEdit={isEdit}
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
          ) : isEdit ? (
            /* EDIT mode — 3 buttons: back / save changes / save & submit */
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
                💾 Lưu thay đổi
              </button>
              <button
                type="button"
                onClick={() => setShowNoteModal(true)}
                disabled={loading}
                className="py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-bold hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 shadow-xl shadow-blue-200 dark:shadow-blue-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
                ) : (
                  '✓ Lưu & Gửi duyệt'
                )}
              </button>
            </div>
          ) : (
            /* CREATE mode — 2 buttons: back / save as draft */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-bold hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 shadow-xl shadow-blue-200 dark:shadow-blue-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang tạo...</>
                ) : (
                  '💾 Tạo bản nháp'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Step Hints */}
      <StepHints currentStep={currentStep} isEdit={isEdit} />

      {/* Submit Note Modal — edit mode only */}
      {isEdit && showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {isEdit ? 'Xác nhận gửi lại' : 'Xác nhận gửi yêu cầu'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ghi chú sẽ được đính kèm khi gửi duyệt</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowNoteModal(false); setSubmitNote(''); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Ghi chú <span className="font-normal text-slate-400">(tuỳ chọn)</span>
              </label>
              <textarea
                value={submitNote}
                onChange={(e) => setSubmitNote(e.target.value)}
                placeholder="Ví dụ: Cần tuyển gấp trước tháng 3, đã confirm với giám đốc..."
                rows={4}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
              />
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                Ghi chú này sẽ giúp HR nắm bắt tình huống nhanh hơn.
              </p>
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 flex gap-3">
              <button
                type="button"
                onClick={() => { setShowNoteModal(false); setSubmitNote(''); }}
                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNoteModal(false);
                  handleSubmit(submitNote.trim() || null);
                  setSubmitNote('');
                }}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 dark:shadow-blue-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
                ) : (
                  <><Send className="w-4 h-4" /> {isEdit ? 'Gửi lại' : 'Gửi yêu cầu'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Step Hints - Shows helpful hints for each step
 */
function StepHints({ currentStep, isEdit = false }) {
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
    4: isEdit ? [
      'Kiểm tra kỹ thông tin trước khi gửi lại', 
      'Sau khi gửi, HR sẽ được thông báo và tiếp tục xử lý',
      'Bạn có thể thêm ghi chú để giải thích lý do chỉnh sửa'
    ] : [
      'Kiểm tra kỹ thông tin trước khi tạo', 
      'Yêu cầu sẽ được lưu ở trạng thái Bản nháp — bạn có thể chỉnh sửa và gửi duyệt sau', 
      '💡 Vào trang chi tiết để gửi yêu cầu lên HR khi đã sẵn sàng'
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
