import { Layout, Hourglass, CheckCircle, XCircle, RotateCcw } from "lucide-react";

// ── Tab definitions ───────────────────────────────────────────────────────────

export const TABS = [
  { key: "all",      label: "Tất cả",      Icon: Layout,      color: "slate"   },
  { key: "pending",  label: "Chờ duyệt",   Icon: Hourglass,   color: "blue"    },
  { key: "approved", label: "Đã duyệt",    Icon: CheckCircle, color: "emerald" },
  { key: "rejected", label: "Đã từ chối",  Icon: XCircle,     color: "red"     },
  { key: "returned", label: "Đã trả lại",  Icon: RotateCcw,   color: "indigo"  },
];

// ── Status code → tab key mapping ────────────────────────────────────────────

export const STATUS_CODE = {
  pending:  ["IN_REVIEW"],
  approved: ["APPROVED"],
  rejected: ["REJECTED"],
  returned: ["RETURNED"],
};

// ── Status badge styles (keyed by status code from backend) ──────────────────

export const STATUS_BADGE = {
  APPROVED: {
    label: "Đã duyệt",
    cls:  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    pill: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700",
  },
  REJECTED: {
    label: "Đã từ chối",
    cls:  "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    pill: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 border-red-200 dark:border-red-700",
  },
  RETURNED: {
    label: "Đã trả lại",
    cls:  "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    pill: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700",
  },
  IN_REVIEW: {
    label: "Chờ duyệt",
    cls:  "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    pill: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 border-blue-200 dark:border-blue-700",
  },
};

// ── Tab colour tokens ────────────────────────────────────────────────────────

export const TAB_COLOR = {
  slate:   { active: "text-slate-700 dark:text-slate-200 border-slate-700 dark:border-slate-200",   badge: "bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200" },
  blue:    { active: "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400",       badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  emerald: { active: "text-emerald-600 dark:text-emerald-400 border-emerald-600",                   badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
  red:     { active: "text-red-600 dark:text-red-400 border-red-600",                               badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" },
  indigo:  { active: "text-indigo-600 dark:text-indigo-400 border-indigo-600",                      badge: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" },
};

// ── Stat box colour tokens ────────────────────────────────────────────────────

export const STAT_COLOR = {
  blue:    { wrap: "bg-blue-50 dark:bg-blue-900/15 border-blue-100 dark:border-blue-800",         label: "text-blue-400 dark:text-blue-500",     value: "text-blue-700 dark:text-blue-300" },
  emerald: { wrap: "bg-emerald-50 dark:bg-emerald-900/15 border-emerald-100 dark:border-emerald-800", label: "text-emerald-400 dark:text-emerald-500", value: "text-emerald-700 dark:text-emerald-300" },
  purple:  { wrap: "bg-purple-50 dark:bg-purple-900/15 border-purple-100 dark:border-purple-800", label: "text-purple-400 dark:text-purple-500",   value: "text-purple-700 dark:text-purple-300" },
  amber:   { wrap: "bg-amber-50 dark:bg-amber-900/15 border-amber-100 dark:border-amber-800",     label: "text-amber-400 dark:text-amber-500",     value: "text-amber-700 dark:text-amber-300" },
  red:     { wrap: "bg-red-50 dark:bg-red-900/15 border-red-100 dark:border-red-800",             label: "text-red-400 dark:text-red-500",         value: "text-red-700 dark:text-red-300" },
  slate:   { wrap: "bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-600",     label: "text-slate-400 dark:text-slate-500",     value: "text-slate-800 dark:text-slate-200" },
};
