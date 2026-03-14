import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import hrService from "../../../services/hrService";
import notify from "../../../utils/notification";
import ConflictPlannerPanel from "../../../components/hr/interviews/ConflictPlannerPanel";
import InterviewSection from "../../../components/hr/interviews/InterviewSection";

export default function HRInterviewCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [allInterviews, setAllInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [conflictResult, setConflictResult] = useState(null);
  const [form, setForm] = useState({
    applicationId: "",
    startTime: "",
    endTime: "",
    location: "",
    meetingLink: "",
    interviewerIds: "",
    ignoreConflicts: false,
    conflictOverrideReason: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [applicationsData, interviewsData] = await Promise.all([
          hrService.applications.getAll(),
          hrService.interviews.getAll()
        ]);
        setApplications(applicationsData || []);
        setAllInterviews(Array.isArray(interviewsData) ? interviewsData : []);

        const prefillApplicationId = searchParams.get('applicationId');
        if (prefillApplicationId && applicationsData.some((app) => String(app.id) === String(prefillApplicationId))) {
          setForm((prev) => ({ ...prev, applicationId: String(prefillApplicationId) }));
        } else {
          setForm((prev) => ({ ...prev, applicationId: "" }));
        }
      } catch {
        notify.error("Không thể tải danh sách ứng viên");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.applicationId) {
      notify.warning("Vui lòng chọn đơn ứng tuyển");
      return;
    }
    if (!form.startTime || !form.endTime) {
      notify.warning("Vui lòng nhập thời gian phỏng vấn");
      return;
    }
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      notify.warning("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    setSubmitting(true);
    try {
      if (
        conflictResult?.hasConflicts &&
        !form.ignoreConflicts &&
        !conflictResult.canProceed
      ) {
        notify.warning(
          "Đang có interviewer conflict. Hãy đổi lịch hoặc bật override để tiếp tục.",
        );
        setSubmitting(false);
        return;
      }

      const result = await hrService.interviews.create({
        applicationId: parseInt(form.applicationId),
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location || null,
        meetingLink: form.meetingLink || null,
        participants: [],
        ignoreConflicts: form.ignoreConflicts,
        conflictOverrideReason: form.conflictOverrideReason || null,
      });

      notify.success("Tạo phỏng vấn thành công");
      if (result?.data?.id) {
        navigate(`/staff/hr-manager/interviews/${result.data.id}`);
      } else {
        navigate("/staff/hr-manager/interviews");
      }
    } catch (err) {
      notify.error(err.message || "Tạo phỏng vấn thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;

  const selectedApplication = applications.find(
    (app) => String(app.id) === String(form.applicationId),
  );

  const currentApplicationInterviews = allInterviews
    .filter((item) => String(item.applicationId) === String(form.applicationId))
    .sort((left, right) => (left.roundNo || 0) - (right.roundNo || 0));

  const lastRoundNo = currentApplicationInterviews.length > 0
    ? Math.max(...currentApplicationInterviews.map((item) => item.roundNo || 0))
    : 0;
  const nextRoundNo = lastRoundNo + 1;

  const roundLabels = {
    1: 'Vòng 1 • HR Screening',
    2: 'Vòng 2 • Technical Interview',
    3: 'Vòng 3 • Manager/Final Interview'
  };

  const nextRoundLabel = roundLabels[nextRoundNo] || `Vòng ${nextRoundNo} • Bổ sung theo quy trình vị trí`;

  return (
    <div
      style={{ padding: 24, backgroundColor: "#f8fafc", minHeight: "100vh" }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <button
            onClick={() => navigate("/staff/hr-manager/interviews")}
            style={{
              padding: "6px 14px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            ← Quay lại
          </button>
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}
            >
              Tạo Phỏng vấn Mới
            </h1>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              Luồng gọn: chọn hồ sơ, kiểm tra lịch, rồi xác nhận cách tổ chức
              buổi phỏng vấn.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            {
              step: "1",
              title: "Chọn hồ sơ",
              desc: "Chọn application cần lên lịch",
            },
            {
              step: "2",
              title: "Kiểm tra lịch",
              desc: "Rà conflict và chọn khung giờ",
            },
            {
              step: "3",
              title: "Xác nhận",
              desc: "Chọn hình thức và tạo interview",
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  backgroundColor: "#dbeafe",
                  color: "#1d4ed8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  marginBottom: 10,
                }}
              >
                {item.step}
              </div>
              <div
                style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}
              >
                {item.title}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <InterviewSection
            step="Bước 1"
            title="Chọn application cần phỏng vấn"
            description="Chọn đúng hồ sơ trước, sau đó mới chốt lịch và người tham gia."
          >
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                Đơn ứng tuyển <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={form.applicationId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, applicationId: e.target.value }))
                }
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              >
                <option value="">— Chọn đơn ứng tuyển —</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    #{app.id} – {app.candidateName} | {app.positionTitle} |{" "}
                    {app.departmentName} | {app.currentStatus}
                  </option>
                ))}
              </select>
            </div>

            {selectedApplication && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 12,
                    padding: 14,
                    borderRadius: 8,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                    >
                      Ứng viên
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {selectedApplication.candidateName}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                    >
                      Vị trí
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {selectedApplication.positionTitle}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                    >
                      Phòng ban
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {selectedApplication.departmentName}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                    >
                      Trạng thái hồ sơ
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {selectedApplication.currentStatus}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #bfdbfe',
                    backgroundColor: '#eff6ff',
                    fontSize: 13,
                    color: '#1e3a8a'
                  }}
                >
                  <strong>Sắp tạo:</strong> {nextRoundLabel}.
                  {currentApplicationInterviews.length > 0
                    ? ` Ứng viên đã có ${currentApplicationInterviews.length} vòng trước đó.`
                    : ' Đây là vòng đầu tiên của ứng viên này.'}
                </div>

                {currentApplicationInterviews.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {currentApplicationInterviews.map((item) => (
                      <span
                        key={item.id}
                        style={{
                          fontSize: 12,
                          padding: '3px 8px',
                          borderRadius: 999,
                          border: '1px solid #d1d5db',
                          backgroundColor: 'white',
                          color: '#374151'
                        }}
                      >
                        Vòng {item.roundNo}: {item.statusName || item.statusCode}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </InterviewSection>

          <ConflictPlannerPanel
            form={form}
            setForm={setForm}
            onConflictResultChange={setConflictResult}
          />

          <InterviewSection
            step="Bước 3"
            title="Chốt thời gian và cách tổ chức"
            description="Điền thời gian chính thức, sau đó chọn địa điểm hoặc link online để hoàn tất việc tạo lịch."
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  Bắt đầu <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  Kết thúc <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                Địa điểm
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="VD: Phòng họp A3, Tầng 5"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                Link họp trực tuyến
              </label>
              <input
                type="url"
                value={form.meetingLink}
                onChange={(e) =>
                  setForm((f) => ({ ...f, meetingLink: e.target.value }))
                }
                placeholder="https://meet.google.com/..."
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                backgroundColor: "#fafafa",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  marginBottom: 10,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.ignoreConflicts}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ignoreConflicts: e.target.checked,
                    }))
                  }
                />
                Tạo lịch dù có conflict
              </label>
              <input
                type="text"
                value={form.conflictOverrideReason}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    conflictOverrideReason: e.target.value,
                  }))
                }
                placeholder="Lý do override conflict"
                disabled={!form.ignoreConflicts}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  boxSizing: "border-box",
                  backgroundColor: form.ignoreConflicts ? "white" : "#f3f4f6",
                }}
              />
            </div>
          </InterviewSection>

          <InterviewSection
            tone="warning"
            title="Sau khi tạo xong"
            description="Nếu buổi phỏng vấn còn thiếu interviewer, bạn có thể gửi yêu cầu đề cử thêm người ngay trong trang chi tiết."
          >
            <div style={{ fontSize: 13, color: "#92400e" }}>
              Bạn không cần chuẩn bị hết mọi thứ ở màn này. Màn chi tiết sẽ là
              nơi tiếp tục điều phối interviewer, nhắc feedback và xử lý next
              round.
            </div>
          </InterviewSection>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => navigate("/staff/hr-manager/interviews")}
              style={{
                padding: "10px 20px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 24px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Đang tạo..." : "Tạo Phỏng vấn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
