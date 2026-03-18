import React from "react";
import {
  ChevronRight,
  CheckSquare,
  Square,
  Briefcase,
  Clock,
} from "lucide-react";
import { formatDateDisplay } from "../../../utils/formatters/date";
import { getPriorityBadge } from "../../../utils/helpers/badge";
import { STATUS_BADGE } from "./constants";

/**
 * Single row in the job request list sidebar.
 * Always shows STATUS badge (workflow status) + small priority indicator.
 *
 * Props:
 *   request       – job request list DTO
 *   isSelected    – whether this row is the active detail item
 *   isChecked     – whether this row is bulk-selected (pending tab only)
 *   isPendingTab  – shows checkbox for bulk selection
 *   onSelect      – click handler for the row
 *   onCheck       – click handler for the checkbox
 */
export default function JobRequestListItem({
  request,
  isSelected,
  isChecked,
  isPendingTab,
  onSelect,
  onCheck,
}) {
  const statusBadge = STATUS_BADGE[request.currentStatusCode];
  const priorityBadge = getPriorityBadge(request.priority);

  return (
    <div
      onClick={onSelect}
      className={`group relative p-3.5 rounded-2xl cursor-pointer transition-all border ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/25 border-blue-200 dark:border-blue-800"
          : "bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-100 dark:hover:border-slate-700"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Bulk select checkbox – only shown while in "pending" tab */}
        {isPendingTab && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onCheck();
            }}
            className="mt-0.5 shrink-0"
          >
            {isChecked ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-200 dark:text-slate-600 group-hover:text-slate-400" />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* ID + status badge + priority dot */}
          <div className="flex items-center justify-between mb-1 gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-tight">
                #{request.id}
              </span>
              {/* Priority indicator — small dot + label */}
              {request.priority && request.priority <= 2 && (
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${priorityBadge?.tailwindColor ?? ""}`}
                >
                  {priorityBadge?.icon} {priorityBadge?.label}
                </span>
              )}
            </div>
            {/* Always show status badge */}
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0 ${statusBadge?.cls ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
            >
              {statusBadge?.label ?? request.currentStatus}
            </span>
          </div>

          {/* Position title */}
          <h3
            className={`text-sm font-bold truncate ${
              isSelected
                ? "text-blue-700 dark:text-blue-300"
                : "text-slate-900 dark:text-slate-100"
            }`}
          >
            {request.positionTitle}
          </h3>

          {/* Department + date */}
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
            <Briefcase className="w-3 h-3 shrink-0" />
            <span className="truncate">{request.departmentName}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <Clock className="w-3 h-3 shrink-0" />
            <span>{formatDateDisplay(request.createdAt)}</span>
          </div>
        </div>

        <ChevronRight
          className={`w-4 h-4 mt-3 transition-transform ${
            isSelected
              ? "text-blue-400 translate-x-0.5"
              : "text-slate-200 dark:text-slate-600 group-hover:translate-x-0.5"
          }`}
        />
      </div>
    </div>
  );
}
