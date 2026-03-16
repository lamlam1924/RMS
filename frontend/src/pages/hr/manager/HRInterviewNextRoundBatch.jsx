import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import hrService from "../../../services/hrService";
import notify from "../../../utils/notification";
import InterviewSection from "../../../components/hr/interviews/InterviewSection";

export default function HRInterviewNextRoundBatch() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [readyApplicationIds, setReadyApplicationIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    jobRequestId: "",
    applicationIds: [],
    startTime: "",
    durationMinutes: 30,
    breakMinutes: 5,
    location: "",
    meetingLink: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        // Ứng viên đang ở trạng thái INTERVIEWING (11) – giả định cần vòng tiếp theo
        const apps = await hrService.applications.getByStatus(11);
        setApplications(apps || []);
      } catch (error) {
        notify.error(error?.message || "Không thể tải danh sách hồ sơ");
        if (error?.message?.includes("đăng nhập") || error?.message?.includes("quyền")) {
          setTimeout(() => navigate("/login", { replace: true }), 1500);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const jobOptions = useMemo(() => {
    const seen = new Set();
    return (applications || [])
      .filter((app) => app.jobRequestId != null && !seen.has(app.jobRequestId) && seen.add(app.jobRequestId))
      .map((app) => ({ id: app.jobRequestId, label: `${app.positionTitle} – ${app.departmentName}` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (!form.jobRequestId) return [];
    return (applications || [])
      .filter((app) => String(app.jobRequestId) === String(form.jobRequestId))
      // Chỉ hiển thị hồ sơ đã được chốt Đạt vòng hiện tại & chưa có vòng tiếp theo
      .filter((app) => readyApplicationIds.includes(app.id))
      .sort((a, b) => new Date(b.appliedDate || 0) - new Date(a.appliedDate || 0));
  }, [applications, form.jobRequestId, readyApplicationIds]);

  const selectedApplications = useMemo(
    () => (form.applicationIds || []).map((id) => filteredApplications.find((app) => String(app.id) === String(id))).filter(Boolean),
    [form.applicationIds, filteredApplications]
  );

  const selectedApplicationsSorted = useMemo(
    () => [...selectedApplications].sort((a, b) => new Date(a.appliedDate || 0) - new Date(b.appliedDate || 0)),
    [selectedApplications]
  );

  const computeSlots = React.useCallback(() => {
    const n = selectedApplicationsSorted.length;
    if (n === 0 || !form.startTime) return [];
    const duration = Math.max(1, Number(form.durationMinutes) || 30);
    const breakM = Math.max(0, Number(form.breakMinutes) || 0);
    const start = new Date(form.startTime);
    const slots = [];
    for (let i = 0; i < n; i++) {
      const slotStart = new Date(start.getTime() + i * (duration + breakM) * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);
      slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
    }
    return slots;
  }, [form.startTime, form.durationMinutes, form.breakMinutes, selectedApplicationsSorted.length]);

  const slotsPreview = useMemo(() => computeSlots(), [computeSlots]);

  // Sau khi chọn vị trí, chỉ giữ lại hồ sơ có vòng hiện tại đã chốt Đạt & đủ điều kiện lên lịch vòng tiếp
  useEffect(() => {
    const loadReadyApplications = async () => {
      if (!form.jobRequestId) {
        setReadyApplicationIds([]);
        return;
      }
      const appsForJob = (applications || []).filter(
        (app) => String(app.jobRequestId) === String(form.jobRequestId)
      );
      if (appsForJob.length === 0) {
        setReadyApplicationIds([]);
        return;
      }
      try {
        const results = await Promise.all(
          appsForJob.map(async (app) => {
            try {
              const progress = await hrService.interviews.getRoundProgress(app.id);
              const rounds = progress?.rounds || [];
              if (!rounds.length) return null;
              const last = rounds[rounds.length - 1];
              const decisionCode = last.roundDecision?.decisionCode;
              const isPass =
                decisionCode &&
                decisionCode.toUpperCase() === "PASS";
              const hasNextRound = last.isNextRoundScheduled === true;
              if (isPass && !hasNextRound) {
                return app.id;
              }
              return null;
            } catch {
              return null;
            }
          })
        );
        setReadyApplicationIds(results.filter((id) => id != null));
      } catch {
        setReadyApplicationIds([]);
      }
    };

    loadReadyApplications();
  }, [applications, form.jobRequestId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedApplicationsSorted.length === 0) {
      notify.warning("Vui lòng chọn ít nhất một hồ sơ cần lên lịch vòng tiếp theo");
      return;
    }
    if (!form.startTime) {
      notify.warning("Vui lòng chọn thời gian bắt đầu");
      return;
    }
    const duration = Math.max(1, Number(form.durationMinutes) || 30);
    if (duration > 240) {
      notify.warning("Độ dài mỗi buổi tối đa 240 phút");
      return;
    }

    const slots = computeSlots();
    if (slots.length !== selectedApplicationsSorted.length) {
      notify.warning("Lỗi tính slot; thử lại.");
      return;
    }

    setSubmitting(true);
    try {
      const applicationIds = selectedApplicationsSorted.map((app) => app.id);
      const payload = {
        jobRequestId: form.jobRequestId ? parseInt(form.jobRequestId) : null,
        applicationIds,
        startTime: slots[0].start,
        durationMinutes: duration,
        breakMinutes: Math.max(0, Number(form.breakMinutes) || 0),
        location: form.location || null,
        meetingLink: form.meetingLink || null,
      };
      const result = await hrService.interviews.scheduleNextRoundBatch(payload);
      const createdIds = result?.data || [];
      const n = createdIds.length;
      notify.success(
        n === 1
          ? "Đã tạo 1 vòng phỏng vấn tiếp theo"
          : `Đã tạo ${n} vòng phỏng vấn tiếp theo`
      );
      if (n === 1) {
        navigate(`/staff/hr-manager/interviews/${createdIds[0]}`);
      } else {
        navigate("/staff/hr-manager/interviews");
      }
    } catch (err) {
      notify.error(err.message || "Không thể tạo vòng phỏng vấn tiếp theo");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;

  return (
    <div style={{ padding: 24, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
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
              Lên lịch vòng phỏng vấn tiếp theo (theo vị trí)
            </h1>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              Chọn vị trí, chọn các hồ sơ đủ điều kiện vòng tiếp theo, rồi xếp khung giờ nối tiếp cho từng ứng viên.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <InterviewSection
            step="Bước 1"
            title="Chọn vị trí và hồ sơ cần lên lịch vòng tiếp theo"
            description="Chỉ hiển thị những hồ sơ đang ở trạng thái Đang phỏng vấn (INTERVIEWING), đã chốt Đạt ở vòng hiện tại và chưa có vòng tiếp theo."
          >
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                Vị trí tuyển dụng <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={form.jobRequestId || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, jobRequestId: e.target.value, applicationIds: [] }))
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
                <option value="">— Chọn vị trí —</option>
                {jobOptions.map((job) => (
                  <option key={job.id} value={job.id}>{job.label}</option>
                ))}
              </select>
              {jobOptions.length === 0 && (
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                  Chưa có hồ sơ nào ở trạng thái Đang phỏng vấn.
                </div>
              )}
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                Hồ sơ trong vị trí này <span style={{ color: "#ef4444" }}>*</span>
                <span style={{ fontWeight: 400, color: "#6b7280", marginLeft: 6 }}>
                  (sắp xếp theo ngày nộp mới nhất)
                </span>
              </label>
              <div
                style={{
                  maxHeight: 220,
                  overflowY: "auto",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 8,
                  backgroundColor: "#fff",
                }}
              >
                {!form.jobRequestId ? (
                  <div style={{ padding: 12, color: "#6b7280", fontSize: 13 }}>
                    Chọn vị trí ở trên để xem danh sách hồ sơ.
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div style={{ padding: 12, color: "#6b7280", fontSize: 13 }}>
                    Không có hồ sơ Đang phỏng vấn nào cho vị trí này.
                  </div>
                ) : (
                  filteredApplications.map((app) => {
                    const idStr = String(app.id);
                    const checked = (form.applicationIds || []).includes(idStr);
                    return (
                      <label
                        key={app.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          borderRadius: 6,
                          cursor: "pointer",
                          backgroundColor: checked ? "#eff6ff" : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setForm((f) => {
                              const prev = f.applicationIds || [];
                              const next = prev.includes(idStr)
                                ? prev.filter((x) => x !== idStr)
                                : [...prev, idStr];
                              return { ...f, applicationIds: next };
                            });
                          }}
                        />
                        <span style={{ fontSize: 13, flex: 1 }}>
                          <strong>#{app.id}</strong> {app.candidateName} · {app.positionTitle}
                          {app.departmentName && ` · ${app.departmentName}`}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {selectedApplications.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid #bfdbfe",
                  backgroundColor: "#eff6ff",
                  fontSize: 13,
                  color: "#1e3a8a",
                }}
              >
                <strong>Đã chọn {selectedApplications.length} hồ sơ.</strong>
                {selectedApplications.length === 1
                  ? " Sắp tạo 1 vòng phỏng vấn tiếp theo."
                  : ` Sẽ tạo ${selectedApplications.length} vòng phỏng vấn tiếp theo nối tiếp, cùng địa điểm.`}
              </div>
            )}
          </InterviewSection>

          <InterviewSection
            step="Bước 2"
            title="Thời gian cho các buổi phỏng vấn"
            description="Chọn thời gian bắt đầu cho hồ sơ đầu tiên và độ dài mỗi buổi; hệ thống sẽ tự tính các buổi tiếp theo."
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Bắt đầu buổi đầu <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Độ dài mỗi buổi (phút)
                </label>
                <input
                  type="number"
                  min={5}
                  max={240}
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationMinutes: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: 12, maxWidth: 260 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                Nghỉ giữa 2 buổi (phút)
              </label>
              <input
                type="number"
                min={0}
                max={240}
                value={form.breakMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, breakMinutes: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {slotsPreview.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                  fontSize: 12,
                  color: "#374151",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Xem nhanh các slot sẽ tạo:</div>
                <ol style={{ paddingLeft: 18, margin: 0 }}>
                  {slotsPreview.map((slot, idx) => (
                    <li key={idx}>
                      #{idx + 1}: {new Date(slot.start).toLocaleString("vi-VN")} →{" "}
                      {new Date(slot.end).toLocaleTimeString("vi-VN")}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </InterviewSection>

          <InterviewSection
            step="Bước 3"
            title="Địa điểm / Link họp"
            description="Điền địa điểm hoặc link họp (tùy chọn). Sau khi tạo vòng tiếp theo, bạn sẽ tiếp tục gửi yêu cầu đề cử như vòng 1."
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
          </InterviewSection>

          <InterviewSection
            tone="info"
            title="Sau khi tạo vòng tiếp theo"
            description="Mỗi ứng viên sẽ có một buổi phỏng vấn mới (vòng tiếp theo) với khung giờ riêng."
          >
            <div style={{ fontSize: 13, color: "#1e40af" }}>
              Sau khi tạo xong, hãy mở chi tiết từng buổi phỏng vấn mới và dùng chức năng{" "}
              <strong>"Gửi yêu cầu đề cử"</strong> để trưởng phòng chọn người phỏng vấn cho vòng mới. Việc gán người vẫn đi qua luồng đề cử như vòng 1.
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
              {submitting
                ? "Đang tạo..."
                : selectedApplications.length > 1
                  ? `Tạo ${selectedApplications.length} vòng tiếp theo`
                  : "Tạo vòng tiếp theo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

