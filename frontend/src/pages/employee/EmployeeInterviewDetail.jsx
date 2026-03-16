import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import employeeService from "../../services/employeeService";
import { LoadingSpinner } from "../../components/shared";
import notify from "../../utils/notification";
import { getStatusBadge } from "../../utils/helpers/badge";
import InterviewFeedbackForm, { INTERVIEW_FEEDBACK_DECISION_OPTIONS } from "../../components/shared/InterviewFeedbackForm";
import InterviewDetailPage from "../../components/shared/interviews/InterviewDetailPage";
import { formatDateTime } from "../../utils/formatters/display";

export default function EmployeeInterviewDetail() {
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
      const data = await employeeService.interviews.getById(id);

      if (!data) {
        notify.error("Không tìm thấy phỏng vấn hoặc bạn không được phân công");
        navigate("/staff/employee/interviews");
        return;
      }

      setInterview(data);
    } catch (error) {
      console.error("Failed to load interview:", error);
      notify.error("Không thể tải thông tin phỏng vấn");
      navigate("/staff/employee/interviews");
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
      const result = await employeeService.interviews.submitFeedback(
        id,
        feedback,
      );

      if (result.success) {
        notify.success("Gửi đánh giá thành công!");
        navigate("/staff/employee/interviews");
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
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18, color: "#6b7280" }}>
          Không tìm thấy buổi phỏng vấn
        </div>
      </div>
    );
  }

  const canEvaluate = isPast(interview.endTime) && !interview.hasMyFeedback;
  const badge = getStatusBadge(interview.statusCode);
  const myConfirmed = !!interview.myConfirmedAt;
  const myDeclined = !!interview.myDeclinedAt;
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
      const result = await employeeService.interviews.respond(id, response, note);
      if (result?.success) {
        notify.success(response === "CONFIRM" ? "Đã xác nhận tham gia" : "Đã ghi nhận từ chối");
        loadInterview();
      } else notify.error(result?.message || "Thao tác thất bại");
    } catch (err) {
      notify.error(err?.message || "Thao tác thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const participationSection = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        marginBottom: 16,
      }}
    >
      <span style={{ fontSize: 13, color: "#374151" }}>
        {participationPending
          ? "Xác nhận tham gia buổi này:"
          : myConfirmed
            ? "✓ Bạn đã xác nhận tham gia."
            : "Bạn đã từ chối tham gia."}
      </span>
      {participationPending && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => handleRespondParticipation("CONFIRM")}
            disabled={submitting}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#16a34a",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            Xác nhận
          </button>
          <button
            type="button"
            onClick={() => handleRespondParticipation("DECLINE")}
            disabled={submitting}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              backgroundColor: "white",
              color: "#6b7280",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 12,
            }}
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
    : canEvaluate
      ? isOverdue
        ? "Đã quá hạn — vui lòng nộp đánh giá sớm."
        : `Có thể nộp đánh giá. Hạn: ${deadlineStr}`
      : `Nộp đánh giá sau khi kết thúc. Hạn: ${deadlineStr}`;

  const candidate = interview.candidate || {};
  const candidateSection = interview.candidate ? (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        padding: 20,
        marginBottom: 16,
      }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px 0" }}>
        Hồ sơ ứng viên
      </h3>
      {candidate.summary ? (
        <div style={{ color: "#4b5563", marginBottom: 10 }}>
          {candidate.summary}
        </div>
      ) : null}
      {(candidate.experiences || []).slice(0, 3).map((exp, idx) => (
        <div
          key={idx}
          style={{ marginBottom: 8, fontSize: 13, color: "#374151" }}
        >
          • {exp.jobTitle} • {exp.companyName}
        </div>
      ))}
      {(candidate.educations || []).slice(0, 2).map((edu, idx) => (
        <div
          key={idx}
          style={{ marginBottom: 6, fontSize: 13, color: "#6b7280" }}
        >
          • {edu.degree} • {edu.schoolName}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <InterviewDetailPage
      onBack={() => navigate("/staff/employee/interviews")}
      backLabel="← Quay lại danh sách"
      title="Chi tiết buổi phỏng vấn"
      statusBadge={badge}
      statusText={interview.statusName || badge.label}
      topSection={participationSection}
      flowMessage={flowText}
      summaryRows={[
        {
          label: "Ứng viên",
          value: candidate.fullName || interview.candidateName,
        },
        { label: "Email", value: candidate.email },
        { label: "Vị trí", value: interview.positionTitle },
        { label: "Phòng ban", value: interview.departmentName },
        { label: "Vòng", value: `Vòng ${interview.roundNo}` },
        ...(canEvaluate || interview.hasMyFeedback
          ? [{ label: "Hạn nộp đánh giá", value: deadlineStr }]
          : []),
      ]}
      scheduleRows={[
        {
          label: "Bắt đầu",
          value: formatDateTime(interview.startTime, "vi-VN"),
        },
        {
          label: "Kết thúc",
          value: formatDateTime(interview.endTime, "vi-VN"),
        },
        { label: "Địa điểm", value: interview.location || "—" },
      ]}
      participants={(interview.participants || []).map((p) => ({
        id: p.userId || p.id,
        name: p.userName || p.name,
        email: p.email,
        role: p.interviewRole || p.role,
        hasFeedback: p.hasFeedback || p.hasSubmittedFeedback,
      }))}
      candidateSection={candidateSection}
      feedbackSection={
        canEvaluate ? (
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
        ) : null
      }
      successMessage={null}
      pendingMessage={null}
      maxWidth={1100}
    />
  );
}
