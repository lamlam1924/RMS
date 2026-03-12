import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';

export default function HRInterviewCreate() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    applicationId: '',
    startTime: '',
    endTime: '',
    location: '',
    meetingLink: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await hrService.applications.getAll();
        setApplications(data);
      } catch {
        notify.error('Không thể tải danh sách ứng viên');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.applicationId) { notify.warning('Vui lòng chọn đơn ứng tuyển'); return; }
    if (!form.startTime || !form.endTime) { notify.warning('Vui lòng nhập thời gian phỏng vấn'); return; }
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      notify.warning('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    setSubmitting(true);
    try {
      const result = await hrService.interviews.create({
        applicationId: parseInt(form.applicationId),
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location || null,
        meetingLink: form.meetingLink || null,
        participants: []
      });
      notify.success('Tạo phỏng vấn thành công');
      if (result?.data?.id) {
        navigate(`/staff/hr-manager/interviews/${result.data.id}`);
      } else {
        navigate('/staff/hr-manager/interviews');
      }
    } catch (err) {
      notify.error(err.message || 'Tạo phỏng vấn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => navigate('/staff/hr-manager/interviews')}
            style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}
          >
            ← Quay lại
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Tạo Phỏng vấn Mới</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>Thông tin cơ bản</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                Đơn ứng tuyển <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={form.applicationId}
                onChange={e => setForm(f => ({ ...f, applicationId: e.target.value }))}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
              >
                <option value="">— Chọn đơn ứng tuyển —</option>
                {applications.map(app => (
                  <option key={app.id} value={app.id}>
                    #{app.id} – {app.candidateName} | {app.positionTitle} | {app.departmentName} | {app.currentStatus}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Bắt đầu <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Kết thúc <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Địa điểm</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="VD: Phòng họp A3, Tầng 5"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Link họp trực tuyến</label>
              <input
                type="url"
                value={form.meetingLink}
                onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))}
                placeholder="https://meet.google.com/..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 14, marginBottom: 20, fontSize: 13, color: '#92400e' }}>
            💡 Sau khi tạo, bạn có thể gửi yêu cầu đề cử người phỏng vấn đến trưởng phòng ban từ trang chi tiết.
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/staff/hr-manager/interviews')}
              style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '10px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Đang tạo...' : 'Tạo Phỏng vấn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
