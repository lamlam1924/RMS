import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';

export default function HROfferCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const [candidates, setCandidates] = useState([]);
  const [jobRequests, setJobRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    candidateId: searchParams.get('candidateId') || '',
    jobRequestId: searchParams.get('jobRequestId') || '',
    salary: '',
    benefits: '',
    startDate: ''
  });
  const isFromApplication = Boolean(applicationId);

  const formatCurrencyInput = (rawValue) => {
    const digits = String(rawValue || '').replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('vi-VN').format(Number(digits));
  };

  const parseCurrencyInput = (formattedValue) => {
    return String(formattedValue || '').replace(/\D/g, '');
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const cId = searchParams.get('candidateId');
    const jId = searchParams.get('jobRequestId');
    if (cId || jId) {
      setForm(prev => ({
        ...prev,
        candidateId: cId || prev.candidateId,
        jobRequestId: jId || prev.jobRequestId
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (applicationId) {
      hrService.applications.getById(applicationId)
        .then(app => {
          setForm(prev => ({
            ...prev,
            candidateId: String(app.candidateId || prev.candidateId),
            jobRequestId: String(app.jobRequestId || prev.jobRequestId),
            salary: app.expectedSalary ? String(app.expectedSalary) : prev.salary
          }));
        })
        .catch(() => {});
    }
  }, [applicationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cands, jobs] = await Promise.all([
        hrService.candidates.getList(),
        hrService.jobRequests.getByStatus('APPROVED')
      ]);
      setCandidates(cands);
      setJobRequests(jobs);
    } catch (err) {
      notify.error(err.message || 'Không thể tải dữ liệu');
      navigate('/staff/hr-manager/offers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const candidateId = parseInt(form.candidateId, 10);
    const jobRequestId = parseInt(form.jobRequestId, 10);
    const salary = parseFloat(form.salary);

    if (!candidateId || !jobRequestId || !salary || salary <= 0) {
      notify.error('Vui lòng chọn ứng viên, vị trí và nhập mức lương hợp lệ');
      return;
    }

    const selectedJobRequest = jobRequests.find(j => String(j.id) === String(jobRequestId));
    const maxInterviewSalary = selectedJobRequest?.budget ? Number(selectedJobRequest.budget) : null;
    if (maxInterviewSalary && salary > maxInterviewSalary) {
      notify.error(`Mức lương không được vượt quá mức tối đa phỏng vấn: ${maxInterviewSalary.toLocaleString('vi-VN')} VNĐ`);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        candidateId,
        jobRequestId,
        salary,
        benefits: form.benefits || undefined,
        startDate: form.startDate || undefined
      };
      if (applicationId) payload.applicationId = parseInt(applicationId, 10);
      await hrService.offers.create(payload);
      notify.success('Tạo thư mời thành công');
      if (applicationId) {
        navigate(`/staff/hr-manager/applications/${applicationId}`);
      } else {
        navigate('/staff/hr-manager/offers');
      }
    } catch (err) {
      notify.error(err.message || 'Tạo thư mời thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>
    );
  }

  const candidateOptions = isFromApplication
    ? candidates.filter(c => String(c.id) === String(form.candidateId))
    : candidates;

  const jobRequestOptions = isFromApplication
    ? jobRequests.filter(j => String(j.id) === String(form.jobRequestId))
    : jobRequests;
  const selectedJobRequest = jobRequests.find(j => String(j.id) === String(form.jobRequestId));
  const maxInterviewSalary = selectedJobRequest?.budget ? Number(selectedJobRequest.budget) : null;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/staff/hr-manager/offers')}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            background: 'white',
            cursor: 'pointer',
            marginBottom: 16
          }}
        >
          ← Quay lại
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>Tạo thư mời nhận việc</h1>
        <p style={{ color: '#6b7280', marginTop: 8 }}>
          {isFromApplication
            ? 'Tạo offer theo hồ sơ ứng tuyển đã chọn (không cho đổi ứng viên/vị trí).'
            : 'Chọn ứng viên và vị trí tuyển dụng để gửi thư mời (ứng viên không cần nộp CV)'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        maxWidth: 560
      }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Ứng viên *</label>
          <select
            name="candidateId"
            value={form.candidateId}
            onChange={handleChange}
            disabled={isFromApplication}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              backgroundColor: isFromApplication ? '#f3f4f6' : 'white',
              cursor: isFromApplication ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">-- Chọn ứng viên --</option>
            {candidateOptions.map(c => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.email})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Vị trí tuyển dụng *</label>
          <select
            name="jobRequestId"
            value={form.jobRequestId}
            onChange={handleChange}
            disabled={isFromApplication}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              backgroundColor: isFromApplication ? '#f3f4f6' : 'white',
              cursor: isFromApplication ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">-- Chọn vị trí --</option>
            {jobRequestOptions.map(j => (
              <option key={j.id} value={j.id}>
                {j.positionTitle} - {j.departmentName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Mức lương (VNĐ) *</label>
          <input
            type="text"
            name="salary"
            value={formatCurrencyInput(form.salary)}
            onChange={(e) => {
              const raw = parseCurrencyInput(e.target.value);
              setForm(prev => ({ ...prev, salary: raw }));
            }}
            placeholder="VD: 15.000.000"
            inputMode="numeric"
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6
            }}
          />
          {maxInterviewSalary && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
              Mức tối đa theo phỏng vấn/vị trí: {maxInterviewSalary.toLocaleString('vi-VN')} VNĐ
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Ngày bắt đầu</label>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Quyền lợi</label>
          <textarea
            name="benefits"
            value={form.benefits}
            onChange={handleChange}
            placeholder="Bảo hiểm, nghỉ phép..."
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            {submitting ? 'Đang tạo...' : 'Tạo thư mời'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/staff/hr-manager/offers')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Huỷ
          </button>
        </div>
      </form>
    </div>
  );
}
