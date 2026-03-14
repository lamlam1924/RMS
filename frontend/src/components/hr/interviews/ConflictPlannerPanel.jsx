import React, { useState } from 'react';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';
import { formatDateTimeVi, parseIdList, toDateInputValue } from '../../../utils/helpers/interviewPhase';
import InterviewSection from './InterviewSection';

export default function ConflictPlannerPanel({ form, setForm, onConflictResultChange }) {
  const [checking, setChecking] = useState(false);
  const [findingSlots, setFindingSlots] = useState(false);
  const [conflictResult, setConflictResult] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);

  const interviewerIds = parseIdList(form.interviewerIds);

  const buildConflictPayload = () => ({
    applicationId: Number(form.applicationId),
    interviewerIds,
    startTime: form.startTime,
    endTime: form.endTime
  });

  const handleCheckConflicts = async () => {
    if (!form.applicationId || !form.startTime || !form.endTime) {
      notify.warning('Cần chọn application và thời gian trước khi kiểm tra conflict');
      return;
    }

    setChecking(true);
    try {
      const result = await hrService.interviews.checkConflicts(buildConflictPayload());
      setConflictResult(result);
      onConflictResultChange?.(result);
      notify.success(result.hasConflicts ? 'Đã kiểm tra conflict' : 'Không có conflict');
    } catch (error) {
      notify.error(error.message || 'Không thể kiểm tra conflict');
    } finally {
      setChecking(false);
    }
  };

  const handleFindSlots = async () => {
    if (!form.startTime || !form.endTime) {
      notify.warning('Cần chọn thời gian dự kiến để gợi ý slot');
      return;
    }

    if (interviewerIds.length === 0) {
      notify.warning('Nhập ít nhất 1 interviewer ID để tìm slot trống');
      return;
    }

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    const durationMinutes = Math.max(30, Math.round((end - start) / 60000));
    const dateFrom = new Date(start);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(start);
    dateTo.setHours(23, 59, 59, 999);

    setFindingSlots(true);
    try {
      const slots = await hrService.interviews.findAvailableSlots({
        interviewerIds,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        durationMinutes
      });
      setAvailableSlots(Array.isArray(slots) ? slots.slice(0, 6) : []);
      if (!slots?.length) {
        notify.warning('Không tìm thấy slot phù hợp trong ngày đã chọn');
      }
    } catch (error) {
      notify.error(error.message || 'Không thể tìm slot trống');
    } finally {
      setFindingSlots(false);
    }
  };

  const applySlot = (slot) => {
    setForm((current) => ({
      ...current,
      startTime: toDateInputValue(slot.startTime),
      endTime: toDateInputValue(slot.endTime)
    }));
    notify.success('Đã áp dụng khung giờ gợi ý');
  };

  return (
    <InterviewSection
      step="Bước 2"
      title="Kiểm tra lịch và người phỏng vấn"
      description="Nhập danh sách interviewer để rà conflict và lấy gợi ý khung giờ phù hợp trước khi tạo lịch."
      tone="muted"
    >

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Interviewer IDs</label>
        <input
          type="text"
          value={form.interviewerIds}
          onChange={(e) => setForm((current) => ({ ...current, interviewerIds: e.target.value }))}
          placeholder="Ví dụ: 12, 18, 24"
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
        />
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Danh sách này dùng để kiểm tra lịch trùng và gợi ý slot trước khi tạo interview.</div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <button
          type="button"
          onClick={handleCheckConflicts}
          disabled={checking}
          style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #2563eb', backgroundColor: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontWeight: 600 }}
        >
          {checking ? 'Đang kiểm tra...' : 'Kiểm tra conflict'}
        </button>
        <button
          type="button"
          onClick={handleFindSlots}
          disabled={findingSlots}
          style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #0f766e', backgroundColor: '#ecfeff', color: '#0f766e', cursor: 'pointer', fontWeight: 600 }}
        >
          {findingSlots ? 'Đang tìm...' : 'Gợi ý slot trống'}
        </button>
      </div>

      {conflictResult && (
        <div style={{ marginBottom: 12, padding: 12, backgroundColor: conflictResult.hasConflicts ? '#fff7ed' : '#ecfdf5', border: `1px solid ${conflictResult.hasConflicts ? '#fdba74' : '#86efac'}`, borderRadius: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#111827' }}>
            {conflictResult.hasConflicts ? 'Có conflict được phát hiện' : 'Không có conflict'}
          </div>
          {conflictResult.conflicts?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {conflictResult.conflicts.map((item, index) => (
                <div key={`${item.conflictingInterviewId}-${item.userId}-${index}`} style={{ fontSize: 13, color: '#374151' }}>
                  <strong>{item.conflictType}</strong>: {item.userName} • {item.candidateName} • {formatDateTimeVi(item.conflictStart)} - {formatDateTimeVi(item.conflictEnd)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {availableSlots.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#0f172a' }}>Slot gợi ý</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {availableSlots.map((slot, index) => (
              <div key={`${slot.startTime}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 10, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{formatDateTimeVi(slot.startTime)} - {formatDateTimeVi(slot.endTime)}</div>
                  <div style={{ color: '#64748b' }}>Khả dụng: {slot.availableInterviewerIds.join(', ') || '—'} • Conflict: {slot.conflictCount}</div>
                </div>
                <button
                  type="button"
                  onClick={() => applySlot(slot)}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Dùng slot này
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </InterviewSection>
  );
}
