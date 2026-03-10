import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { formatCurrency } from '../../../utils/formatters/display';
import notify from '../../../utils/notification';

export default function EditJobPosting() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobPosting, setJobPosting] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    salaryMin: '',
    salaryMax: '',
    location: '',
    deadline: ''
  });

  useEffect(() => {
    loadJobPosting();
  }, [id]);

  const loadJobPosting = async () => {
    try {
      setLoading(true);
      const data = await hrService.jobPostings.getById(id);
      setJobPosting(data);
      
      setFormData({
        title: data.positionTitle,
        description: data.description && data.description !== data.title ? data.description : '',
        requirements: data.requirements || '',
        benefits: data.benefits || '',
        salaryMin: data.salaryMin || '',
        salaryMax: data.salaryMax || '',
        location: data.location || '',
        deadline: data.deadline || ''
      });
    } catch (error) {
      console.error('Failed to load job posting:', error);
      notify.error('Không thể tải thông tin tin tuyển dụng');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        benefits: formData.benefits,
        salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
        location: formData.location,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
      };

      await hrService.jobPostings.update(id, payload);
      notify.success('Cập nhật tin tuyển dụng thành công!');
      navigate('/staff/hr-staff/job-postings');
    } catch (error) {
      console.error('Failed to update job posting:', error);
      notify.error('Cập nhật tin tuyển dụng thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!jobPosting) return <div style={{ padding: 24 }}>Job Posting not found</div>;

  if (jobPosting.statusId === 8) {
    return (
      <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>
              Cannot Edit This Job Posting
            </h2>
            <p style={{ color: '#78350f', marginBottom: 16 }}>
              Job posting đã <strong>Đóng</strong> không thể chỉnh sửa. Trạng thái hiện tại: <strong>{jobPosting.currentStatus}</strong>
            </p>
            <button
              onClick={() => navigate('/staff/hr-staff/job-postings')}
              style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Edit Job Posting</h1>
        
        <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Original Info</h3>
            <p><strong>Status:</strong> {jobPosting.currentStatus}</p>
            <p><strong>Position:</strong> {jobPosting.positionTitle}</p>
            <p><strong>Department:</strong> {jobPosting.departmentName}</p>
            {jobPosting.jdFileUrl && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontWeight: 500, marginBottom: 8 }}>Ảnh JD từ phòng ban:</p>
                {jobPosting.jdFileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={`/api/files/jd/${jobPosting.jobRequestId}`}
                    alt="JD"
                    style={{ maxWidth: '100%', borderRadius: 6, border: '1px solid #d1d5db' }}
                  />
                ) : (
                  <a href={`/api/files/jd/${jobPosting.jobRequestId}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                    Xem file JD đính kèm
                  </a>
                )}
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                  Ảnh này tự động hiển thị cho ứng viên xem trong tin tuyển dụng.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Job Title</label>
              <div style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, backgroundColor: '#f9fafb', color: '#374151', fontWeight: 600 }}>
                {formData.title}
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Tự động lấy từ vị trí tuyển dụng</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Salary Min</label>
                <input
                  type="number"
                  name="salaryMin"
                  value={formData.salaryMin}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Salary Max</label>
                <input
                  type="number"
                  name="salaryMax"
                  value={formData.salaryMax}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline ? formData.deadline.split('T')[0] : ''}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Mô tả công việc</label>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Ảnh JD từ phòng ban hiển thị cho ứng viên xem. Bổ sung thêm mô tả text nếu cần.</p>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Ví dụ: Chúng tôi tìm kiếm ứng viên có kinh nghiệm..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Requirements</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={4}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Benefits</label>
              <textarea
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                rows={4}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => navigate('/staff/hr-staff/job-postings')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
