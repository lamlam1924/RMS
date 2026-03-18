import React, { useState, useEffect } from "react";
import { candidateService } from "../../services/candidateService";

const STATUS_STYLE = {
  APPLIED:       { label: "Đã ứng tuyển",   cls: "bg-blue-100 text-blue-700" },
  SCREENING:     { label: "Đang sàng lọc",  cls: "bg-yellow-100 text-yellow-700" },
  INTERVIEWING:  { label: "Phỏng vấn",       cls: "bg-purple-100 text-purple-700" },
  PASSED:        { label: "Đạt",             cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" },
  REJECTED:      { label: "Không đạt",       cls: "bg-rose-100 text-rose-700 ring-1 ring-rose-200" },
};

function statusInfo(statusName) {
  const key = Object.keys(STATUS_STYLE).find(
    k => statusName?.toUpperCase().includes(k)
  );
  return STATUS_STYLE[key] || { label: statusName, cls: "bg-slate-100 text-slate-600" };
}

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    candidateService.getMyApplications()
      .then(setApplications)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center p-16 text-slate-500">
      <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
      Đang tải...
    </div>
  );

  if (error) return (
    <div className="p-10 text-center text-red-500">{error}</div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Hồ sơ ứng tuyển của tôi</h2>

      {applications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-500 font-medium">Bạn chưa có đơn ứng tuyển nào.</p>
          <a href="/app/jobs" className="mt-4 inline-block text-blue-600 font-semibold hover:underline">Khám phá việc làm →</a>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => {
            const s = statusInfo(app.statusName);
            return (
              <div key={app.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{app.jobTitle}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{app.positionTitle} · {app.departmentName}</p>
                  {app.appliedAt && (
                    <p className="text-xs text-slate-400 mt-1">
                      Nộp ngày: {new Date(app.appliedAt).toLocaleDateString("vi-VN")}
                    </p>
                  )}
                  {app.rejectionReason && (
                    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                      <strong>Lý do từ chối:</strong> {app.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
                  {app.cvFileUrl && (
                    <a
                      href={`/api/files/application/${app.id}/cv`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Xem CV
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

