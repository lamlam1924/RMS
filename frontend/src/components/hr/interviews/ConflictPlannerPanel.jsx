import React from 'react';
import InterviewSection from './InterviewSection';

function formatSlot(dt) {
  const d = new Date(dt);
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

export default function ConflictPlannerPanel({ form, setForm, slotsPreview = [], selectedCount = 0, slotCandidates = [] }) {
  const multi = selectedCount > 1;

  return (
    <InterviewSection
      step="Bước 2"
      title="Thời gian phỏng vấn"
      description={
        multi
          ? 'Mỗi ứng viên một slot riêng, nối tiếp. Thứ tự slot: đơn nộp trước → slot trước. Chọn giờ bắt đầu, độ dài mỗi buổi và nghỉ giữa; xem "Kết thúc dự kiến" bên dưới để chọn trong phạm vi giờ hợp lý.'
          : 'Chọn thời gian bắt đầu và độ dài buổi phỏng vấn.'
      }
      tone="muted"
    >
      <div style={{ display: 'grid', gridTemplateColumns: multi ? '1fr 1fr 1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
            Bắt đầu buổi đầu <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => setForm((c) => ({ ...c, startTime: e.target.value }))}
            required
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
            Độ dài mỗi buổi (phút) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="number"
            min={10}
            max={240}
            value={form.durationMinutes ?? 30}
            onChange={(e) => setForm((c) => ({ ...c, durationMinutes: parseInt(e.target.value, 10) || 30 }))}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>VD: 30</div>
        </div>
        {multi && (
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
              Nghỉ giữa các buổi (phút)
            </label>
            <input
              type="number"
              min={0}
              max={60}
              value={form.breakMinutes ?? 5}
              onChange={(e) => setForm((c) => ({ ...c, breakMinutes: parseInt(e.target.value, 10) || 0 }))}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>VD: 5</div>
          </div>
        )}
      </div>

      {slotsPreview.length > 0 && (
        <div style={{ padding: 12, backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13 }}>
          {multi ? (
            <>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#166534' }}>
                Sẽ tạo {slotsPreview.length} buổi nối tiếp (thứ tự theo đơn nộp trước):
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#15803d' }}>
                {slotsPreview.map((slot, i) => {
                  const name = slotCandidates[i]?.candidateName;
                  return (
                    <li key={i}>
                      Buổi {i + 1}:{name ? ` ${name} — ` : ' '}
                      {formatSlot(slot.start)} → {formatSlot(slot.end)}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #86efac', fontWeight: 600, color: '#166534' }}>
            Kết thúc dự kiến (buổi cuối): {formatSlot(slotsPreview[slotsPreview.length - 1].end)}
          </div>
        </div>
      )}
    </InterviewSection>
  );
}
