import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { LoadingSpinner } from '../../../components/shared';
import { getStatusBadge } from '../../../utils/helpers/badge';
import notify from '../../../utils/notification';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export default function HRInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => { loadInterviews(); }, [filter]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data = filter === 'upcoming'
        ? await hrService.interviews.getUpcoming()
        : await hrService.interviews.getAll();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load interviews:', error);
      notify.error('Không thể tải danh sách phỏng vấn');
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Interviews</h1>
          <p style={{ color: '#6b7280' }}>Manage and track candidate interviews</p>
        </div>
        <button
          onClick={() => navigate('/staff/hr-manager/interviews/create')}
          style={{
            padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500
          }}
        >
          + Schedule Interview
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'all', label: 'All Interviews' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === tab.id ? '#3b82f6' : 'white',
              color: filter === tab.id ? 'white' : '#374151',
              border: '1px solid #d1d5db', borderRadius: 6,
              cursor: 'pointer', fontWeight: 500
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner />
      ) : interviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>No interviews scheduled</h3>
          <p style={{ color: '#6b7280' }}>{filter === 'upcoming' ? 'No upcoming interviews' : 'No interviews found'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {interviews.map((interview) => {
            const badge = getStatusBadge(interview.statusCode);
            return (
              <div
                key={interview.id}
                onClick={() => navigate(`/staff/hr-manager/interviews/${interview.id}`)}
                style={{
                  backgroundColor: 'white', padding: 20, borderRadius: 8,
                  border: '1px solid #e5e7eb', cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                      {interview.candidateName}
                    </h3>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                      Round {interview.roundNo} • {interview.positionTitle} • {interview.departmentName}
                    </div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
                    {interview.statusName || badge.label}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Start</div>
                    <div style={{ fontWeight: 500 }}>{formatDateTime(interview.startTime)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>End</div>
                    <div style={{ fontWeight: 500 }}>{formatDateTime(interview.endTime)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Location</div>
                    <div style={{ fontWeight: 500 }}>{interview.location || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Participants / Feedbacks</div>
                    <div style={{ fontWeight: 500 }}>{interview.participantCount} / {interview.feedbackCount}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
