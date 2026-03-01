import React from "react";
import { FileText, CheckCircle2, RotateCcw, Hourglass } from "lucide-react";
import StatusStatCards from "../../common/StatusStatCards";

/**
 * DM-specific StatCards — wraps generic StatusStatCards with DM card definitions.
 */
export default function StatCards({ statCounts, currentFilter, onFilterChange }) {
  const cards = [
    {
      label: "Bản nháp",
      count: statCounts.draft,
      icon: <FileText className="w-5 h-5" />,
      color: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      iconBg: "bg-slate-100 dark:bg-slate-700",
      iconColor: "text-slate-600 dark:text-slate-300",
      countColor: "text-slate-800 dark:text-slate-100",
      filterTarget: "draft",
    },
    {
      label: "Bị trả về",
      count: statCounts.returned,
      icon: <RotateCcw className="w-5 h-5" />,
      color: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
      iconBg: "bg-orange-100 dark:bg-orange-900/60",
      iconColor: "text-orange-600 dark:text-orange-400",
      countColor: "text-orange-700 dark:text-orange-300",
      filterTarget: "returned",
    },
    {
      label: "Đang xử lý",
      count: statCounts.processing,
      icon: <Hourglass className="w-5 h-5" />,
      color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      iconBg: "bg-blue-100 dark:bg-blue-900/60",
      iconColor: "text-blue-600 dark:text-blue-400",
      countColor: "text-blue-700 dark:text-blue-300",
      filterTarget: "pending",
    },
    {
      label: "Đã duyệt",
      count: statCounts.approved,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      countColor: "text-emerald-700 dark:text-emerald-300",
      filterTarget: "approved",
    },
  ];

  return (
    <StatusStatCards
      cards={cards}
      currentFilter={currentFilter}
      onFilterChange={onFilterChange}
    />
  );
}
