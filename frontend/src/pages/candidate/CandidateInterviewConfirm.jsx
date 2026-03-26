import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, HelpCircle } from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import notify from '../../utils/notification';

/**
 * Trang xác nhận / từ chối tham gia phỏng vấn (mở từ link trong email).
 * Route: /app/interviews/:id/confirm hoặc /app/interviews/:id/decline
 */
export default function CandidateInterviewConfirm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isDecline = location.pathname.endsWith('/decline');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await candidateService.respondInterview(id, isDecline ? 'DECLINE' : 'CONFIRM', isDecline ? note : undefined);
      setDone(true);
      notify.success(isDecline ? 'Đã ghi nhận từ chối tham gia' : 'Đã xác nhận tham gia phỏng vấn');
      setTimeout(() => navigate('/app/interviews/confirm-success', { replace: true }), 800);
    } catch (err) {
      notify.error(err?.message || 'Thao tác thất bại');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-200/50">
        {!done ? (
          <>
            <div
              className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                isDecline ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <HelpCircle className="h-7 w-7" aria-hidden />
            </div>
            <h1 className="text-center text-xl font-bold tracking-tight text-slate-900">
              {isDecline ? 'Từ chối tham gia phỏng vấn?' : 'Xác nhận tham gia phỏng vấn?'}
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
              {isDecline
                ? 'Bạn chắc chắn muốn từ chối? Có thể ghi chú lý do hoặc đề xuất khung giờ khác để HR xem xét đổi lịch.'
                : 'Bấm nút bên dưới để xác nhận bạn sẽ tham gia buổi phỏng vấn.'}
            </p>
            {isDecline && (
              <div className="mt-6">
                <label htmlFor="decline-note" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ghi chú cho HR (tùy chọn)
                </label>
                <textarea
                  id="decline-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Em bận hôm đó, có thể đổi sang buổi chiều hôm sau được không?"
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => navigate('/app/interviews', { replace: true })}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none ${
                  isDecline ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isDecline ? 'Xác nhận từ chối' : 'Xác nhận tham gia'}
              </button>
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-slate-600">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-sm font-medium">Đang chuyển trang...</p>
          </div>
        )}
      </div>
    </div>
  );
}
