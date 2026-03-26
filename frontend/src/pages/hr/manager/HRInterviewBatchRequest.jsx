import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';
import { formatDateTime } from '../../../utils/formatters/display';

function groupInterviewsByBlock(interviews) {
  const byKey = new Map();
  for (const i of interviews) {
    const dateStr = i.startTime ? new Date(i.startTime).toDateString() : '';
    const key = `${i.positionTitle || ''}|${dateStr}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(i);
  }
  return Array.from(byKey.entries())
    .map(([key, list]) => ({
      key,
      positionTitle: list[0]?.positionTitle || '',
      dateStr: list[0]?.startTime ? new Date(list[0].startTime).toDateString() : '',
      timeStart: list.length ? new Date(Math.min(...list.map(x => new Date(x.startTime)))) : null,
      timeEnd: list.length ? new Date(Math.max(...list.map(x => new Date(x.endTime)))) : null,
      interviews: list.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    }))
    .filter(g => g.interviews.length >= 2);
}

/** Trả về true nếu có ít nhất một request trùng khớp cả block (cùng tập interview ids). */
function blockHasRequestSent(block, requestsForFirstInterview) {
  if (!Array.isArray(requestsForFirstInterview) || !block?.interviews?.length) return false;
  const blockIds = new Set(block.interviews.map((i) => i.id));
  for (const req of requestsForFirstInterview) {
    const reqIds = Array.isArray(req.interviews) ? req.interviews.map((x) => x.interviewId) : [];
    if (reqIds.length === blockIds.size && reqIds.every((id) => blockIds.has(id))) return true;
  }
  return false;
}

export default function HRInterviewBatchRequest() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [deptManagers, setDeptManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalGroup, setModalGroup] = useState(null);
  const [form, setForm] = useState({ assignedToUserId: '', requiredCount: 1, message: '' });
  /** block.key -> true nếu đã gửi yêu cầu đề cử cho block đó */
  const [blockSent, setBlockSent] = useState({});
  /** Modal gửi thông báo (địa điểm/link) cho cả block */
  const [inviteModalGroup, setInviteModalGroup] = useState(null);
  const [inviteType, setInviteType] = useState('online');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLocation, setInviteLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sentFilter, setSentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('time-asc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [data, managers] = await Promise.all([
          hrService.interviews.getAll(),
          hrService.interviews.getDeptManagers(),
        ]);
        setInterviews(Array.isArray(data) ? data : []);
        setDeptManagers(managers || []);
      } catch (err) {
        notify.error(err?.message || 'Không thể tải dữ liệu');
        if (err?.message?.includes('đăng nhập') || err?.message?.includes('quyền')) {
          setTimeout(() => navigate('/login', { replace: true }), 1500);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const blocks = groupInterviewsByBlock(interviews);

  const processedBlocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = blocks.filter((block) => {
      const sent = !!blockSent[block.key];
      if (sentFilter === 'sent' && !sent) return false;
      if (sentFilter === 'unsent' && sent) return false;
      if (!q) return true;
      const candidates = block.interviews.map((i) => i.candidateName || '').join(' ');
      const haystack = [
        block.positionTitle,
        block.dateStr,
        candidates,
        block.interviews.length ? `${block.interviews.length} buổi` : '',
        block.timeStart ? formatDateTime(block.timeStart, 'vi-VN') : '',
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });

    list = list.slice().sort((a, b) => {
      if (sortBy === 'time-desc') {
        return new Date(b.timeStart || 0) - new Date(a.timeStart || 0);
      }
      if (sortBy === 'size-desc') {
        return b.interviews.length - a.interviews.length || (new Date(a.timeStart || 0) - new Date(b.timeStart || 0));
      }
      if (sortBy === 'sent-first') {
        const sa = blockSent[a.key] ? 1 : 0;
        const sb = blockSent[b.key] ? 1 : 0;
        return sb - sa || (new Date(a.timeStart || 0) - new Date(b.timeStart || 0));
      }
      if (sortBy === 'unsent-first') {
        const sa = blockSent[a.key] ? 1 : 0;
        const sb = blockSent[b.key] ? 1 : 0;
        return sa - sb || (new Date(a.timeStart || 0) - new Date(b.timeStart || 0));
      }
      return new Date(a.timeStart || 0) - new Date(b.timeStart || 0);
    });

    return list;
  }, [blocks, blockSent, searchQuery, sentFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedBlocks.length / pageSize));
  const pagedBlocks = processedBlocks.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sentFilter, sortBy]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Khi có blocks, kiểm tra block nào đã có participant request (batch) gửi cho đúng tập interview
  useEffect(() => {
    if (!blocks.length) return;
    let cancelled = false;
    const next = {};
    (async () => {
      for (const block of blocks) {
        if (cancelled) return;
        const firstId = block.interviews[0]?.id;
        if (!firstId) continue;
        try {
          const list = await hrService.interviews.getParticipantRequests(firstId);
          const arr = Array.isArray(list) ? list : list?.data ?? [];
          next[block.key] = blockHasRequestSent(block, arr);
        } catch {
          next[block.key] = false;
        }
      }
      if (!cancelled) setBlockSent((prev) => ({ ...prev, ...next }));
    })();
    return () => { cancelled = true; };
  }, [blocks.length, blocks.map((b) => b.key).filter(Boolean).join('|')]);

  const openModal = (group) => {
    setModalGroup(group);
    setForm({ assignedToUserId: '', requiredCount: 1, message: '' });
  };

  const handleSubmit = async () => {
    if (!modalGroup) return;
    if (!form.assignedToUserId) {
      notify.warning('Vui lòng chọn trưởng phòng');
      return;
    }
    setSubmitting(true);
    try {
      await hrService.interviews.createParticipantRequestBatch({
        interviewIds: modalGroup.interviews.map(i => i.id),
        assignedToUserId: parseInt(form.assignedToUserId),
        requiredCount: form.requiredCount || 1,
        message: form.message || null,
      });
      notify.success('Đã gửi yêu cầu đề cử theo block');
      setBlockSent((prev) => ({ ...prev, [modalGroup.key]: true }));
      setModalGroup(null);
      const data = await hrService.interviews.getAll();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      notify.error(err?.message || 'Gửi yêu cầu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInvitationBatch = async () => {
    if (!inviteModalGroup) return;
    const body = {
      interviewIds: inviteModalGroup.interviews.map((i) => i.id),
      meetingLink: inviteType === 'online' ? inviteLink || undefined : undefined,
      location: inviteType === 'offline' ? inviteLocation || undefined : undefined
    };
    if (inviteType === 'online' && !body.meetingLink) {
      notify.warning('Vui lòng nhập link họp');
      return;
    }
    if (inviteType === 'offline' && !body.location) {
      notify.warning('Vui lòng nhập địa điểm');
      return;
    }
    setSubmitting(true);
    try {
      await hrService.interviews.sendInvitationBatch(body);
      notify.success('Đã gửi thông báo cho người phỏng vấn của cả block');
      setInviteModalGroup(null);
      const data = await hrService.interviews.getAll();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      notify.error(err?.message || 'Gửi thông báo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-start gap-3">
          <button
            onClick={() => navigate('/staff/hr-manager/interviews')}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← Quay lại
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gửi yêu cầu đề cử theo block</h1>
            <p className="mt-1 text-sm text-slate-600">
              Chọn block (nhiều buổi cùng vị trí, cùng ngày) và gửi một yêu cầu đến trưởng phòng; trưởng phòng sẽ đề cử người cho cả block.
            </p>
          </div>
        </div>

        {blocks.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
            Chưa có block nào (cần ít nhất 2 buổi cùng vị trí cùng ngày). Tạo nhiều buổi trong &quot;Tạo phỏng vấn&quot; trước.
          </div>
        )}

        {blocks.length > 0 && (
          <>
            <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1.2fr_180px_200px]">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm vị trí, ứng viên, ngày giờ..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <select
                  value={sentFilter}
                  onChange={(e) => setSentFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="unsent">Chưa gửi yêu cầu</option>
                  <option value="sent">Đã gửi yêu cầu</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="time-asc">Thời gian tăng dần</option>
                  <option value="time-desc">Thời gian giảm dần</option>
                  <option value="size-desc">Nhiều buổi trước</option>
                  <option value="unsent-first">Ưu tiên chưa gửi</option>
                  <option value="sent-first">Ưu tiên đã gửi</option>
                </select>
              </div>
              <div className="mt-2 text-xs text-slate-600">
                Hiển thị {processedBlocks.length} block (trên tổng {blocks.length}).
              </div>
            </div>

            {processedBlocks.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
                Không có block phù hợp với bộ lọc hiện tại.
              </div>
            )}

            <div className="flex flex-col gap-3">
              {pagedBlocks.map((block) => (
              <div key={block.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-base font-semibold text-slate-900">{block.positionTitle}</div>
                    <div className="text-sm text-slate-600">
                    {block.interviews.length} buổi · {block.timeStart && formatDateTime(block.timeStart)} → {block.timeEnd && formatDateTime(block.timeEnd)}
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs text-slate-500">
                      {block.interviews.map(i => i.candidateName || `#${i.id}`).join(', ')}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openModal(block)}
                      className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${
                        blockSent[block.key]
                          ? 'border-emerald-600 bg-white text-emerald-700 hover:bg-emerald-50'
                          : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {blockSent[block.key] ? 'Đã gửi yêu cầu · Gửi lại' : 'Gửi yêu cầu đề cử'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Gửi yêu cầu xác nhận tham gia cho ${block.interviews.length} ứng viên (mỗi buổi 1 người)?`)) return;
                        setSubmitting(true);
                        try {
                          await hrService.interviews.sendCandidateConfirmationBatch({ interviewIds: block.interviews.map((i) => i.id) });
                          notify.success('Đã gửi yêu cầu xác nhận tham gia cho ứng viên');
                          const data = await hrService.interviews.getAll();
                          setInterviews(Array.isArray(data) ? data : []);
                        } catch (err) {
                          notify.error(err?.message || 'Gửi thất bại');
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      disabled={submitting}
                      className="rounded-lg bg-green-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Gửi xác nhận cho ứng viên
                    </button>
                    <button
                      onClick={() => { setInviteModalGroup(block); setInviteLink(''); setInviteLocation(''); }}
                      className="rounded-lg border border-emerald-600 bg-white px-3.5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Gửi thông báo (địa điểm/link)
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>

            {processedBlocks.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <span className="text-xs text-slate-600">
                  Trang {page}/{totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalGroup && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => !submitting && setModalGroup(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl sm:p-6" onClick={e => e.stopPropagation()}>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">{blockSent[modalGroup?.key] ? 'Gửi lại yêu cầu đề cử' : 'Gửi yêu cầu đề cử'} cho block</h3>
            <p className="mb-4 text-sm text-slate-600">{modalGroup.interviews.length} buổi · {modalGroup.positionTitle}</p>
            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-medium text-slate-800">Trưởng phòng <span className="text-red-600">*</span></label>
              <select
                value={form.assignedToUserId}
                onChange={e => setForm(f => ({ ...f, assignedToUserId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">— Chọn trưởng phòng ban —</option>
                {deptManagers.map(m => (
                  <option key={m.id} value={m.id}>{m.fullName}{m.departmentName ? ` — ${m.departmentName}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-medium text-slate-800">Số lượng người cần</label>
              <input type="number" min={1} value={form.requiredCount} onChange={e => setForm(f => ({ ...f, requiredCount: parseInt(e.target.value, 10) || 1 }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-slate-800">Tin nhắn (tùy chọn)</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2} className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" placeholder="Ghi chú cho trưởng phòng" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalGroup(null)} disabled={submitting} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">Hủy</button>
              <button type="button" onClick={handleSubmit} disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>
            </div>
          </div>
        </div>
      )}

      {inviteModalGroup && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => !submitting && setInviteModalGroup(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl sm:p-6" onClick={e => e.stopPropagation()}>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Gửi thông báo (địa điểm/link) cho người phỏng vấn</h3>
            <p className="mb-4 text-sm text-slate-600">{inviteModalGroup.interviews.length} buổi · {inviteModalGroup.positionTitle}. Chỉ gửi cho interviewer, không gửi ứng viên.</p>
            <div className="mb-3 flex gap-5">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="inviteTypeBatch" checked={inviteType === 'online'} onChange={() => setInviteType('online')} />
                <span>Online</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="inviteTypeBatch" checked={inviteType === 'offline'} onChange={() => setInviteType('offline')} />
                <span>Offline</span>
              </label>
            </div>
            {inviteType === 'online' ? (
              <input type="url" placeholder="Link họp (Meet, Zoom...)" value={inviteLink} onChange={e => setInviteLink(e.target.value)} className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
            ) : (
              <input type="text" placeholder="Địa điểm phỏng vấn" value={inviteLocation} onChange={e => setInviteLocation(e.target.value)} className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setInviteModalGroup(null)} disabled={submitting} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">Hủy</button>
              <button type="button" onClick={handleSendInvitationBatch} disabled={submitting || (inviteType === 'online' ? !inviteLink?.trim() : !inviteLocation?.trim())} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Đang gửi...' : 'Gửi thông báo'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
