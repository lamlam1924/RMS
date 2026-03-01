import React from "react";
import { Send, AlertCircle, Clock, CheckCircle, CornerUpLeft, XCircle, Inbox } from "lucide-react";
import StatusStatCards from "../../common/StatusStatCards";

/**
 * HR-specific StatCards — wraps generic StatusStatCards with HR card definitions.
 */
export default function StatCards({ statCounts, currentFilter, onFilterChange }) {
  const cards = [
    {
      label: "Cần xử lý",
      count: statCounts.needsAction,
      icon: <Send className="w-5 h-5" />,
      color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      iconBg: "bg-blue-100 dark:bg-blue-900/60",
      iconColor: "text-blue-600 dark:text-blue-400",
      countColor: "text-blue-700 dark:text-blue-300",
      filterTarget: "needs_action",
    },
    {
      label: "Chờ duyệt hủy",
      count: statCounts.cancelPending,
      icon: <AlertCircle className="w-5 h-5" />,
      color: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
      iconBg: "bg-orange-100 dark:bg-orange-900/60",
      iconColor: "text-orange-600 dark:text-orange-400",
      countColor: "text-orange-700 dark:text-orange-300",
      filterTarget: "cancel_pending",
    },
    {
      label: "Chờ Director",
      count: statCounts.inReview,
      icon: <Clock className="w-5 h-5" />,
      color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
      iconBg: "bg-amber-100 dark:bg-amber-900/60",
      iconColor: "text-amber-600 dark:text-amber-400",
      countColor: "text-amber-700 dark:text-amber-300",
      filterTarget: "in_review",
    },
    {
      label: "Đã duyệt",
      count: statCounts.approved,
      icon: <CheckCircle className="w-5 h-5" />,
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
