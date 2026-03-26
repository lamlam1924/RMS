import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import interviewerService from '../../services/interviewerService';
import notify from '../../utils/notification';
import { getStatusBadge } from '../../utils/helpers/badge';
import { INTERVIEW_FEEDBACK_DECISION_OPTIONS } from '../../components/shared/InterviewFeedbackForm';
import { formatDateTime } from '../../utils/formatters/display';

export default function InterviewerInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ comment: '', decision: '' });
  const [blockInterviews, setBlockInterviews] = useState([]);
  const [tab, setTab] = useState('overview'); // overview | candidate | feedback | participants

  // Hooks must be called on every render (avoid defining after early returns).
  const activeIdx = useMemo(() => {
    const currentId = interview?.id ?? id;
    if (!currentId || !Array.isArray(blockInterviews) || blockInterviews.length === 0) return 0;
    const idx = blockInterviews.findIndex((x) => String(x.id) === String(currentId));
    return Math.max(0, idx);
  }, [blockInterviews, interview?.id, id]);

  useEffect(() => {
    loadInterview();
  }, [id]);

  const normalizeInterview = (raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const pick = (...vals) => vals.find((v) => v != null && v !== '');
    const startTime = pick(raw.startTime, raw.StartTime, raw.interviewDateTime, raw.InterviewDateTime, raw.startAt, raw.StartAt);
    const endTime = pick(raw.endTime, raw.EndTime, raw.endAt, raw.EndAt);

    // Defensive: if payload accidentally swaps times (start > end), auto-correct.
    let safeStartTime = startTime;
    let safeEndTime = endTime;
    const startDate = startTime ? new Date(startTime) : null;
    const endDate = endTime ? new Date(endTime) : null;
    if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate > endDate) {
      safeStartTime = endTime;
      safeEndTime = startTime;
    }

    return {
      ...raw,
      startTime: safeStartTime,
      endTime: safeEndTime,
      meetingLink: pick(raw.meetingLink, raw.MeetingLink),
      location: pick(raw.location, raw.Location),
      participantRequestId: raw.participantRequestId ?? raw.ParticipantRequestId,
      myConfirmedAt: pick(raw.myConfirmedAt, raw.MyConfirmedAt),
      myDeclinedAt: pick(raw.myDeclinedAt, raw.MyDeclinedAt),
      hasMyFeedback: raw.hasMyFeedback ?? raw.HasMyFeedback,
      candidateProfile: raw.candidateProfile ?? raw.CandidateProfile,
      previousRounds: raw.previousRounds ?? raw.PreviousRounds,
      statusCode: raw.statusCode ?? raw.StatusCode,
      statusName: raw.statusName ?? raw.StatusName,
      roundNo: raw.roundNo ?? raw.RoundNo,
      positionTitle: raw.positionTitle ?? raw.PositionTitle,
      candidateName: raw.candidateName ?? raw.CandidateName,
      applicationId: raw.applicationId ?? raw.ApplicationId,
      participants: raw.participants ?? raw.Participants,
    };
  };

  const formatDateTimeSafe = (value) => {
    if (value == null || value === '') return '—';
    const formatted = formatDateTime(value);
    if (formatted === 'N/A') return '—';
    if (formatted !== 'Invalid date') return formatted;

    // Fallback: parse common dd/MM/yyyy HH:mm(:ss) format if backend ever returns it as a string.
    if (typeof value === 'string') {
      const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
      if (m) {
        const dd = Number(m[1]);
        const mm = Number(m[2]);
        const yyyy = Number(m[3]);
        const hh = Number(m[4] ?? 0);
        const min = Number(m[5] ?? 0);
        const ss = Number(m[6] ?? 0);
        const d = new Date(yyyy, mm - 1, dd, hh, min, ss);
        if (!isNaN(d.getTime())) return d.toLocaleString('vi-VN');
      }
    }

    return String(value);
  };

  const loadInterview = async () => {
    try {
      setLoading(true);
      const data = await interviewerService.interviews.getById(id);
      const normalized = normalizeInterview(data);
      setInterview(normalized);
      await loadBlockInterviews(normalized?.id);

    } catch (error) {
      console.error('Failed to load interview detail:', error);
      notify.error('Không thể tải thông tin phỏng vấn');
      navigate('/staff/interviews');
    } finally {
      setLoading(false);
    }
  };

  const loadBlockInterviews = async (currentId) => {
    try {
      const list = await interviewerService.interviews.getAll();
      const all = Array.isArray(list) ? list : [];
      const cur = all.find((x) => String(x.id) === String(currentId));
      const reqId = cur?.participantRequestId ?? cur?.ParticipantRequestId;
      if (reqId == null || reqId === '') {
        setBlockInterviews(cur ? [cur] : []);
        return;
      }
      const sameBlock = all
        .filter((x) => (x.participantRequestId ?? x.ParticipantRequestId) === reqId)
        .sort((a, b) => new Date(a.startTime ?? a.StartTime) - new Date(b.startTime ?? b.StartTime))
        .map((x) => normalizeInterview(x));
      setBlockInterviews(sameBlock);
    } catch {
      setBlockInterviews([]);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.decision) {
      notify.warning('Vui lòng chọn kết luận');
      return;
    }

    try {
      setSubmitting(true);
      await interviewerService.interviews.submitFeedback(id, feedback);
      notify.success('Đã nộp đánh giá phỏng vấn');
      await loadInterview();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      notify.error(error.message || 'Không thể nộp đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-700">Đang tải...</div>
        </div>
      </div>
    );
  }
  if (!interview) return null;

  const badge = getStatusBadge(interview.statusCode);
  const isFinal = ['COMPLETED', 'CANCELLED'].includes(interview.statusCode);
  const myConfirmed = !!interview.myConfirmedAt;
  const myDeclined = !!interview.myDeclinedAt;
  const canEvaluate =
    myConfirmed &&
    !myDeclined &&
    new Date(interview.endTime) < new Date() &&
    !interview.hasMyFeedback &&
    !isFinal;
  const participationPending = !myConfirmed && !myDeclined;

  const handleRespondParticipation = async (response) => {
    let note;
    if (response === 'DECLINE') {
      const value = window.prompt('Ghi chú từ chối (tùy chọn, vd. bận ngày đó / có thể chọn ngày khác) để HR thương lượng:');
      if (value === null) return;
      note = (value || '').trim() || undefined;
    }
    try {
      setSubmitting(true);
      const result = await interviewerService.interviews.respond(id, response, note);
      if (result?.success) {
        notify.success(response === 'CONFIRM' ? 'Đã xác nhận tham gia' : 'Đã ghi nhận từ chối');
        loadInterview();
      } else notify.error(result?.message || 'Thao tác thất bại');
    } catch (err) {
      notify.error(err?.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const cp = interview.candidateProfile;
  const cvDownloadUrl = interview?.applicationId
    ? `/api/files/application/${interview.applicationId}/cv`
    : (cp?.cvFileUrl ? `/api/files/cv?url=${encodeURIComponent(cp.cvFileUrl)}` : '');
  const prevRounds = interview.previousRounds || [];

  const flowText = interview.hasMyFeedback
    ? 'Đã hoàn tất feedback'
    : myDeclined
      ? 'Đã từ chối tham gia'
      : !myConfirmed
        ? 'Chưa xác nhận tham gia'
        : canEvaluate
          ? 'Có thể nộp feedback'
          : 'Chờ buổi kết thúc';

  const flowPill =
    interview.hasMyFeedback
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : myDeclined
        ? 'border-rose-200 bg-rose-50 text-rose-800'
        : !myConfirmed
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : canEvaluate
            ? 'border-blue-200 bg-blue-50 text-blue-800'
            : 'border-slate-200 bg-slate-50 text-slate-700';

  const blockNav = blockInterviews.length > 1 ? (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-slate-900">Block ({blockInterviews.length} buổi)</div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const prev = Math.max(0, activeIdx - 1);
              const target = blockInterviews[prev];
              if (target) navigate(`/staff/interviews/${target.id}`);
            }}
            disabled={activeIdx <= 0}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => {
              const next = Math.min(blockInterviews.length - 1, activeIdx + 1);
              const target = blockInterviews[next];
              if (target) navigate(`/staff/interviews/${target.id}`);
            }}
            disabled={activeIdx >= blockInterviews.length - 1}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            ▶
          </button>
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {blockInterviews.map((iv, idx) => {
          const isActive = String(iv.id) === String(interview.id);
          const done = !!(iv.hasMyFeedback ?? iv.HasMyFeedback);
          return (
            <button
              key={iv.id}
              type="button"
              onClick={() => navigate(`/staff/interviews/${iv.id}`)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title={iv.candidateName}
            >
              Buổi {idx + 1} • {done ? 'Đã nộp' : 'Chưa nộp'}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  const participationCard = (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900">Xác nhận tham gia</div>
            <div className="mt-1 text-sm text-slate-600">Xác nhận để có thể nộp feedback sau khi buổi kết thúc.</div>
          </div>
          {participationPending ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleRespondParticipation('CONFIRM')}
                disabled={submitting}
                className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                Xác nhận
              </button>
              <button
                type="button"
                onClick={() => handleRespondParticipation('DECLINE')}
                disabled={submitting}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Từ chối
              </button>
            </div>
          ) : myConfirmed ? (
            <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              Đã xác nhận
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
              Đã từ chối
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'candidate', label: 'Ứng viên' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'participants', label: 'Người tham gia' },
  ];

  const candidateTab = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-bold text-slate-900">Hồ sơ ứng viên</div>
            <div className="mt-1 text-sm text-slate-600">{cp?.summary || '—'}</div>
          </div>
          {cvDownloadUrl ? (
            <a
              href={cvDownloadUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Tải CV
            </a>
          ) : null}
        </div>
        {cp?.yearsOfExperience != null ? (
          <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {cp.yearsOfExperience} năm kinh nghiệm
          </div>
        ) : null}
      </div>

      {cp?.experiences?.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-bold text-slate-900">Kinh nghiệm</div>
          <div className="mt-3 space-y-3">
            {cp.experiences.map((exp, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="font-semibold text-slate-900">{exp.jobTitle}</div>
                <div className="text-sm text-slate-600">{exp.companyName}</div>
                {exp.description ? <div className="mt-1 text-sm text-slate-700">{exp.description}</div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {cp?.educations?.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-bold text-slate-900">Học vấn</div>
          <div className="mt-3 space-y-3">
            {cp.educations.map((edu, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="font-semibold text-slate-900">{edu.schoolName}</div>
                <div className="text-sm text-slate-600">{[edu.degree, edu.major].filter(Boolean).join(' — ') || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {prevRounds.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-bold text-slate-900">Các vòng trước</div>
          <div className="mt-3 space-y-2">
            {prevRounds.map((r, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="text-sm font-semibold text-slate-900">Vòng {r.roundNo}</div>
                <div className="text-xs font-semibold text-slate-600">{r.statusName}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  const feedbackTab = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-sm font-bold text-slate-900">Feedback của bạn</div>
            <div className="mt-1 text-sm text-slate-600">
              {interview.hasMyFeedback ? 'Đã nộp feedback cho buổi này.' : canEvaluate ? 'Bạn có thể nộp feedback ngay.' : 'Chưa thể nộp feedback.'}
            </div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${flowPill}`}>{flowText}</span>
        </div>

        {interview.hasMyFeedback ? (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <div className="text-sm font-semibold text-slate-900">
              Kết luận: <span className={interview.myFeedbackRecommendation === 'HIRE' ? 'text-emerald-700' : 'text-rose-700'}>
                {interview.myFeedbackRecommendation === 'HIRE' ? 'Đạt' : 'Không đạt'}
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
              {interview.myFeedbackComment || '—'}
            </div>
          </div>
        ) : canEvaluate ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Nhận xét</label>
              <textarea
                value={feedback.comment || ''}
                onChange={(e) => setFeedback((prev) => ({ ...prev, comment: e.target.value }))}
                rows={5}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Ghi nhận xét chính của bạn về ứng viên..."
              />
            </div>

            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Kết luận</div>
              <div className="grid grid-cols-2 gap-2">
                {INTERVIEW_FEEDBACK_DECISION_OPTIONS.map((opt) => {
                  const active = feedback.decision === opt.value;
                  const positive = opt.value === 'PASS';
                  const activeClass = active
                    ? positive
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-rose-500 bg-rose-50 text-rose-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFeedback((prev) => ({ ...prev, decision: opt.value }))}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${activeClass}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={submitting || !feedback.decision}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Đang nộp...' : 'Gửi feedback'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-sm text-slate-700">
            {!myConfirmed
              ? 'Bạn cần xác nhận tham gia trước.'
              : myDeclined
                ? 'Bạn đã từ chối tham gia.'
                : `Bạn có thể nộp feedback sau khi buổi kết thúc vào ${formatDateTime(interview.endTime)}.`}
          </div>
        )}
      </div>
    </div>
  );

  const participantsTab = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-bold text-slate-900">Người tham gia ({(interview.participants || []).length})</div>
      <div className="mt-3 space-y-2">
        {(interview.participants || []).length === 0 ? (
          <div className="text-sm text-slate-600">Chưa có người tham gia</div>
        ) : (
          (interview.participants || []).map((p) => (
            <div key={p.userId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{p.userName}</div>
                <div className="text-xs text-slate-600">{p.email || '—'}</div>
              </div>
              <div className="flex items-center gap-2">
                {p.interviewRole ? (
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
                    {p.interviewRole}
                  </span>
                ) : null}
                {p.hasFeedback ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    Đã nộp
                  </span>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/staff/interviews')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Quay lại
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold text-slate-900">
                {interview.candidateName} • Vòng {interview.roundNo}
              </h1>
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                {interview.statusName || badge.label}
              </span>
            </div>
            <div className="mt-1 text-sm text-slate-600">{interview.positionTitle}</div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${flowPill}`}>{flowText}</span>
        </div>

        {blockNav}

        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-900">Lịch phỏng vấn</div>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
              <div className="grid grid-cols-12 items-baseline gap-3">
                <dt className="col-span-4 font-medium text-slate-500">Bắt đầu</dt>
                <dd className="col-span-8 text-right font-semibold text-slate-900">{formatDateTimeSafe(interview.startTime)}</dd>
              </div>
              <div className="grid grid-cols-12 items-baseline gap-3">
                <dt className="col-span-4 font-medium text-slate-500">Kết thúc</dt>
                <dd className="col-span-8 text-right font-semibold text-slate-900">{formatDateTimeSafe(interview.endTime)}</dd>
              </div>
              {interview.meetingLink ? (
                <div className="grid grid-cols-12 items-start gap-3">
                  <dt className="col-span-4 pt-0.5 font-medium text-slate-500">Link họp</dt>
                  <dd className="col-span-8 min-w-0 text-right font-semibold text-slate-900">
                    <a
                      href={interview.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="block break-all text-blue-700 underline-offset-2 hover:underline"
                    >
                      {interview.meetingLink}
                    </a>
                  </dd>
                </div>
              ) : (
                <div className="grid grid-cols-12 items-start gap-3">
                  <dt className="col-span-4 pt-0.5 font-medium text-slate-500">Địa điểm</dt>
                  <dd className="col-span-8 min-w-0 text-right font-semibold text-slate-900">
                    <span className="block break-words">{interview.location || '—'}</span>
                  </dd>
                </div>
              )}
            </dl>
          </div>
          {participationCard}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'overview' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-900">Tóm tắt</div>
            <div className="mt-2 text-sm text-slate-700">
              {interview.hasMyFeedback
                ? 'Bạn đã nộp feedback cho buổi này.'
                : myDeclined
                  ? 'Bạn đã từ chối tham gia.'
                  : !myConfirmed
                    ? 'Bạn chưa xác nhận tham gia.'
                    : canEvaluate
                      ? 'Buổi đã kết thúc và bạn có thể nộp feedback.'
                      : 'Chưa đến bước nộp feedback.'}
            </div>
          </div>
        ) : null}

        {tab === 'candidate' ? candidateTab : null}
        {tab === 'feedback' ? feedbackTab : null}
        {tab === 'participants' ? participantsTab : null}
      </div>
    </div>
  );
}