import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import deptManagerService from "../../services/deptManagerService";
import notify from "../../utils/notification";

const reqStatusLabel = {
  PENDING: "Đang chờ",
  FORWARDED: "Đã chuyển tiếp",
  FULFILLED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const reqStatusPill = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-900",
  FORWARDED: "border-blue-200 bg-blue-50 text-blue-900",
  FULFILLED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-900",
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const historyStatusLabel = {
  PENDING: "Chưa phản hồi",
  CONFIRMED: "Đã xác nhận",
  DECLINED: "Đã từ chối",
};

const historyStatusPill = {
  PENDING: "border-slate-200 bg-slate-50 text-slate-700",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  DECLINED: "border-rose-200 bg-rose-50 text-rose-900",
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function dateToKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mondayIndex(d) {
  return (d.getDay() + 6) % 7;
}

function buildMonthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const pad = mondayIndex(first);
  const cells = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let day = 1; day <= lastDay; day++) cells.push(new Date(year, monthIndex, day));
  return cells;
}

const MONTH_LABELS_VI = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString("vi-VN", { month: "long" })
);

export default function DeptManagerNominationList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState("pending"); // pending | processed | history
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [activeReqId, setActiveReqId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [quickViewReq, setQuickViewReq] = useState(null);
  const [quickViewHistory, setQuickViewHistory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("time-desc"); // time-desc | time-asc | required-desc | required-asc
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historySortBy, setHistorySortBy] = useState("time-desc"); // time-desc | time-asc
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 8;

  /** Lọc danh sách đề cử — phòng lớn không render một lần quá dài */
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const [viewMode, setViewMode] = useState("list"); // list | calendar
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqs, members] = await Promise.all([
        deptManagerService.participantRequests.getMyAssigned(),
        deptManagerService.participantRequests.getTeamMembers(),
      ]);
      setRequests(reqs?.data ?? reqs ?? []);
      setTeamMembers(members?.data ?? members ?? []);
    } catch {
      notify.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await deptManagerService.participantRequests.getNominationHistory();
      setHistory(res?.data ?? res ?? []);
    } catch {
      notify.error("Không thể tải lịch sử đề cử");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (view === "history" && history.length === 0 && !historyLoading) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    if (view === "history" && viewMode === "calendar") setViewMode("list");
  }, [view, viewMode]);

  const isBlock = (req) => Array.isArray(req?.interviews) && req.interviews.length > 1;

  const getReqInterviews = (req) => {
    if (Array.isArray(req?.interviews) && req.interviews.length > 0) return req.interviews;
    // Fallback for older payloads
    if (req?.interviewId) {
      return [{
        interviewId: req.interviewId,
        candidateName: req?.candidateName || "—",
        startTime: req?.startTime || null,
      }];
    }
    return [];
  };

  const getReqStartTime = (req) => req?.timeRangeStart || req?.startTime || null;
  const getReqEndTime = (req) => req?.timeRangeEnd || null;

  const getReqTimeLabel = (req) => {
    const block = isBlock(req);
    if (block) {
      const start = formatDateTime(getReqStartTime(req));
      const end = formatDateTime(getReqEndTime(req));
      return `${start} → ${end}`;
    }
    return formatDateTime(req?.startTime);
  };

  const resetActivePanel = () => {
    setActiveReqId(null);
    setSelectedIds([]);
    setMemberSearchQuery("");
  };

  useEffect(() => {
    resetActivePanel();
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sortBy, view]);

  useEffect(() => {
    setHistoryPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historySearchQuery, historySortBy]);

  const viewRequests = useMemo(() => {
    const all = Array.isArray(requests) ? requests : [];
    if (view === "pending") return all.filter((r) => r?.status === "PENDING");
    if (view === "processed") return all.filter((r) => r?.status && r.status !== "PENDING");
    return all;
  }, [requests, view]);

  const filteredSortedRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = (Array.isArray(viewRequests) ? viewRequests : []).filter((r) => {
      if (!q) return true;
      const haystack = [
        r?.candidateName,
        r?.titleLabel,
        r?.positionTitle,
        r?.departmentName,
        r?.requestedByName,
        r?.message,
        isBlock(r) ? `block ${r?.interviews?.length ?? 0}` : null,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    const sorted = filtered.slice().sort((a, b) => {
      const ta = new Date(getReqStartTime(a) ?? 0).getTime();
      const tb = new Date(getReqStartTime(b) ?? 0).getTime();
      const ra = a?.requiredCount ?? 0;
      const rb = b?.requiredCount ?? 0;

      if (sortBy === "time-asc") return ta - tb;
      if (sortBy === "required-desc") return rb - ra;
      if (sortBy === "required-asc") return ra - rb;
      // default: time-desc
      return tb - ta;
    });

    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewRequests, searchQuery, sortBy]);

  /** Mỗi buổi PV trong các yêu cầu (sau lọc/tìm) — dùng cho lịch */
  const nominationCalendarFlat = useMemo(() => {
    const rows = [];
    for (const req of filteredSortedRequests) {
      const interviews = Array.isArray(req?.interviews) && req.interviews.length > 0
        ? req.interviews
        : req?.interviewId
          ? [
              {
                interviewId: req.interviewId,
                candidateName: req?.candidateName || "—",
                startTime: req?.startTime || null,
              },
            ]
          : [];
      for (const inv of interviews) {
        if (!inv?.startTime) continue;
        const d = new Date(inv.startTime);
        if (Number.isNaN(d.getTime())) continue;
        rows.push({
          key: `${req.id}-${inv.interviewId ?? inv.startTime}`,
          requestId: req.id,
          interviewId: inv.interviewId,
          startTime: inv.startTime,
          candidateName: inv.candidateName || "—",
          positionTitle: req.positionTitle,
          departmentName: req.departmentName,
          status: req.status,
          req,
        });
      }
    }
    return rows.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [filteredSortedRequests]);

  const calendarYearOptions = useMemo(() => {
    const nowY = new Date().getFullYear();
    const yearsFromData = (nominationCalendarFlat || [])
      .map((row) => (row?.startTime ? new Date(row.startTime).getFullYear() : null))
      .filter((y) => typeof y === "number" && !Number.isNaN(y));

    let minY = yearsFromData.length ? Math.min(...yearsFromData) : nowY - 1;
    let maxY = yearsFromData.length ? Math.max(...yearsFromData) : nowY + 1;
    minY -= 1;
    maxY += 1;
    if (!yearsFromData.includes(nowY)) {
      minY = Math.min(minY, nowY - 2);
      maxY = Math.max(maxY, nowY + 2);
    }
    const list = [];
    for (let y = minY; y <= maxY; y++) list.push(y);
    return list.length ? list : [nowY];
  }, [nominationCalendarFlat]);

  const nominationByDate = useMemo(() => {
    const m = new Map();
    for (const row of nominationCalendarFlat) {
      const k = dateToKey(new Date(row.startTime));
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(row);
    }
    return m;
  }, [nominationCalendarFlat]);

  const todayKey = dateToKey(new Date());
  const calYear = calMonth.getFullYear();
  const calMonthIdx = calMonth.getMonth();
  const monthCells = useMemo(() => buildMonthCells(calYear, calMonthIdx), [calYear, calMonthIdx]);

  useEffect(() => {
    if (viewMode !== "calendar") return;
    if (view === "history") return;

    const keysInMonth = [...nominationByDate.keys()]
      .filter((k) => {
        const [yy, mm] = k.split("-").map(Number);
        return yy === calYear && mm - 1 === calMonthIdx;
      })
      .sort();

    const inMonth = selectedDayKey
      ? (() => {
          const [yy, mm] = selectedDayKey.split("-").map(Number);
          return yy === calYear && mm - 1 === calMonthIdx;
        })()
      : false;

    if (inMonth) return;

    const pick = (keysInMonth.includes(todayKey) ? todayKey : keysInMonth[0]) ?? null;
    setSelectedDayKey(pick);
  }, [viewMode, view, calYear, calMonthIdx, nominationByDate, selectedDayKey, todayKey]);

  const selectedDaySlots = selectedDayKey ? nominationByDate.get(selectedDayKey) ?? [] : [];

  /** Gom các buổi trong ngày theo block (yêu cầu) — hiển thị giống danh sách, không lặp từng candidate */
  const selectedDayBlocks = useMemo(() => {
    if (!selectedDayKey || !selectedDaySlots.length) return [];
    const byReq = new Map();
    for (const slot of selectedDaySlots) {
      const rid = slot.requestId;
      if (!byReq.has(rid)) {
        byReq.set(rid, { requestId: rid, req: slot.req, status: slot.status, slots: [] });
      }
      byReq.get(rid).slots.push(slot);
    }
    const groups = [...byReq.values()].map((g) => {
      g.slots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      return g;
    });
    groups.sort((a, b) => new Date(a.slots[0].startTime) - new Date(b.slots[0].startTime));
    return groups;
  }, [selectedDayKey, selectedDaySlots]);

  const totalCount = filteredSortedRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRequests = filteredSortedRequests.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const nums = new Set([1, totalPages, safePage - 1, safePage, safePage + 1]);
    const sorted = [...nums].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
    const items = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push("...");
      items.push(sorted[i]);
    }
    return items;
  }, [safePage, totalPages]);

  const handleOpenNominate = async (req) => {
    setActiveReqId(req.id);
    setSelectedIds([]);
    setMemberSearchQuery("");

    try {
      setLoadingAvailability(true);
      const res = await deptManagerService.participantRequests.getTeamMembersAvailability(req.id);
      setTeamMembers(res?.data ?? res ?? []);
    } catch {
      console.warn("Chưa thể tải trạng thái rảnh/bận. Có thể backend chưa được restart.");
    } finally {
      setLoadingAvailability(false);
    }
  };

  const goToRequestPage = (reqId) => {
    const idx = filteredSortedRequests.findIndex((r) => r.id === reqId);
    if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE) + 1);
  };

  const openNominateFromCalendar = (req) => {
    setViewMode("list");
    goToRequestPage(req.id);
    handleOpenNominate(req);
  };

  const filteredTeamMembers = useMemo(() => {
    const q = memberSearchQuery.trim().toLowerCase();
    const list = Array.isArray(teamMembers) ? teamMembers : [];
    if (!q) return list;
    return list.filter((m) => {
      const name = `${m.fullName || ""} ${m.name || ""}`.toLowerCase();
      const email = (m.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [teamMembers, memberSearchQuery]);

  /** Đã chọn luôn nổi lên trên — tránh “mất” khi đang lọc */
  const membersOrderedForNomination = useMemo(() => {
    const all = Array.isArray(teamMembers) ? teamMembers : [];
    const selectedSet = new Set(selectedIds);
    const selectedRows = all.filter((m) => selectedSet.has(m.id));
    const rest = filteredTeamMembers.filter((m) => !selectedSet.has(m.id));
    return [...selectedRows, ...rest];
  }, [teamMembers, filteredTeamMembers, selectedIds]);

  const toggleMember = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleNominate = async () => {
    const req = (Array.isArray(requests) ? requests : []).find((r) => r?.id === activeReqId);
    const required = req?.requiredCount ?? 0;
    const uniqueSelected = [...new Set(selectedIds)];

    if (!uniqueSelected.length) {
      notify.warning("Vui lòng chọn ít nhất một người");
      return;
    }
    if (!activeReqId) return;
    if (required > 0 && uniqueSelected.length !== required) {
      notify.warning(`Cần đề cử đúng ${required} người (hiện tại: ${uniqueSelected.length}).`);
      return;
    }

    setSubmitting(true);
    try {
      await deptManagerService.participantRequests.nominate(activeReqId, uniqueSelected);
      notify.success("Đã đề cử người tham gia phỏng vấn");
      resetActivePanel();
      await loadData();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Đề cử thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const totalCountAll = Array.isArray(requests) ? requests.length : 0;
  const pendingCount = (Array.isArray(requests) ? requests : []).filter((r) => r?.status === "PENDING").length;
  const processedCount = Math.max(0, totalCountAll - pendingCount);

  const groupedHistory = useMemo(() => {
    const list = Array.isArray(history) ? history : [];
    if (!list.length) return [];

    const groups = new Map();
    for (const item of list) {
      const key = item?.requestId ? `req:${item.requestId}` : `int:${item?.interviewId}:${item?.createdAt ?? ""}`;
      if (!groups.has(key)) {
        groups.set(key, {
          requestId: item?.requestId ?? null,
          createdAt: item?.createdAt,
          note: item?.note,
          positionTitle: item?.positionTitle,
          // For block, we show "Block #reqId"; for candidate keep candidateName as-is
          candidateName: item?.requestId ? `Block #${item.requestId}` : (item?.candidateName ?? "—"),
          nominatedUsers: [],
          interviews: [],
        });
      }
      const g = groups.get(key);

      // earliest createdAt (or keep first)
      if (!g.createdAt || (item?.createdAt && new Date(item.createdAt) < new Date(g.createdAt))) g.createdAt = item.createdAt;
      if (!g.positionTitle && item?.positionTitle) g.positionTitle = item.positionTitle;

      if (item?.interviewId) {
        g.interviews.push({
          interviewId: item.interviewId,
          candidateName: item?.candidateName ?? "—",
          startTime: item?.startTime ?? null,
          endTime: item?.endTime ?? null,
        });
      }

      for (const u of item?.nominatedUsers || []) {
        g.nominatedUsers.push(u);
      }
    }

    // de-dupe users per group by id, keep "worst" status (DECLINED > PENDING > CONFIRMED)
    const rank = { DECLINED: 3, PENDING: 2, CONFIRMED: 1 };
    const result = [];
    for (const g of groups.values()) {
      const byId = new Map();
      for (const u of g.nominatedUsers) {
        const existing = byId.get(u.id);
        if (!existing) byId.set(u.id, u);
        else {
          const eRank = rank[existing.participationStatus] ?? 0;
          const uRank = rank[u.participationStatus] ?? 0;
          byId.set(u.id, uRank >= eRank ? u : existing);
        }
      }
      g.nominatedUsers = Array.from(byId.values());

      // sort interviews ascending by startTime
      g.interviews = (g.interviews || []).slice().sort((a, b) => new Date(a?.startTime ?? 0) - new Date(b?.startTime ?? 0));
      result.push(g);
    }
    return result;
  }, [history]);

  const filteredSortedHistory = useMemo(() => {
    const q = historySearchQuery.trim().toLowerCase();
    const list = Array.isArray(groupedHistory) ? groupedHistory : [];

    const filtered = list.filter((h) => {
      if (!q) return true;
      const haystack = [
        h?.candidateName,
        h?.positionTitle,
        (h?.nominatedUsers || []).map((u) => u?.fullName || u?.name || u?.email).join(" "),
        (h?.interviews || []).map((i) => i?.candidateName).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    return filtered.slice().sort((a, b) => {
      const ta = new Date(a?.createdAt ?? 0).getTime();
      const tb = new Date(b?.createdAt ?? 0).getTime();
      return historySortBy === "time-asc" ? ta - tb : tb - ta;
    });
  }, [groupedHistory, historySearchQuery, historySortBy]);

  const historyTotalCount = filteredSortedHistory.length;
  const historyTotalPages = Math.max(1, Math.ceil(historyTotalCount / HISTORY_PAGE_SIZE));
  const historySafePage = Math.min(historyPage, historyTotalPages);
  const pagedHistory = filteredSortedHistory.slice((historySafePage - 1) * HISTORY_PAGE_SIZE, historySafePage * HISTORY_PAGE_SIZE);

  const historyPaginationItems = useMemo(() => {
    if (historyTotalPages <= 7) return Array.from({ length: historyTotalPages }, (_, i) => i + 1);
    const nums = new Set([1, historyTotalPages, historySafePage - 1, historySafePage, historySafePage + 1]);
    const sorted = [...nums].filter((n) => n >= 1 && n <= historyTotalPages).sort((a, b) => a - b);
    const items = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push("...");
      items.push(sorted[i]);
    }
    return items;
  }, [historySafePage, historyTotalPages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">Yêu cầu đề cử người phỏng vấn</h1>
            <p className="mt-1 text-sm text-slate-600">
              Đề cử thành viên trong phòng ban tham gia buổi phỏng vấn — xem danh sách hoặc lịch các buổi trong yêu cầu.
            </p>
          </div>
          {view !== "history" ? (
            <div className="inline-flex shrink-0 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "list" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Danh sách
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "calendar" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Lịch
              </button>
            </div>
          ) : null}
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setView("pending")}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                view === "pending"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Cần xử lý{" "}
              <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                view === "pending" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}>{pendingCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setView("processed")}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                view === "processed"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Đã xử lý{" "}
              <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                view === "processed" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}>{processedCount}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setView("history");
                setViewMode("list");
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                view === "history"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Lịch sử đề cử
            </button>
          </div>

          {view === "history" ? null : null}
        </div>

        {view === "history" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-bold text-slate-900">Lịch sử đề cử của bạn</div>
              <button
                type="button"
                onClick={loadHistory}
                disabled={historyLoading}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {historyLoading ? "Đang tải..." : "Tải lại"}
              </button>
            </div>

            {historyLoading ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Đang tải lịch sử...
              </div>
            ) : pagedHistory.length === 0 ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                Chưa có lịch sử đề cử.
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_220px]">
                  <div className="min-w-0">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Tìm kiếm</label>
                    <input
                      type="search"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="Ứng viên, vị trí, người được đề cử..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Sắp xếp</label>
                    <select
                      value={historySortBy}
                      onChange={(e) => setHistorySortBy(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="time-desc">Mới nhất</option>
                      <option value="time-asc">Cũ nhất</option>
                    </select>
                  </div>
                  <div className="flex items-end justify-between lg:justify-end">
                    <div className="text-xs text-slate-600">
                      Trang{" "}
                      <strong className="font-semibold text-slate-900">
                        {historySafePage}/{historyTotalPages}
                      </strong>{" "}
                      • {historyTotalCount} lượt
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historySafePage <= 1}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <div className="flex items-center gap-1">
                    {historyPaginationItems.map((it, idx) =>
                      it === "..." ? (
                        <span key={`${it}-${idx}`} className="px-1 text-xs font-semibold text-slate-400">
                          ...
                        </span>
                      ) : (
                        <button
                          key={it}
                          type="button"
                          onClick={() => setHistoryPage(it)}
                          disabled={it === historySafePage}
                          className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                            it === historySafePage
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                          }`}
                        >
                          {it}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                    disabled={historySafePage >= historyTotalPages}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                {pagedHistory.map((h, idx) => {
                  const isBlockItem = !!h.requestId;
                  const firstInterview = (h.interviews || [])[0];
                  const startTime = isBlockItem ? firstInterview?.startTime : h.startTime;
                  const endTime = isBlockItem ? null : h.endTime;

                  return (
                  <div key={`${h.requestId ?? h.interviews?.[0]?.interviewId ?? "x"}-${h.createdAt}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-bold text-slate-900">
                          {h.candidateName || "—"}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          <span className="font-medium text-slate-800">{h.positionTitle || "—"}</span>
                        </div>
                        <div className="mt-1 text-sm text-slate-700">
                          Thời gian:{" "}
                          <span className="font-semibold">
                            {formatDateTime(startTime)}{" "}
                            {!isBlockItem && endTime ? <span className="text-slate-500">→ {formatDateTime(endTime)}</span> : null}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Bạn đã đề cử lúc: {formatDateTime(h.createdAt)}
                          {h.requestId ? <span className="text-slate-400"> · Req #{h.requestId}</span> : null}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {(h.nominatedUsers || []).length === 0 ? (
                            <span className="text-xs text-slate-500">Không có danh sách người được đề cử.</span>
                          ) : (
                            (h.nominatedUsers || []).map((u) => (
                              <span
                                key={u.id}
                                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                  historyStatusPill[u.participationStatus] || historyStatusPill.PENDING
                                }`}
                                title={
                                  [
                                    u.email,
                                    u.declineNote ? `Lý do: ${u.declineNote}` : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" • ")
                                }
                              >
                                <span className="max-w-[160px] truncate">{u.fullName || u.name || `User #${u.id}`}</span>
                                <span className="text-slate-400">·</span>
                                <span className="shrink-0">{historyStatusLabel[u.participationStatus] || "Chưa phản hồi"}</span>
                              </span>
                            ))
                          )}
                        </div>

                        {isBlockItem && Array.isArray(h.interviews) && h.interviews.length > 0 ? (
                          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                              Các candidate trong block ({h.interviews.length})
                            </div>
                            <div className="flex flex-col gap-1">
                              {h.interviews.slice(0, 2).map((inv, i) => (
                                <div key={inv.interviewId || i} className="text-sm text-slate-700">
                                  Buổi {i + 1}: <span className="font-medium">{inv.candidateName || "—"}</span> · {formatDateTime(inv.startTime)}
                                </div>
                              ))}
                              {h.interviews.length > 2 ? (
                                <div className="text-xs text-slate-500">+ {h.interviews.length - 2} candidate khác</div>
                              ) : null}
                            </div>

                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setQuickViewHistory(h)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                              >
                                Quick view ({h.interviews.length})
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const targetId = isBlockItem ? firstInterview?.interviewId : h.interviewId;
                            if (targetId) navigate(`/staff/dept-manager/interviews/${targetId}`);
                          }}
                          className="whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                        >
                          Xem interview
                        </button>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
              </>
            )}
          </div>
        ) : (
          <>
            {viewMode === "calendar" ? (
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-4 text-sm leading-relaxed text-slate-700">
                  <span className="font-semibold text-slate-900">Lịch các buổi phỏng vấn</span> trong yêu cầu đề cử (tab{" "}
                  <span className="font-semibold">{view === "pending" ? "Cần xử lý" : "Đã xử lý"}</span>, áp dụng tìm kiếm và sắp
                  xếp). Chấm dưới ngày = có buổi; chọn ngày để xem chi tiết và thao tác.
                </p>

                <div className="grid gap-3 lg:grid-cols-[1fr_180px_1fr]">
                  <div className="min-w-0">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Tìm kiếm</label>
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ứng viên, vị trí, phòng ban, người yêu cầu..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Sắp xếp yêu cầu</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="time-desc">Thời gian (mới nhất)</option>
                      <option value="time-asc">Thời gian (cũ nhất)</option>
                      <option value="required-desc">Số người cần (giảm dần)</option>
                      <option value="required-asc">Số người cần (tăng dần)</option>
                    </select>
                  </div>

                  <div className="flex min-h-[40px] items-end text-xs text-slate-600 lg:justify-end">
                    <span>
                      <strong className="font-semibold text-slate-900">{nominationCalendarFlat.length}</strong> buổi trong{" "}
                      <strong className="font-semibold text-slate-900">{totalCount}</strong> yêu cầu
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex w-full min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                  <div className="relative z-0 w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:max-w-md lg:shrink-0">
                    <div className="mb-3 flex flex-col gap-3">
                      <div className="flex min-w-0 items-end gap-2">
                        <div className="min-w-0 flex-1">
                          <label className="mb-1 block text-[11px] font-bold uppercase leading-none tracking-wide text-slate-500">
                            Tháng
                          </label>
                          <select
                            value={calMonthIdx}
                            onChange={(e) => setCalMonth(new Date(calYear, Number(e.target.value), 1))}
                            className="h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          >
                            {MONTH_LABELS_VI.map((label, idx) => (
                              <option key={label} value={idx}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="min-w-0 flex-1">
                          <label className="mb-1 block text-[11px] font-bold uppercase leading-none tracking-wide text-slate-500">
                            Năm
                          </label>
                          <select
                            value={calYear}
                            onChange={(e) => setCalMonth(new Date(Number(e.target.value), calMonthIdx, 1))}
                            className="h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          >
                            {calendarYearOptions.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-center sm:justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const k = dateToKey(now);
                            setCalMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                            setSelectedDayKey(k);
                          }}
                          className="rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Hôm nay
                        </button>
                      </div>
                    </div>

                    <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50">
                      <div
                        className="min-w-[280px] w-full border-b border-slate-200 bg-slate-100/90"
                        style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
                      >
                        {WEEKDAYS.map((w) => (
                          <div key={w} className="py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
                            {w}
                          </div>
                        ))}
                      </div>
                      <div
                        className="min-w-[280px] w-full gap-px bg-slate-200 p-px"
                        style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
                      >
                        {monthCells.map((cell, idx) => {
                          if (!cell) return <div key={`empty-${idx}`} className="h-11 bg-white sm:h-12" aria-hidden />;
                          const key = dateToKey(cell);
                          const list = nominationByDate.get(key) ?? [];
                          const count = list.length;
                          const isToday = key === todayKey;
                          const isSelected = key === selectedDayKey;
                          const hasEvents = count > 0;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setSelectedDayKey(key)}
                              className={`relative z-0 flex h-11 w-full flex-col items-center justify-center text-sm font-semibold transition sm:h-12 ${
                                isSelected
                                  ? hasEvents
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-900 ring-2 ring-inset ring-blue-500"
                                  : hasEvents
                                    ? "bg-white text-slate-900 hover:bg-blue-50"
                                    : "bg-white text-slate-400 hover:bg-slate-50"
                              } ${!isSelected && isToday ? "ring-2 ring-inset ring-blue-400" : ""}`}
                            >
                              <span className="leading-none">{cell.getDate()}</span>
                              {hasEvents && (
                                <span
                                  className={`mt-1 flex items-center gap-0.5 ${isSelected ? "text-white" : "text-blue-600"}`}
                                  aria-label={`${count} buổi`}
                                >
                                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                                    <span key={i} className={`h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-blue-600"}`} />
                                  ))}
                                  {count > 3 && (
                                    <span
                                      className={`text-[9px] font-bold leading-none ${isSelected ? "text-white" : "text-blue-600"}`}
                                    >
                                      +
                                    </span>
                                  )}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 w-full min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:max-w-3xl">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                      {selectedDayKey
                        ? new Date(`${selectedDayKey}T12:00:00`).toLocaleDateString("vi-VN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Chọn ngày"}
                    </h3>

                    {!selectedDayKey || selectedDayBlocks.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-600">
                        {selectedDayKey
                          ? "Không có buổi phỏng vấn trong ngày này (hoặc không khớp bộ lọc hiện tại)."
                          : "Chọn một ngày có dấu chấm trên lịch để xem chi tiết."}
                      </p>
                    ) : (
                      <ul className="mt-4 flex max-h-[min(70vh,520px)] flex-col gap-3 overflow-y-auto pr-1">
                        {selectedDayBlocks.map((g) => {
                          const req = g.req;
                          const fullInterviews = getReqInterviews(req);
                          const daySlots = g.slots;
                          const pillClass = reqStatusPill[g.status] || "border-slate-200 bg-slate-50 text-slate-700";
                          const isPending = g.status === "PENDING";
                          const blockStyle = true;

                          return (
                            <li
                              key={g.requestId}
                              className={`rounded-xl border bg-white p-4 shadow-sm ${
                                isPending ? (blockStyle ? "border-blue-200" : "border-amber-200") : "border-slate-200"
                              }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate text-base font-bold text-slate-900">{`Block #${req.id}`}</h3>
                                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${pillClass}`}>
                                      {reqStatusLabel[g.status] || g.status || "—"}
                                    </span>
                                  </div>

                                  <div className="mt-2 text-sm text-slate-600">
                                    <span className="font-medium text-slate-800">{req.positionTitle || "—"}</span>
                                    {req.departmentName ? <span className="text-slate-400"> · {req.departmentName}</span> : null}
                                  </div>

                                  <div className="mt-1 text-sm text-slate-700">
                                    <span>
                                      Thời gian block: <span className="font-semibold">{getReqTimeLabel(req)}</span>
                                    </span>
                                    <span className="text-slate-400"> · </span>
                                    Cần <span className="font-semibold text-slate-900">{req.requiredCount ?? 0}</span> người
                                  </div>

                                  {req.requestedByName ? (
                                    <div className="mt-1 text-sm text-slate-500">Từ: {req.requestedByName}</div>
                                  ) : null}

                                  {req.message ? (
                                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                      {req.message}
                                    </div>
                                  ) : null}

                                  {daySlots.length > 0 ? (
                                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                          Buổi trong ngày đã chọn ({daySlots.length})
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setQuickViewReq({ ...req, interviews: fullInterviews })}
                                          className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                                        >
                                          Quick view ({fullInterviews.length})
                                        </button>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        {daySlots.slice(0, 2).map((slot, idx) => (
                                          <div key={slot.key} className="text-sm text-slate-700">
                                            Buổi {idx + 1}: <span className="font-medium">{slot.candidateName || "—"}</span> ·{" "}
                                            {formatDateTime(slot.startTime)}
                                          </div>
                                        ))}
                                        {daySlots.length > 2 ? (
                                          <div className="text-xs text-slate-500">
                                            + {daySlots.length - 2} buổi khác trong ngày — danh sách đủ candidate trong Quick view
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>

                                <div className="shrink-0">
                                  {isPending ? (
                                    <button
                                      type="button"
                                      onClick={() => openNominateFromCalendar(req)}
                                      className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold text-white transition ${
                                        blockStyle ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"
                                      }`}
                                    >
                                      Đề cử cho block
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : (
            <>
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_200px]">
            <div className="min-w-0">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Tìm kiếm</label>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ứng viên, vị trí, phòng ban, người yêu cầu..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="min-w-0">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Sắp xếp</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="time-desc">Thời gian (mới nhất)</option>
                <option value="time-asc">Thời gian (cũ nhất)</option>
                <option value="required-desc">Số người cần (giảm dần)</option>
                <option value="required-asc">Số người cần (tăng dần)</option>
              </select>
            </div>

            <div className="flex items-end justify-between lg:justify-end">
              <div className="text-xs text-slate-600">
                Trang{" "}
                <strong className="font-semibold text-slate-900">
                  {safePage}/{totalPages}
                </strong>{" "}
                • {totalCount} yêu cầu
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <div className="flex items-center gap-1">
              {paginationItems.map((it, idx) =>
                it === "..." ? (
                  <span key={`${it}-${idx}`} className="px-1 text-xs font-semibold text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={it}
                    type="button"
                    onClick={() => setPage(it)}
                    disabled={it === safePage}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                      it === safePage
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                    }`}
                  >
                    {it}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>

        {pagedRequests.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600 shadow-sm">
            Không có yêu cầu phù hợp.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pagedRequests.map((req) => {
              const interviews = getReqInterviews(req);
              const block = true; // always render as "block" card (even 1 candidate)
              const pillClass = reqStatusPill[req.status] || "border-slate-200 bg-slate-50 text-slate-700";
              const isPending = req?.status === "PENDING";

              return (
                <div key={req.id} className={`rounded-xl border bg-white p-4 shadow-sm ${isPending ? (block ? "border-blue-200" : "border-amber-200") : "border-slate-200"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-bold text-slate-900">
                          {`Block #${req.id}`}
                        </h3>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${pillClass}`}>
                          {reqStatusLabel[req.status] || req.status || "—"}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">{req.positionTitle || "—"}</span>
                        {req.departmentName ? <span className="text-slate-400"> · {req.departmentName}</span> : null}
                      </div>

                      <div className="mt-1 text-sm text-slate-700">
                        <span>
                          Thời gian: <span className="font-semibold">{getReqTimeLabel(req)}</span>
                        </span>
                        <span className="text-slate-400"> · </span>
                        Cần <span className="font-semibold text-slate-900">{req.requiredCount ?? 0}</span> người
                      </div>

                      {req.requestedByName ? <div className="mt-1 text-sm text-slate-500">Từ: {req.requestedByName}</div> : null}

                      {req.message ? (
                        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                          {req.message}
                        </div>
                      ) : null}

                      {interviews.length > 0 ? (
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Các candidate trong block</div>
                            <button
                              type="button"
                              onClick={() => setQuickViewReq({ ...req, interviews })}
                              className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                            >
                              Quick view ({interviews.length})
                            </button>
                          </div>
                          <div className="flex flex-col gap-1">
                            {interviews.slice(0, 2).map((inv, idx) => (
                              <div key={inv.interviewId || idx} className="text-sm text-slate-700">
                                Buổi {idx + 1}: <span className="font-medium">{inv.candidateName || "—"}</span> · {formatDateTime(inv.startTime)}
                              </div>
                            ))}
                            {interviews.length > 2 ? (
                              <div className="text-xs text-slate-500">+ {interviews.length - 2} candidate khác</div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0">
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => handleOpenNominate(req)}
                          className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold text-white transition ${
                            block ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                        >
                          Đề cử cho block
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {activeReqId === req.id && isPending && (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900">
                          Chọn thành viên tham gia {`block (${interviews.length} candidate)`} (
                          <span className="font-bold">{selectedIds.length}</span>/
                          <span className="font-bold">{req.requiredCount ?? 0}</span> người)
                        </div>
                        <div className="text-xs text-slate-600">
                          Cần đề cử đúng <span className="font-semibold text-slate-900">{req.requiredCount ?? 0}</span> người
                        </div>
                      </div>

                      {teamMembers.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                          Không có thành viên trong phòng ban.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label htmlFor={`member-search-${req.id}`} className="sr-only">
                              Tìm thành viên phòng ban
                            </label>
                            <input
                              id={`member-search-${req.id}`}
                              type="search"
                              value={memberSearchQuery}
                              onChange={(e) => setMemberSearchQuery(e.target.value)}
                              placeholder="Tìm theo tên hoặc email..."
                              autoComplete="off"
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                              <span>
                                Hiển thị{" "}
                                <span className="font-semibold text-slate-700">{filteredTeamMembers.length}</span>/
                                <span className="font-semibold text-slate-700">{teamMembers.length}</span> thành viên
                                {memberSearchQuery.trim() ? " (theo lọc)" : ""}
                              </span>
                              {memberSearchQuery.trim() ? (
                                <button
                                  type="button"
                                  onClick={() => setMemberSearchQuery("")}
                                  className="font-semibold text-blue-700 transition hover:text-blue-900"
                                >
                                  Xóa lọc
                                </button>
                              ) : null}
                            </div>
                          </div>

                          <div className="max-h-[min(420px,55vh)] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/60 p-2 md:p-3">
                            {loadingAvailability ? (
                              <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-600">
                                Đang kiểm tra lịch trống của các thành viên...
                              </div>
                            ) : filteredTeamMembers.length === 0 && selectedIds.length === 0 ? (
                              <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-600">
                                Không có thành viên khớp tìm kiếm. Thử từ khóa khác hoặc{" "}
                                <button
                                  type="button"
                                  onClick={() => setMemberSearchQuery("")}
                                  className="font-semibold text-blue-700 underline-offset-2 hover:underline"
                                >
                                  xóa lọc
                                </button>
                                .
                              </div>
                            ) : (
                              <div className="grid gap-2 md:grid-cols-2">
                                {membersOrderedForNomination.map((m) => {
                                  const checked = selectedIds.includes(m.id);
                                  const required = req.requiredCount ?? 0;
                                  const atLimit = required > 0 && selectedIds.length >= required;
                                  const disabled = (!checked && atLimit) || m.isBusy;
                                  return (
                                    <label
                                      key={m.id}
                                      className={`flex items-center gap-3 rounded-lg border p-3 transition ${
                                        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                                      } ${
                                        checked ? "border-blue-300 bg-blue-50" : (m.isBusy ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50")
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={disabled}
                                        onChange={() => toggleMember(m.id)}
                                        className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-slate-900">
                                          {m.fullName || m.name || "—"}
                                        </div>
                                        <div className="truncate text-xs text-slate-500">{m.email || ""}</div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={resetActivePanel}
                          disabled={submitting}
                          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleNominate}
                          disabled={submitting || (selectedIds.length !== (req.requiredCount ?? 0))}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submitting ? "Đang gửi..." : `Xác nhận đề cử (${selectedIds.length} người)`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
            </>
            )}
          </>
        )}
      </div>
    </div>

      {quickViewReq && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuickViewReq(null);
          }}
        >
          <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-slate-900">
                    {`Block #${quickViewReq.id ?? quickViewReq.requestId ?? "?"}`}{" "}
                    <span className="text-slate-500">({quickViewReq.interviews?.length ?? 0} candidate)</span>
                  </h2>
                  <div className="mt-1 text-xs text-slate-600">
                    {quickViewReq.positionTitle ? <span>{quickViewReq.positionTitle}</span> : null}
                    {quickViewReq.departmentName ? <span> · {quickViewReq.departmentName}</span> : null}
                    <span className="text-slate-400"> · </span>
                    <span>{getReqTimeLabel(quickViewReq)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickViewReq(null)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              <div className="grid gap-3">
                {(quickViewReq.interviews || []).map((inv, idx) => (
                  <div key={inv.interviewId || idx} className="rounded-lg border border-slate-200 bg-slate-50/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-slate-900">
                          Buổi {idx + 1}: {inv.candidateName || "—"}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Thời gian: <span className="font-semibold text-slate-800">{formatDateTime(inv.startTime)}</span>
                        </div>
                      </div>
                      {inv.location ? (
                        <div className="shrink-0 text-xs text-slate-600">
                          {inv.location}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {quickViewHistory && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuickViewHistory(null);
          }}
        >
          <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-slate-900">
                    {quickViewHistory.requestId ? `Block #${quickViewHistory.requestId}` : (quickViewHistory.candidateName || "—")}
                    {quickViewHistory.requestId ? (
                      <span className="ml-2 text-slate-500">({quickViewHistory.interviews?.length ?? 0} candidate)</span>
                    ) : null}
                  </h2>
                  <div className="mt-1 text-xs text-slate-600">
                    {quickViewHistory.positionTitle ? <span>{quickViewHistory.positionTitle}</span> : null}
                    <span className="text-slate-400"> · </span>
                    <span>Bạn đã đề cử lúc: {formatDateTime(quickViewHistory.createdAt)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickViewHistory(null)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              <div className="grid gap-3">
                {(quickViewHistory.interviews || []).map((inv, idx) => (
                  <div key={inv.interviewId || idx} className="rounded-lg border border-slate-200 bg-slate-50/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-slate-900">
                          Buổi {idx + 1}: {inv.candidateName || "—"}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Thời gian: <span className="font-semibold text-slate-800">{formatDateTime(inv.startTime)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/staff/dept-manager/interviews/${inv.interviewId}`)}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Mở interview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
