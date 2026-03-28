import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { formatVND, parseVND } from '../../../utils/formatters/currency';
import notify from '../../../utils/notification';

export default function CreateJobPosting() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobRequestId = searchParams.get('jobRequestId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobRequest, setJobRequest] = useState(null);

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

  const [templateSelection, setTemplateSelection] = useState({
    description: '',
    requirements: '',
    benefits: ''
  });

  const templateOptions = {
    description: [
      {
        id: 'desc_it_general',
        label: 'Mẫu IT tổng quan',
        value:
          'Chúng tôi tìm kiếm ứng viên có kinh nghiệm thực chiến, tư duy giải quyết vấn đề và khả năng phối hợp tốt với các phòng ban. Bạn sẽ tham gia xây dựng, vận hành và tối ưu sản phẩm theo mục tiêu kinh doanh của công ty.'
      },
      {
        id: 'desc_backend',
        label: 'Mẫu Lập trình viên Backend',
        value:
          'Bạn sẽ tham gia thiết kế và phát triển hệ thống backend hiệu năng cao, xây dựng API, tối ưu truy vấn CSDL và đảm bảo tính ổn định khi vận hành. Vị trí yêu cầu phối hợp chặt chẽ với Frontend, QA và DevOps.'
      },
      {
        id: 'desc_frontend',
        label: 'Mẫu Lập trình viên Frontend',
        value:
          'Bạn sẽ phát triển giao diện web hiện đại, tối ưu trải nghiệm người dùng và hiệu năng ứng dụng. Vị trí cần khả năng làm việc với API, xử lý trạng thái và bảo đảm tương thích trên nhiều trình duyệt/thiết bị.'
      }
    ],
    requirements: [
      {
        id: 'req_standard',
        label: 'Mẫu yêu cầu cơ bản',
        value:
          '- Tốt nghiệp Đại học/Cao đẳng chuyên ngành CNTT hoặc liên quan\n- Từ 1-2 năm kinh nghiệm ở vị trí tương đương\n- Khả năng tự học, giải quyết vấn đề và giao tiếp tốt\n- Có tinh thần trách nhiệm, chủ động và hợp tác'
      },
      {
        id: 'req_backend',
        label: 'Mẫu yêu cầu Backend',
        value:
          '- Thành thạo ít nhất 1 ngôn ngữ backend (C#, Java, Node.js,...)\n- Có kinh nghiệm làm việc với REST API và CSDL quan hệ\n- Hiểu về cache, queue, logging và monitoring là lợi thế\n- Ưu tiên ứng viên có kinh nghiệm microservices/cloud'
      },
      {
        id: 'req_frontend',
        label: 'Mẫu yêu cầu Frontend',
        value:
          '- Thành thạo HTML, CSS, JavaScript/TypeScript\n- Có kinh nghiệm với React/Vue/Angular\n- Hiểu về responsive UI, performance và accessibility\n- Có kinh nghiệm làm việc với REST API/Git là bắt buộc'
      }
    ],
    benefits: [
      {
        id: 'ben_standard',
        label: 'Mẫu phúc lợi cơ bản',
        value:
          '- Thu nhập cạnh tranh theo năng lực\n- Thưởng hiệu suất và thưởng dự án\n- Đầy đủ BHXH, BHYT, BHTN theo quy định\n- Môi trường làm việc trẻ trung, hỗ trợ phát triển'
      },
      {
        id: 'ben_it',
        label: 'Mẫu phúc lợi IT',
        value:
          '- Cấp laptop/thiết bị phục vụ công việc\n- Hỗ trợ học tập, thi chứng chỉ chuyên môn\n- Cơ hội tham gia dự án lớn, công nghệ mới\n- Hybrid/remote linh hoạt (theo chính sách công ty)'
      },
      {
        id: 'ben_senior',
        label: 'Mẫu phúc lợi cấp cao',
        value:
          '- Gói lương và thưởng cạnh tranh theo cấp bậc\n- Cơ hội dẫn dắt nhóm và mentoring\n- Lộ trình phát triển nghề nghiệp rõ ràng\n- Được tham gia quyết định kỹ thuật quan trọng'
      }
    ]
  };

  const todayString = new Date().toISOString().split('T')[0];

  const formatVNDLabel = (value) => {
    if (value === null || value === undefined || value === '') return 'Không có';
    return `${formatVND(value)} VND`;
  };

  useEffect(() => {
    if (jobRequestId) {
      loadJobRequest();
    }
  }, [jobRequestId]);

  const loadJobRequest = async () => {
    try {
      setLoading(true);
      const data = await hrService.jobRequests.getById(jobRequestId);
      setJobRequest(data);
      
      // Pre-fill form
      setFormData({
        title: data.positionTitle,
        description: '',
        requirements: '',
        benefits: '',
        salaryMin: data.budget ? data.budget * 0.8 : '',
        salaryMax: data.budget || '',
        location: 'Trụ sở chính',
        deadline: data.deadlineDate || ''
      });
    } catch (error) {
      console.error('Không thể tải yêu cầu tuyển dụng:', error);
      notify.error('Không thể tải thông tin yêu cầu tuyển dụng');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'salaryMin' || name === 'salaryMax') {
      const numericValue = parseVND(String(value || ''));
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyTemplate = (field, templateId) => {
    if (!templateId) return;

    const selectedTemplate = (templateOptions[field] || []).find((item) => item.id === templateId);
    if (!selectedTemplate) return;

    setFormData((prev) => {
      const currentText = (prev[field] || '').trim();
      const nextText = currentText
        ? `${currentText}\n\n${selectedTemplate.value}`
        : selectedTemplate.value;

      return {
        ...prev,
        [field]: nextText
      };
    });

    setTemplateSelection((prev) => ({
      ...prev,
      [field]: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.deadline) {
      notify.warning('Vui lòng chọn hạn nộp hồ sơ');
      return;
    }

    if (formData.deadline < todayString) {
      notify.warning('Hạn nộp hồ sơ không được ở quá khứ');
      return;
    }

    const requestDeadline = (jobRequest?.deadlineDate || '').split('T')[0];
    if (requestDeadline && formData.deadline > requestDeadline) {
      notify.warning('Hạn nộp của Job Posting không được sau hạn của Job Request');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        jobRequestId: parseInt(jobRequestId),
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        benefits: formData.benefits,
        salaryMin: parseFloat(formData.salaryMin),
        salaryMax: parseFloat(formData.salaryMax),
        location: formData.location,
        deadline: formData.deadline ? `${formData.deadline}T00:00:00` : null
      };

      await hrService.jobPostings.create(payload);
      notify.success('Tạo tin tuyển dụng thành công! Tin đang ở trạng thái Nháp');
      navigate('/staff/hr-staff/job-postings');
    } catch (error) {
      console.error('Không thể tạo tin tuyển dụng:', error);
      notify.error('Không thể tạo tin: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;
  if (!jobRequest) return <div style={{ padding: 24 }}>Không tìm thấy yêu cầu tuyển dụng</div>;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Tạo tin tuyển dụng</h1>
        
        <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Yêu cầu nguồn</h3>
            <p><strong>Vị trí:</strong> {jobRequest.positionTitle}</p>
            <p><strong>Phòng ban:</strong> {jobRequest.departmentName}</p>
            <p><strong>Số lượng:</strong> {jobRequest.quantity}</p>
            <p><strong>Ngân sách:</strong> {formatVNDLabel(jobRequest.budget)}</p>
            {jobRequest.jdFileUrl && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontWeight: 500, marginBottom: 8 }}>Ảnh JD từ phòng ban:</p>
                {jobRequest.jdFileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={`/api/files/jd/${jobRequest.id}`}
                    alt="JD"
                    style={{ maxWidth: '100%', borderRadius: 6, border: '1px solid #d1d5db' }}
                  />
                ) : (
                  <a href={`/api/files/jd/${jobRequest.id}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                    Xem file JD đính kèm
                  </a>
                )}
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                  Ảnh này sẽ tự động được đính kèm vào tin tuyển dụng để ứng viên xem.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Tiêu đề tuyển dụng
              </label>
              <div style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, backgroundColor: '#f9fafb', color: '#374151', fontWeight: 600 }}>
                {formData.title}
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Tự động lấy từ vị trí tuyển dụng</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Lương tối thiểu (VND)</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="salaryMin"
                    value={formatVND(formData.salaryMin)}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: 'none', outline: 'none', borderRadius: 6 }}
                  />
                  <span style={{ padding: '0 12px', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>VND</span>
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                  {formatVNDLabel(formData.salaryMin)}
                </p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Lương tối đa (VND)</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="salaryMax"
                    value={formatVND(formData.salaryMax)}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: 'none', outline: 'none', borderRadius: 6 }}
                  />
                  <span style={{ padding: '0 12px', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>VND</span>
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                  {formatVNDLabel(formData.salaryMax)}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Địa điểm làm việc</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Hạn nộp hồ sơ</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline ? formData.deadline.split('T')[0] : ''}
                  onChange={handleChange}
                  min={todayString}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Mô tả công việc</label>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                Ảnh JD từ phòng ban sẽ hiển thị phía trên. Bạn có thể bổ sung thêm mô tả text ở đây (không bắt buộc).
              </p>
              <div style={{ marginBottom: 8 }}>
                <select
                  value={templateSelection.description}
                  onChange={(e) => {
                    const templateId = e.target.value;
                    setTemplateSelection((prev) => ({ ...prev, description: templateId }));
                    handleApplyTemplate('description', templateId);
                  }}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: '#f9fafb', fontSize: 13 }}
                >
                  <option value="">-- Chọn mẫu mô tả công việc --</option>
                  {templateOptions.description.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </div>
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
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Yêu cầu</label>
              <div style={{ marginBottom: 8 }}>
                <select
                  value={templateSelection.requirements}
                  onChange={(e) => {
                    const templateId = e.target.value;
                    setTemplateSelection((prev) => ({ ...prev, requirements: templateId }));
                    handleApplyTemplate('requirements', templateId);
                  }}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: '#f9fafb', fontSize: 13 }}
                >
                  <option value="">-- Chọn mẫu yêu cầu --</option>
                  {templateOptions.requirements.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </div>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={4}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                placeholder="- Tốt nghiệp Đại học chuyên ngành CNTT..."
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Phúc lợi</label>
              <div style={{ marginBottom: 8 }}>
                <select
                  value={templateSelection.benefits}
                  onChange={(e) => {
                    const templateId = e.target.value;
                    setTemplateSelection((prev) => ({ ...prev, benefits: templateId }));
                    handleApplyTemplate('benefits', templateId);
                  }}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: '#f9fafb', fontSize: 13 }}
                >
                  <option value="">-- Chọn mẫu phúc lợi --</option>
                  {templateOptions.benefits.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </div>
              <textarea
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                rows={4}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                placeholder="- Thưởng tháng 13..."
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
                Hủy
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
                {saving ? 'Đang tạo...' : 'Tạo bản nháp'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
