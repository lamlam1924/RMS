import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { candidateService } from '../../services/candidateService';
import { authService } from '../../services/authService';

const emptyExperience = () => ({ id: null, companyName: '', jobTitle: '', startDate: '', endDate: '', description: '' });
const emptyEducation = () => ({ id: null, schoolName: '', degree: '', major: '', startYear: '', endYear: '', gpa: '' });
const emptyCertificate = () => ({ id: null, certificateName: '', issuer: '', issuedYear: '' });

function buildFormFromCv(cv, user) {
  return {
    fullName: cv?.fullName || user?.fullName || '',
    email: cv?.email || user?.email || '',
    phone: cv?.phone || '',
    summary: cv?.summary || '',
    yearsOfExperience: cv?.yearsOfExperience ?? '',
    source: cv?.source || '',
    experiences: cv?.experiences?.length > 0
      ? cv.experiences.map(e => ({ id: e.id, companyName: e.companyName || '', jobTitle: e.jobTitle || '', startDate: e.startDate ? e.startDate.slice(0, 10) : '', endDate: e.endDate ? e.endDate.slice(0, 10) : '', description: e.description || '' }))
      : [emptyExperience()],
    educations: cv?.educations?.length > 0
      ? cv.educations.map(e => ({ id: e.id, schoolName: e.schoolName || '', degree: e.degree || '', major: e.major || '', startYear: e.startYear ?? '', endYear: e.endYear ?? '', gpa: e.gpa ?? '' }))
      : [emptyEducation()],
    certificates: cv?.certificates?.length > 0
      ? cv.certificates.map(c => ({ id: c.id, certificateName: c.certificateName || '', issuer: c.issuer || '', issuedYear: c.issuedYear ?? '' }))
      : [emptyCertificate()],
  };
}

