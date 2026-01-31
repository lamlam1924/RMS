import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { formatDate, formatTime, getTimeBadge } from '../../../utils/formatters';
import { InterviewTypeBadge, TimeBadge, StatusBadge } from '../../../components/shared/Badge';

export default function HRInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' or 'all'

  useEffect(() => {
    loadInterviews();
  }, [filter]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data = filter === 'upcoming'
        ? await hrService.interviews.getUpcoming()
        : await hrService.interviews.getAll();
      setInterviews(data);
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInterviewTypeBadge = (type) => {
    const styles = {
      'Phone': { bg: '#dbeafe', color: '#1e40af', icon: '📞' },
      'Video': { bg: '#e0e7ff', color: '#3730a3', icon: '💻' },
      'In-Person': { bg: '#dcfce7', color: '#166534', icon: '👥' },
      'Technical': { bg: '#fef3c7', color: '#92400e', icon: '⚡' }
    };
    const style = styles[type] || { bg: '#f3f4f6', color: '#374151', icon: '📋' };

    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: 16,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.icon} {type}
      </span>
    );
  };

  const isToday = (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    return today.toDateString() === checkDate.toDateString();
  };

  const isTomorrow = (date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkDate = new Date(date);
    return tomorrow.toDateString() === checkDate.toDateString();
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Interviews
            </h1>
            <p style={{ color: '#6b7280' }}>
              Manage and track candidate interviews
            </p>
          </div>
          <button
            onClick={() => navigate('/staff/hr-manager/interviews/create')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            + Schedule Interview
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setFilter('upcoming')}
          style={{
            padding: '8px 16px',
            backgroundColor: filter === 'upcoming' ? '#3b82f6' : 'white',
            color: filter === 'upcoming' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Upcoming ({interviews.filter(i => new Date(i.scheduledAt) > new Date()).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            backgroundColor: filter === 'all' ? '#3b82f6' : 'white',
            color: filter === 'all' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          All Interviews
        </button>
      </div>

      {/* Interviews List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : interviews.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: 40,
          textAlign: 'center',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No interviews scheduled</div>
          <div style={{ color: '#6b7280', marginBottom: 16 }}>
            {filter === 'upcoming' ? 'No upcoming interviews' : 'No interviews found'}
          </div>
          <button
            onClick={() => navigate('/staff/hr-manager/interviews/create')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Schedule First Interview
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {interviews.map((interview) => {
            const isPast = new Date(interview.scheduledAt) < new Date();
            const isUpcoming = isToday(interview.scheduledAt) || isTomorrow(interview.scheduledAt);

            return (
              <div
                key={interview.id}
                onClick={() => navigate(`/staff/hr-manager/interviews/${interview.id}`)}
                style={{
                  backgroundColor: 'white',
                  padding: 20,
                  borderRadius: 8,
                  border: `2px solid ${isUpcoming ? '#3b82f6' : '#e5e7eb'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  opacity: isPast ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Time Badge */}
                {isToday(interview.scheduledAt) && (
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 12
                  }}>
                    🔴 TODAY
                  </div>
                )}
                {isTomorrow(interview.scheduledAt) && (
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 12
                  }}>
                    ⏰ TOMORROW
                  </div>
                )}

                {/* Interview Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                      {interview.candidateName}
                    </div>
                    <div style={{ fontSize: 14, color: '#3b82f6', fontWeight: 500, marginBottom: 4 }}>
                      {interview.positionTitle}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                      {interview.departmentName}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {getInterviewTypeBadge(interview.interviewType)}
                  </div>
                </div>

                {/* Interview Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>📅 Date</div>
                    <div style={{ fontWeight: 600 }}>{formatDate(interview.scheduledAt)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>🕒 Time</div>
                    <div style={{ fontWeight: 600 }}>{formatTime(interview.scheduledAt)}</div>
                  </div>
                  {interview.location && (
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>📍 Location</div>
                      <div style={{ fontWeight: 500 }}>{interview.location}</div>
                    </div>
                  )}
                  {interview.interviewerName && (
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>👤 Interviewer</div>
                      <div style={{ fontWeight: 500 }}>{interview.interviewerName}</div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {interview.notes && (
                  <div style={{
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: '#f9fafb',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#374151'
                  }}>
                    <span style={{ fontWeight: 600 }}>Notes:</span> {interview.notes}
                  </div>
                )}

                {/* Past Interview Indicator */}
                {isPast && (
                  <div style={{
                    marginTop: 12,
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#6b7280',
                    textAlign: 'center'
                  }}>
                    ✓ Completed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
