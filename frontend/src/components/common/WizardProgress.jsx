import React from 'react';
import { Check } from 'lucide-react';

/**
 * WizardProgress Component
 * Visual progress indicator for multi-step wizard
 * @param {number} currentStep - Current active step (1-based)
 * @param {Array} steps - Array of step objects: { id, label, icon }
 * @param {Function} onStepClick - Callback when clicking a completed step
 * @param {boolean} allowSkip - Allow clicking future steps (default: false)
 */
export default function WizardProgress({ 
  currentStep = 1, 
  steps = [], 
  onStepClick,
  allowSkip = false 
}) {
  const handleStepClick = (stepIndex) => {
    if (!onStepClick) return;
    
    const targetStep = stepIndex + 1;
    
    // Allow clicking previous steps or current step
    if (targetStep <= currentStep || allowSkip) {
      onStepClick(targetStep);
    }
  };

  return (
    <div className="w-full py-8">
      {/* Desktop: Horizontal */}
      <div className="hidden md:flex items-center justify-center gap-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isClickable = (isCompleted || isActive || allowSkip) && onStepClick;

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div
                onClick={() => isClickable && handleStepClick(index)}
                className={`
                  group flex flex-col items-center gap-3
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                <div
                  className={`
                    relative w-14 h-14 rounded-2xl flex items-center justify-center
                    font-bold text-lg transition-all duration-300
                    ${isCompleted
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900'
                      : isActive
                        ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900 ring-4 ring-blue-100 dark:ring-blue-900 scale-110'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-2 border-slate-200 dark:border-slate-600'
                    }
                    ${isClickable ? 'hover:scale-105' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-7 h-7" strokeWidth={3} />
                  ) : step.icon ? (
                    <step.icon className="w-6 h-6" />
                  ) : (
                    stepNumber
                  )}
                  
                  {/* Active Pulse */}
                  {isActive && (
                    <span className="absolute -inset-1 rounded-2xl border-2 border-blue-400 dark:border-blue-600 animate-pulse" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    text-sm font-semibold transition-colors duration-300 text-center
                    ${isActive
                      ? 'text-slate-900 dark:text-slate-100'
                      : isCompleted
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    h-1 w-20 rounded-full transition-all duration-500
                    ${stepNumber < currentStep
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                    }
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile: Vertical Compact */}
      <div className="md:hidden flex flex-col gap-3">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isClickable = (isCompleted || isActive || allowSkip) && onStepClick;

          return (
            <div key={step.id} className="flex items-center gap-4">
              {/* Step Circle */}
              <div
                onClick={() => isClickable && handleStepClick(index)}
                className={`
                  flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                  font-bold text-sm transition-all duration-300
                  ${isCompleted
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : isActive
                      ? 'bg-blue-600 dark:bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-900'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }
                  ${isClickable ? 'cursor-pointer' : ''}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" strokeWidth={3} />
                ) : step.icon ? (
                  <step.icon className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Label & Connector */}
              <div className="flex-1 flex items-center gap-4">
                <span
                  className={`
                    text-sm font-semibold flex-1
                    ${isActive
                      ? 'text-slate-900 dark:text-slate-100'
                      : isCompleted
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }
                  `}
                >
                  {step.label}
                </span>

                {/* Status Badge */}
                {isCompleted && (
                  <span className="px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-bold">
                    ✓
                  </span>
                )}
                {isActive && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold">
                    •••
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar (Mobile) */}
      <div className="md:hidden mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Bước {currentStep}/{steps.length}
          </span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            {Math.round((currentStep / steps.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * WizardNavigationButtons Component
 * Standard navigation buttons for wizard steps
 */
export function WizardNavigationButtons({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  nextDisabled = false,
  nextLabel = "Tiếp theo",
  backLabel = "Quay lại",
  submitLabel = "Hoàn tất",
  loading = false,
}) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex gap-4 pt-8">
      {/* Back Button */}
      {!isFirstStep && (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {backLabel}
        </button>
      )}

      {/* Next/Submit Button */}
      <button
        type="button"
        onClick={isLastStep ? onSubmit : onNext}
        disabled={nextDisabled || loading}
        className={`
          ${isFirstStep ? 'w-full' : 'flex-[2]'}
          py-4 rounded-2xl font-bold transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isLastStep
            ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }
          text-white shadow-xl
          ${isLastStep ? 'shadow-green-200 dark:shadow-green-900' : 'shadow-blue-200 dark:shadow-blue-900'}
          active:scale-[0.98]
          flex items-center justify-center gap-2
        `}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Đang xử lý...</span>
          </>
        ) : (
          <>
            <span>{isLastStep ? submitLabel : nextLabel}</span>
            {!isLastStep && <span className="text-xl">→</span>}
          </>
        )}
      </button>
    </div>
  );
}
