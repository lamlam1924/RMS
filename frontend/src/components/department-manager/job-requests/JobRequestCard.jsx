import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Clock, ChevronRight } from "lucide-react";
import { formatVND } from "../../../utils/formatters/currency";
import { formatDateDisplay } from "../../../utils/formatters/date";
import {
  calculateDaysPending,
  getDaysPendingLabel,
  isPendingUrgent,
} from "../../../utils/helpers/dateUtils";
import { getPriorityBadge, getStatusBadgeByName } from "../../../utils/helpers/badge";
import SLABadge from "../../common/SLABadge";

/**
 * JobRequestCard — single card in the job request grid.
 */
export default function JobRequestCard({ request }) {
  const navigate = useNavigate();
  const daysPending = calculateDaysPending(request.createdAt);
  const priorityBadge = getPriorityBadge(request.priority || 3);
  const statusBadge = getStatusBadgeByName(request.currentStatus);

  return (
    <div
      onClick={() => navigate(`/staff/dept-manager/job-requests/${request.id}`)}
      className="group relative bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer overflow-hidden"
    >
      {/* Decorative circle */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/30 dark:bg-blue-900/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex justify-between items-start mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm flex items-center justify-center font-bold text-xl text-slate-800 dark:text-slate-200 group-hover:bg-gradient-to-br group-hover:from-slate-900 group-hover:to-slate-800 group-hover:text-white group-hover:border-slate-800 transition-all">
            {request.positionTitle.charAt(0)}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <span className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${statusBadge.className}`}>
              {request.currentStatus === "Yêu cầu chỉnh sửa" ? "⚠️ " : ""}
              {request.currentStatus}
            </span>
            <span className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest ${priorityBadge.className} shadow-sm`}>
              {priorityBadge.icon} {priorityBadge.label}
            </span>
            <SLABadge
              createdDate={request.createdAt}
              priority={request.priority || 3}
              status={request.currentStatus}
              size="sm"
              showTime={false}
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-2 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {request.positionTitle}
        </h3>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-10">
          <span>#{request.id}</span>
          <span className="mx-1 opacity-30">•</span>
          <span className="truncate">{request.departmentName}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 pt-8 border-t-2 border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Plus className="w-3 h-3 rotate-45" /> Số lượng
            </p>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-[16px]">
              {request.quantity}{" "}
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">NS</span>
            </p>
          </div>
          <div>
            <p className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest mb-1.5">
              Ngân sách
            </p>
            <p className="font-bold text-emerald-700 dark:text-emerald-400 text-[16px] truncate">
              {formatVND(request.budget)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {formatDateDisplay(request.createdAt)}
              </span>
            </div>
            {daysPending > 0 && (
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                  isPendingUrgent(daysPending) ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {getDaysPendingLabel(daysPending)} trước
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/staff/dept-manager/job-requests/${request.id}`);
            }}
            className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white group-hover:translate-x-1 transition-all shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
