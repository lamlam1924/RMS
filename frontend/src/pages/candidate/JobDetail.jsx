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
  const [hasApplied, setHasApplied] = useState(false);
  const [selectedCvOption, setSelectedCvOption] = useState('latest');
  const [preferredLocations, setPreferredLocations] = useState([]);
  const [preferredLocationInput, setPreferredLocationInput] = useState('');
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);
  const fileInputRef = useRef(null);

  const selectedCvPreviewUrl = cvFile ? URL.createObjectURL(cvFile) : '';
  const latestCvPreviewUrl = existingCv?.cvFileUrl
    ? `/api/files/cv?url=${encodeURIComponent(existingCv.cvFileUrl)}`
    : '';

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  const fetchJobDetail = async () => {
    try {
      const data = await candidateService.getJobDetail(id);
      setJob(data);
      setHasApplied(Boolean(data?.isApplied));
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
    if (hasApplied) {
      notify.info('Bạn đã ứng tuyển vị trí này rồi');
      return;
    }

    setCvFile(null);
    setExistingCv(null);
    setSelectedCvOption('latest');
    setHasAcceptedPrivacy(false);
    setPreferredLocationInput('');
    setPreferredLocations(job?.location ? [job.location] : []);
    setShowApplyModal(true);
    setLoadingCv(true);
    try {
      const cv = await candidateService.getMyCv();
      setExistingCv(cv);
      setSelectedCvOption(cv?.cvFileUrl ? 'latest' : 'upload');
    } catch {
      setExistingCv(null);
      setSelectedCvOption('upload');
    } finally {
      setLoadingCv(false);
    }
  };

  const handleAddPreferredLocation = () => {
    const normalized = preferredLocationInput.trim();
    if (!normalized) return;
    if (preferredLocations.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      setPreferredLocationInput('');
      return;
    }
    setPreferredLocations((prev) => [...prev, normalized]);
    setPreferredLocationInput('');
  };

  const handleRemovePreferredLocation = (locationToRemove) => {
    setPreferredLocations((prev) => prev.filter((item) => item !== locationToRemove));
  };

  const closeApplyModal = () => {
    if (applying) return;
    setShowApplyModal(false);
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
    if (!hasAcceptedPrivacy) {
      notify.error('Vui lòng đồng ý thỏa thuận sử dụng dữ liệu cá nhân');
      return;
    }

    if (!preferredLocations.length) {
      notify.error('Vui lòng nhập ít nhất một địa điểm làm việc mong muốn');
      return;
    }

    if (selectedCvOption === 'upload' && !cvFile) {
      notify.error('Vui lòng chọn file CV để tải lên');
      return;
    }

    if (selectedCvOption === 'latest' && !existingCv?.cvFileUrl) {
      notify.error('Bạn chưa có CV gần nhất. Vui lòng tải CV từ máy lên');
      return;
    }

    setApplying(true);
    try {
      const uploadFile = selectedCvOption === 'upload' ? cvFile : null;
      await candidateService.applyToJob(id, uploadFile);
      notify.success('Nộp đơn ứng tuyển thành công!');
      setShowApplyModal(false);
      setHasApplied(true);
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
              <div className="flex flex-wrap items-start gap-3 mb-6">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">{job.title}</h1>
                {hasApplied && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 mt-1">
                    Đã ứng tuyển
                  </span>
                )}
              </div>
              
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
                {hasApplied ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/app/applications?jobRequestId=${job.jobRequestId}`)}
                    className="w-full flex justify-center items-center py-3 px-4 border border-blue-200 rounded-xl shadow-sm text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    Đã ứng tuyển • Xem hồ sơ
                  </button>
                ) : (
                  <button
                    onClick={handleApply}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5"
                  >
                    Ứng tuyển ngay
                  </button>
                )}
                {!hasApplied && (
                  <button
                    className="w-full flex justify-center items-center py-3 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
                  >
                    Lưu tin (Yêu thích)
                  </button>
                )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 md:px-4 py-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[760px] max-h-[92vh] overflow-hidden">
            <div className="px-5 md:px-8 pt-5 md:pt-6 pb-4 border-b border-slate-200 flex items-start justify-between gap-4">
              <h3 className="text-2xl font-bold text-slate-900 leading-snug">{job.title}</h3>
              <button
                onClick={closeApplyModal}
                disabled={applying}
                className="shrink-0 h-9 w-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50"
                aria-label="Đóng"
              >
                <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 md:px-8 py-5 md:py-6 overflow-y-auto max-h-[calc(92vh-82px)] space-y-4">
              {loadingCv ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                  <span className="text-sm text-slate-500">Đang kiểm tra CV...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <label className="block border border-slate-200 rounded-lg p-4 cursor-pointer transition-colors hover:border-blue-300">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="cv-source"
                          checked={selectedCvOption === 'latest'}
                          onChange={() => setSelectedCvOption('latest')}
                          className="mt-1 h-5 w-5 accent-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-base font-semibold text-blue-700">
                              CV ứng tuyển gần nhất: {existingCv?.cvFileName || 'CV online của bạn'}
                            </p>
                            {latestCvPreviewUrl && (
                              <a
                                href={latestCvPreviewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 font-semibold hover:underline text-sm shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Xem CV đã chọn
                              </a>
                            )}
                          </div>
                          <div className="text-slate-700 mt-2 space-y-1 text-sm">
                            <p>Họ và tên: <span className="font-semibold">{existingCv?.fullName || 'Hồ sơ ứng viên'}</span></p>
                            <p>Email: <span className="font-semibold">{existingCv?.email || 'Thông tin từ hồ sơ'}</span></p>
                            <p>Số điện thoại: <span className="font-semibold">{existingCv?.phone || 'Thông tin từ hồ sơ'}</span></p>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="block border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-pointer transition-colors hover:border-blue-500">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="cv-source"
                          checked={selectedCvOption === 'upload'}
                          onChange={() => setSelectedCvOption('upload')}
                          className="mt-1 h-5 w-5 accent-blue-600"
                        />
                        <div className="flex-1 text-center" onClick={() => fileInputRef.current?.click()}>
                          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-7l-3-3m0 0L10 9m3-3v9" />
                            </svg>
                          </div>
                          <p className="text-base font-semibold text-slate-700">Tải lên CV từ máy tính, chọn hoặc kéo thả</p>
                          <p className="text-sm text-slate-400 mt-1">Hỗ trợ định dạng .doc, .docx, .pdf có kích thước dưới 5MB</p>
                          <button
                            type="button"
                            className="mt-3 px-6 py-2 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700 transition-colors"
                          >
                            Chọn CV
                          </button>
                          {cvFile && <p className="text-sm text-blue-700 font-medium mt-2 truncate">{cvFile.name}</p>}
                          {selectedCvOption === 'upload' && cvFile && (
                            <a
                              href={selectedCvPreviewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-block mt-2 text-sm text-blue-600 font-semibold hover:underline"
                            >
                              Xem CV đã chọn
                            </a>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-slate-800 mb-2">Địa điểm làm việc mong muốn <span className="text-red-500">*</span></label>
                    <div className="min-h-[56px] flex items-center flex-wrap gap-2 px-3 py-2 border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-500">
                      {preferredLocations.map((location) => (
                        <span key={location} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm">
                          {location}
                          <button
                            type="button"
                            className="text-slate-400 hover:text-red-500"
                            onClick={() => handleRemovePreferredLocation(location)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        value={preferredLocationInput}
                        onChange={(e) => setPreferredLocationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPreferredLocation();
                          }
                        }}
                        onBlur={handleAddPreferredLocation}
                        className="flex-1 min-w-[140px] outline-none text-sm text-slate-700"
                        placeholder={preferredLocations.length ? '' : 'Nhập địa điểm mong muốn'}
                      />
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Nhập địa điểm rồi nhấn Enter để thêm. Thông tin này phục vụ cho hồ sơ ứng tuyển hiện tại.</p>
                  </div>

                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={hasAcceptedPrivacy}
                      onChange={(e) => setHasAcceptedPrivacy(e.target.checked)}
                      className="h-5 w-5 mt-0.5 rounded accent-blue-600"
                    />
                    <span>
                      Tôi đã đọc và đồng ý với <span className="text-blue-600 font-semibold">"Thỏa thuận sử dụng dữ liệu cá nhân"</span> của Nhà tuyển dụng
                    </span>
                  </label>

                  <button
                    onClick={handleConfirmApply}
                    disabled={applying || loadingCv || !hasAcceptedPrivacy}
                    className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {applying && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
                    {applying ? 'Đang nộp...' : 'Nộp hồ sơ ứng tuyển'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
