// CommonPagination.jsx - Dùng cho HR Manager và Department Manager
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * CommonPagination — generic pagination bar.
 *
 * Props:
 *   totalPages     — total number of pages
 *   currentPage    — current active page (1-based)
 *   setCurrentPage — (page: number) => void
 */
const CommonPagination = ({ totalPages, currentPage, setCurrentPage }) => (
  <div className="flex items-center justify-center gap-3 mt-16">
    <button
      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
      disabled={currentPage === 1}
      className="p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>

    <div className="flex items-center gap-2">
      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => setCurrentPage(i + 1)}
          className={`w-12 h-12 rounded-2xl text-sm font-bold transition-all ${
            currentPage === i + 1
              ? "bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-600 text-white shadow-md"
              : "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
          }`}
        >
          {i + 1}
        </button>
      ))}
    </div>

    <button
      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
      disabled={currentPage === totalPages}
      className="p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
    >
      <ChevronRight className="w-5 h-5" />
    </button>
  </div>
);
export default CommonPagination;
