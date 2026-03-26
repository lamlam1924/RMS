import { getStatusBadge } from './badge';

/**
 * Trạng thái xác nhận/từ chối tham gia của chính user trên buổi PV (từ API list/detail).
 * Hỗ trợ cả camelCase và PascalCase (tuỳ cấu hình JSON backend).
 */
export function getParticipationDecisionFromItem(item) {
  if (!item) return 'pending';
  const confirmed = item.myConfirmedAt ?? item.MyConfirmedAt;
  const declined = item.myDeclinedAt ?? item.MyDeclinedAt;
  if (confirmed != null && confirmed !== '') return 'confirmed';
  if (declined != null && declined !== '') return 'declined';
  return 'pending';
}

/**
 * Nhãn / màu pill phản ánh thao tác xác nhận–từ chối tham gia của interviewer,
 * không thay thế trạng thái buổi PV / ứng viên khi chưa có participation rõ ràng.
 */
export function getInterviewerParticipationDisplay(interview) {
  if (!interview || interview.readOnlyNominator) return null;
  const p = interview.participation;
  if (p === 'declined') {
    return {
      label: 'Đã từ chối tham gia',
      bg: '#fef2f2',
      color: '#b91c1c',
      pillClass: 'border-rose-200 bg-rose-50 text-rose-800',
    };
  }
  if (p === 'confirmed') {
    return {
      label: 'Đã xác nhận tham gia',
      bg: '#ecfdf5',
      color: '#047857',
      pillClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    };
  }
  if (p === 'pending') {
    return {
      label: 'Chưa xác nhận tham gia',
      bg: '#fffbeb',
      color: '#b45309',
      pillClass: 'border-amber-200 bg-amber-50 text-amber-900',
    };
  }
  return null;
}

/**
 * Cho InterviewListPage: statusLabel + màu badge (inline) khi ưu tiên feedback / participation.
 */
export function buildInterviewerListCardStatus(interview, statusNameFallback) {
  if (!interview) {
    return { statusLabel: '—', statusBadgeOverride: undefined };
  }
  if (interview.needsFeedback) {
    return {
      statusLabel: 'Cần nộp feedback',
      statusBadgeOverride: { bg: '#fff1f2', color: '#be123c' },
    };
  }
  const disp = getInterviewerParticipationDisplay(interview);
  if (disp) {
    return {
      statusLabel: disp.label,
      statusBadgeOverride: { bg: disp.bg, color: disp.color },
    };
  }
  return {
    statusLabel: statusNameFallback ?? interview.statusName ?? '—',
    statusBadgeOverride: undefined,
  };
}

/**
 * Pill trên lịch / quick view (Tailwind border + nền + chữ).
 */
export function getInterviewerCalendarStatusPill(interview) {
  if (!interview) {
    return { statusText: '—', pillClass: 'border-slate-200 bg-slate-50 text-slate-700' };
  }
  if (interview.readOnlyNominator) {
    return {
      statusText: 'Chỉ xem (đề cử)',
      pillClass: 'border-amber-200 bg-amber-50 text-amber-900',
    };
  }
  if (interview.needsFeedback) {
    return {
      statusText: 'Cần nộp feedback',
      pillClass: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }
  const disp = getInterviewerParticipationDisplay(interview);
  if (disp) {
    return { statusText: disp.label, pillClass: disp.pillClass };
  }
  const badge = getStatusBadge(interview.statusCode);
  return { statusText: interview.statusName || badge.label, pillClass: badge.className };
}
