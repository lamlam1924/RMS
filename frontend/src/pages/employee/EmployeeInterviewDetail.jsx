import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import employeeService from "../../services/employeeService";
import { LoadingSpinner } from "../../components/shared";
import notify from "../../utils/notification";
import { getStatusBadge } from "../../utils/helpers/badge";
import InterviewFeedbackForm from "../../components/shared/InterviewFeedbackForm";
import SimpleInterviewerDetailPage from "../../components/shared/interviews/SimpleInterviewerDetailPage";
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
    <SimpleInterviewerDetailPage
      onBack={() => navigate("/staff/employee/interviews")}
      backLabel="← Quay lại danh sách"
      title="Chi tiết buổi phỏng vấn"
      statusBadge={badge}
      statusText={interview.statusName || badge.label}
      flowMessage={
        interview.hasMyFeedback
          ? "Bạn đã hoàn thành đánh giá cho buổi phỏng vấn này."
          : canEvaluate
            ? "Bạn có thể nộp đánh giá ngay bây giờ."
            : "Phần đánh giá sẽ mở sau khi buổi phỏng vấn kết thúc."
      }
      summaryRows={[
        {
          label: "Ứng viên",
          value: candidate.fullName || interview.candidateName,
        },
        { label: "Email", value: candidate.email },
        { label: "Vị trí", value: interview.positionTitle },
        { label: "Phòng ban", value: interview.departmentName },
        { label: "Vòng", value: `Vòng ${interview.roundNo}` },
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
            description="Ghi nhận xét về ứng viên và chọn kết luận cuối cùng."
            feedback={feedback}
            setFeedback={setFeedback}
            submitting={submitting}
            onSubmit={handleSubmitFeedback}
            submitLabel="Gửi đánh giá"
            commentLabel="Nhận xét tổng quan"
            commentPlaceholder="Tóm tắt đánh giá của bạn về ứng viên..."
          />
        ) : null
      }
      successMessage={
        interview.hasMyFeedback
          ? "Đánh giá của bạn đã được lưu. Bạn có thể quay lại danh sách phỏng vấn để tiếp tục công việc khác."
          : null
      }
      pendingMessage={
        !canEvaluate && !interview.hasMyFeedback
          ? `Bạn có thể nộp đánh giá sau khi buổi phỏng vấn kết thúc vào ${formatDateTime(interview.endTime, "vi-VN")}`
          : null
      }
      maxWidth={1100}
    />
  );
}
