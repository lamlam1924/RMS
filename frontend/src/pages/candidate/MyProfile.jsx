import React, { useState, useEffect } from 'react';
import { candidateService } from '../../services/candidateService';
import { authService } from '../../services/authService';

const emptyExperience = () => ({
  id: null,
  companyName: '',
  jobTitle: '',
  startDate: '',
  endDate: '',
  description: '',
});

const emptyEducation = () => ({
  id: null,
  schoolName: '',
  degree: '',
  major: '',
  startYear: '',
  endYear: '',
  gpa: '',
});

const emptyCertificate = () => ({
  id: null,
  certificateName: '',
  issuer: '',
  issuedYear: '',
});

export default function MyProfile() {
  const user = authService.getUserInfo();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cv, setCv] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    summary: '',
    yearsOfExperience: '',
    source: '',
    experiences: [emptyExperience()],
    educations: [emptyEducation()],
    certificates: [emptyCertificate()],
  });

  useEffect(() => {
    loadCv();
  }, []);

  const loadCv = async () => {
    try {
      setError('');
      const data = await candidateService.getMyCv();
      setCv(data);
      if (data) {
        setForm({
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          summary: data.summary || '',
          yearsOfExperience: data.yearsOfExperience ?? '',
          source: data.source || '',
          experiences:
            data.experiences?.length > 0
              ? data.experiences.map((e) => ({
                  id: e.id,
                  companyName: e.companyName || '',
                  jobTitle: e.jobTitle || '',
                  startDate: e.startDate ? e.startDate.slice(0, 10) : '',
                  endDate: e.endDate ? e.endDate.slice(0, 10) : '',
                  description: e.description || '',
                }))
              : [emptyExperience()],
          educations:
            data.educations?.length > 0
              ? data.educations.map((e) => ({
                  id: e.id,
                  schoolName: e.schoolName || '',
                  degree: e.degree || '',
                  major: e.major || '',
                  startYear: e.startYear ?? '',
                  endYear: e.endYear ?? '',
                  gpa: e.gpa ?? '',
                }))
              : [emptyEducation()],
          certificates:
            data.certificates?.length > 0
              ? data.certificates.map((c) => ({
                  id: c.id,
                  certificateName: c.certificateName || '',
                  issuer: c.issuer || '',
                  issuedYear: c.issuedYear ?? '',
                }))
              : [emptyCertificate()],
        });
      } else {
        setForm((f) => ({
          ...f,
          fullName: user?.fullName || f.fullName,
          email: user?.email || f.email,
        }));
      }
    } catch (err) {
      setError(err.message || 'Không thể tải CV');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
    setSuccess('');
  };

  const updateArrayItem = (arrayName, index, field, value) => {
    setForm((f) => {
      const arr = [...(f[arrayName] || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...f, [arrayName]: arr };
    });
  };

  const addArrayItem = (arrayName, emptyFn) => {
    setForm((f) => ({
      ...f,
      [arrayName]: [...(f[arrayName] || []), emptyFn()],
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    setForm((f) => {
      const arr = [...(f[arrayName] || [])];
      if (arr.length <= 1) return f;
      arr.splice(index, 1);
      return { ...f, [arrayName]: arr };
    });
  };

  const toApiPayload = () => {
    return {
      fullName: form.fullName.trim(),
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      summary: form.summary?.trim() || null,
      yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience, 10) : null,
      source: form.source?.trim() || null,
      experiences: form.experiences
        .filter((e) => e.companyName?.trim() && e.jobTitle?.trim())
        .map((e) => ({
          id: e.id || undefined,
          companyName: e.companyName.trim(),
          jobTitle: e.jobTitle.trim(),
          startDate: e.startDate || '2020-01-01',
          endDate: e.endDate || null,
          description: e.description?.trim() || null,
        })),
      educations: form.educations
        .filter((e) => e.schoolName?.trim())
        .map((e) => ({
          id: e.id || undefined,
          schoolName: e.schoolName.trim(),
          degree: e.degree?.trim() || null,
          major: e.major?.trim() || null,
          startYear: e.startYear ? parseInt(e.startYear, 10) : null,
          endYear: e.endYear ? parseInt(e.endYear, 10) : null,
          gpa: e.gpa ? parseFloat(e.gpa) : null,
        })),
      certificates: form.certificates
        .filter((c) => c.certificateName?.trim())
        .map((c) => ({
          id: c.id || undefined,
          certificateName: c.certificateName.trim(),
          issuer: c.issuer?.trim() || null,
          issuedYear: c.issuedYear ? parseInt(c.issuedYear, 10) : null,
        })),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.fullName?.trim()) {
      setError('Vui lòng nhập họ tên');
      return;
    }
    setSaving(true);
    try {
      const payload = toApiPayload();
      if (cv) {
        await candidateService.updateCv(cv.id, payload);
        const refreshed = await candidateService.getMyCv();
        setCv(refreshed);
        setSuccess('Cập nhật CV thành công!');
        setIsEditing(false);
      } else {
        const created = await candidateService.createCv(payload);
        setCv(created);
        setSuccess('Tạo CV thành công!');
        setIsEditing(false);
      }
    } catch (err) {
      setError(err.message || 'Lưu CV thất bại');
      console.error('CV save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-slate-600 bg-white p-6 rounded-xl shadow-sm">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="font-medium">Đang tải...</span>
        </div>
      </div>
    );
  }

  const showViewMode = cv && !isEditing;

  const formatDate = (s) => s ? new Date(s).toLocaleDateString('vi-VN') : '';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">CV của tôi</h1>
        <p className="text-slate-500 mt-1">
          {showViewMode ? 'Thông tin CV của bạn' : cv ? 'Chỉnh sửa thông tin CV của bạn' : 'Tạo CV profile để ứng tuyển'}
        </p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {showViewMode ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full" />
              Thông tin cá nhân
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 text-slate-700">
              <div><span className="text-slate-500 text-sm">Họ và tên:</span> <span className="font-medium">{cv.fullName}</span></div>
              <div><span className="text-slate-500 text-sm">Email:</span> {cv.email || '—'}</div>
              <div><span className="text-slate-500 text-sm">Số điện thoại:</span> {cv.phone || '—'}</div>
              <div><span className="text-slate-500 text-sm">Năm kinh nghiệm:</span> {cv.yearsOfExperience ?? '—'}</div>
              {cv.summary && (
                <div className="sm:col-span-2"><span className="text-slate-500 text-sm block mb-1">Giới thiệu:</span><p className="text-slate-700 whitespace-pre-line">{cv.summary}</p></div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full" />
              Kinh nghiệm làm việc
            </h2>
            {(cv.experiences?.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {cv.experiences.map((exp, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl">
                    <div className="font-medium text-slate-800">{exp.companyName} · {exp.jobTitle}</div>
                    <div className="text-sm text-slate-500">{formatDate(exp.startDate)} — {exp.endDate ? formatDate(exp.endDate) : 'Hiện tại'}</div>
                    {exp.description && <p className="text-slate-600 text-sm mt-2">{exp.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-2">Chưa có kinh nghiệm. Nhấn <strong>Cập nhật</strong> bên dưới để thêm.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full" />
              Học vấn
            </h2>
            {(cv.educations?.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {cv.educations.map((edu, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl">
                    <div className="font-medium text-slate-800">{edu.schoolName}</div>
                    <div className="text-sm text-slate-600">{edu.degree} {edu.major && `· ${edu.major}`}</div>
                    <div className="text-sm text-slate-500">{edu.startYear} — {edu.endYear || '—'} {edu.gpa != null && `· GPA ${edu.gpa}`}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-2">Chưa có học vấn. Nhấn <strong>Cập nhật</strong> bên dưới để thêm.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full" />
              Chứng chỉ
            </h2>
            {(cv.certificates?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap gap-2">
                {cv.certificates.map((c, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 rounded-lg text-sm text-slate-700">{c.certificateName}{c.issuer && ` (${c.issuer})`}{c.issuedYear && ` · ${c.issuedYear}`}</span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-2">Chưa có chứng chỉ. Nhấn <strong>Cập nhật</strong> bên dưới để thêm.</p>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                if (cv) {
                  setForm({
                    fullName: cv.fullName || '',
                    email: cv.email || '',
                    phone: cv.phone || '',
                    summary: cv.summary || '',
                    yearsOfExperience: cv.yearsOfExperience ?? '',
                    source: cv.source || '',
                    experiences: cv.experiences?.length ? cv.experiences.map((e) => ({
                      id: e.id, companyName: e.companyName || '', jobTitle: e.jobTitle || '',
                      startDate: e.startDate ? e.startDate.slice(0, 10) : '', endDate: e.endDate ? e.endDate.slice(0, 10) : '',
                      description: e.description || '',
                    })) : [emptyExperience()],
                    educations: cv.educations?.length ? cv.educations.map((e) => ({
                      id: e.id, schoolName: e.schoolName || '', degree: e.degree || '', major: e.major || '',
                      startYear: e.startYear ?? '', endYear: e.endYear ?? '', gpa: e.gpa ?? '',
                    })) : [emptyEducation()],
                    certificates: cv.certificates?.length ? cv.certificates.map((c) => ({
                      id: c.id, certificateName: c.certificateName || '', issuer: c.issuer || '', issuedYear: c.issuedYear ?? '',
                    })) : [emptyCertificate()],
                  });
                }
                setIsEditing(true);
                setSuccess('');
                setError('');
              }}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Cập nhật
            </button>
          </div>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* Thông tin cơ bản */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full" />
            Thông tin cá nhân
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0901234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Năm kinh nghiệm</label>
              <input
                type="number"
                min="0"
                value={form.yearsOfExperience}
                onChange={(e) => updateField('yearsOfExperience', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Giới thiệu bản thân</label>
              <textarea
                value={form.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mô tả ngắn gọn về bản thân, mục tiêu nghề nghiệp..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nguồn tham khảo</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => updateField('source', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="WEBSITE, REFERRAL, SOCIAL..."
              />
            </div>
          </div>
        </div>

        {/* Kinh nghiệm làm việc */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full" />
              Kinh nghiệm làm việc
            </h2>
            <button
              type="button"
              onClick={() => addArrayItem('experiences', emptyExperience)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + Thêm
            </button>
          </div>
          {form.experiences.map((exp, idx) => (
            <div key={idx} className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-slate-600">#{idx + 1}</span>
                {form.experiences.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('experiences', idx)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Xóa
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Công ty <span className="text-red-500">*</span></label>
                  <input
                    value={exp.companyName}
                    onChange={(e) => updateArrayItem('experiences', idx, 'companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Tên công ty"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Vị trí <span className="text-red-500">*</span></label>
                  <input
                    value={exp.jobTitle}
                    onChange={(e) => updateArrayItem('experiences', idx, 'jobTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Job title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Từ ngày <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={exp.startDate}
                    onChange={(e) => updateArrayItem('experiences', idx, 'startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Đến ngày (để trống nếu hiện tại)</label>
                  <input
                    type="date"
                    value={exp.endDate}
                    onChange={(e) => updateArrayItem('experiences', idx, 'endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Mô tả</label>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateArrayItem('experiences', idx, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Mô tả công việc đã làm..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Học vấn */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full" />
              Học vấn
            </h2>
            <button
              type="button"
              onClick={() => addArrayItem('educations', emptyEducation)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + Thêm
            </button>
          </div>
          {form.educations.map((edu, idx) => (
            <div key={idx} className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-slate-600">#{idx + 1}</span>
                {form.educations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('educations', idx)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Xóa
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Trường <span className="text-red-500">*</span></label>
                  <input
                    value={edu.schoolName}
                    onChange={(e) => updateArrayItem('educations', idx, 'schoolName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Tên trường"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Bằng cấp</label>
                  <input
                    value={edu.degree}
                    onChange={(e) => updateArrayItem('educations', idx, 'degree', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Cử nhân, Thạc sĩ..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Chuyên ngành</label>
                  <input
                    value={edu.major}
                    onChange={(e) => updateArrayItem('educations', idx, 'major', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="CNTT, Marketing..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Năm bắt đầu</label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    value={edu.startYear}
                    onChange={(e) => updateArrayItem('educations', idx, 'startYear', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="2020"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Năm tốt nghiệp</label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    value={edu.endYear}
                    onChange={(e) => updateArrayItem('educations', idx, 'endYear', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">GPA</label>
                  <input
                    type="text"
                    value={edu.gpa}
                    onChange={(e) => updateArrayItem('educations', idx, 'gpa', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="3.5"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chứng chỉ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full" />
              Chứng chỉ
            </h2>
            <button
              type="button"
              onClick={() => addArrayItem('certificates', emptyCertificate)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + Thêm
            </button>
          </div>
          {form.certificates.map((cert, idx) => (
            <div key={idx} className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-slate-600">#{idx + 1}</span>
                {form.certificates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('certificates', idx)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Xóa
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tên chứng chỉ <span className="text-red-500">*</span></label>
                  <input
                    value={cert.certificateName}
                    onChange={(e) => updateArrayItem('certificates', idx, 'certificateName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="TOEIC, AWS..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tổ chức cấp</label>
                  <input
                    value={cert.issuer}
                    onChange={(e) => updateArrayItem('certificates', idx, 'issuer', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="IIG, Microsoft..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Năm</label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    value={cert.issuedYear}
                    onChange={(e) => updateArrayItem('certificates', idx, 'issuedYear', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="2024"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          {cv && (
            <button
              type="button"
              onClick={() => { setIsEditing(false); setError(''); setSuccess(''); }}
              className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Đang lưu...' : cv ? 'Lưu thay đổi' : 'Tạo CV'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
