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

  if (loading) return <div className="p-6 text-sm text-slate-600">Đang tải...</div>;

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

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-start gap-3">
          <button
            onClick={() => navigate("/staff/hr-manager/interviews")}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
            title="Vị trí và hồ sơ"
            description="Chọn vị trí, sau đó chọn hồ sơ cần xếp lịch."
          >
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Vị trí tuyển dụng <span className="text-red-500">*</span>
              </label>
              <select
                value={form.jobRequestId || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, jobRequestId: e.target.value, applicationIds: [] }))
                }
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">— Chọn vị trí —</option>
                {jobOptions.map((job) => (
                  <option key={job.id} value={job.id}>{job.label}</option>
                ))}
              </select>
              {jobOptions.length === 0 && (
                <div className="mt-1.5 text-xs text-slate-500">
                  Chưa có hồ sơ nào ở trạng thái Sàng lọc. Cập nhật trạng thái hồ sơ tại trang quản lý ứng tuyển.
                </div>
              )}
            </div>

            <div className="mb-2">
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Hồ sơ trong vị trí này <span className="text-red-500">*</span>
              </label>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                {!form.jobRequestId ? (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    Chọn vị trí ở trên để xem danh sách hồ sơ.
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    Không có hồ sơ Sàng lọc nào cho vị trí này.
                  </div>
                ) : (
                  filteredApplications.map((app) => {
                    const idStr = String(app.id);
                    const checked = (form.applicationIds || []).includes(idStr);
                    return (
                      <label key={app.id} className={`mb-1 flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 ${checked ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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
                        <span className="flex-1 text-sm text-slate-800">
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
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-3 text-sm text-blue-800">
                <strong>Đã chọn {selectedApplications.length} hồ sơ.</strong>
                {selectedApplications.length === 1
                  ? ` Sắp tạo 1 buổi phỏng vấn (Vòng ${nextRoundNo}).`
                  : ` Sẽ tạo ${selectedApplications.length} buổi phỏng vấn nối tiếp.`}
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

          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-slate-900">Thông tin bổ sung (tùy chọn)</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Địa điểm</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="VD: Phòng họp A3, Tầng 5"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Link họp trực tuyến</label>
                <input
                  type="url"
                  value={form.meetingLink}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, meetingLink: e.target.value }))
                  }
                  placeholder="https://meet.google.com/..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate("/staff/hr-manager/interviews")}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
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
