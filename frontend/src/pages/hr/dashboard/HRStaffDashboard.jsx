import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';

export default function HRStaffDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedJobRequests: 0,
    myJobPostings: 0,
    upcomingInterviews: 0,
    approvedOffersToSend: 0,
  });
  const [assignedJobRequests, setAssignedJobRequests] = useState([]);
  const [myJobPostings, setMyJobPostings] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [offersToSend, setOffersToSend] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const [jobRequestsResult, jobPostingsResult, interviewsResult, approvedOffersResult] = await Promise.allSettled([
        hrService.jobRequests.getApprovedForMe(),
        hrService.jobPostings.getMy(),
        hrService.interviews.getUpcoming(),
        hrService.offers.getApproved(),
      ]);

      const jobRequests = jobRequestsResult.status === 'fulfilled' ? jobRequestsResult.value : [];
      const jobPostings = jobPostingsResult.status === 'fulfilled' ? jobPostingsResult.value : [];
      const interviews = interviewsResult.status === 'fulfilled' ? interviewsResult.value : [];
      const approvedOffers = approvedOffersResult.status === 'fulfilled' ? approvedOffersResult.value : [];

      if (jobRequestsResult.status === 'rejected' || jobPostingsResult.status === 'rejected'
        || interviewsResult.status === 'rejected' || approvedOffersResult.status === 'rejected') {
        setError('Một phần dữ liệu không tải được. Bạn có thể làm mới để thử lại.');
      }

      setAssignedJobRequests(jobRequests.slice(0, 5));
      setMyJobPostings(jobPostings.slice(0, 5));
      setUpcomingInterviews(interviews.slice(0, 5));
      setOffersToSend(approvedOffers.slice(0, 5));

      setStats({
        assignedJobRequests: jobRequests.length,
        myJobPostings: jobPostings.length,
        upcomingInterviews: interviews.length,
        approvedOffersToSend: approvedOffers.length,
      });
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('vi-VN');
  };

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Đang tải bảng điều khiển...</div>;
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Bảng điều khiển Nhân viên Nhân sự
        </h1>
        <p style={{ color: '#6b7280' }}>
          Theo dõi công việc được giao và tiến độ thực thi hằng ngày
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 6, border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard title="Yêu cầu được giao" value={stats.assignedJobRequests} hint="Yêu cầu tuyển dụng đã được duyệt và giao cho bạn" color="#2563eb" onClick={() => navigate('/staff/hr-staff/job-requests')} />
        <StatCard title="Tin tuyển dụng của tôi" value={stats.myJobPostings} hint="Tin tuyển dụng được giao xử lý" color="#10b981" onClick={() => navigate('/staff/hr-staff/job-postings')} />
        <StatCard title="Phỏng vấn sắp tới" value={stats.upcomingInterviews} hint="Lịch phỏng vấn thuộc các yêu cầu bạn đang phụ trách" color="#f59e0b" onClick={() => navigate('/staff/hr-manager/interviews')} />
        <StatCard title="Offer chờ gửi" value={stats.approvedOffersToSend} hint="Offer đã duyệt, chờ gửi ứng viên" color="#7c3aed" onClick={() => navigate('/staff/hr-manager/offers')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Panel
          title="Yêu cầu tuyển dụng được giao"
          actionLabel="Xem tất cả"
          onAction={() => navigate('/staff/hr-staff/job-requests')}
          emptyText="Không có yêu cầu nào được giao"
          items={assignedJobRequests}
          renderItem={(item) => (
            <>
              <div style={{ fontWeight: 600 }}>{item.positionTitle || 'N/A'}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{item.departmentName || 'N/A'}</div>
            </>
          )}
        />

        <Panel
          title="Offer cần gửi"
          actionLabel="Xem tất cả"
          onAction={() => navigate('/staff/hr-manager/offers')}
          emptyText="Không có offer nào cần gửi"
          items={offersToSend}
          renderItem={(item) => (
            <>
              <div style={{ fontWeight: 600 }}>{item.candidateName || 'N/A'}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{item.positionTitle || 'N/A'}</div>
            </>
          )}
        />

        <Panel
          title="Tin tuyển dụng của tôi"
          actionLabel="Quản lý"
          onAction={() => navigate('/staff/hr-staff/job-postings')}
          emptyText="Không có tin tuyển dụng được giao"
          items={myJobPostings}
          renderItem={(item) => (
            <>
              <div style={{ fontWeight: 600 }}>{item.title || item.positionTitle || 'N/A'}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{item.departmentName || 'N/A'}</div>
            </>
          )}
        />

        <Panel
          title="Phỏng vấn sắp tới"
          actionLabel="Xem lịch"
          onAction={() => navigate('/staff/hr-manager/interviews')}
          emptyText="Không có lịch phỏng vấn sắp tới"
          items={upcomingInterviews}
          renderItem={(item) => (
            <>
              <div style={{ fontWeight: 600 }}>{item.candidateName || 'N/A'}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{item.positionTitle || 'N/A'}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatDateTime(item.scheduledAt || item.startTime)}</div>
            </>
          )}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, hint, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 18,
        borderLeft: `4px solid ${color}`,
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: 13, color: '#6b7280' }}>{title}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: '#111827', marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>{hint}</div>
    </div>
  );
}

function Panel({ title, actionLabel, onAction, emptyText, items, renderItem }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600 }}>{title}</h2>
        <button onClick={onAction} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12 }}>
          {actionLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: 13, padding: 8 }}>{emptyText}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item, idx) => (
            <div key={item.id || idx} style={{ border: '1px solid #f1f5f9', borderRadius: 6, padding: 10 }}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
