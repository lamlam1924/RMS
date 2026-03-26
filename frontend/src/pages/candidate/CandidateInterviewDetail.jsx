import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Link2,
  Users,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  UserCircle2
} from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import notify from '../../utils/notification';
import { formatDateTime } from '../../utils/formatters/display';

const STATUS_STYLES = {
  SCHEDULED: { label: 'Đã lên lịch', className: 'bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200' },
  RESCHEDULED: { label: 'Đổi lịch', className: 'bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200' },
  COMPLETED: { label: 'Đã hoàn thành', className: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200' },
  CANCELLED: { label: 'Đã huỷ', className: 'bg-red-50 text-red-800 ring-1 ring-inset ring-red-200' },
  DECLINED_BY_CANDIDATE: { label: 'Đã từ chối', className: 'bg-red-50 text-red-800 ring-1 ring-inset ring-red-200' },
  NO_SHOW: { label: 'Vắng mặt', className: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200' }
};

const PREV_ROUND_ICON = {
  COMPLETED: { Icon: CheckCircle2, className: 'text-emerald-500' },
  CANCELLED: { Icon: XCircle, className: 'text-red-500' },
  NO_SHOW: { Icon: AlertCircle, className: 'text-slate-400' },
  SCHEDULED: { Icon: Clock, className: 'text-blue-500' },
  CONFIRMED: { Icon: Clock, className: 'text-blue-500' }
};

function Card({ title, icon: Icon, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      {title && (
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />}
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
        </div>
      )}
      {children}
    </section>
  );
}

function InfoItem({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 sm:items-start">
      {Icon && (
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-slate-900">{children}</div>
      </div>
    </div>
  );
}

export default function CandidateInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await candidateService.getInterviewDetail(id);
      setInterview(data);
    } catch (err) {
      notify.error(err.message || 'Không thể tải chi tiết phỏng vấn');
      navigate('/app/interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (response) => {
    let note;
    if (response === 'DECLINE') {
      const value = window.prompt('Ghi chú từ chối (tùy chọn, vd. muốn đổi ngày khác) để HR thương lượng:');
      if (value === null) return;
      note = (value || '').trim() || undefined;
    }
    setResponding(true);
    try {
      await candidateService.respondInterview(id, response, note);
      notify.success(response === 'CONFIRM' ? 'Đã xác nhận tham dự phỏng vấn' : 'Đã từ chối lịch phỏng vấn');
      await loadDetail();
    } catch (err) {
      notify.error(err.message || 'Thao tác thất bại');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden />
          <p className="text-sm font-medium">Đang tải chi tiết...</p>
        </div>
      </div>
    );
  }

  if (!interview) return null;

  const status = STATUS_STYLES[interview.statusCode] || {
    label: interview.statusName,
    className: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200'
  };
  const canRespond = ['SCHEDULED', 'RESCHEDULED'].includes(interview.statusCode);
  const isDeclined = interview.statusCode === 'DECLINED_BY_CANDIDATE';
  const placeLabel = interview.location?.trim();
  const linkOnly = interview.meetingLink?.trim();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 pb-16 pt-6 sm:pt-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/app/interviews')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Quay lại danh sách
        </button>

        {/* Hero */}
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">
                {interview.departmentName}
                <span className="mx-2 text-slate-300">·</span>
                Vòng {interview.roundNo}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {interview.positionTitle}
              </h1>
            </div>
            <span
              className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
            >
              {status.label}
            </span>
          </div>
        </header>

        <div className="flex flex-col gap-5">
          <Card title="Thời gian & địa điểm" icon={Calendar}>
            <div className="grid gap-5 sm:grid-cols-2">
              <InfoItem icon={Clock} label="Bắt đầu">
                {formatDateTime(interview.startTime, 'vi-VN')}
              </InfoItem>
              <InfoItem icon={Clock} label="Kết thúc">
                {formatDateTime(interview.endTime, 'vi-VN')}
              </InfoItem>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-5">
              {placeLabel ? (
                <InfoItem icon={MapPin} label="Địa điểm">
                  {placeLabel}
                </InfoItem>
              ) : linkOnly ? (
                <InfoItem icon={Link2} label="Link họp">
                  <a
                    href={linkOnly}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 break-all text-blue-600 underline decoration-blue-200 underline-offset-2 transition hover:text-blue-700"
                  >
                    Tham gia buổi họp
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </a>
                </InfoItem>
              ) : (
                <InfoItem icon={MapPin} label="Địa điểm">
                  —
                </InfoItem>
              )}
            </div>
          </Card>

          <Card title="Ban phỏng vấn" icon={Users}>
            {(interview.participants?.length ?? 0) > 0 ? (
              <ul className="flex flex-col gap-2">
                {interview.participants.map((p, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <UserCircle2 className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                      <span className="truncate font-medium text-slate-900">{p.fullName}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                      {p.role}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-slate-600">
                Chưa có người phỏng vấn nào xác nhận tham gia. Danh sách sẽ cập nhật khi họ xác nhận (người từ chối
                hoặc chưa phản hồi không hiển thị).
              </p>
            )}
          </Card>

          {interview.previousRounds?.length > 0 && (
            <Card title="Các vòng trước" icon={History}>
              <ul className="flex flex-col gap-3">
                {interview.previousRounds.map((round) => {
                  const meta = PREV_ROUND_ICON[round.statusCode] || { Icon: Clock, className: 'text-slate-400' };
                  const RIcon = meta.Icon;
                  return (
                    <li
                      key={round.roundNo}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                    >
                      <RIcon className={`h-5 w-5 shrink-0 ${meta.className}`} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-900">Vòng {round.roundNo}</span>
                        <span className="ml-2 text-sm text-slate-500">
                          {formatDateTime(round.startTime, 'vi-VN')}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-slate-600">{round.statusName}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {canRespond && (
            <Card className="border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white">
              {interview.statusCode === 'RESCHEDULED' && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                  Lịch đã được cập nhật — vui lòng xác nhận lại tham gia.
                </div>
              )}
              <p className="mb-5 text-sm leading-relaxed text-slate-700">
                Vui lòng xác nhận hoặc từ chối lịch phỏng vấn để HR chuẩn bị buổi phỏng vấn phù hợp.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleRespond('CONFIRM')}
                  disabled={responding}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {responding ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Xác nhận tham dự
                </button>
                <button
                  type="button"
                  onClick={() => handleRespond('DECLINE')}
                  disabled={responding}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" />
                  Từ chối
                </button>
              </div>
            </Card>
          )}

          {interview.statusCode === 'CONFIRMED' && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm font-medium text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              <span>Bạn đã xác nhận tham dự. Hẹn gặp bạn tại buổi phỏng vấn!</span>
            </div>
          )}

          {isDeclined && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 px-5 py-4 text-sm text-red-900">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
              <span>Bạn đã từ chối lịch phỏng vấn này. Nếu cần hỗ trợ, vui lòng liên hệ HR.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
