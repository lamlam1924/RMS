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

export default function InterviewerInterviewList() {
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
  /** Modal lịch: toàn bộ buổi trong cùng block (yêu cầu đề cử) */
  const [calendarQuickView, setCalendarQuickView] = useState(null);
  /** Danh sách: chọn block + chọn buổi trong block (tabs trái/phải) */
  const [selectedBlockKey, setSelectedBlockKey] = useState(null);

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
    const hasMyFeedback = !!(item.hasMyFeedback ?? item.HasMyFeedback);
    const end = new Date(item.endTime || item.startTime);
    const canSubmitNow = end < now;
    const participation = getParticipationDecisionFromItem(item);
    // Chỉ hiện "Cần nộp feedback" sau khi đã xác nhận tham gia.
    const needsFeedback = participation === 'confirmed' && canSubmitNow && !hasMyFeedback;
    return {
      ...item,
      hasMyFeedback,
      canSubmitNow,
      needsFeedback,
      participation,
    };
  });

  const filteredByModes = baseInterviews.filter((item) =>
    decisionFilter === 'all' ? true : item.participation === decisionFilter
  );

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

  function monthTitleVi(d) {
    return d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  }
  void monthTitleVi;

  const MONTH_LABELS_VI = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleDateString('vi-VN', { month: 'long' })
  );

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

  const interviewBlockKey = (iv) => {
    const pr = iv.participantRequestId ?? iv.ParticipantRequestId;
    if (pr != null && pr !== '') return `pr-${pr}`;
    return `iv-${iv.id}`;
  };

  const listBlockGroups = useMemo(() => {
    const by = new Map();
    for (const iv of sortedInterviews) {
      const k = interviewBlockKey(iv);
      if (!by.has(k)) {
        by.set(k, {
          blockKey: k,
          participantRequestId: iv.participantRequestId ?? iv.ParticipantRequestId,
          interviews: [],
        });
      }
      by.get(k).interviews.push(iv);
    }
    const groups = [...by.values()].map((g) => ({
      ...g,
      interviews: g.interviews.slice().sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    }));
    groups.sort((a, b) => new Date(a.interviews[0]?.startTime ?? 0) - new Date(b.interviews[0]?.startTime ?? 0));
    return groups;
  }, [sortedInterviews]);

  const totalBlocks = listBlockGroups.length;
  const totalBlockPages = Math.max(1, Math.ceil(totalBlocks / PAGE_SIZE));
  const safeBlockPage = Math.min(page, totalBlockPages);
  const pagedBlocks = listBlockGroups.slice((safeBlockPage - 1) * PAGE_SIZE, safeBlockPage * PAGE_SIZE);

  useEffect(() => {
    if (viewMode !== 'list') return;
    const exists = selectedBlockKey && listBlockGroups.some((g) => g.blockKey === selectedBlockKey);
    const next = exists ? selectedBlockKey : listBlockGroups[0]?.blockKey ?? null;
    setSelectedBlockKey(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, listBlockGroups]);

  const selectedBlock = useMemo(
    () => listBlockGroups.find((g) => g.blockKey === selectedBlockKey) ?? null,
    [listBlockGroups, selectedBlockKey]
  );

  const selectedBlockInterviews = selectedBlock?.interviews ?? [];

  const blockParticipationAgg = (ivs) => {
    if (!ivs?.length) return '—';
    const set = new Set(ivs.map((x) => x.participation));
    if (set.size === 1) return [...set][0];
    if (set.has('pending')) return 'pending';
    return 'mixed';
  };

  const blockParticipationLabel = (agg) => {
    if (agg === 'pending') return { text: 'Chưa xác nhận (còn buổi chưa phản hồi)', pill: 'border-amber-200 bg-amber-50 text-amber-900' };
    if (agg === 'confirmed') return { text: 'Đã xác nhận tham gia', pill: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
    if (agg === 'declined') return { text: 'Đã từ chối tham gia', pill: 'border-rose-200 bg-rose-50 text-rose-800' };
    if (agg === 'mixed') return { text: 'Đã phản hồi (một phần)', pill: 'border-slate-200 bg-slate-50 text-slate-700' };
    return { text: '—', pill: 'border-slate-200 bg-slate-50 text-slate-700' };
  };

  const handleRespondBlock = async (block, response) => {
    if (!block?.interviews?.length) return;
    const targets = block.interviews.filter((iv) => iv.participation === 'pending');
    if (!targets.length) return;

    let note;
    if (response === 'DECLINE') {
      const value = window.prompt('Ghi chú từ chối (tùy chọn, vd. bận ngày đó / có thể chọn ngày khác) để HR thương lượng:');
      if (value === null) return;
      note = (value || '').trim() || undefined;
    }

    try {
      const results = await Promise.allSettled(
        targets.map((iv) => interviewerService.interviews.respond(iv.id, response, note))
      );
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const fail = results.length - ok;
      if (fail === 0) {
        notify.success(response === 'CONFIRM' ? 'Đã xác nhận tham gia cho toàn bộ block' : 'Đã ghi nhận từ chối cho toàn bộ block');
      } else {
        notify.warning(`Đã cập nhật ${ok}/${results.length} buổi trong block. Vui lòng thử lại những buổi còn lỗi.`);
      }
      loadInterviews();
    } catch (err) {
      notify.error(err?.message || 'Thao tác thất bại');
    }
  };

  const selectedDayBlockGroups = useMemo(() => {
    if (!selectedDayKey || !selectedDayInterviews.length) return [];
    const by = new Map();
    for (const iv of selectedDayInterviews) {
      const k = interviewBlockKey(iv);
      if (!by.has(k)) {
        by.set(k, {
          blockKey: k,
          participantRequestId: iv.participantRequestId ?? iv.ParticipantRequestId,
          dayInterviews: [],
        });
      }
      by.get(k).dayInterviews.push(iv);
    }
    const groups = [...by.values()].map((g) => ({
      ...g,
      dayInterviews: g.dayInterviews.slice().sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    }));
    groups.sort((a, b) => new Date(a.dayInterviews[0].startTime) - new Date(b.dayInterviews[0].startTime));
    return groups;
  }, [selectedDayKey, selectedDayInterviews]);

  const getInterviewsInBlock = (blockKey) =>
    sortedInterviews
      .filter((iv) => interviewBlockKey(iv) === blockKey)
      .slice()
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const blockTimeRangeLabel = (blockKey) => {
    const list = getInterviewsInBlock(blockKey);
    if (!list.length) return '—';
    if (list.length === 1) return getScheduleLabel(list[0]);
    return `${formatDateTime(list[0].startTime)} → ${formatDateTime(list[list.length - 1].endTime || list[list.length - 1].startTime)}`;
  };

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
                  filter === t.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
              onChange={(e) => setDecisionFilter(e.target.value)}
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
                    <label className="mb-1 block text-[11px] font-bold uppercase leading-none tracking-wide text-slate-500">Tháng</label>
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
                    <label className="mb-1 block text-[11px] font-bold uppercase leading-none tracking-wide text-slate-500">Năm</label>
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
                <div className="min-w-[280px] w-full border-b border-slate-200 bg-slate-100/90" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
                      {w}
                    </div>
                  ))}
                </div>
                <div className="min-w-[280px] w-full gap-px bg-slate-200 p-px" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
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
                            {count > 3 && <span className={`text-[9px] font-bold leading-none ${isSelected ? 'text-white' : 'text-blue-600'}`}>+</span>}
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
                  ? new Date(selectedDayKey + 'T12:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Chọn ngày'}
              </h3>

              {!selectedDayKey || selectedDayBlockGroups.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">{selectedDayKey ? 'Không có buổi phỏng vấn trong ngày này (hoặc không khớp tìm kiếm).' : 'Chọn một ngày có dấu chấm trên lịch để xem chi tiết.'}</p>
              ) : (
                <ul className="mt-4 flex max-h-[min(70vh,520px)] flex-col gap-3 overflow-y-auto pr-1">
                  {selectedDayBlockGroups.map((g) => {
                    const first = g.dayInterviews[0];
                    const fullBlock = getInterviewsInBlock(g.blockKey);
                    const anyNeedsFb = g.dayInterviews.some((iv) => iv.needsFeedback);
                    const blockPill = anyNeedsFb
                      ? { statusText: 'Cần nộp feedback', pillClass: 'border-rose-200 bg-rose-50 text-rose-700' }
                      : getInterviewerCalendarStatusPill(first);
                    const { statusText, pillClass } = blockPill;
                    const blockTitle =
                      g.participantRequestId != null && g.participantRequestId !== ''
                        ? `Block #${g.participantRequestId}`
                        : `Buổi #${first.id}`;

                    return (
                      <li key={g.blockKey} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-base font-bold text-slate-900">{blockTitle}</h3>
                              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${pillClass}`}>
                                {statusText}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-slate-600">
                              <span className="font-medium text-slate-800">{first.positionTitle || '—'}</span>
                              {first.departmentName ? <span className="text-slate-400"> · {first.departmentName}</span> : null}
                            </div>
                            <div className="mt-1 text-sm text-slate-700">
                              Thời gian (toàn block): <span className="font-semibold">{blockTimeRangeLabel(g.blockKey)}</span>
                            </div>

                            {g.dayInterviews.length > 0 ? (
                              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Buổi trong ngày đã chọn ({g.dayInterviews.length})
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setCalendarQuickView(fullBlock)}
                                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                                  >
                                    Quick view ({fullBlock.length})
                                  </button>
                                </div>
                                <div className="flex flex-col gap-1">
                                  {g.dayInterviews.slice(0, 2).map((iv, idx) => (
                                    <div key={iv.id} className="text-sm text-slate-700">
                                      Buổi {idx + 1}: <span className="font-medium">{iv.candidateName}</span> · {formatDateTime(iv.startTime)}
                                    </div>
                                  ))}
                                  {g.dayInterviews.length > 2 ? (
                                    <div className="text-xs text-slate-500">
                                      + {g.dayInterviews.length - 2} buổi khác trong ngày — xem đủ trong Quick view
                                    </div>
                                  ) : null}
                                </div>
                              </div>
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

          {calendarQuickView && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setCalendarQuickView(null);
              }}
            >
              <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
                <div className="border-b border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-slate-900">Tất cả buổi trong block</h2>
                      <p className="mt-1 text-xs text-slate-600">{calendarQuickView.length} buổi phỏng vấn</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCalendarQuickView(null)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-5">
                  <ul className="flex flex-col gap-3">
                    {calendarQuickView.map((iv) => {
                      const { statusText, pillClass } = getInterviewerCalendarStatusPill(iv);
                      return (
                        <li key={iv.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
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
                              onClick={() => navigate(`/staff/interviews/${iv.id}`)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                            >
                              Xem chi tiết
                            </button>
                            {iv.participation === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await interviewerService.interviews.respond(iv.id, 'CONFIRM');
                                      notify.success('Đã xác nhận tham gia');
                                      setCalendarQuickView(null);
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
                                  onClick={async () => {
                                    let note;
                                    const value = window.prompt('Ghi chú từ chối (tùy chọn, vd. bận ngày đó / có thể chọn ngày khác) để HR thương lượng:');
                                    if (value === null) return;
                                    note = (value || '').trim() || undefined;
                                    try {
                                      await interviewerService.interviews.respond(iv.id, 'DECLINE', note);
                                      notify.success('Đã ghi nhận từ chối');
                                      setCalendarQuickView(null);
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
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Phỏng vấn của tôi</h1>
            <div className="mt-1 text-sm text-slate-600">
              Xác nhận/từ chối theo <span className="font-semibold">block</span>. Chọn block để xem chi tiết từng buổi trong block.
            </div>
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
                filter === t.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
            onChange={(e) => setDecisionFilter(e.target.value)}
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
          {/* LEFT: blocks list */}
          <div className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:max-w-md lg:shrink-0">
            <div className="mb-3">
              <div className="text-xs text-slate-600">
                Trang <strong className="font-semibold text-slate-900">{safeBlockPage}</strong> /{' '}
                <strong className="font-semibold text-slate-900">{totalBlockPages}</strong> • {totalBlocks} block
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safeBlockPage <= 1}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalBlockPages, p + 1))}
                disabled={safeBlockPage >= totalBlockPages}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
              <div className="ml-auto text-xs text-slate-500">
                {unconfirmedCount > 0 ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-900">
                    {unconfirmedCount} buổi chưa xác nhận
                  </span>
                ) : null}
              </div>
            </div>

            {pagedBlocks.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                Không có block phù hợp.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pagedBlocks.map((g) => {
                  const first = g.interviews[0];
                  const anyNeedsFb = g.interviews.some((iv) => iv.needsFeedback);
                  const agg = blockParticipationAgg(g.interviews);
                  const aggPill = blockParticipationLabel(agg);
                  const title =
                    g.participantRequestId != null && g.participantRequestId !== ''
                      ? `Block #${g.participantRequestId}`
                      : `Buổi #${first?.id ?? '—'}`;
                  const selected = g.blockKey === selectedBlockKey;

                  return (
                    <button
                      key={g.blockKey}
                      type="button"
                      onClick={() => {
                        setSelectedBlockKey(g.blockKey);
                        setSelectedInterviewIdx(0);
                      }}
                      className={`text-left rounded-xl border bg-white p-4 shadow-sm transition ${
                        selected ? 'border-blue-300 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-bold text-slate-900">{title}</h3>
                            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${anyNeedsFb ? 'border-rose-200 bg-rose-50 text-rose-700' : aggPill.pill}`}>
                              {anyNeedsFb ? 'Cần nộp feedback' : aggPill.text}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-slate-600">
                            <span className="font-medium text-slate-800">{first?.positionTitle || '—'}</span>
                            {first?.departmentName ? <span className="text-slate-400"> · {first.departmentName}</span> : null}
                          </div>
                          <div className="mt-1 text-sm text-slate-700">
                            <span>
                              Thời gian: <span className="font-semibold">{blockTimeRangeLabel(g.blockKey)}</span>
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {g.interviews.length} buổi trong block
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: block detail */}
          <div className="w-full min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {!selectedBlock ? (
              <div className="p-6 text-sm text-slate-600">Chọn một block ở danh sách bên trái để xem chi tiết.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-bold text-slate-900">
                        {selectedBlock.participantRequestId != null && selectedBlock.participantRequestId !== ''
                          ? `Block #${selectedBlock.participantRequestId}`
                          : `Buổi #${activeInterview.id}`}
                      </h2>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {selectedBlockInterviews.length} buổi
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Thời gian (toàn block): <span className="font-semibold text-slate-900">{blockTimeRangeLabel(selectedBlock.blockKey)}</span>
                    </div>
                  </div>

                  {(() => {
                    const pendingCount = selectedBlockInterviews.filter((iv) => iv.participation === 'pending').length;
                    return pendingCount > 0 ? (
                      <div className="shrink-0 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRespondBlock(selectedBlock, 'CONFIRM')}
                          className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Xác nhận ({pendingCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespondBlock(selectedBlock, 'DECLINE')}
                          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Từ chối ({pendingCount})
                        </button>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Danh sách ứng viên trong block
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {selectedBlockInterviews.map((iv, idx) => {
                      const pill = getInterviewerCalendarStatusPill(iv);
                      return (
                        <li key={iv.id} className="px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">
                                Buổi {idx + 1}: {iv.candidateName || '—'}
                              </div>
                              <div className="text-xs text-slate-600">
                                Vòng {iv.roundNo} • {formatDateTime(iv.startTime)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${pill.pillClass}`}>
                                {pill.statusText}
                              </span>
                              <button
                                type="button"
                                onClick={() => navigate(`/staff/interviews/${iv.id}`)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                              >
                                Chi tiết
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}