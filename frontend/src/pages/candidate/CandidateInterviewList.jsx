import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Inbox,
  LayoutList,
  Link2,
  Loader2,
  MapPin,
  Search
} from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import notify from '../../utils/notification';
import { formatDateTime } from '../../utils/formatters/display';
import { getStatusBadge } from '../../utils/helpers/badge';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const MONTH_LABELS_VI = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString('vi-VN', { month: 'long' })
);

function toLocalDateKey(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return dateToKey(d);
}

/** Ngày theo giờ local (dùng cho ô lịch, không dùng toISOString). */
function dateToKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Thứ Hai = 0 … Chủ nhật = 6 */
function mondayIndex(d) {
  return (d.getDay() + 6) % 7;
}

function buildMonthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const pad = mondayIndex(first);
  const cells = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let day = 1; day <= lastDay; day++) {
    cells.push(new Date(year, monthIndex, day));
  }
  return cells;
}

function monthTitleVi(d) {
  return d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

export default function CandidateInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  /** Tháng đã áp dụng auto-chọn (tránh ghi đè khi chỉ bấm "Hôm nay" / cùng tháng). */
  const lastCalendarMonthKeyRef = useRef(null);
  /** Bấm "Hôm nay" — luôn chọn đúng ngày đó, không nhảy sang ngày đầu tiên có lịch. */
  const pendingSelectDayKeyRef = useRef(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef(null);

  const loadInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await candidateService.getMyInterviews();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      notify.error('Không thể tải danh sách phỏng vấn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const filteredInterviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return interviews;
    return interviews.filter((i) => {
      const hay = [
        i.positionTitle,
        i.departmentName,
        i.statusName,
        i.statusCode,
        formatDateTime(i.startTime, 'vi-VN')
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [interviews, searchQuery]);

  const interviewsByDate = useMemo(() => {
    const m = new Map();
    for (const i of filteredInterviews) {
      const k = toLocalDateKey(i.startTime);
      if (!k) continue;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(i);
    }
    for (const [, arr] of m) {
      arr.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }
    return m;
  }, [filteredInterviews]);

  const calendarYearOptions = useMemo(() => {
    const nowY = new Date().getFullYear();
    let minY = nowY - 2;
    let maxY = nowY + 4;
    for (const i of interviews) {
      const t = new Date(i.startTime);
      if (Number.isNaN(t.getTime())) continue;
      const y = t.getFullYear();
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const list = [];
    for (let y = minY; y <= maxY; y++) list.push(y);
    return list;
  }, [interviews]);

  useEffect(() => {
    if (viewMode !== 'calendar') {
      lastCalendarMonthKeyRef.current = null;
      setMonthPickerOpen(false);
      return;
    }

    const y = calMonth.getFullYear();
    const mo = calMonth.getMonth();
    const monthKey = `${y}-${mo}`;
    const tk = dateToKey(new Date());
    const [ty, tm] = tk.split('-').map(Number);
    const todayInView = ty === y && tm - 1 === mo;

    const keysInMonth = [...interviewsByDate.keys()].filter((k) => {
      const [yy, mm] = k.split('-').map(Number);
      return yy === y && mm - 1 === mo;
    });
    keysInMonth.sort();

    const pickDefaultForMonth = () => {
      if (todayInView && interviewsByDate.has(tk)) return tk;
      return keysInMonth[0] ?? null;
    };

    const pending = pendingSelectDayKeyRef.current;
    if (pending != null) {
      pendingSelectDayKeyRef.current = null;
      const [py, pm] = pending.split('-').map(Number);
      if (!Number.isNaN(py) && !Number.isNaN(pm) && py === y && pm - 1 === mo) {
        setSelectedDayKey(pending);
        lastCalendarMonthKeyRef.current = monthKey;
        return;
      }
    }

    const monthBecameActive = lastCalendarMonthKeyRef.current !== monthKey;
    if (monthBecameActive) {
      lastCalendarMonthKeyRef.current = monthKey;
      setSelectedDayKey(pickDefaultForMonth());
      return;
    }

    setSelectedDayKey((current) => {
      if (current == null) return pickDefaultForMonth();
      const parts = current.split('-').map(Number);
      if (parts.length < 3 || parts.some(Number.isNaN)) return pickDefaultForMonth();
      const [cy, cm] = parts;
      if (cy !== y || cm - 1 !== mo) return pickDefaultForMonth();
      return current;
    });
  }, [viewMode, calMonth, interviewsByDate]);

  useEffect(() => {
    if (!monthPickerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMonthPickerOpen(false);
    };
    const onDown = (e) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target)) {
        setMonthPickerOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [monthPickerOpen]);

  const handleRespond = async (interviewId, response) => {
    let note;
    if (response === 'DECLINE') {
      const value = window.prompt('Ghi chú từ chối (tùy chọn, vd. muốn đổi ngày khác) để HR thương lượng:');
      if (value === null) return;
      note = (value || '').trim() || undefined;
    }
    setResponding(interviewId);
    try {
      await candidateService.respondInterview(interviewId, response, note);
      notify.success(response === 'CONFIRM' ? 'Đã xác nhận tham gia phỏng vấn' : 'Đã từ chối lịch phỏng vấn');
      await loadInterviews();
    } catch (err) {
      notify.error(err.message || 'Thao tác thất bại');
    } finally {
      setResponding(null);
    }
  };

  const calYear = calMonth.getFullYear();
  const calMonthIdx = calMonth.getMonth();
  const monthCells = useMemo(() => buildMonthCells(calYear, calMonthIdx), [calYear, calMonthIdx]);
  const todayKey = dateToKey(new Date());

  const yearSelectOptions = useMemo(() => {
    const s = new Set(calendarYearOptions);
    s.add(calYear);
    return [...s].sort((a, b) => a - b);
  }, [calendarYearOptions, calYear]);

  const renderInterviewCard = (interview) => {
    const canRespond = ['SCHEDULED', 'RESCHEDULED'].includes(interview.statusCode);
    const isLoading = responding === interview.id;
    const badge = getStatusBadge(interview.statusCode);
    const statusText = interview.statusName || badge.label;
    const note =
      interview.statusCode === 'CONFIRMED'
        ? 'Bạn đã xác nhận tham gia phỏng vấn này'
        : interview.statusCode === 'DECLINED_BY_CANDIDATE'
          ? 'Bạn đã từ chối lịch phỏng vấn này'
          : canRespond
            ? 'Cần phản hồi lịch phỏng vấn'
            : null;
    const loc = (interview.location || '').trim();
    const link = (interview.meetingLink || '').trim();

    return (
      <li
        key={interview.id}
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
      >
        <div className="border-b border-slate-100 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">{interview.positionTitle}</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Vòng {interview.roundNo}
                <span className="mx-2 text-slate-300">·</span>
                {interview.departmentName}
              </p>
            </div>
            <span className={`inline-flex w-fit shrink-0 px-3 py-1 text-xs font-semibold ${badge.className}`}>{statusText}</span>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 sm:px-6">
          <div className="flex gap-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <div>
              <p className="text-xs font-medium text-slate-500">Bắt đầu</p>
              <p className="text-sm font-medium text-slate-900">{formatDateTime(interview.startTime, 'vi-VN')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <div>
              <p className="text-xs font-medium text-slate-500">Kết thúc</p>
              <p className="text-sm font-medium text-slate-900">{formatDateTime(interview.endTime, 'vi-VN')}</p>
            </div>
          </div>
          {loc ? (
            <div className="flex gap-3 sm:col-span-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Địa điểm</p>
                <p className="text-sm font-medium text-slate-900">{loc}</p>
              </div>
            </div>
          ) : link ? (
            <div className="flex gap-3 sm:col-span-2">
              <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Link họp</p>
                <p className="truncate text-sm font-medium text-blue-600">{link}</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 sm:col-span-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Địa điểm</p>
                <p className="text-sm font-medium text-slate-900">—</p>
              </div>
            </div>
          )}
        </div>

        {note && (
          <div className="mx-5 mb-4 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-700 ring-1 ring-slate-100 sm:mx-6">
            {note}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(`/app/interviews/${interview.id}`)}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Chi tiết
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          {canRespond && (
            <>
              <button
                type="button"
                onClick={() => handleRespond(interview.id, 'CONFIRM')}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Xác nhận tham dự
              </button>
              <button
                type="button"
                onClick={() => handleRespond(interview.id, 'DECLINE')}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Từ chối
              </button>
            </>
          )}
        </div>
      </li>
    );
  };

  const selectedDayInterviews = selectedDayKey ? interviewsByDate.get(selectedDayKey) ?? [] : [];

  return (
    <div className="min-h-screen min-w-0 bg-gradient-to-b from-slate-50 to-slate-100/80 pb-16 pt-8 sm:pt-12">
      <div className="mx-auto min-w-0 max-w-6xl px-4 sm:px-6">
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <Briefcase className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Lịch phỏng vấn</h1>
                <p className="mt-1 text-sm text-slate-600 sm:text-base">
                  Xem theo danh sách hoặc lịch tháng, tìm theo vị trí / phòng ban / trạng thái
                </p>
              </div>
            </div>
          </div>

          {!loading && interviews.length > 0 && (
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:items-center">
              <div className="relative w-full min-w-0 sm:w-auto sm:flex-1 sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo vị trí, phòng ban, trạng thái, ngày..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  aria-label="Tìm kiếm lịch phỏng vấn"
                />
              </div>
              <div className="inline-flex justify-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <LayoutList className="h-4 w-4" aria-hidden />
                  Danh sách
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    viewMode === 'calendar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  Lịch
                </button>
              </div>
            </div>
          )}
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-20 shadow-sm">
            <Loader2 className="h-9 w-9 animate-spin text-blue-600" aria-hidden />
            <p className="mt-3 text-sm font-medium text-slate-500">Đang tải danh sách...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Inbox className="h-7 w-7" aria-hidden />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-slate-900">Chưa có lịch phỏng vấn</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
              Bạn chưa được mời tham gia phỏng vấn nào. Khi HR gửi lời mời, lịch sẽ hiển thị tại đây.
            </p>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 px-6 py-12 text-center shadow-sm">
            <Search className="mx-auto h-10 w-10 text-amber-600/70" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Không tìm thấy lịch phù hợp</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">Thử bỏ bớt từ khóa hoặc tìm theo tên vị trí, phòng ban.</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Xóa tìm kiếm
            </button>
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="flex w-full min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
            <div className="w-full min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 lg:max-w-md lg:shrink-0 xl:max-w-lg lg:sticky lg:top-4">
              {/* Chọn tháng/năm: bấm tiêu đề mở panel */}
              <div className="mb-4 flex flex-col gap-3 sm:mb-5">
                <div className="relative flex justify-center" ref={monthPickerRef}>
                  <button
                    type="button"
                    onClick={() => setMonthPickerOpen((o) => !o)}
                    className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-2.5 text-base font-bold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 sm:text-lg"
                    aria-expanded={monthPickerOpen}
                    aria-haspopup="dialog"
                    aria-label="Chọn tháng và năm"
                  >
                    <span className="truncate">{monthTitleVi(calMonth)}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${monthPickerOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>
                  {monthPickerOpen && (
                    <div
                      className="absolute left-1/2 top-full z-20 mt-2 w-[min(100vw-2rem,18rem)] -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
                      role="dialog"
                      aria-label="Chọn tháng và năm"
                    >
                      <div className="flex flex-col gap-3">
                        <div>
                          <label htmlFor="cal-pick-month" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Tháng
                          </label>
                          <select
                            id="cal-pick-month"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={calMonthIdx}
                            onChange={(e) => setCalMonth(new Date(calYear, Number(e.target.value), 1))}
                          >
                            {MONTH_LABELS_VI.map((label, idx) => (
                              <option key={idx} value={idx}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="cal-pick-year" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Năm
                          </label>
                          <select
                            id="cal-pick-year"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={calYear}
                            onChange={(e) => setCalMonth(new Date(Number(e.target.value), calMonthIdx, 1))}
                          >
                            {yearSelectOptions.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const k = dateToKey(now);
                      pendingSelectDayKeyRef.current = k;
                      setCalMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                      setSelectedDayKey(k);
                      setMonthPickerOpen(false);
                    }}
                    className="rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    Hôm nay
                  </button>
                </div>
              </div>

              <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50">
                {/* Cố định 7 cột bằng inline grid — tránh vỡ hàng khi flex cha thiếu min-w-0 / width */}
                <div
                  className="min-w-[280px] w-full border-b border-slate-200 bg-slate-100/90"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
                >
                  {WEEKDAYS.map((w) => (
                    <div
                      key={w}
                      className="py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs"
                    >
                      {w}
                    </div>
                  ))}
                </div>
                <div
                  className="min-w-[280px] w-full gap-px bg-slate-200 p-px"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
                >
                  {monthCells.map((cell, idx) => {
                    if (!cell) {
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="h-11 bg-white sm:h-12"
                          aria-hidden
                        />
                      );
                    }
                    const key = dateToKey(cell);
                    const list = interviewsByDate.get(key) ?? [];
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
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-900 ring-2 ring-inset ring-blue-500'
                            : hasEvents
                              ? 'bg-white text-slate-900 hover:bg-blue-50'
                              : 'bg-white text-slate-400 hover:bg-slate-50'
                        } ${!isSelected && isToday ? 'ring-2 ring-inset ring-blue-400' : ''} `}
                      >
                        <span className="leading-none">{cell.getDate()}</span>
                        {hasEvents && (
                          <span
                            className={`mt-1 flex items-center gap-0.5 ${isSelected ? 'text-white' : 'text-blue-600'}`}
                            aria-label={`${count} buổi phỏng vấn`}
                          >
                            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                              <span
                                key={i}
                                className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600'}`}
                              />
                            ))}
                            {count > 3 && (
                              <span className={`text-[9px] font-bold leading-none ${isSelected ? 'text-white' : 'text-blue-600'}`}>
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
              <p className="mt-3 text-center text-xs text-slate-500">
                Chấm dưới số ngày = có lịch (tối đa 3 chấm, nhiều hơn hiện +). Ô viền xanh là hôm nay.
              </p>
            </div>

            <div className="w-full min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                {selectedDayKey
                  ? new Date(selectedDayKey + 'T12:00:00').toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'Chọn ngày'}
              </h3>
              {!selectedDayKey || selectedDayInterviews.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  {selectedDayKey
                    ? 'Không có buổi phỏng vấn nào trong ngày này (hoặc không khớp tìm kiếm).'
                    : 'Chọn một ngày có đánh dấu trên lịch để xem chi tiết.'}
                </p>
              ) : (
                <ul className="mt-4 flex max-h-[min(70vh,520px)] flex-col gap-3 overflow-y-auto pr-1">
                  {selectedDayInterviews.map((iv) => {
                    const badge = getStatusBadge(iv.statusCode);
                    const statusText = iv.statusName || badge.label;
                    return (
                      <li
                        key={iv.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-blue-200 hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{iv.positionTitle}</p>
                            <p className="text-xs text-slate-500">
                              Vòng {iv.roundNo} · {iv.departmentName}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-700">
                              {formatDateTime(iv.startTime, 'vi-VN')}
                            </p>
                            <p className="text-xs text-slate-500">Đến {formatDateTime(iv.endTime, 'vi-VN')}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                            {statusText}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/app/interviews/${iv.id}`)}
                          className="mt-2 w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                        >
                          Xem chi tiết
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <ul className="mx-auto flex max-w-3xl flex-col gap-4">{filteredInterviews.map((i) => renderInterviewCard(i))}</ul>
        )}
      </div>
    </div>
  );
}
