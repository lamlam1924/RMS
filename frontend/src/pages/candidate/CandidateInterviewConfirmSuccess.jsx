import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ListChecks } from 'lucide-react';

/**
 * Trang hiển thị sau khi ứng viên bấm link xác nhận/tham gia phỏng vấn trong email.
 */
export default function CandidateInterviewConfirmSuccess() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50/80 to-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-emerald-200/80 bg-white p-10 text-center shadow-lg shadow-emerald-100/50">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-9 w-9" strokeWidth={2} aria-hidden />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-emerald-900">Đã ghi nhận</h1>
        <p className="mt-3 text-sm leading-relaxed text-emerald-800/90">
          Phản hồi của bạn đã được lưu. Bạn có thể xem lại lịch phỏng vấn trong mục ứng tuyển.
        </p>
        <button
          type="button"
          onClick={() => navigate('/app/interviews', { replace: true })}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto sm:min-w-[220px]"
        >
          <ListChecks className="h-4 w-4" aria-hidden />
          Xem danh sách phỏng vấn
        </button>
      </div>
    </div>
  );
}
