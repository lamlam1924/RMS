import React from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Clock, ChevronRight, Eye, UserPlus } from "lucide-react";
import { formatVND } from "../../../utils/formatters/currency";
import { formatDateDisplay } from "../../../utils/formatters/date";
import { getPriorityBadge, getStatusBadgeByName } from "../../../utils/helpers/badge";
import SLABadge from "../../common/SLABadge";
import { BulkSelectCheckbox } from "../../common/BulkActionBar";

/**
 * HRJobRequestCard — card for HR Manager job-request list.
 * Shows checkbox + quick-review button for SUBMITTED items.
 * Orange border highlight for CANCEL_PENDING items.
 * UserPlus button for APPROVED items (assign HR Staff).
 *
 * Props:
 *   request       — job request data object
 *   isSelected    — bool, whether this card is bulk-selected
 *   onSelect      — fn(id) — toggle bulk selection
 *   onQuickReview — fn(e, id) — open quick-review modal
 *   onAssignStaff — fn(e, id) — open assign staff modal (APPROVED only)
 */
export default function HRJobRequestCard({ request, isSelected, onSelect, onQuickReview, onAssignStaff }) {
  const navigate = useNavigate();
  const canSelect = request.currentStatus === "SUBMITTED";
  const isApproved = request.currentStatus === "APPROVED";
  const isCancelPending = request.currentStatus === "CANCEL_PENDING";

  const handleCardClick = () => {
    if (!canSelect) navigate(`/staff/hr-manager/job-requests/${request.id}`);
  };

  const handleNavigate = (e) => {
    if (canSelect) {
      e.stopPropagation();
      navigate(`/staff/hr-manager/job-requests/${request.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white rounded-[2.5rem] p-10 border shadow-sm hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all cursor-pointer overflow-hidden ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-200"
          : isCancelPending
          ? "border-orange-300 bg-orange-50/40"
          : isApproved && !request.assignedStaffId
          ? "border-green-300 bg-green-50/20"
          : "border-slate-100"
      }`}
    >
      {/* Selection Checkbox */}
      {canSelect && (
        <div className="absolute top-6 left-6 z-20">
          <BulkSelectCheckbox
            checked={isSelected}
            onChange={() => onSelect(request.id)}
          />
        </div>
      )}

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

      <div className="relative z-10">
        {/* Top Row: initial icon + badges */}
        <div className="flex justify-between items-start mb-8">
          <div
            onClick={handleNavigate}
            className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all flex items-center justify-center font-bold text-xl shadow-sm"
          >
            {request.positionTitle?.charAt(0)}
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Status Badge */}
            {(() => {
              const sb = getStatusBadgeByName(request.currentStatus);
              return (
                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${sb.className}`}>
                  {request.currentStatus}
                </span>
              );
            })()}
            {/* Priority Badge */}
            {(() => {
              const pb = getPriorityBadge(request.priority || 3);
              return (
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${pb.className}`}>
                  {pb.icon} {pb.label}
                </span>
              );
            })()}
            {/* SLA Badge */}
            <SLABadge
              createdDate={request.createdAt}
              priority={request.priority}
              status={request.currentStatus}
              size="sm"
              showTime={false}
            />
          </div>
        </div>

        {/* Position title */}
        <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 truncate group-hover:text-blue-600 transition-colors">
          {request.positionTitle}
        </h3>

        {/* Dept + ID */}
        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-10">
          <Briefcase className="w-3.5 h-3.5" />
          <span>{request.departmentName}</span>
          <span className="mx-1 opacity-30">•</span>
          <span>#{request.id}</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-6 pt-8 border-t border-slate-50">
          <div>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <ListIcon className="w-3 h-3" /> Số lượng
            </p>
            <p className="font-bold text-slate-800 text-[16px]">
              {request.quantity}{" "}
              <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">Nhân sự</span>
            </p>
          </div>
          <div>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mb-1.5">
              Ngân sách
            </p>
            <p className="font-bold text-emerald-600 text-[16px] truncate">
              {formatVND(request.budget)}
            </p>
          </div>
        </div>

        {/* Footer Row: date + action buttons */}
        <div className="mt-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {formatDateDisplay(request.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick Review Button (SUBMITTED only) */}
            {canSelect && (
              <button
                onClick={(e) => onQuickReview(e, request.id)}
                className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-all"
                title="Đánh giá nhanh"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {/* Assign Staff Button (APPROVED only) */}
            {isApproved && onAssignStaff && !request.assignedStaffId && (
              <button
                onClick={(e) => onAssignStaff(e, request.id)}
                className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-all"
                title={request.assignedStaffId ? `Đã gán: ${request.assignedStaffName || 'HR Staff'}` : 'Gán HR Staff'}
              >
                <UserPlus className="w-4 h-4" />
              </button>
            )}
            {/* Navigate arrow */}
            <div
              onClick={handleNavigate}
              className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:translate-x-1 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline list icon helper
const ListIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
