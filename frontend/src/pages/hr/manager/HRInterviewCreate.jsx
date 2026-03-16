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
  const [form, setForm] = useState({
    applicationIds: [],
    jobRequestId: "",
    startTime: "",
    durationMinutes: 30,
    breakMinutes: 5,
    location: "",
    meetingLink: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        // Chỉ lấy hồ sơ đang Sàng lọc (SCREENING = 10) — đã cập nhật status mới được xếp lịch
        const [applicationsData, interviewsData] = await Promise.all([
          hrService.applications.getByStatus(10),
          hrService.interviews.getAll()
        ]);
        setApplications(applicationsData || []);
        setAllInterviews(Array.isArray(interviewsData) ? interviewsData : []);

        const prefillApplicationId = searchParams.get('applicationId');
        const prefillApp = applicationsData?.find((app) => String(app.id) === String(prefillApplicationId));
        if (prefillApp) {
          setForm((prev) => ({
            ...prev,
            jobRequestId: String(prefillApp.jobRequestId ?? ""),
            applicationIds: [String(prefillApp.id)],
          }));
        } else if (applicationsData?.length > 0) {
          const firstJob = applicationsData.find((a) => a.jobRequestId != null)?.jobRequestId;
          setForm((prev) => ({ ...prev, jobRequestId: firstJob ? String(firstJob) : "" }));
        }
      } catch (error) {
        notify.error(error?.message || "Không thể tải danh sách ứng viên");
        if (error?.message?.includes('đăng nhập') || error?.message?.includes('quyền')) {
          setTimeout(() => navigate('/login', { replace: true }), 1500);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams]);

  // Unique jobs từ applications (có jobRequestId từ API) — hooks phải gọi trước mọi early return
  const jobOptions = React.useMemo(() => {
    const seen = new Set();
    return (applications || [])
      .filter((app) => app.jobRequestId != null && !seen.has(app.jobRequestId) && seen.add(app.jobRequestId))
      .map((app) => ({ id: app.jobRequestId, label: `${app.positionTitle} – ${app.departmentName}` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [applications]);

  useEffect(() => {
    if (loading || jobOptions.length === 0) return;
    if (!form.jobRequestId && jobOptions.length === 1) {
      setForm((prev) => ({ ...prev, jobRequestId: String(jobOptions[0].id) }));
    }
  }, [loading, jobOptions, form.jobRequestId]);

  // Chỉ hiển thị hồ sơ thuộc vị trí đã chọn (cùng vị trí = cùng job = cùng interviewer sau này)
  const filteredApplications = React.useMemo(() => {
    const list = applications || [];
    if (!form.jobRequestId) return [];
    return list
      .filter((app) => String(app.jobRequestId) === String(form.jobRequestId))
      .sort((a, b) => new Date(b.appliedDate || 0) - new Date(a.appliedDate || 0));
  }, [applications, form.jobRequestId]);

  const selectedApplications = React.useMemo(
    () => (form.applicationIds || []).map((id) => filteredApplications.find((app) => String(app.id) === String(id))).filter(Boolean),
    [form.applicationIds, filteredApplications]
  );

  // Sắp xếp theo đơn nộp trước (cũ nhất trước) → slot 1 = nộp sớm nhất
  const selectedApplicationsSorted = React.useMemo(
    () => [...selectedApplications].sort((a, b) => new Date(a.appliedDate || 0) - new Date(b.appliedDate || 0)),
    [selectedApplications]
  );

  // Mỗi ứng viên một slot riêng; thứ tự slot = thứ tự đơn nộp (cũ → mới)
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

  const slotsPreview = React.useMemo(() => computeSlots(), [computeSlots]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedApplicationsSorted.length === 0) {
      notify.warning("Vui lòng chọn ít nhất một đơn ứng tuyển");
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
      const created = [];
      for (let i = 0; i < selectedApplicationsSorted.length; i++) {
        const appId = selectedApplicationsSorted[i].id;
        const result = await hrService.interviews.create({
          applicationId: parseInt(appId),
          startTime: slots[i].start,
          endTime: slots[i].end,
          location: form.location || null,
          meetingLink: form.meetingLink || null,
          participants: [],
          ignoreConflicts: false,
          conflictOverrideReason: null,
        });
        if (result?.data?.id) created.push(result.data.id);
      }

      const n = created.length;
      notify.success(n === 1 ? "Tạo phỏng vấn thành công" : `Đã tạo ${n} buổi phỏng vấn`);
      if (n === 1) {
        navigate(`/staff/hr-manager/interviews/${created[0]}`);
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

  const firstApplicationId = form.applicationIds?.[0];
  const currentApplicationInterviews = firstApplicationId
    ? allInterviews
        .filter((item) => String(item.applicationId) === String(firstApplicationId))
        .sort((a, b) => (a.roundNo || 0) - (b.roundNo || 0))
    : [];
  const lastRoundNo = currentApplicationInterviews.length > 0
    ? Math.max(...currentApplicationInterviews.map((item) => item.roundNo || 0))
    : 0;
  const nextRoundNo = lastRoundNo + 1;
  const nextRoundLabel = `Vòng ${nextRoundNo}`;

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
            { step: "1", title: "Vị trí & hồ sơ", desc: "Chọn vị trí rồi chọn đơn (cùng vị trí)" },
            { step: "2", title: "Thời gian", desc: "Khung giờ phỏng vấn" },
            { step: "3", title: "Địa điểm & tạo", desc: "Địa điểm/link, rồi tạo" },
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
            title="Chọn vị trí và hồ sơ cần xếp lịch"
            description="Mỗi đơn ứng tuyển thuộc một vị trí. Chọn vị trí trước — các hồ sơ bên dưới chỉ thuộc vị trí đó. Cùng vị trí thường cùng người phỏng vấn; chọn nhiều hồ sơ sẽ tạo nhiều buổi nối tiếp, cùng địa điểm."
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
                  Chưa có hồ sơ nào ở trạng thái Sàng lọc. Cập nhật trạng thái hồ sơ tại trang quản lý ứng tuyển.
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
                    Không có hồ sơ Sàng lọc nào cho vị trí này.
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
                  ? ` Sắp tạo 1 buổi phỏng vấn (${nextRoundLabel}).`
                  : ` Sẽ tạo ${selectedApplications.length} buổi phỏng vấn nối tiếp, cùng địa điểm (mỗi buổi một khung giờ).`}
              </div>
            )}
          </InterviewSection>

          <ConflictPlannerPanel
            form={form}
            setForm={setForm}
            slotsPreview={slotsPreview}
            selectedCount={selectedApplicationsSorted.length}
            slotCandidates={selectedApplicationsSorted}
          />

          <InterviewSection
            step="Bước 3"
            title="Địa điểm và tạo lịch"
            description="Điền địa điểm hoặc link họp (tùy chọn), rồi bấm tạo."
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

          <InterviewSection tone="info" title="Sau khi tạo" description="Trong trang chi tiết phỏng vấn bạn có thể gán người phỏng vấn hoặc gửi yêu cầu đề cử cho trưởng phòng, kiểm tra trùng lịch và nhắc nộp đánh giá.">
            <div style={{ fontSize: 13, color: "#1e40af" }}>
              Người phỏng vấn được thêm hoặc đề cử trong trang chi tiết — không cần nhập ở bước tạo lịch.
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
                  ? `Tạo ${selectedApplications.length} phỏng vấn`
                  : "Tạo phỏng vấn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
