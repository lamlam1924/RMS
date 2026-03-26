import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';

export default function RecruitmentReportDashboard() {
  const [jobId, setJobId] = useState('');
  const [jobRequests, setJobRequests] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [summary, setSummary] = useState({
    totalApply: 0,
    totalOffer: 0,
    totalRejectOffer: 0,
    totalHired: 0
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const jobParam = jobId ? Number(jobId) : undefined;
      const [daily, sum] = await Promise.all([
        hrService.reports.getApplyDaily(jobParam),
        hrService.reports.getSummary(jobParam)
      ]);
      setDailyData(daily || []);
      setSummary(sum || { totalApply: 0, totalOffer: 0, totalRejectOffer: 0, totalHired: 0 });
    } catch (error) {
      notify.error(error.message || 'Không thể tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadJobRequests();
  }, []);

  const loadJobRequests = async () => {
    try {
      const data = await hrService.jobRequests.getAll();
      setJobRequests(data || []);
    } catch (error) {
      notify.error(error.message || 'Không thể tải danh sách Job Request');
      setJobRequests([]);
    }
  };

  const hireRate = useMemo(() => {
    if (!summary.totalApply) return 0;
    return (summary.totalHired / summary.totalApply) * 100;
  }, [summary.totalApply, summary.totalHired]);

  const rejectRate = useMemo(() => {
    if (!summary.totalOffer) return 0;
    return (summary.totalRejectOffer / summary.totalOffer) * 100;
  }, [summary.totalOffer, summary.totalRejectOffer]);

  const comparisonData = [
    { name: 'Apply', value: summary.totalApply },
    { name: 'Reject Offer', value: summary.totalRejectOffer },
    { name: 'Hired', value: summary.totalHired }
  ];

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Recruitment Reporting Dashboard</h1>
        <p style={{ color: '#6b7280' }}>Theo doi hieu qua tuyen dung theo Job Request</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', minWidth: 420 }}
        >
          <option value="">Tất cả Job Request</option>
          {jobRequests.map((job) => (
            <option key={job.id} value={job.id}>
              #{job.id} - {job.positionTitle || 'N/A'} ({job.departmentName || 'N/A'})
            </option>
          ))}
        </select>
        <button
          onClick={loadData}
          style={{ padding: '10px 16px', border: 'none', borderRadius: 8, backgroundColor: '#2563eb', color: 'white', cursor: 'pointer' }}
        >
          Lọc dữ liệu
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Total Apply" value={summary.totalApply} />
        <KpiCard label="Total Offer" value={summary.totalOffer} />
        <KpiCard label="Total Reject Offer" value={summary.totalRejectOffer} />
        <KpiCard label="Total Hired" value={summary.totalHired} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={rateCardStyle}>
          <div style={{ color: '#6b7280', marginBottom: 6 }}>Hire Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>{hireRate.toFixed(2)}%</div>
        </div>
        <div style={rateCardStyle}>
          <div style={{ color: '#6b7280', marginBottom: 6 }}>Reject Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>{rejectRate.toFixed(2)}%</div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: 10, border: '1px solid #e5e7eb', padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Daily Applications (Line Chart)</h3>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalApply" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: 10, border: '1px solid #e5e7eb', padding: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Summary Comparison (Bar Chart)</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {loading && <p style={{ marginTop: 12, color: '#6b7280' }}>Dang tai...</p>}
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: 10, border: '1px solid #e5e7eb', padding: 16 }}>
      <div style={{ color: '#6b7280', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const rateCardStyle = {
  backgroundColor: 'white',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  padding: 16
};