export default function MyProfile() {
  const location = useLocation();
  const [user, setUser] = useState(authService.getUserInfo());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cv, setCv] = useState(null);
  const [editingSection, setEditingSection] = useState(null); // null | 'header' | 'contact' | 'summary' | 'experience' | 'education' | 'certificates'

  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const [form, setForm] = useState(buildFormFromCv(null, authService.getUserInfo()));

  useEffect(() => {
    loadCv();
  }, []);

  useEffect(() => {
    if (!loading && location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    }
  }, [location, loading]);

  const loadCv = async () => {
    try {
      setError('');
      const data = await candidateService.getMyCv();
      setCv(data);
      setForm(buildFormFromCv(data, user));
    } catch (err) {
      setError(err.message || 'Không thể tải hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const updateArrayItem = (arr, idx, field, value) => setForm(f => { const a = [...(f[arr] || [])]; a[idx] = { ...a[idx], [field]: value }; return { ...f, [arr]: a }; });
  const addArrayItem = (arr, emptyFn) => setForm(f => ({ ...f, [arr]: [...(f[arr] || []), emptyFn()] }));
  const removeArrayItem = (arr, idx) => setForm(f => { const a = [...(f[arr] || [])]; if (a.length <= 1) return f; a.splice(idx, 1); return { ...f, [arr]: a }; });

  const toApiPayload = () => ({
    fullName: form.fullName.trim(),
    email: form.email?.trim() || null,
    phone: form.phone?.trim() || null,
    summary: form.summary?.trim() || null,
    yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience, 10) : null,
    source: form.source?.trim() || null,
    experiences: form.experiences
      .filter(e => e.companyName?.trim() && e.jobTitle?.trim())
      .map(e => ({ id: e.id || undefined, companyName: e.companyName.trim(), jobTitle: e.jobTitle.trim(), startDate: e.startDate || '2020-01-01', endDate: e.endDate || null, description: e.description?.trim() || null })),
    educations: form.educations
      .filter(e => e.schoolName?.trim())
      .map(e => ({ id: e.id || undefined, schoolName: e.schoolName.trim(), degree: e.degree?.trim() || null, major: e.major?.trim() || null, startYear: e.startYear ? parseInt(e.startYear, 10) : null, endYear: e.endYear ? parseInt(e.endYear, 10) : null, gpa: e.gpa ? parseFloat(e.gpa) : null })),
    certificates: form.certificates
      .filter(c => c.certificateName?.trim())
      .map(c => ({ id: c.id || undefined, certificateName: c.certificateName.trim(), issuer: c.issuer?.trim() || null, issuedYear: c.issuedYear ? parseInt(c.issuedYear, 10) : null })),
  });

  const enterEdit = (section) => {
    if (cv) setForm(buildFormFromCv(cv, user));
    setError('');
    setSuccess('');
    setEditingSection(section);
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setError('');
  };

  const saveSection = async (section) => {
    setError('');
    if (!form.fullName?.trim()) { setError('Vui lòng nhập họ và tên'); return; }
    if (section === 'contact' && !form.phone?.trim()) { setError('Vui lòng nhập số điện thoại'); return; }
    if (section === 'experience') {
      for (let i = 0; i < form.experiences.length; i++) {
        const e = form.experiences[i];
        const hasData = e.companyName?.trim() || e.jobTitle?.trim() || e.startDate;
        if (hasData) {
          if (!e.companyName?.trim()) { setError(`Kinh nghiệm #${i + 1}: Vui lòng nhập tên công ty`); return; }
          if (!e.jobTitle?.trim()) { setError(`Kinh nghiệm #${i + 1}: Vui lòng nhập vị trí`); return; }
          if (!e.startDate) { setError(`Kinh nghiệm #${i + 1}: Vui lòng chọn ngày bắt đầu`); return; }
        }
      }
    }
    setSaving(true);
    try {
      const payload = toApiPayload();
      if (cv) {
        const updated = await candidateService.updateCv(cv.id, payload);
        setCv(updated);
        setForm(buildFormFromCv(updated, user));
      } else {
        const created = await candidateService.createCv(payload);
        setCv(created);
        setForm(buildFormFromCv(created, user));
      }
      setEditingSection(null);
      setSuccess('Cập nhật thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (pwdForm.newPassword !== pwdForm.confirmNewPassword) { setPwdError('Mật khẩu xác nhận không khớp'); return; }
    setPwdSaving(true);
    try {
      await authService.changePassword(pwdForm.currentPassword, pwdForm.newPassword, pwdForm.confirmNewPassword);
      setPwdSuccess('Đổi mật khẩu thành công');
      setPwdForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setPwdError(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPwdSaving(false);
    }
  };

  const handleCvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadSuccess('');
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) { setUploadError('Chỉ chấp nhận file định dạng PDF, DOC, DOCX'); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError('Kích thước file quá lớn (tối đa 10MB)'); return; }
    setUploadingCv(true);
    try {
      const result = await candidateService.uploadCvFile(file);
      setCv(prev => prev ? { ...prev, cvFileUrl: result.cvFileUrl } : prev);
      setUploadSuccess('Tải file CV lên thành công!');
    } catch (err) {
      setUploadError(err.message || 'Tải lên CV thất bại');
    } finally {
      setUploadingCv(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-slate-600 bg-white p-6 rounded-xl shadow-sm">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="font-medium">Đang tải hồ sơ...</span>
        </div>
      </div>
    );
  }

  const formatDateShort = (s) => s ? new Date(s).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }) : '';

  const EditActions = ({ section }) => (
    <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
      <button type="button" onClick={cancelEdit} className="px-5 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Hủy</button>
      <button type="button" onClick={() => saveSection(section)} disabled={saving} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors">
        {saving && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">

      {/* Global flash messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {success}
        </div>
      )}

      {/* ────────── PROFILE BANNER ────────── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end">

            {/* Avatar */}
            <div className="relative group shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/30" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white/20 text-white flex items-center justify-center text-3xl font-extrabold ring-4 ring-white/30">
                  {(form.fullName || user?.fullName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-2xl cursor-pointer transition-opacity">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploadingCv(true);
                    await authService.uploadAvatar(file);
                    setUser(authService.getUserInfo());
                    window.dispatchEvent(new Event('storage'));
                    setSuccess('Cập nhật ảnh đại diện thành công');
                    setTimeout(() => setSuccess(''), 3000);
                  } catch (err) {
                    setError(err.message || 'Cập nhật ảnh thất bại');
                  } finally {
                    setUploadingCv(false);
                  }
                }} />
              </label>
            </div>

            {/* Banner content / edit */}
            {editingSection === 'header' ? (
              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-4 w-full">
                {error && <p className="text-red-200 text-sm mb-3 bg-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">Họ và tên <span className="text-red-300">*</span></label>
                    <input value={form.fullName} onChange={e => updateField('fullName', e.target.value)} className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/50" placeholder="Nguyễn Văn An" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">Số năm kinh nghiệm</label>
                    <input type="number" min="0" value={form.yearsOfExperience} onChange={e => updateField('yearsOfExperience', e.target.value)} className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/50" placeholder="3" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">Nguồn ứng tuyển</label>
                    <input value={form.source} onChange={e => updateField('source', e.target.value)} className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/50" placeholder="WEBSITE, REFERRAL, LINKEDIN..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">Tiêu đề nghề nghiệp</label>
                    <input value={form.summary} onChange={e => updateField('summary', e.target.value)} className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/50" placeholder="Ví dụ: Frontend Developer với 3 năm kinh nghiệm" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={cancelEdit} className="px-4 py-1.5 text-sm text-white/80 hover:text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors">Hủy</button>
                  <button onClick={() => saveSection('header')} disabled={saving} className="px-4 py-1.5 text-sm bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 disabled:opacity-60 flex items-center gap-1.5 transition-colors">
                    {saving && <span className="animate-spin h-3.5 w-3.5 border-2 border-blue-700 border-t-transparent rounded-full" />}
                    Lưu
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white truncate">
                  {form.fullName || user?.fullName || 'Chưa cập nhật tên'}
                </h1>
                {form.summary && (
                  <p className="text-blue-100 mt-1 text-sm md:text-base line-clamp-1">{form.summary}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.yearsOfExperience !== '' && form.yearsOfExperience != null && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {form.yearsOfExperience} năm kinh nghiệm
                    </span>
                  )}
                  {form.source && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      {form.source}
                    </span>
                  )}
                  {!cv && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/30 rounded-full text-xs font-semibold text-amber-200">
                      Hồ sơ chưa hoàn chỉnh
                    </span>
                  )}
                </div>
              </div>
            )}

            {editingSection !== 'header' && (
              <button onClick={() => enterEdit('header')} className="shrink-0 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Chỉnh sửa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ────────── TWO-COLUMN LAYOUT ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT SIDEBAR ── */}
        <div className="space-y-6">

          {/* Thông tin liên hệ */}
          <div id="contact" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm scroll-mt-20">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Liên hệ
              </h2>
              {editingSection !== 'contact' && (
                <button onClick={() => enterEdit('contact')} className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">Chỉnh sửa</button>
              )}
            </div>

            {editingSection === 'contact' ? (
              <div>
                {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                    <input value={form.fullName} onChange={e => updateField('fullName', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nguyễn Văn An" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                    <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0901234567" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="email@example.com" />
                  </div>
                </div>
                <EditActions section="contact" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-500 shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 font-medium mb-0.5">Điện thoại</div>
                    <div className="text-sm font-semibold text-slate-800 break-all">{form.phone || <span className="text-slate-400 italic font-normal">Chưa cập nhật</span>}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg text-green-500 shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 font-medium mb-0.5">Email</div>
                    <div className="text-sm font-semibold text-slate-800 break-all">{form.email || user?.email || <span className="text-slate-400 italic font-normal">Chưa cập nhật</span>}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tài liệu CV */}
          <div id="cv-upload" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm scroll-mt-20">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-5">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Tài liệu CV
            </h2>

            {uploadError && <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{uploadError}</div>}
            {uploadSuccess && <div className="mb-3 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">{uploadSuccess}</div>}

            {cv?.cvFileUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="p-2 bg-indigo-600 rounded-lg text-white shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800">CV của tôi</div>
                    <div className="text-xs text-indigo-600 font-medium">Đã tải lên ✓</div>
                  </div>
                  <a 
                    href={`/api/files/cv?url=${encodeURIComponent(cv.cvFileUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-100 transition-colors" 
                    title="Xem CV"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
                <div className="relative">
                  <input type="file" onChange={handleCvUpload} accept=".pdf,.doc,.docx" disabled={uploadingCv} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                  <button type="button" disabled={uploadingCv} className="w-full py-2 text-xs font-medium text-slate-500 border border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors pointer-events-none">
                    {uploadingCv ? 'Đang tải lên...' : '↑ Cập nhật CV mới'}
                  </button>
                </div>
                <p className="text-xs text-slate-400">CV này sẽ được dùng khi bạn ứng tuyển.</p>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <input type="file" onChange={handleCvUpload} accept=".pdf,.doc,.docx" disabled={uploadingCv} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                    <div className="p-3 bg-slate-100 rounded-xl inline-block mb-2">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                    <div className="text-sm font-medium text-slate-600">{uploadingCv ? 'Đang tải lên...' : 'Tải lên file CV'}</div>
                    <div className="text-xs text-slate-400 mt-1">PDF, DOCX · Tối đa 10MB</div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">CV sẽ tự động đính kèm khi ứng tuyển</p>
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT MAIN CONTENT ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Giới thiệu bản thân */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Giới thiệu bản thân
              </h2>
              {editingSection !== 'summary' && (cv?.summary || cv) && (
                <button onClick={() => enterEdit('summary')} className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">Chỉnh sửa</button>
              )}
            </div>

            {editingSection === 'summary' ? (
              <div>
                {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
                <textarea value={form.summary} onChange={e => updateField('summary', e.target.value)} rows={5}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm text-slate-700"
                  placeholder="Giới thiệu ngắn gọn về bản thân, điểm mạnh, mục tiêu nghề nghiệp của bạn..."
                />
                <EditActions section="summary" />
              </div>
            ) : (
              cv?.summary ? (
                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">{cv.summary}</p>
              ) : (
                <button onClick={() => enterEdit('summary')} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors text-sm font-medium">
                  + Thêm giới thiệu bản thân
                </button>
              )
            )}
          </div>

          {/* Kinh nghiệm làm việc */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Kinh nghiệm làm việc
              </h2>
              {editingSection !== 'experience' && (
                <button onClick={() => enterEdit('experience')} className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                  {cv?.experiences?.length > 0 ? 'Chỉnh sửa' : '+ Thêm'}
                </button>
              )}
            </div>

            {editingSection === 'experience' ? (
              <div>
                {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
                {form.experiences.map((exp, idx) => (
                  <div key={idx} className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vị trí #{idx + 1}</span>
                      {form.experiences.length > 1 && (
                        <button type="button" onClick={() => removeArrayItem('experiences', idx)} className="text-xs text-red-500 hover:text-red-700 font-medium">Xóa</button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Công ty <span className="text-red-500">*</span></label>
                        <input value={exp.companyName} onChange={e => updateArrayItem('experiences', idx, 'companyName', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Tên công ty" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Chức danh <span className="text-red-500">*</span></label>
                        <input value={exp.jobTitle} onChange={e => updateArrayItem('experiences', idx, 'jobTitle', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Frontend Developer" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Từ ngày <span className="text-red-500">*</span></label>
                        <input type="date" value={exp.startDate} onChange={e => updateArrayItem('experiences', idx, 'startDate', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Đến ngày <span className="text-slate-400">(để trống = hiện tại)</span></label>
                        <input type="date" value={exp.endDate} onChange={e => updateArrayItem('experiences', idx, 'endDate', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Mô tả công việc</label>
                        <textarea value={exp.description} onChange={e => updateArrayItem('experiences', idx, 'description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none" placeholder="Mô tả nhiệm vụ và thành tích nổi bật..." />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('experiences', emptyExperience)} className="w-full py-2.5 text-sm font-medium text-blue-600 border border-dashed border-blue-300 rounded-xl hover:bg-blue-50 transition-colors">+ Thêm kinh nghiệm</button>
                <EditActions section="experience" />
              </div>
            ) : (
              cv?.experiences?.length > 0 ? (
                <div className="space-y-0">
                  {cv.experiences.map((exp, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-100 mt-1.5 shrink-0" />
                        {i < cv.experiences.length - 1 && <div className="w-0.5 bg-slate-200 flex-1 my-1" />}
                      </div>
                      <div className={`flex-1 pb-5 ${i < cv.experiences.length - 1 ? '' : ''}`}>
                        <div className="font-bold text-slate-900 text-sm">{exp.jobTitle}</div>
                        <div className="text-sm text-blue-600 font-semibold">{exp.companyName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{formatDateShort(exp.startDate)} — {exp.endDate ? formatDateShort(exp.endDate) : 'Hiện tại'}</div>
                        {exp.description && <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{exp.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button onClick={() => enterEdit('experience')} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors text-sm font-medium">
                  + Thêm kinh nghiệm làm việc
                </button>
              )
            )}
          </div>

          {/* Học vấn */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
                Học vấn
              </h2>
              {editingSection !== 'education' && (
                <button onClick={() => enterEdit('education')} className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                  {cv?.educations?.length > 0 ? 'Chỉnh sửa' : '+ Thêm'}
                </button>
              )}
            </div>

            {editingSection === 'education' ? (
              <div>
                {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
                {form.educations.map((edu, idx) => (
                  <div key={idx} className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bằng cấp #{idx + 1}</span>
                      {form.educations.length > 1 && (
                        <button type="button" onClick={() => removeArrayItem('educations', idx)} className="text-xs text-red-500 hover:text-red-700 font-medium">Xóa</button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Trường <span className="text-red-500">*</span></label>
                        <input value={edu.schoolName} onChange={e => updateArrayItem('educations', idx, 'schoolName', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Tên trường đại học / cao đẳng" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Bằng cấp</label>
                        <input value={edu.degree} onChange={e => updateArrayItem('educations', idx, 'degree', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Cử nhân, Thạc sĩ..." />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Chuyên ngành</label>
                        <input value={edu.major} onChange={e => updateArrayItem('educations', idx, 'major', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Công nghệ thông tin" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Năm bắt đầu</label>
                        <input type="number" min="1990" max="2030" value={edu.startYear} onChange={e => updateArrayItem('educations', idx, 'startYear', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="2020" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Năm tốt nghiệp</label>
                        <input type="number" min="1990" max="2030" value={edu.endYear} onChange={e => updateArrayItem('educations', idx, 'endYear', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="2024" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">GPA</label>
                        <input type="text" value={edu.gpa} onChange={e => updateArrayItem('educations', idx, 'gpa', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="3.5 / 4.0" />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('educations', emptyEducation)} className="w-full py-2.5 text-sm font-medium text-blue-600 border border-dashed border-blue-300 rounded-xl hover:bg-blue-50 transition-colors">+ Thêm học vấn</button>
                <EditActions section="education" />
              </div>
            ) : (
              cv?.educations?.length > 0 ? (
                <div className="space-y-3">
                  {cv.educations.map((edu, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                      <div className="p-2 bg-purple-100 rounded-lg text-purple-600 shrink-0 h-fit">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{edu.schoolName}</div>
                        <div className="text-sm text-slate-600">{[edu.degree, edu.major].filter(Boolean).join(' · ')}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {[edu.startYear, edu.endYear].filter(v => v != null && v !== '').join(' — ')}
                          {edu.gpa != null && edu.gpa !== '' ? ` · GPA ${edu.gpa}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button onClick={() => enterEdit('education')} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors text-sm font-medium">
                  + Thêm thông tin học vấn
                </button>
              )
            )}
          </div>

          {/* Chứng chỉ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                Chứng chỉ &amp; Kỹ năng
              </h2>
              {editingSection !== 'certificates' && (
                <button onClick={() => enterEdit('certificates')} className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                  {cv?.certificates?.length > 0 ? 'Chỉnh sửa' : '+ Thêm'}
                </button>
              )}
            </div>

            {editingSection === 'certificates' ? (
              <div>
                {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
                {form.certificates.map((cert, idx) => (
                  <div key={idx} className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chứng chỉ #{idx + 1}</span>
                      {form.certificates.length > 1 && (
                        <button type="button" onClick={() => removeArrayItem('certificates', idx)} className="text-xs text-red-500 hover:text-red-700 font-medium">Xóa</button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Tên chứng chỉ <span className="text-red-500">*</span></label>
                        <input value={cert.certificateName} onChange={e => updateArrayItem('certificates', idx, 'certificateName', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="TOEIC, AWS, PMP..." />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Tổ chức cấp</label>
                        <input value={cert.issuer} onChange={e => updateArrayItem('certificates', idx, 'issuer', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="IIG, Microsoft..." />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Năm cấp</label>
                        <input type="number" min="1990" max="2030" value={cert.issuedYear} onChange={e => updateArrayItem('certificates', idx, 'issuedYear', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="2024" />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('certificates', emptyCertificate)} className="w-full py-2.5 text-sm font-medium text-blue-600 border border-dashed border-blue-300 rounded-xl hover:bg-blue-50 transition-colors">+ Thêm chứng chỉ</button>
                <EditActions section="certificates" />
              </div>
            ) : (
              cv?.certificates?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {cv.certificates.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                      <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{c.certificateName}</div>
                        {(c.issuer || c.issuedYear) && (
                          <div className="text-xs text-slate-500">{[c.issuer, c.issuedYear].filter(Boolean).join(' · ')}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button onClick={() => enterEdit('certificates')} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors text-sm font-medium">
                  + Thêm chứng chỉ &amp; kỹ năng
                </button>
              )
            )}
          </div>

        </div>
      </div>

      {/* ────────── BẢO MẬT TÀI KHOẢN ────────── */}
      <div id="change-password" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm scroll-mt-20">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-5">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Bảo mật tài khoản
        </h2>
        {pwdError && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{pwdError}</div>}
        {pwdSuccess && <div className="mb-4 text-sm text-green-600 bg-green-50 border border-green-200 px-4 py-3 rounded-lg">{pwdSuccess}</div>}
        <form onSubmit={handlePasswordChange}>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPwd.current ? 'text' : 'password'} value={pwdForm.currentPassword} onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg pr-14 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                <button type="button" onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })} className="absolute right-3 top-2 text-slate-500 hover:text-slate-700 text-xs font-medium">{showPwd.current ? 'Ẩn' : 'Hiện'}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPwd.new ? 'text' : 'password'} value={pwdForm.newPassword} onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg pr-14 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required minLength={6} />
                <button type="button" onClick={() => setShowPwd({ ...showPwd, new: !showPwd.new })} className="absolute right-3 top-2 text-slate-500 hover:text-slate-700 text-xs font-medium">{showPwd.new ? 'Ẩn' : 'Hiện'}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPwd.confirm ? 'text' : 'password'} value={pwdForm.confirmNewPassword} onChange={e => setPwdForm({ ...pwdForm, confirmNewPassword: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg pr-14 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required minLength={6} />
                <button type="button" onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })} className="absolute right-3 top-2 text-slate-500 hover:text-slate-700 text-xs font-medium">{showPwd.confirm ? 'Ẩn' : 'Hiện'}</button>
              </div>
            </div>
          </div>
          <div className="flex justify-start mt-4">
            <button type="submit" disabled={pwdSaving} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors">
              {pwdSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

