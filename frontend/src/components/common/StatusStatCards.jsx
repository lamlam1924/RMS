import React from "react";

/**
 * StatusStatCards — generic clickable stat card grid.
 *
 * Card shape:
 *   { label, count, icon, color, iconBg, iconColor, countColor, filterTarget }
 *
 * Props:
 *   cards          — array of card definitions
 *   currentFilter  — active filter key
 *   onFilterChange — (filterTarget: string) => void
 */
export default function StatusStatCards({ cards, currentFilter, onFilterChange }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
      {cards.map((card) => (
        <button
          key={card.filterTarget}
          onClick={() => onFilterChange(card.filterTarget)}
          className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] text-left ${
            currentFilter === card.filterTarget
              ? card.color + " ring-2 ring-offset-2 ring-blue-400 dark:ring-blue-500"
              : card.color
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
            <span className={card.iconColor}>{card.icon}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
            <p className={`text-2xl font-bold mt-0.5 ${card.countColor}`}>{card.count}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
