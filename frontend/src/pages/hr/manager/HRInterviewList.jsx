import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import hrService from "../../../services/hrService";
import notify from "../../../utils/notification";
import LoadingSpinner from "../../../components/shared/LoadingSpinner";
import { getStatusBadge } from "../../../utils/helpers/badge";
import { formatDateTime } from "../../../utils/formatters/display";

export default function HRInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [focusMode, setFocusMode] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [roundFilter, setRoundFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("start-asc");
  const [selectedBlockKey, setSelectedBlockKey] = useState(null);

  useEffect(() => {
    loadInterviews();
  }, [filter]);
  useEffect(() => {
    // Đổi tab dữ liệu (Sắp diễn ra/Tất cả) thì reset filter con để tránh "lọc rỗng".
    setFocusMode("all");
    setPositionFilter("all");
    setRoundFilter("all");
    setSearchQuery("");
    setSortBy("start-asc");
    setSelectedBlockKey(null);
  }, [filter]);

  const isMissingInterviewer = (item) => {
    const participantCount = item.participantCount || 0;
    const openRequestCount = item.openParticipantRequestCount || 0;
    const fulfilledRequestCount = item.fulfilledParticipantRequestCount || 0;
    return (
      participantCount === 0 &&
      openRequestCount === 0 &&
      fulfilledRequestCount === 0
    );
  };

  const isFinalStatus = (statusCode) =>
    ["COMPLETED", "CANCELLED", "NO_SHOW", "INTERVIEWER_ABSENT"].includes(
      statusCode,
    );

  const isReadyToFinalize = (item) => {
    const participantCount = item.participantCount || 0;
    const feedbackCount = item.feedbackCount || 0;
    if (isFinalStatus(item.statusCode)) return false;
    return participantCount > 0 && feedbackCount >= participantCount;
  };

  const toDateKey = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const groupInterviewsByBlock = (list) => {
    const byKey = new Map();
    for (const i of list) {
      const dateKey = toDateKey(i.startTime);
      const key = `${i.positionTitle || ""}|${dateKey}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(i);
    }

    return Array.from(byKey.entries())
      .map(([key, items]) => {
        const dateKey = String(key).split("|")[1] || "";
        const sorted = items
          .slice()
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        const timeStart = sorted.length
          ? new Date(
              Math.min(...sorted.map((x) => new Date(x.startTime).getTime())),
            )
          : null;
        const timeEnd = sorted.length
          ? new Date(
              Math.max(...sorted.map((x) => new Date(x.endTime).getTime())),
            )
          : null;

        const roundNos = Array.from(
          new Set(sorted.map((x) => x.roundNo).filter((v) => v != null)),
        ).sort((a, b) => a - b);

        const dateLabel = sorted[0]?.startTime
          ? new Date(sorted[0].startTime).toLocaleDateString("vi-VN", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "";

        const summary = {
          total: sorted.length,
          missingInterviewer: sorted.filter((x) => isMissingInterviewer(x))
            .length,
          pendingFeedback: sorted.filter(
            (x) =>
              (x.participantCount || 0) > (x.feedbackCount || 0) &&
              !isFinalStatus(x.statusCode),
          ).length,
          readyFinalize: sorted.filter((x) => isReadyToFinalize(x)).length,
          declineNotes: sorted.filter((x) => x.hasDeclineNote === true).length,
        };

        return {
          key,
          dateKey,
          dateLabel,
          positionTitle: sorted[0]?.positionTitle || "",
          departmentName: sorted[0]?.departmentName || "",
          timeStart,
          timeEnd,
          roundNos,
          interviews: sorted,
          summary,
        };
      })
      .sort((a, b) => {
        const ta = a.timeStart ? a.timeStart.getTime() : 0;
        const tb = b.timeStart ? b.timeStart.getTime() : 0;
        return ta - tb;
      });
  };

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data =
        filter === "upcoming"
          ? await hrService.interviews.getUpcoming()
          : await hrService.interviews.getAll();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load interviews:", error);
      notify.error(error?.message || "Không thể tải danh sách phỏng vấn");
      setInterviews([]);
      if (
        error?.message?.includes("đăng nhập") ||
        error?.message?.includes("quyền")
      ) {
        setTimeout(() => navigate("/login", { replace: true }), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const positionOptions = Array.from(
    new Set(interviews.map((item) => item.positionTitle).filter(Boolean)),
  );
  const roundOptions = Array.from(
    new Set(
      interviews.map((item) => item.roundNo).filter((value) => value != null),
    ),
  ).sort((a, b) => a - b);

  useEffect(() => {
    // Nếu option không còn tồn tại sau khi đổi nguồn dữ liệu, trả về "all".
    if (positionFilter !== "all" && !positionOptions.includes(positionFilter)) {
      setPositionFilter("all");
    }
  }, [positionFilter, positionOptions]);

  useEffect(() => {
    if (
      roundFilter !== "all" &&
      !roundOptions.map(String).includes(roundFilter)
    ) {
      setRoundFilter("all");
    }
  }, [roundFilter, roundOptions]);

  const focusModeMeta = {
    "pending-feedback": "Chờ feedback",
    "missing-interviewer": "Thiếu interviewer",
    "ready-finalize": "Đủ điều kiện chốt vòng",
    "decline-notes": "Cần xử lý từ chối",
  };

  const displayedInterviews = interviews
    .filter((item) => {
      if (focusMode === "pending-feedback") {
        return (item.participantCount || 0) > (item.feedbackCount || 0);
      }

      if (focusMode === "missing-interviewer") {
        return isMissingInterviewer(item);
      }

      if (focusMode === "ready-finalize") {
        return isReadyToFinalize(item);
      }

      if (focusMode === "decline-notes") {
        return item.hasDeclineNote === true;
      }

      return true;
    })
    .filter((item) => {
      if (positionFilter !== "all" && item.positionTitle !== positionFilter) {
        return false;
      }

      if (roundFilter !== "all" && String(item.roundNo) !== roundFilter) {
        return false;
      }

      return true;
    })
    .filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const haystack = [
        item.candidateName,
        item.positionTitle,
        item.departmentName,
        item.statusName,
        item.statusCode,
        `vòng ${item.roundNo ?? ""}`,
        formatDateTime(item.startTime, "vi-VN"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    })
    .slice()
    .sort((a, b) => {
      if (sortBy === "start-desc")
        return new Date(b.startTime) - new Date(a.startTime);
      if (sortBy === "priority") {
        const score = (item) => {
          if (isMissingInterviewer(item)) return 3;
          const pending =
            (item.participantCount || 0) > (item.feedbackCount || 0);
          if (pending) return 2;
          if (item.hasDeclineNote) return 1;
          return 0;
        };
        return (
          score(b) - score(a) || new Date(a.startTime) - new Date(b.startTime)
        );
      }
      return new Date(a.startTime) - new Date(b.startTime);
    });

  const blocks = useMemo(
    () => groupInterviewsByBlock(displayedInterviews),
    [displayedInterviews],
  );

  const selectedBlock = useMemo(() => {
    if (!blocks.length) return null;
    if (selectedBlockKey)
      return blocks.find((b) => b.key === selectedBlockKey) || blocks[0];
    return blocks[0];
  }, [blocks, selectedBlockKey]);

  useEffect(() => {
    if (!blocks.length) return;
    if (!selectedBlockKey) {
      setSelectedBlockKey(blocks[0].key);
      return;
    }
    if (!blocks.some((b) => b.key === selectedBlockKey)) {
      setSelectedBlockKey(blocks[0].key);
    }
  }, [blocks, selectedBlockKey]);

  const summary = {
    total: interviews.length,
    pendingFeedback: interviews.filter(
      (item) => (item.participantCount || 0) > (item.feedbackCount || 0),
    ).length,
    missingInterviewer: interviews.filter((item) => isMissingInterviewer(item))
      .length,
    readyFinalize: interviews.filter((item) => isReadyToFinalize(item)).length,
    declineNotes: interviews.filter((item) => item.hasDeclineNote === true)
      .length,
  };

  const focusModes = [
    { id: "all", label: `Tất cả (${summary.total})` },
    {
      id: "pending-feedback",
      label: `Chờ feedback (${summary.pendingFeedback})`,
    },
    {
      id: "missing-interviewer",
      label: `Thiếu interviewer (${summary.missingInterviewer})`,
    },
    {
      id: "ready-finalize",
      label: `Đủ điều kiện chốt vòng (${summary.readyFinalize})`,
    },
    {
      id: "decline-notes",
      label: `Cần xử lý từ chối (${summary.declineNotes})`,
    },
  ];

  const renderStatusPill = (statusCode, statusName) => {
    const badge = getStatusBadge(statusCode);
    return (
      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: badge.bg, color: badge.color }}
      >
        {statusName || badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Danh sách phỏng vấn
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Quản lý và theo dõi các buổi phỏng vấn ứng viên
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* <button
              type="button"
              onClick={() =>
                navigate("/staff/hr-manager/interviews/batch-request")
              }
              className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Gửi yêu cầu theo block
            </button>
            <button
              type="button"
              onClick={() =>
                navigate("/staff/hr-manager/interviews/next-round-batch")
              }
              className="rounded-lg border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Lên lịch vòng tiếp
            </button> */}
            <button
              type="button"
              onClick={() => navigate("/staff/hr-manager/interviews/create")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Tạo lịch
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "upcoming", label: "Sắp diễn ra" },
            { id: "all", label: "Tất cả" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filter === t.id
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {focusModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setFocusMode(mode.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  focusMode === mode.id
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-[1.2fr_1fr_160px_190px]">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm ứng viên, vị trí, phòng ban, trạng thái..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <select
              value={positionFilter}
              onChange={(event) => setPositionFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Tất cả vị trí</option>
              {positionOptions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
            <select
              value={roundFilter}
              onChange={(event) => setRoundFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Mọi vòng</option>
              {roundOptions.map((roundNo) => (
                <option key={roundNo} value={String(roundNo)}>
                  Vòng {roundNo}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="start-asc">Sớm nhất trước</option>
              <option value="start-desc">Muộn nhất trước</option>
              <option value="priority">Ưu tiên cần xử lý</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              Đang hiển thị {blocks.length} block ({displayedInterviews.length}{" "}
              buổi).
            </span>
            {(focusMode !== "all" ||
              positionFilter !== "all" ||
              roundFilter !== "all" ||
              searchQuery.trim()) && (
              <button
                type="button"
                onClick={() => {
                  setFocusMode("all");
                  setPositionFilter("all");
                  setRoundFilter("all");
                  setSearchQuery("");
                }}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : blocks.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
            <div className="text-base font-semibold text-slate-900">
              Chưa có lịch phỏng vấn
            </div>
            <div className="mt-1 text-sm">
              {filter === "upcoming"
                ? "Không có buổi phỏng vấn sắp diễn ra"
                : "Không có dữ liệu theo bộ lọc hiện tại"}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-3">
              {blocks.map((b) => {
                const active = b.key === selectedBlock?.key;
                return (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => setSelectedBlockKey(b.key)}
                    className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-slate-300 ${
                      active
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-slate-900">
                          {b.positionTitle}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {b.departmentName ? `${b.departmentName} • ` : ""}
                          {b.dateLabel || "—"}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {b.summary.total} buổi
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                        <div className="font-semibold text-slate-800">
                          Thời gian
                        </div>
                        <div className="mt-0.5">
                          {b.timeStart
                            ? formatDateTime(b.timeStart, "vi-VN")
                            : "—"}{" "}
                          →{" "}
                          {b.timeEnd ? formatDateTime(b.timeEnd, "vi-VN") : "—"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                        <div className="font-semibold text-slate-800">
                          Theo dõi
                        </div>
                        <div className="mt-0.5">
                          Thiếu interviewer: {b.summary.missingInterviewer} •
                          Chờ feedback: {b.summary.pendingFeedback}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-slate-900">
                  {selectedBlock?.positionTitle || "Chi tiết block"}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {selectedBlock?.dateLabel || "—"} •{" "}
                  {selectedBlock?.interviews?.length || 0} buổi
                  {selectedBlock?.roundNos?.length
                    ? ` • Vòng ${selectedBlock.roundNos.join(", ")}`
                    : ""}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {(selectedBlock?.interviews || []).map((iv, idx) => (
                  <div
                    key={iv.id}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">
                          Buổi {idx + 1}: {iv.candidateName || `#${iv.id}`}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          Vòng {iv.roundNo} •{" "}
                          {formatDateTime(iv.startTime, "vi-VN")} →{" "}
                          {formatDateTime(iv.endTime, "vi-VN")}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {iv.departmentName ? `${iv.departmentName} • ` : ""}
                          {iv.positionTitle}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {renderStatusPill(iv.statusCode, iv.statusName)}
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/staff/hr-manager/interviews/${iv.id}`)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-3">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                        <div className="font-semibold text-slate-800">
                          Người tham gia / Feedback
                        </div>
                        <div className="mt-0.5">
                          {iv.participantCount} / {iv.feedbackCount}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                        <div className="font-semibold text-slate-800">
                          Yêu cầu đề cử
                        </div>
                        <div className="mt-0.5">
                          Mở: {iv.openParticipantRequestCount || 0} • Đã đề cử:{" "}
                          {iv.fulfilledParticipantRequestCount || 0}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                        <div className="font-semibold text-slate-800">
                          Cần chú ý
                        </div>
                        <div className="mt-0.5">
                          {iv.hasDeclineNote ? "Có ghi chú từ chối" : "Không"}
                          {isMissingInterviewer(iv) ? " • Thiếu interviewer" : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
