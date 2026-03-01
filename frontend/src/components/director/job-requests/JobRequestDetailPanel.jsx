import React from "react";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  List as ListIcon,
  AlertCircle,
  Clock,
  Briefcase,
  History,
  CalendarRange,
} from "lucide-react";
import { formatVND } from "../../../utils/formatters/currency";
import { formatDateDisplay } from "../../../utils/formatters/date";
import { getPriorityBadge } from "../../../utils/helpers/badge";
import { STATUS_BADGE, STAT_COLOR } from "./constants";

// ─── Section heading ──────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
        <span className="w-5 h-px bg-slate-200 dark:bg-slate-700 inline-block" />{" "}
        {title}
      </h3>
      {children}
    </section>
  );
}

// ─── Stat box ─────────────────────────────────────────────────────────────────

function StatBox({ label, value, valueNode, icon, color = "slate" }) {
  const c = STAT_COLOR[color];
  return (
    <div className={`p-4 rounded-2xl border ${c.wrap}`}>
      <p
        className={`text-[9px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${c.label}`}
      >
        {icon && <span className="opacity-60">{icon}</span>}
        {label}
      </p>
      {valueNode ?? (
        <p className={`text-base font-bold ${c.value}`}>{value ?? "—"}</p>
      )}
    </div>
  );
}

// ─── Action buttons (pending only) ───────────────────────────────────────────

function ActionButtons({ onApprove, onReturn, onReject }) {
  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <button
        onClick={onApprove}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-md active:scale-95"
      >
        <CheckCircle className="w-4 h-4" /> Phê duyệt
      </button>
      <div className="flex gap-2">
        <button
          onClick={onReturn}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Trả lại
        </button>
        <button
          onClick={onReject}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-700 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold uppercase rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm"
        >
          <XCircle className="w-3.5 h-3.5" /> Từ chối
        </button>
      </div>
    </div>
  );
}

// ─── Approval timeline ────────────────────────────────────────────────────────

function ApprovalTimeline({ history }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
      <div className="relative space-y-6">
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-700" />
        {history.map((entry, i) => (
          <div key={i} className="relative flex gap-4 pl-12">
            <div
              className={`absolute left-[13px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 z-10 ${
                i === 0
                  ? "bg-blue-500 ring-4 ring-blue-500/20"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-bold ${i === 0 ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
              >
                {entry.statusName}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                <span>{formatDateDisplay(entry.changedAt)}</span>
                {entry.changedByName && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {entry.changedByName}
                    </span>
                  </>
                )}
                {entry.changedByRole && (
                  <>
                    <span>•</span>
                    <span className="uppercase font-medium">
                      {entry.changedByRole}
                    </span>
                  </>
                )}
              </div>
              {entry.comment && (
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 italic font-medium bg-slate-50 dark:bg-slate-700/50 border-l-2 border-slate-300 dark:border-slate-600 pl-3 py-1.5 rounded-r-lg">
                  "{entry.comment}"
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main detail panel ────────────────────────────────────────────────────────

/**
 * Props:
 *   detail      – JobRequestDetailDto
 *   isReadOnly  – hide action buttons (for processed requests)
 *   onApprove / onReturn / onReject  – action callbacks
 */
export default function JobRequestDetailPanel({
  detail,
  isReadOnly,
  onApprove,
  onReturn,
  onReject,
}) {
  const statusBadge = STATUS_BADGE[detail.currentStatusCode];
  const priorityBadge = getPriorityBadge(detail.priority);

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-10 gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusBadge?.pill ?? "bg-blue-50 text-blue-700 border-blue-200"}`}
            >
              {statusBadge?.label ?? detail.currentStatus}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">
              ID #{detail.id}
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
            {detail.positionTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              {detail.departmentName}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {formatDateDisplay(detail.createdAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        {isReadOnly ? (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider shadow-sm shrink-0">
            <History className="w-4 h-4" /> Đã xử lý – Chỉ xem
          </div>
        ) : (
          <ActionButtons
            onApprove={onApprove}
            onReturn={onReturn}
            onReject={onReject}
          />
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatBox
          label="Số lượng"
          value={`${detail.quantity} người`}
          icon={<ListIcon className="w-4 h-4" />}
          color="blue"
        />
        <StatBox
          label="Ngân sách"
          value={formatVND(detail.budget)}
          color="emerald"
        />
        <StatBox
          label="Ưu tiên"
          color={
            detail.priority === 1
              ? "red"
              : detail.priority === 2
                ? "amber"
                : "slate"
          }
          valueNode={
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${priorityBadge?.tailwindColor ?? ""}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${priorityBadge?.dot ?? ""}`}
              />
              {priorityBadge?.label}
            </span>
          }
        />
        <StatBox
          label="Bắt đầu dự kiến"
          value={formatDateDisplay(detail.expectedStartDate)}
          icon={<CalendarRange className="w-4 h-4" />}
          color="purple"
        />
      </div>

      {/* ── Content ── */}
      <div className="space-y-8">
        {/* Reason */}
        <Section title="Lý do đề xuất từ bộ phận">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm leading-relaxed font-medium italic">
            "{detail.reason}"
          </div>
        </Section>

        {/* JD attachment */}
        <Section title="Hồ sơ kèm theo">
          {detail.jdFileUrl ? (
            <a
              href={detail.jdFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Job Description (JD)
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase">
                    Tài liệu chính thức
                  </p>
                </div>
              </div>
              <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400 text-xs font-bold uppercase group-hover:bg-blue-600 group-hover:text-white transition-all">
                Xem
              </span>
            </a>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-500">
              <AlertCircle className="w-7 h-7 mb-2 opacity-40" />
              <p className="text-xs font-bold uppercase tracking-widest">
                Không có tệp đính kèm
              </p>
            </div>
          )}
        </Section>

        {/* HR note */}
        <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-8 border border-slate-800 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 border-b border-white/10 pb-3">
            Nhận xét từ phòng Nhân sự (HR)
          </h3>
          <p className="text-base text-slate-100 dark:text-slate-200 font-semibold italic leading-relaxed">
            {detail.hrNote
              ? `"${detail.hrNote}"`
              : "Không có lưu ý đặc biệt từ phía HR."}
          </p>
        </div>

        {/* Requester info */}
        <Section title="Người yêu cầu">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black text-xl shrink-0">
              {detail.requestedByName?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {detail.requestedByName}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {detail.requestedByEmail}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase mt-0.5">
                {detail.departmentName}
              </p>
            </div>
          </div>
        </Section>

        {/* Approval history */}
        {detail.approvalHistory?.length > 0 && (
          <Section title="Lịch sử phê duyệt">
            <ApprovalTimeline history={detail.approvalHistory} />
          </Section>
        )}
      </div>
    </div>
  );
}
