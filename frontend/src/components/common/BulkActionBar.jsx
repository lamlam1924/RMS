import React from 'react';
import { CheckSquare, X, CheckCircle2, XCircle, Trash2, Send } from 'lucide-react';

/**
 * BulkActionBar Component
 * Sticky action bar that appears when items are selected
 * @param {number} selectedCount - Number of selected items
 * @param {Function} onClearSelection - Callback to clear selection
 * @param {Array} actions - Array of action objects { id, label, icon, color, onClick }
 * @param {boolean} loading - Whether actions are being processed
 */
export default function BulkActionBar({ 
  selectedCount = 0, 
  onClearSelection,
  actions = [],
  loading = false 
}) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-600 px-6 py-4 flex items-center gap-6 min-w-[500px]">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-bold">
              {selectedCount} mục đã chọn
            </div>
            <div className="text-xs text-slate-400">
              Chọn hành động bên dưới
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-slate-700 dark:bg-slate-600"></div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-1">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={loading}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm
                  transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  ${action.color === 'green' 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : action.color === 'red'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : action.color === 'blue'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Clear Selection */}
        <button
          onClick={onClearSelection}
          disabled={loading}
          className="w-10 h-10 rounded-xl bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 flex items-center justify-center transition-all disabled:opacity-50"
          title="Bỏ chọn tất cả"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute inset-0 bg-slate-900/80 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-sm font-semibold">Đang xử lý...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * BulkSelectCheckbox Component
 * Checkbox for selecting individual items with dark mode support
 */
export function BulkSelectCheckbox({ checked, onChange, disabled = false }) {
  return (
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
        onClick={(e) => e.stopPropagation()}
      />
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onChange({ target: { checked: !checked } });
        }}
        className={`
          w-5 h-5 rounded-lg border-2 cursor-pointer transition-all
          ${checked 
            ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          flex items-center justify-center
        `}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  );
}

/**
 * BulkSelectAll Component
 * Checkbox for selecting all items with indeterminate state
 */
export function BulkSelectAll({ 
  checked, 
  indeterminate, 
  onChange, 
  totalCount = 0,
  selectedCount = 0 
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <div
          onClick={onChange}
          className={`
            w-5 h-5 rounded-lg border-2 cursor-pointer transition-all
            ${checked || indeterminate
              ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
              : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
            }
            flex items-center justify-center
          `}
        >
          {indeterminate ? (
            <div className="w-2.5 h-0.5 bg-white rounded-full"></div>
          ) : checked ? (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
        </div>
      </div>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {selectedCount > 0 ? (
          <>Đã chọn {selectedCount}/{totalCount}</>
        ) : (
          <>Chọn tất cả ({totalCount})</>
        )}
      </span>
    </div>
  );
}
