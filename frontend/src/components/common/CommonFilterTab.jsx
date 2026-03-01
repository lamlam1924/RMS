// CommonFilterTab.jsx - Dùng cho HR Manager và Department Manager
import React from "react";

/**
 * CommonFilterTab — generic filter tab bar với đếm số lượng từng trạng thái.
 *
 * Props:
 *   filters        — [{ id, label, icon }]
 *   statCounts     — { [id]: number }
 *   currentFilter  — active filter id
 *   onFilterChange — (id: string) => void
 */
const CommonFilterTab = ({ filters, statCounts, currentFilter, onFilterChange }) => (
  <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
    {filters.map(f => (
      <button
        key={f.id}
        onClick={() => onFilterChange(f.id)}
        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
          currentFilter === f.id
            ? "bg-slate-900 dark:bg-slate-700 text-white shadow-md"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
        }`}
      >
        {f.icon} {f.label}
        {statCounts[f.id] > 0 && (
          <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
            currentFilter === f.id
              ? "bg-white/20 text-white"
              : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
          }`}>
            {statCounts[f.id]}
          </span>
        )}
      </button>
    ))}
  </div>
);
export default CommonFilterTab;
