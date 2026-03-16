import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { candidateService } from '../../services/candidateService';
import notify from '../../utils/notification';
import { formatDateTime } from '../../utils/formatters/display';

const STATUS_MAP = {
  SCHEDULED: { label: 'Đã lên lịch', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  RESCHEDULED: { label: 'Đổi lịch', color: '#92400e', bg: '#fffbeb', border: '#fcd34d' },
  COMPLETED: { label: 'Đã hoàn thành', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  CANCELLED: { label: 'Đã huỷ', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  DECLINED_BY_CANDIDATE: { label: 'Đã từ chối', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  NO_SHOW: { label: 'Vắng mặt', color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' },
};

const PREV_ROUND_STATUS = {
  COMPLETED: { icon: '✓', color: '#16a34a' },
  CANCELLED: { icon: '✕', color: '#dc2626' },
  NO_SHOW: { icon: '—', color: '#9ca3af' },
  SCHEDULED: { icon: '○', color: '#1d4ed8' },
  CONFIRMED: { icon: '○', color: '#1d4ed8' },
};

function SectionCard({ title, children, style }) {
  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 14, ...style }}>
      {title && <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</h3>}
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 12, color: '#6b7280', minWidth: 90, flexShrink: 0, paddingTop: 2 }}>{label}</span>
      <span style={{ fontSize: 14, color: '#111827', lineHeight: 1.5 }}>{value}</span>
    </div>
  );
}

export default function CandidateInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => { loadDetail(); }, [id]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await candidateService.getInterviewDetail(id);
      setInterview(data);
    } catch (err) {
      notify.error(err.message || 'Không thể tải chi tiết phỏng vấn');
      navigate('/app/interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (response) => {
    let note;
    if (response === 'DECLINE') {
      const value = window.prompt('Ghi chú từ chối (tùy chọn, vd. muốn đổi ngày khác) để HR thương lượng:');
      if (value === null) return;
      note = (value || '').trim() || undefined;
    }
    setResponding(true);
    try {
      await candidateService.respondInterview(id, response, note);
      notify.success(response === 'CONFIRM' ? 'Đã xác nhận tham dự phỏng vấn' : 'Đã từ chối lịch phỏng vấn');
      await loadDetail();
    } catch (err) {
      notify.error(err.message || 'Thao tác thất bại');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: 14 }}>Đang tải...</div>
      </div>
    );
  }

  if (!interview) return null;

  const status = STATUS_MAP[interview.statusCode] || { label: interview.statusName, color: '#475569', bg: '#f8fafc', border: '#e5e7eb' };
  const canRespond = ['SCHEDULED', 'RESCHEDULED'].includes(interview.statusCode);
  const isDeclined = interview.statusCode === 'DECLINED_BY_CANDIDATE';

  return (
    <div style={{ padding: '20px 16px', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => navigate('/app/interviews')}
            style={{ fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← Quay lại danh sách
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
                {interview.positionTitle}
              </h1>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {interview.departmentName} · Vòng {interview.roundNo}
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: `1px solid ${status.border}`, backgroundColor: status.bg, color: status.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Thời gian & Địa điểm */}
        <SectionCard title="Thời gian & Địa điểm">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <InfoRow label="Bắt đầu" value={formatDateTime(interview.startTime, 'vi-VN')} />
            <InfoRow label="Kết thúc" value={formatDateTime(interview.endTime, 'vi-VN')} />
          </div>
          <InfoRow label="Địa điểm" value={interview.location || '—'} />
          {interview.meetingLink && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 12, color: '#6b7280', minWidth: 90, flexShrink: 0, paddingTop: 2 }}>Link họp</span>
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 14, color: '#2563eb', wordBreak: 'break-all' }}
              >
                {interview.meetingLink}
              </a>
            </div>
          )}
        </SectionCard>

        {/* Ban phỏng vấn */}
        {interview.participants?.length > 0 && (
          <SectionCard title="Ban phỏng vấn">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {interview.participants.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{p.fullName}</span>
                  <span style={{ fontSize: 11, color: '#6b7280', padding: '2px 8px', backgroundColor: '#e5e7eb', borderRadius: 10 }}>{p.role}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Lịch sử vòng trước */}
        {interview.previousRounds?.length > 0 && (
          <SectionCard title="Các vòng trước">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {interview.previousRounds.map((round) => {
                const rs = PREV_ROUND_STATUS[round.statusCode] || { icon: '○', color: '#94a3b8' };
                return (
                  <div key={round.roundNo} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: rs.color, width: 20, textAlign: 'center', flexShrink: 0 }}>{rs.icon}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Vòng {round.roundNo}</span>
                      <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{formatDateTime(round.startTime, 'vi-VN')}</span>
                    </div>
                    <span style={{ fontSize: 11, color: rs.color, fontWeight: 600 }}>{round.statusName}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Hành động */}
        {canRespond && (
          <SectionCard style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
            {interview.statusCode === 'RESCHEDULED' && (
              <div style={{ fontSize: 13, color: '#92400e', marginBottom: 12, padding: '8px 12px', backgroundColor: '#fffbeb', borderRadius: 6, border: '1px solid #fcd34d', fontWeight: 600 }}>
                Lịch đã được cập nhật, vui lòng xác nhận lại tham gia.
              </div>
            )}
            <div style={{ fontSize: 14, color: '#0c4a6e', marginBottom: 14, lineHeight: 1.6 }}>
              Vui lòng xác nhận hoặc từ chối lịch phỏng vấn này để HR có thể chuẩn bị tốt hơn cho buổi phỏng vấn.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleRespond('CONFIRM')}
                disabled={responding}
                style={{ padding: '10px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: responding ? 0.7 : 1 }}
              >
                ✓ Xác nhận tham dự
              </button>
              <button
                onClick={() => handleRespond('DECLINE')}
                disabled={responding}
                style={{ padding: '10px 24px', backgroundColor: 'white', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: responding ? 0.7 : 1 }}
              >
                Từ chối
              </button>
            </div>
          </SectionCard>
        )}

        {interview.statusCode === 'CONFIRMED' && (
          <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
            ✓ Bạn đã xác nhận tham dự. Hẹn gặp bạn tại buổi phỏng vấn!
          </div>
        )}
        {isDeclined && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
            Bạn đã từ chối lịch phỏng vấn này. Nếu cần hỗ trợ, vui lòng liên hệ HR.
          </div>
        )}
      </div>
    </div>
  );
}
