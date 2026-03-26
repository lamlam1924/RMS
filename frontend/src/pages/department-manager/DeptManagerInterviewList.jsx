import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import interviewerService from '../../services/interviewerService';
import notify from '../../utils/notification';
import InterviewListPage from '../../components/shared/interviews/InterviewListPage';
import { formatDateTime } from '../../utils/formatters/display';
import {
  buildInterviewerListCardStatus,
  getInterviewerCalendarStatusPill,
  getParticipationDecisionFromItem,
} from '../../utils/helpers/interviewerParticipation';

export default function DeptManagerInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('all'); // all | pending | confirmed | declined
  const [sortBy, setSortBy] = useState('needs-first'); // needs-first | start-asc | start-desc
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [viewMode, setViewMode] = useState('list'); // list | calendar
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  useEffect(() => {
    loadInterviews();
  }, [filter]);

  useEffect(() => {
    setPage(1);
  }, [filter, decisionFilter, searchQuery, sortBy]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      let data = [];
      if (filter === 'upcoming') {
        data = await interviewerService.interviews.getUpcoming();
      } else {
        data = await interviewerService.interviews.getAll();
        if (filter === 'past') {
          const now = new Date();
          data = (Array.isArray(data) ? data : []).filter((item) => new Date(item.startTime) < now);
        }
      }
      setInterviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load interviews:', error);
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const baseInterviews = interviews.map((item) => {
    const readOnly = !!(item.isReadOnlyNominatorAccess ?? item.IsReadOnlyNominatorAccess);
    const hasMyFeedback = !!(item.hasMyFeedback ?? item.HasMyFeedback);
    const end = new Date(item.endTime || item.startTime);
    const canSubmitNow = end < now;
    const participation = readOnly ? 'view_only' : getParticipationDecisionFromItem(item);
    const needsFeedback =
      readOnly
        ? false
        : participation !== 'declined' && canSubmitNow && !hasMyFeedback;
    return {
      ...item,
      hasMyFeedback,
      canSubmitNow,
      needsFeedback,
      participation,
      readOnlyNominator: readOnly,
    };
  });

  const filteredByModes = baseInterviews.filter((item) => {
    if (decisionFilter === 'all') return true;
    if (item.readOnlyNominator) return false;
    return item.participation === decisionFilter;
  });

  const searchedInterviews = filteredByModes.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      item.candidateName,
      item.positionTitle,
      item.departmentName,
      item.statusName,
      item.statusCode,
      item.location,
      item.meetingLink,
      `vòng ${item.roundNo ?? ''}`,
      formatDateTime(item.startTime, 'vi-VN'),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  const sortedInterviews = searchedInterviews.slice().sort((a, b) => {
    if (sortBy === 'start-asc') return new Date(a.startTime) - new Date(b.startTime);
    if (sortBy === 'start-desc') return new Date(b.startTime) - new Date(a.startTime);
    // needs-first
    if (a.needsFeedback !== b.needsFeedback) return a.needsFeedback ? -1 : 1;
    return new Date(a.startTime) - new Date(b.startTime);
  });

  const totalCount = sortedInterviews.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedInterviews = sortedInterviews.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const nums = new Set([1, totalPages, safePage - 1, safePage, safePage + 1]);
    const sorted = [...nums].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

    const items = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push('...');
      items.push(sorted[i]);
    }
    return items;
  }, [safePage, totalPages]);

  const summary = {
    total: filteredByModes.length,
    pending: filteredByModes.filter((i) => i.needsFeedback).length,
    submitted: filteredByModes.filter((i) => i.hasMyFeedback).length,
  };

  const getSessionLabel = (interview) => {
    const date = new Date(interview.startTime);
    const hour = date.getHours();
    const shift = hour < 12 ? 'Buổi sáng' : hour < 18 ? 'Buổi chiều' : 'Buổi tối';
    return `${date.toLocaleDateString('vi-VN')} • ${shift}`;
  };

  const getScheduleLabel = (interview) => {
    const d = new Date(interview.startTime);
    if (Number.isNaN(d.getTime())) return '—';
    const hour = d.getHours();
    const shift = hour < 12 ? 'Buổi sáng' : hour < 18 ? 'Buổi chiều' : 'Buổi tối';
    const day = d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${day} • ${shift} • ${time}`;
  };

  const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  function dateToKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
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
    new Date(2000, i, 1).toLocaleDateString('vi-VN', { month: 'long' })
  );

  const monthTitleVi = (d) => d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  void monthTitleVi;

  const unconfirmedCount = filteredByModes.filter((i) => i.participation === 'pending').length;

  // ----- Calendar derived data -----
  const calendarInterviews = useMemo(
    () => sortedInterviews.slice().sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [sortedInterviews]
  );

  const calendarYearOptions = useMemo(() => {
    const nowY = new Date().getFullYear();
    const yearsFromData = (calendarInterviews || [])
      .map((iv) => (iv?.startTime ? new Date(iv.startTime).getFullYear() : null))
      .filter((y) => typeof y === 'number' && !Number.isNaN(y));

    let minY = yearsFromData.length ? Math.min(...yearsFromData) : nowY - 1;
    let maxY = yearsFromData.length ? Math.max(...yearsFromData) : nowY + 1;

    minY = minY - 1;
    maxY = maxY + 1;

    if (!yearsFromData.includes(nowY)) {
      minY = Math.min(minY, nowY - 2);
      maxY = Math.max(maxY, nowY + 2);
    }

    const list = [];
    for (let y = minY; y <= maxY; y++) list.push(y);
    return list.length ? list : [nowY];
  }, [calendarInterviews]);

  const interviewsByDate = useMemo(() => {
    const m = new Map();
    for (const iv of calendarInterviews) {
      if (!iv?.startTime) continue;
      const d = new Date(iv.startTime);
      if (Number.isNaN(d.getTime())) continue;
      const k = dateToKey(d);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(iv);
    }
    return m;
  }, [calendarInterviews]);

  const todayKey = dateToKey(new Date());
  const calYear = calMonth.getFullYear();
  const calMonthIdx = calMonth.getMonth();
  const monthCells = useMemo(() => buildMonthCells(calYear, calMonthIdx), [calYear, calMonthIdx]);

  useEffect(() => {
    if (viewMode !== 'calendar') return;

    const keysInMonth = [...interviewsByDate.keys()]
      .filter((k) => {
        const [yy, mm] = k.split('-').map(Number);
        return yy === calYear && mm - 1 === calMonthIdx;
      })
      .sort();

    const inMonth = selectedDayKey
      ? (() => {
          const [yy, mm] = selectedDayKey.split('-').map(Number);
          return yy === calYear && mm - 1 === calMonthIdx;
        })()
      : false;

    if (inMonth) return;

    const pick = (keysInMonth.includes(todayKey) ? todayKey : keysInMonth[0]) ?? null;
    setSelectedDayKey(pick);
  }, [viewMode, calYear, calMonthIdx, interviewsByDate, selectedDayKey, todayKey]);

  const selectedDayInterviews = selectedDayKey ? interviewsByDate.get(selectedDayKey) ?? [] : [];

  const viewToggle = (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setViewMode('list')}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        Danh sách
      </button>
      <button
        type="button"
        onClick={() => setViewMode('calendar')}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        Lịch
      </button>
    </div>
  );

  if (viewMode === 'calendar') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Phỏng vấn của tôi</h1>
              <div className="mt-1 text-sm text-slate-600">Xem theo lịch tháng, chọn ngày để xem chi tiết buổi phỏng vấn.</div>
            </div>
            {viewToggle}
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { id: 'upcoming', label: 'Sắp tới' },
              { id: 'past', label: 'Đã qua' },
              { id: 'all', label: 'Tất cả' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  filter === t.id
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mb-6 grid gap-2 sm:grid-cols-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo ứng viên, vị trí, phòng ban..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value.trim())}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Trạng thái: Tất cả</option>
              <option value="pending">Chưa xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="declined">Đã từ chối</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="needs-first">Ưu tiên cần nộp feedback</option>
              <option value="start-asc">Thời gian tăng dần</option>
              <option value="start-desc">Thời gian giảm dần</option>
            </select>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
            <div className="relative z-0 w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:max-w-md lg:shrink-0">
              <div className="mb-3 flex flex-col gap-3">
                <div className="flex gap-2 items-end min-w-0">
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-[11px] font-bold uppercase leading-none tracking-wide text-slate-500">
                      Tháng
                    </label>
                    <select
                      value={calMonthIdx}
                      onChange={(e) => setCalMonth(new Date(calYear, Number(e.target.value), 1))}
                      className="min-w-0 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                      className="min-w-0 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
                >
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
                      {w}
                    </div>
                  ))}
                </div>
                <div
                  className="min-w-[280px] w-full gap-px bg-slate-200 p-px"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
                >
                  {monthCells.map((cell, idx) => {
                    if (!cell) return <div key={`empty-${idx}`} className="h-11 bg-white sm:h-12" aria-hidden />;
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
                        } ${!isSelected && isToday ? 'ring-2 ring-inset ring-blue-400' : ''}`}
                      >
                        <span className="leading-none">{cell.getDate()}</span>
                        {hasEvents && (
                          <span className={`mt-1 flex items-center gap-0.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} aria-label={`${count} buổi phỏng vấn`}>
                            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                              <span key={i} className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600'}`} />
                            ))}
                            {count > 3 && (
                              <span className={`text-[9px] font-bold leading-none ${isSelected ? 'text-white' : 'text-blue-600'}`}>+</span>
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
                  ? new Date(selectedDayKey + 'T12:00:00').toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Chọn ngày'}
              </h3>

              {!selectedDayKey || selectedDayInterviews.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  {selectedDayKey
                    ? 'Không có buổi phỏng vấn trong ngày này (hoặc không khớp tìm kiếm).'
                    : 'Chọn một ngày có dấu chấm trên lịch để xem chi tiết.'}
                </p>
              ) : (
                <ul className="mt-4 flex max-h-[min(70vh,520px)] flex-col gap-3 overflow-y-auto pr-1">
                  {selectedDayInterviews.map((iv) => {
                    const { statusText, pillClass } = getInterviewerCalendarStatusPill(iv);
                    return (
                      <li key={iv.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-blue-200 hover:bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{iv.candidateName}</p>
                            <p className="text-xs text-slate-500">
                              Vòng {iv.roundNo} • {iv.positionTitle}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-700">{getScheduleLabel(iv)}</p>
                            <p className="text-xs text-slate-500">{iv.location || iv.meetingLink || '—'}</p>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${pillClass}`}>
                            {statusText}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/staff/dept-manager/interviews/${iv.id}`)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                          >
                            Xem chi tiết
                          </button>

                          {!iv.readOnlyNominator && iv.participation === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await interviewerService.interviews.respond(iv.id, 'CONFIRM');
                                    notify.success('Đã xác nhận tham gia');
                                    loadInterviews();
                                  } catch (err) {
                                    notify.error(err?.message || 'Thao tác thất bại');
                                  }
                                }}
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                              >
                                Xác nhận
                              </button>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  let note;
                                  const value = window.prompt(
                                    'Ghi chú từ chối (tùy chọn, vd. bận ngày đó / có thể chọn ngày khác) để HR thương lượng:'
                                  );
                                  if (value === null) return;
                                  note = (value || '').trim() || undefined;
                                  try {
                                    await interviewerService.interviews.respond(iv.id, 'DECLINE', note);
                                    notify.success('Đã ghi nhận từ chối');
                                    loadInterviews();
                                  } catch (err) {
                                    notify.error(err?.message || 'Thao tác thất bại');
                                  }
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>

                        {iv.needsFeedback && <p className="mt-2 text-xs font-semibold text-rose-600">Cần nộp feedback</p>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <InterviewListPage
      title="Phỏng vấn của tôi"
      description="Các buổi bạn tham gia phỏng vấn hoặc các buổi bạn đã đề cử người tham gia (xem chi tiết ở chế độ chỉ đọc nếu bạn không tham gia)."
      topRight={viewToggle}
      filters={[
        { id: 'upcoming', label: 'Sắp tới' },
        { id: 'past', label: 'Đã qua' },
        { id: 'all', label: 'Tất cả' },
      ]}
      filter={filter}
      onFilterChange={setFilter}
      loading={loading}
      items={pagedInterviews}
      emptyTitle="Không có buổi phỏng vấn nào"
      emptyDescription={searchQuery.trim() ? 'Không có kết quả theo từ khóa/bộ lọc.' : filter === 'upcoming' ? 'Chưa có lịch sắp tới.' : 'Không có dữ liệu.'}
      extraTop={
        <div className="mb-4 flex flex-col gap-3">
          {unconfirmedCount > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Bạn có <strong>{unconfirmedCount}</strong> buổi chưa xác nhận.
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-rose-700">Cần feedback</div>
              <div className="text-2xl font-bold text-rose-600">{summary.pending}</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">Đã nộp</div>
              <div className="text-2xl font-bold text-emerald-600">{summary.submitted}</div>
            </div>
          </div>

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo ứng viên, vị trí, phòng ban..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={decisionFilter}
onChange={(e) => setDecisionFilter(e.target.value.trim())}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="pending">Chưa xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="declined">Đã từ chối</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="needs-first">Ưu tiên cần nộp feedback</option>
            <option value="start-asc">Thời gian tăng dần</option>
            <option value="start-desc">Thời gian giảm dần</option>
          </select>
          <div className="hidden sm:block" />
          </div>

          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-600">
              Trang <strong className="font-semibold text-slate-900">{safePage}</strong> /{' '}
              <strong className="font-semibold text-slate-900">{totalPages}</strong> • {totalCount} kết quả
            </div>
            <div className="flex items-center gap-2">
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
                  it === '...' ? (
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
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70'
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
        </div>
      }
      onItemClick={(interview) => navigate(`/staff/dept-manager/interviews/${interview.id}`)}
      getGroupLabel={getSessionLabel}
      renderRowActions={(interview) => {
        const handleRespond = async (e, response) => {
          e.stopPropagation();
          let note;
          if (response === 'DECLINE') {
            const value = window.prompt('Ghi chú từ chối (tùy chọn, vd. bận ngày đó / có thể chọn ngày khác) để HR thương lượng:');
            if (value === null) return;
            note = (value || '').trim() || undefined;
          }
          try {
            await interviewerService.interviews.respond(interview.id, response, note);
            notify.success(response === 'CONFIRM' ? 'Đã xác nhận tham gia' : 'Đã ghi nhận từ chối');
            loadInterviews();
          } catch (err) {
            notify.error(err?.message || 'Thao tác thất bại');
          }
        };

        return (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/staff/dept-manager/interviews/${interview.id}`);
              }}
              className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              Xem chi tiết
            </button>
            {!interview.readOnlyNominator && interview.participation === 'pending' && (
              <>
                <button
                  onClick={(e) => handleRespond(e, 'CONFIRM')}
                  className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  Xác nhận
                </button>
                <button
                  onClick={(e) => handleRespond(e, 'DECLINE')}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Từ chối
                </button>
              </>
            )}
            {interview.readOnlyNominator && (
              <span className="ml-auto rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                Chỉ xem (đề cử)
              </span>
            )}
            {interview.needsFeedback && <span className="ml-auto text-xs font-semibold text-rose-600">Cần nộp feedback</span>}
          </div>
        );
      }}
      getCardData={(interview) => {
        const built = interview.readOnlyNominator
          ? {
              statusLabel: 'Chỉ xem (đề cử)',
              statusBadgeOverride: { bg: '#fffbeb', color: '#92400e' },
            }
          : buildInterviewerListCardStatus(interview, interview.statusName);
        return {
          title: interview.candidateName,
          subtitle: `Vòng ${interview.roundNo}`,
          statusCode: interview.statusCode,
          statusLabel: built.statusLabel,
          statusBadgeOverride: built.statusBadgeOverride,
          infoRows: [
            { label: 'Vị trí', value: interview.positionTitle },
            { label: 'Lịch phỏng vấn', value: getScheduleLabel(interview) },
            { label: 'Địa điểm / Link', value: interview.location || interview.meetingLink || '—' },
          ],
          note: interview.readOnlyNominator
            ? 'Bạn đề cử người tham gia — không tham gia phỏng vấn'
            : interview.needsFeedback
              ? 'Chưa nộp feedback'
              : interview.hasMyFeedback
                ? 'Đã nộp feedback'
                : interview.participation === 'declined'
                  ? 'Bạn đã từ chối tham gia buổi này.'
                  : null,
        };
      }}
    />
  );
}
