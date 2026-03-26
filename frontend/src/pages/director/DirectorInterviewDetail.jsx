import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import interviewerService from "../../services/interviewerService";
import { LoadingSpinner } from "../../components/shared";
import notify from "../../utils/notification";
import { getStatusBadge } from "../../utils/helpers/badge";
import InterviewFeedbackForm, { INTERVIEW_FEEDBACK_DECISION_OPTIONS } from "../../components/shared/InterviewFeedbackForm";
import { formatDateTime } from "../../utils/formatters/display";

export default function DirectorInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({
    comment: "",
    decision: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInterview();
  }, [id]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const data = await interviewerService.interviews.getById(id);
      if (!data) {
        notify.error("Không tìm thấy phỏng vấn hoặc bạn không được phân công");
        navigate("/staff/director/my-interviews");
        return;
      }
      setInterview(data);
    } catch (error) {
      console.error("Failed to load interview:", error);
      notify.error("Không thể tải thông tin phỏng vấn");
      navigate("/staff/director/my-interviews");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.decision) {
      notify.warning("Vui lòng chọn kết quả (Đạt/Trượt)");
      return;
    }
    try {
      setSubmitting(true);
      const result = await interviewerService.interviews.submitFeedback(id, feedback);
      if (result?.success) {
        notify.success("Gửi đánh giá thành công!");
        navigate("/staff/director/my-interviews");
      } else {
        notify.error(result.message || "Gửi đánh giá thất bại");
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      notify.error("Gửi đánh giá thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const isPast = (dateString) => new Date(dateString) < new Date();

  if (loading) {
    return <LoadingSpinner message="Đang tải chi tiết phỏng vấn..." />;
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          Không tìm thấy buổi phỏng vấn.
        </div>
      </div>
    );
  }

  const badge = getStatusBadge(interview.statusCode);
  const myConfirmed = !!interview.myConfirmedAt;
  const myDeclined = !!interview.myDeclinedAt;
  const canEvaluate =
    myConfirmed &&
    !myDeclined &&
    isPast(interview.endTime) &&
    !interview.hasMyFeedback;
  const participationPending = !myConfirmed && !myDeclined;

  const handleRespondParticipation = async (response) => {
    let note;
    if (response === "DECLINE") {
      const value = window.prompt("Ghi chú từ chối (tùy chọn, vd. bận ngày đó / có thể chọn ngày khác) để HR thương lượng:");
      if (value === null) return;
      note = (value || "").trim() || undefined;
    }
    try {
      setSubmitting(true);
      const result = await interviewerService.interviews.respond(id, response, note);
      if (result?.success) {
        notify.success(response === "CONFIRM" ? "Đã xác nhận tham gia" : "Đã ghi nhận từ chối");
        loadInterview();
      } else {
        notify.error(result?.message || "Thao tác thất bại");
      }
    } catch (err) {
      notify.error(err?.message || "Thao tác thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const participationSection = (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-sm text-slate-700">
        {participationPending
          ? "Xác nhận tham gia buổi này:"
          : myConfirmed
            ? "✓ Bạn đã xác nhận tham gia."
            : "Bạn đã từ chối tham gia."}
      </span>
      {participationPending && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleRespondParticipation("CONFIRM")}
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Xác nhận
          </button>
          <button
            type="button"
            onClick={() => handleRespondParticipation("DECLINE")}
            disabled={submitting}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Từ chối
          </button>
        </div>
      )}
    </div>
  );

  const feedbackDeadline = interview.requiresFeedbackBy
    ? new Date(interview.requiresFeedbackBy)
    : (() => {
        const d = new Date(interview.endTime);
        d.setDate(d.getDate() + 3);
        return d;
      })();

  const deadlineStr = feedbackDeadline.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isOverdue = canEvaluate && new Date() > feedbackDeadline;

  const flowText = interview.hasMyFeedback
    ? "Bạn đã nộp đánh giá."
    : myDeclined
      ? "Bạn đã từ chối tham gia — không thể nộp đánh giá."
      : !myConfirmed
        ? "Xác nhận tham gia để có thể nộp đánh giá sau khi buổi phỏng vấn kết thúc."
        : canEvaluate
          ? isOverdue
            ? "Đã quá hạn — vui lòng nộp đánh giá sớm."
            : `Có thể nộp đánh giá. Hạn: ${deadlineStr}`
          : `Nộp đánh giá sau khi kết thúc. Hạn: ${deadlineStr}`;

  // CV/Resume profile can come from different keys depending on API.
  const candidate = interview.candidateProfile || interview.candidate || {};

  const cvExperiences =
    candidate?.experiences ||
    candidate?.workExperiences ||
    candidate?.experienceList ||
    candidate?.cvExperiences ||
    [];

  const cvEducations =
    candidate?.educations ||
    candidate?.educationList ||
    candidate?.cvEducations ||
    [];

  const cvDownloadUrl = interview?.applicationId
    ? `/api/files/application/${interview.applicationId}/cv`
    : candidate?.cvFileUrl
      ? `/api/files/cv?url=${encodeURIComponent(candidate.cvFileUrl)}`
      : candidate?.cvUrl || candidate?.resumeUrl || "";

  const candidateCertificates =
    candidate?.certificates ||
    candidate?.Certificates ||
    candidate?.certifications ||
    candidate?.Certifications ||
    candidate?.certificateList ||
    candidate?.CertificateList ||
    candidate?.cvCertificates ||
    candidate?.CvCertificates ||
    [];

  const formatCvMonthYear = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      const iso = String(value);
      if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
        const d2 = new Date(iso.slice(0, 10) + "T00:00:00");
        if (!Number.isNaN(d2.getTime())) return d2.toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" });
      }
      return "";
    }
    return d.toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" });
  };

  const hasAnyCvInfo =
    Boolean(cvDownloadUrl) ||
    Boolean(candidate?.summary) ||
    (cvExperiences?.length ?? 0) > 0 ||
    (cvEducations?.length ?? 0) > 0 ||
    (candidateCertificates?.length ?? 0) > 0 ||
    Boolean(candidate?.phone) ||
    Boolean(candidate?.email) ||
    Boolean(candidate?.fullName) ||
    candidate?.yearsOfExperience != null ||
    Boolean(candidate?.source);

  const candidateSection = (interview.candidate || interview.candidateProfile) ? (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900">Hồ sơ ứng viên</h3>
        {cvDownloadUrl ? (
          <a
            href={cvDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            Xem / Tải CV
          </a>
        ) : null}
      </div>

      {!hasAnyCvInfo && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-600">
          Ứng viên chưa cập nhật hồ sơ CV.
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-xs text-slate-500">Họ tên</div>
          <div className="mt-0.5 text-sm font-semibold text-slate-900">{candidate.fullName || interview.candidateName || "—"}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Email</div>
          <div className="mt-0.5 text-sm font-medium text-slate-800">{candidate.email || "—"}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">SĐT</div>
          <div className="mt-0.5 text-sm font-medium text-slate-800">{candidate.phone || "—"}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Kinh nghiệm</div>
          <div className="mt-0.5 text-sm font-medium text-slate-800">
            {candidate.yearsOfExperience != null && candidate.yearsOfExperience !== "" ? `${candidate.yearsOfExperience} năm` : "—"}
          </div>
        </div>
        <div className="sm:col-span-2">
          <div className="text-xs text-slate-500">Nguồn</div>
          <div className="mt-0.5 text-sm font-medium text-slate-800">{candidate.source || "—"}</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Tóm tắt</div>
        {candidate.summary ? (
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{candidate.summary}</p>
        ) : (
          <p className="text-sm text-slate-500">Chưa có tóm tắt.</p>
        )}
      </div>

      <div className="mb-4">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Kinh nghiệm</div>
        {(cvExperiences || []).length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có kinh nghiệm.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(cvExperiences || []).map((exp, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="text-sm font-semibold text-slate-900">{exp.jobTitle || "—"}</div>
                <div className="text-sm text-slate-700">{exp.companyName || "—"}</div>
                {(exp.startDate || exp.endDate) && (
                  <div className="mt-1 text-xs text-slate-500">
                    {(formatCvMonthYear(exp.startDate) || "—")} → {(formatCvMonthYear(exp.endDate) || "Hiện tại")}
                  </div>
                )}
                {exp.description ? <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{exp.description}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Học vấn</div>
        {(cvEducations || []).length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có học vấn.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(cvEducations || []).map((edu, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="text-sm font-semibold text-slate-900">{edu.schoolName || "—"}</div>
                <div className="text-sm text-slate-700">{[edu.degree, edu.major].filter(Boolean).join(" — ") || "—"}</div>
                {(edu.startYear || edu.endYear || edu.gpa != null) && (
                  <div className="mt-1 text-xs text-slate-500">
                    {[edu.startYear ? `Từ ${edu.startYear}` : null, edu.endYear ? `đến ${edu.endYear}` : null, edu.gpa != null ? `GPA ${edu.gpa}` : null]
                      .filter(Boolean)
                      .join(" • ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-1">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Chứng chỉ</div>
        {(candidateCertificates || []).length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có chứng chỉ.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(candidateCertificates || []).map((c, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="text-sm font-semibold text-slate-900">{c.certificateName || c.CertificateName || "—"}</div>
                <div className="text-xs text-slate-600">
                  {[c.issuer || c.Issuer, (c.issuedYear ?? c.IssuedYear) ? `Năm ${c.issuedYear ?? c.IssuedYear}` : null].filter(Boolean).join(" • ") || "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => navigate("/staff/director/my-interviews")}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ← Quay lại
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">Chi tiết buổi phỏng vấn</h1>
              <p className="mt-1 text-sm text-slate-600">
                {interview.positionTitle} · Vòng {interview.roundNo}
              </p>
            </div>
          </div>

          <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${badge.className || ""}`}>
            {interview.statusName || badge.label}
          </span>
        </div>

        <div className="mb-4">{participationSection}</div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Trạng thái</div>
          <div className={`text-sm font-semibold ${isOverdue ? "text-rose-700" : "text-slate-900"}`}>{flowText}</div>
          {(canEvaluate || interview.hasMyFeedback) && (
            <div className="mt-2 text-xs text-slate-600">
              Hạn nộp đánh giá: <span className="font-semibold text-slate-900">{deadlineStr}</span>
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Thông tin</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs text-slate-500">Ứng viên</div>
                <div className="mt-0.5 text-sm font-semibold text-slate-900">{candidate.fullName || interview.candidateName || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Email</div>
                <div className="mt-0.5 text-sm font-medium text-slate-800">{candidate.email || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Vị trí</div>
                <div className="mt-0.5 text-sm font-medium text-slate-800">{interview.positionTitle || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Địa điểm</div>
                <div className="mt-0.5 text-sm font-medium text-slate-800">{interview.location || interview.meetingLink || "—"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Lịch phỏng vấn</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs text-slate-500">Bắt đầu</div>
                <div className="mt-0.5 text-sm font-medium text-slate-800">{formatDateTime(interview.startTime, "vi-VN")}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Kết thúc</div>
                <div className="mt-0.5 text-sm font-medium text-slate-800">{formatDateTime(interview.endTime, "vi-VN")}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-slate-500">Địa điểm / Link</div>
                <div className="mt-0.5 text-sm font-medium text-slate-800">
                  {(interview.location || "").trim() ? (
                    interview.location
                  ) : (interview.meetingLink || "").trim() ? (
                    <a className="break-all text-blue-600 underline-offset-2 hover:underline" href={interview.meetingLink} target="_blank" rel="noreferrer">
                      {interview.meetingLink}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {candidateSection}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-slate-900">Người tham gia ({(interview.participants || []).length})</h2>
            {(interview.participants || []).length === 0 ? (
              <p className="text-sm text-slate-600">Chưa có người tham gia.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(interview.participants || []).map((p) => {
                  const hasFb = !!(p.hasFeedback || p.hasSubmittedFeedback);
                  return (
                    <div key={p.userId || p.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{p.userName || p.name || "—"}</div>
                        <div className="truncate text-xs text-slate-600">{p.email || "—"}</div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        {hasFb && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Đã nộp
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {canEvaluate && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <InterviewFeedbackForm
              title="Nộp đánh giá của bạn"
              description="Ghi nhận xét về ứng viên và chọn kết luận."
              feedback={feedback}
              setFeedback={setFeedback}
              submitting={submitting}
              onSubmit={handleSubmitFeedback}
              submitLabel="Gửi đánh giá"
              commentLabel="Nhận xét tổng quan"
              commentPlaceholder="Tóm tắt đánh giá của bạn về ứng viên..."
              decisionOptions={INTERVIEW_FEEDBACK_DECISION_OPTIONS}
            />
          </div>
        )}
      </div>
    </div>
  );
}
