import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import employeeService from '../../services/employeeService';
import { FilterTabs, EmptyState, LoadingSpinner } from '../../components/shared';
import { getStatusBadge } from '../../utils/helpers/badge';

export default function EmployeeInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming'

  useEffect(() => {
    loadInterviews();
  }, [filter]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data = filter === 'upcoming' 
        ? await employeeService.interviews.getUpcoming()
        : await employeeService.interviews.getAll();
      setInterviews(data);
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          My Interviews
        </h1>
        <p style={{ color: '#6b7280' }}>
          Interviews where you are assigned as participant
        </p>
      </div>

      {/* Filter Tabs */}
      <FilterTabs
        tabs={[
          { id: 'all', label: 'All Interviews' },
          { id: 'upcoming', label: 'Upcoming' }
        ]}
        activeTab={filter}
        onChange={setFilter}
      />

      {/* Interviews List */}
      {loading ? (
        <LoadingSpinner />
      ) : interviews.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No interviews found"
          message={filter === 'upcoming' ? 'No upcoming interviews' : 'You have no assigned interviews'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {interviews.map((interview) => (
            <div
              key={interview.id}
              onClick={() => navigate(`/staff/employee/interviews/${interview.id}`)}
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              {/* Header with candidate name and status */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 12
              }}>
                <div>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: 4
                  }}>
                    {interview.candidateName}
                  </h3>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    Interview #{interview.id} • Round {interview.roundNo}
                  </div>
                </div>
                {(() => {
                  const badge = getStatusBadge(interview.statusCode);
                  return (
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: badge.bg,
                      color: badge.color
                    }}>
                      {badge.label}
                    </span>
                  );
                })()}
              </div>

              {/* Interview Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                marginBottom: 12
              }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Position</div>
                  <div style={{ fontWeight: 500 }}>{interview.positionTitle}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Department</div>
                  <div style={{ fontWeight: 500 }}>{interview.departmentName}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Time</div>
                  <div style={{ fontWeight: 500 }}>{formatDateTime(interview.startTime)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Location</div>
                  <div style={{ fontWeight: 500 }}>{interview.location}</div>
                </div>
              </div>

              {/* Feedback Status */}
              {interview.hasMyFeedback && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#d1fae5',
                  borderRadius: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: '#065f46'
                }}>
                  ✓ You submitted feedback
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
