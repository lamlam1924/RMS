import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * ActionBanners — generic actionable alert banners.
 * Shows up to 3 inline; overflow opens a self-contained modal.
 *
 * Banner shape:
 *   { id, color, iconBg, iconColor, icon, text, sub?, actionLabel, filterTarget }
 *
 * Props:
 *   banners        — array of banner objects
 *   onFilterChange — (filterTarget: string) => void
 */
export default function ActionBanners({ banners, onFilterChange }) {
  const [showModal, setShowModal] = useState(false);

  if (!banners || banners.length === 0) return null;

  const visible  = banners.slice(0, 3);
  const overflow = banners.slice(3);

  const handleAction = (filterTarget, closeModal = false) => {
    onFilterChange(filterTarget);
    if (closeModal) setShowModal(false);
  };

  return (
    <>
      <div className="space-y-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-700 delay-150">
        {visible.map((banner) => (
          <div
            key={banner.id}
            className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border ${banner.color} transition-all`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${banner.iconBg}`}>
              <span className={banner.iconColor}>{banner.icon}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {banner.text}
              </p>
              {banner.sub && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {banner.sub}
                </p>
              )}
            </div>

            <button
              onClick={() => handleAction(banner.filterTarget)}
              className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-xl ${banner.iconBg} ${banner.iconColor} hover:opacity-80 transition-opacity whitespace-nowrap`}
            >
              {banner.actionLabel} →
            </button>
          </div>
        ))}

        {overflow.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            +{overflow.length} thông báo khác — Xem tất cả
          </button>
        )}
      </div>

      {/* Overflow modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Tất cả thông báo</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-8 py-6 space-y-3 max-h-96 overflow-y-auto">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border ${banner.color}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${banner.iconBg}`}>
                    <span className={banner.iconColor}>{banner.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{banner.text}</p>
                    {banner.sub && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{banner.sub}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAction(banner.filterTarget, true)}
                    className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl ${banner.iconBg} ${banner.iconColor} hover:opacity-80 transition-opacity whitespace-nowrap`}
                  >
                    {banner.actionLabel} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
