import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidateService } from '../../services/candidateService';
import notify from '../../utils/notification';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [applying, setApplying] = useState(false);
  const [existingCv, setExistingCv] = useState(null);
  const [loadingCv, setLoadingCv] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  const fetchJobDetail = async () => {
    try {
      const data = await candidateService.getJobDetail(id);
      setJob(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Thỏa thuận';
    if (min && max) {
      return `${(min / 1000000).toFixed(0)} - ${(max / 1000000).toFixed(0)} triệu VNĐ`;
    }
    return min ? `Từ ${(min / 1000000).toFixed(0)} triệu VNĐ` : `Lên đến ${(max / 1000000).toFixed(0)} triệu VNĐ`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleApply = async () => {
    setCvFile(null);
    setExistingCv(null);
    setShowApplyModal(true);
    setLoadingCv(true);
    try {
      const cv = await candidateService.getMyCv();
      setExistingCv(cv);
    } catch {
      setExistingCv(null);
    } finally {
      setLoadingCv(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      notify.error('Chỉ chấp nhận file PDF');
      e.target.value = '';
      return;
    }
    setCvFile(file || null);
  };

  const handleConfirmApply = async () => {
    setApplying(true);
    try {
      await candidateService.applyToJob(id, cvFile);
      notify.success('Nộp đơn ứng tuyển thành công!');
      setShowApplyModal(false);
    } catch (err) {
      notify.error(err.message || 'Nộp đơn thất bại');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-slate-600 flex items-center gap-3 bg-white p-6 rounded-xl shadow-sm">
           <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
           <span className="font-medium">Đang tải thông tin...</span>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy tin tuyển dụng</h2>
          <p className="text-slate-500 mb-6">{error || 'Tin tuyển dụng không tồn tại hoặc đã bị xóa.'}</p>
          <button onClick={() => navigate('/app/jobs')} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft(job.deadlineDate);
  const isJdImage = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(job.jdFileUrl || '');
  const jdPreviewUrl = job.jobRequestId ? `/api/files/jd/${job.jobRequestId}` : job.jdFileUrl;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate('/app/jobs')} className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-6 transition-colors group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại danh sách
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 z-0 opacity-50"></div>
          <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">{job.title}</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-slate-500 mb-1">Vị trí</span>
                    <span className="block font-semibold text-slate-800">{job.positionTitle}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                   <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                     <span className="block text-sm font-medium text-slate-500 mb-1">Phòng ban</span>
                     <span className="block font-semibold text-slate-800">{job.departmentName}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-50 rounded-xl text-green-600 shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-slate-500 mb-1">Mức lương</span>
                    <span className="block font-semibold text-slate-800">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-50 rounded-xl text-purple-600 shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-slate-500 mb-1">Địa điểm</span>
                    <span className="block font-semibold text-slate-800">{job.location || 'Từ xa/Tại văn phòng'}</span>
                  </div>
                </div>
              </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
               <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center border-b border-slate-100 pb-4">
                <span className="bg-blue-600 w-1.5 h-6 rounded-full mr-3"></span>
                Mô tả công việc
              </h2>
              {job.jdFileUrl && isJdImage && (
                <div className="mb-6">
                  <img
                    src={jdPreviewUrl}
                    alt="Ảnh mô tả công việc"
                    className="w-full rounded-xl border border-slate-200 object-contain"
                  />
                </div>
              )}
              <div 
                className="prose prose-slate max-w-none text-slate-600 whitespace-pre-line break-words [overflow-wrap:anywhere]"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </section>

             <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center border-b border-slate-100 pb-4">
                <span className="bg-indigo-600 w-1.5 h-6 rounded-full mr-3"></span>
                Yêu cầu ứng viên
              </h2>
              <div 
                className="prose prose-slate max-w-none text-slate-600 whitespace-pre-line break-words [overflow-wrap:anywhere]"
                dangerouslySetInnerHTML={{ __html: job.requirements }}
              />
            </section>
            
             <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center border-b border-slate-100 pb-4">
                 <span className="bg-green-600 w-1.5 h-6 rounded-full mr-3"></span>
                Quyền lợi được hưởng
              </h2>
              <div 
                className="prose prose-slate max-w-none text-slate-600 whitespace-pre-line break-words [overflow-wrap:anywhere]"
                dangerouslySetInnerHTML={{ __html: job.benefits }}
              />
            </section>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:sticky lg:top-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Thông tin ứng tuyển</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500 text-sm">Ngày đăng</span>
                  <span className="font-medium text-slate-900">{formatDate(job.createdAt)}</span>
                </div>
                 <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500 text-sm">Hạn nộp</span>
                  <span className="font-medium text-red-600">{formatDate(job.deadlineDate)}</span>
                </div>
                 <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500 text-sm">Trạng thái</span>
                   {daysLeft !== null && daysLeft > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Đang tuyển ({daysLeft} ngày)
                      </span>
                   ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Hết hạn
                      </span>
                   )}
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleApply}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5"
                >
                  Ứng tuyển ngay
                </button>
                 <button 
                  className="w-full flex justify-center items-center py-3 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
                >
                  Lưu tin (Yêu thích)
                </button>
              </div>

               <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Chia sẻ tin này</h4>
                  <div className="flex justify-center gap-4">
                     <button className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                     </button>
                      <button className="p-2 rounded-full bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Xác nhận ứng tuyển</h3>
            <p className="text-slate-500 text-sm mb-5">
              Bạn đang ứng tuyển vào: <span className="font-semibold text-slate-800">{job.title}</span>
            </p>

            {loadingCv ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                <span className="text-sm text-slate-500">Đang kiểm tra CV...</span>
              </div>
            ) : existingCv?.cvFileUrl ? (
              /* User already has a CV uploaded – no need to upload again */
              <div className="mb-5">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="p-2 bg-green-600 rounded-lg text-white shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800">CV của bạn đã sẵn sàng</div>
                    <div className="text-xs text-slate-500 mt-0.5">CV sẽ được tự động đính kèm vào hồ sơ ứng tuyển</div>
                  </div>
                  <a 
                    href={`/api/files/cv?url=${encodeURIComponent(existingCv.cvFileUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-blue-600 hover:underline font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    Xem CV
                  </a>
                </div>
              </div>
            ) : (
              /* No CV uploaded – allow optional file upload */
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Đính kèm CV (PDF) <span className="text-slate-400 font-normal">– Không bắt buộc</span>
                </label>
                <div
                  className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {cvFile ? (
                    <div className="flex items-center justify-center gap-2 text-blue-700">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium truncate max-w-[220px]">{cvFile.name}</span>
                      <button
                        className="text-slate-400 hover:text-red-500 ml-1"
                        onClick={(e) => { e.stopPropagation(); setCvFile(null); fileInputRef.current.value = ''; }}
                      >✕</button>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">
                      <svg className="w-8 h-8 mx-auto mb-1 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Nhấn để chọn file PDF
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Hệ thống sẽ dùng CV online của bạn nếu không đính kèm file.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                disabled={applying}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmApply}
                disabled={applying || loadingCv}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {applying && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
                {applying ? 'Đang nộp...' : 'Xác nhận ứng tuyển'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
