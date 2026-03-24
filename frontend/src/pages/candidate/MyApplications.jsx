import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const autoOpenedRef = useRef(false);

  const targetApplicationId = useMemo(() => {
    const raw = searchParams.get("applicationId");
    return raw ? Number(raw) : null;
  }, [searchParams]);

  const targetJobRequestId = useMemo(() => {
    const raw = searchParams.get("jobRequestId");
    return raw ? Number(raw) : null;
  }, [searchParams]);

  useEffect(() => {
    candidateService.getMyApplications()
      .then(setApplications)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleViewDetail = async (applicationId) => {
    try {
      setDetailLoading(true);
      const detail = await candidateService.getMyApplicationById(applicationId);
      setSelectedApplication(detail);
    } catch (err) {
      setError(err.message || "Không thể tải chi tiết hồ sơ");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (!applications.length || loading) return;

    let target = null;
    if (targetApplicationId) {
      target = applications.find((a) => a.id === targetApplicationId) || null;
    }

    if (!target && targetJobRequestId) {
      target = applications.find((a) => a.jobRequestId === targetJobRequestId) || null;
    }

    if (target) {
      autoOpenedRef.current = true;
      handleViewDetail(target.id);
    }
  }, [applications, loading, targetApplicationId, targetJobRequestId]);

  if (loading) return (
    <div className="flex items-center justify-center p-16 text-slate-500">
      <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
      Đang tải...
    </div>
  );

  if (error) return (
    <div className="p-10 text-center text-red-500">{error}</div>
  );

  const closeDetail = () => {
    setSelectedApplication(null);
    if (searchParams.get("applicationId") || searchParams.get("jobRequestId")) {
      const next = new URLSearchParams(searchParams);
      next.delete("applicationId");
      next.delete("jobRequestId");
      setSearchParams(next, { replace: true });
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return "Thỏa thuận";
    if (min && max) return `${(min / 1000000).toFixed(0)}-${(max / 1000000).toFixed(0)} triệu`;
    if (min) return `Từ ${(min / 1000000).toFixed(0)} triệu`;
    return `Đến ${(max / 1000000).toFixed(0)} triệu`;
  };

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
            const isTarget =
              (targetApplicationId && app.id === targetApplicationId) ||
              (!targetApplicationId && targetJobRequestId && app.jobRequestId === targetJobRequestId);
            return (
              <div
                key={app.id}
                className={`bg-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 ${isTarget ? "border-2 border-blue-400 ring-2 ring-blue-100" : "border border-slate-200"}`}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{app.jobTitle}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{app.positionTitle} · {app.departmentName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Mã hồ sơ #{app.id}</span>
                    {app.location && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{app.location}</span>
                    )}
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {formatSalary(app.salaryMin, app.salaryMax)}
                    </span>
                  </div>
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
                  <button
                    type="button"
                    onClick={() => handleViewDetail(app.id)}
                    className="text-xs text-slate-700 hover:text-blue-700 font-semibold border border-slate-300 hover:border-blue-300 rounded-md px-2.5 py-1 transition-colors"
                  >
                    Xem hồ sơ
                  </button>
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

      {selectedApplication && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Chi tiết hồ sơ ứng tuyển</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedApplication.jobTitle}</p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="h-9 w-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-74px)] space-y-6">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Vị trí</p>
                  <p className="font-semibold text-slate-900">{selectedApplication.positionTitle}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Phòng ban</p>
                  <p className="font-semibold text-slate-900">{selectedApplication.departmentName}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Mức lương</p>
                  <p className="font-semibold text-slate-900">
                    {formatSalary(selectedApplication.salaryMin, selectedApplication.salaryMax)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Ngày nộp</p>
                  <p className="font-semibold text-slate-900">
                    {selectedApplication.appliedAt ? new Date(selectedApplication.appliedAt).toLocaleString("vi-VN") : "-"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Trạng thái</p>
                  <p className="font-semibold text-slate-900">{selectedApplication.statusName}</p>
                </div>
              </section>

              {selectedApplication.cvFileUrl && (
                <section className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">CV đã nộp</p>
                    <p className="text-xs text-blue-700">Xem lại tệp CV ứng tuyển của bạn</p>
                  </div>
                  <a
                    href={`/api/files/application/${selectedApplication.id}/cv`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-700 hover:underline"
                  >
                    Xem CV
                  </a>
                </section>
              )}

              <section>
                <h4 className="text-base font-bold text-slate-900 mb-3">Thông tin hồ sơ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Họ tên</p>
                    <p className="text-sm font-medium text-slate-800">{selectedApplication.candidateName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium text-slate-800">{selectedApplication.candidateEmail || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Điện thoại</p>
                    <p className="text-sm font-medium text-slate-800">{selectedApplication.candidatePhone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Kinh nghiệm</p>
                    <p className="text-sm font-medium text-slate-800">{selectedApplication.yearsOfExperience ?? "-"} năm</p>
                  </div>
                </div>
                {selectedApplication.professionalTitle && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500">Tiêu đề nghề nghiệp</p>
                    <p className="text-sm font-medium text-slate-800">{selectedApplication.professionalTitle}</p>
                  </div>
                )}
                {selectedApplication.summary && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500">Tóm tắt</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{selectedApplication.summary}</p>
                  </div>
                )}
                {selectedApplication.skillsText && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500">Kỹ năng</p>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{selectedApplication.skillsText}</p>
                  </div>
                )}
              </section>

              {selectedApplication.experiences?.length > 0 && (
                <section>
                  <h4 className="text-base font-bold text-slate-900 mb-3">Kinh nghiệm làm việc</h4>
                  <div className="space-y-3">
                    {selectedApplication.experiences.map((exp) => (
                      <div key={exp.id} className="border border-slate-200 rounded-xl p-4">
                        <p className="font-semibold text-slate-900">{exp.jobTitle} - {exp.companyName}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {exp.startDate} - {exp.endDate || "Hiện tại"}
                        </p>
                        {exp.description && <p className="text-sm text-slate-700 mt-2">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selectedApplication.educations?.length > 0 && (
                <section>
                  <h4 className="text-base font-bold text-slate-900 mb-3">Học vấn</h4>
                  <div className="space-y-3">
                    {selectedApplication.educations.map((edu) => (
                      <div key={edu.id} className="border border-slate-200 rounded-xl p-4">
                        <p className="font-semibold text-slate-900">{edu.schoolName}</p>
                        <p className="text-sm text-slate-700 mt-1">{[edu.degree, edu.major].filter(Boolean).join(" - ") || "-"}</p>
                        <p className="text-xs text-slate-500 mt-1">{edu.startYear || "-"} - {edu.endYear || "-"}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selectedApplication.certificates?.length > 0 && (
                <section>
                  <h4 className="text-base font-bold text-slate-900 mb-3">Chứng chỉ</h4>
                  <div className="space-y-2">
                    {selectedApplication.certificates.map((cert) => (
                      <div key={cert.id} className="border border-slate-200 rounded-xl p-4">
                        <p className="font-semibold text-slate-900">{cert.certificateName}</p>
                        <p className="text-sm text-slate-700">{cert.issuer || "-"}</p>
                        <p className="text-xs text-slate-500">Năm cấp: {cert.issuedYear || "-"}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selectedApplication.rejectionReason && (
                <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <strong>Lý do từ chối:</strong> {selectedApplication.rejectionReason}
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-40 bg-black/20 flex items-center justify-center">
          <div className="bg-white rounded-xl px-5 py-3 text-sm font-medium text-slate-700 shadow">
            Đang tải chi tiết hồ sơ...
          </div>
        </div>
      )}
    </div>
  );
}

