import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateDisplay } from '../../utils/formatters/date';

/**
 * StatusHistoryTimeline Component
 * Reusable component for displaying status history with expand/collapse functionality
 * 
 * @param {Array} statusHistory - Array of status history objects
 * @param {number} initialDisplayCount - Number of items to show when collapsed (default: 3)
 * @param {string} title - Timeline title (default: "Lịch sử trạng thái")
 */
export default function StatusHistoryTimeline({ 
  statusHistory = [], 
  initialDisplayCount = 3,
  title = "Lịch sử trạng thái" 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!statusHistory || statusHistory.length === 0) {
    return null;
  }

  const displayedHistory = isExpanded 
    ? statusHistory 
    : statusHistory.slice(0, initialDisplayCount);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
        <h3 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
          {title}
        </h3>
        {statusHistory.length > initialDisplayCount && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors uppercase tracking-wide"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Thu gọn
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Xem thêm ({statusHistory.length - initialDisplayCount})
              </>
            )}
          </button>
        )}
      </div>

      <div 
        className={`space-y-8 relative transition-all ${isExpanded ? 'max-h-[600px] overflow-y-auto pr-2' : ''}`}
        style={isExpanded ? {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(148 163 184) transparent'
        } : {}}
      >
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-white/10"></div>

        {displayedHistory.map((history, idx) => (
          <div key={idx} className="relative pl-12">
            <div 
              className={`absolute left-[20px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 z-10 ${
                idx === 0 
                  ? "bg-blue-500 scale-125 ring-4 ring-blue-500/30 animate-pulse" 
                  : "bg-slate-600 opacity-60"
              }`}
            ></div>
            <p 
              className={`text-sm font-bold tracking-tight ${
                idx === 0 ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {history.toStatus}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <p className="text-[11px] text-slate-500 dark:text-slate-500 font-medium">
                {formatDateDisplay(history.changedAt)}
              </p>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
              {history.changedByName}
            </p>
            {(history.comment || history.note) && (
              <div className="mt-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-2 border-slate-300 dark:border-white/20 pl-4 py-2 bg-slate-50 dark:bg-white/5 rounded-r-xl">
                "{history.comment || history.note}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
