import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateService } from '../../services/candidateService';

export default function JobBoard() {
  const navigate = useNavigate();
  const [jobPostings, setJobPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobPostings();
  }, []);

  const fetchJobPostings = async () => {
    try {
      const data = await candidateService.getJobPostings();
      setJobPostings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Thỏa thuận';
    if (min && max) {
      return `${(min / 1000000).toFixed(0)} - ${(max / 1000000).toFixed(0)} triệu`;
    }
    return min ? `Từ ${(min / 1000000).toFixed(0)} triệu` : `Lên đến ${(max / 1000000).toFixed(0)} triệu`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleViewDetail = (id) => {
    navigate(`/app/jobs/${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 flex justify-center items-center h-64">
        <div className="text-gray-500 text-lg flex items-center gap-2">
            <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
            Đang tải danh sách tuyển dụng...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <div className="text-red-500 text-lg">Lỗi: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Việc làm đang tuyển</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Tìm kiếm cơ hội nghề nghiệp phù hợp với bạn trong hàng ngàn vị trí hấp dẫn</p>
      </div>

      {jobPostings.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 text-lg">Hiện tại chưa có tin tuyển dụng nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobPostings.map(job => {
            const daysLeft = getDaysLeft(job.deadlineDate);
            
            return (
              <div key={job.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{job.title}</h2>
                    {daysLeft !== null && daysLeft > 0 ? (
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${daysLeft < 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        Còn {daysLeft} ngày
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-600 text-sm">
                      <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{job.positionTitle}</span>
                    </div>

                    <div className="flex items-center text-gray-600 text-sm">
                      <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="truncate">{job.departmentName}</span>
                    </div>

                    {job.location && (
                      <div className="flex items-center text-gray-600 text-sm">
                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{job.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 mt-auto">
                    <div className="flex justify-between items-center mb-3">
                         <div className="flex items-center text-indigo-600 font-semibold text-sm">
                            <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </div>
                   </div>
                   
                   <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                       <span>Đăng: {formatDate(job.createdAt)}</span>
                        {job.deadlineDate && <span>Hạn: {formatDate(job.deadlineDate)}</span>}
                   </div>

                  <button 
                  onClick={() => handleViewDetail(job.id)} 
                  className="w-full inline-flex justify-center items-center px-4 py-2 bg-white border border-indigo-600 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors duration-200">
                    Xem chi tiết →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
