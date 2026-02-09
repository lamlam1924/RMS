import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import deptManagerService from '../../services/deptManagerService';
import { LoadingSpinner } from '../../components/shared';
import { getStatusBadge } from '../../utils/helpers/badge';

export default function DeptManagerInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'

  useEffect(() => {
    loadInterviews();
  }, [filter]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      let data = [];
      
      if (filter === 'upcoming') {
        data = await deptManagerService.interviews.getUpcoming();
      } else {
        data = await deptManagerService.interviews.getAll();
        
        if (filter === 'past') {
          const now = new Date();
          data = data.filter(i => new Date(i.startTime) < now);
        }
      }
      
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

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          My Interviews
        </h1>
        <p style={{ color: '#6b7280' }}>
          Interviews where you are participating as department manager
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'past', label: 'Past' },
          { id: 'all', label: 'All' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              color: filter === tab.id ? '#3b82f6' : '#6b7280',
              borderBottom: filter === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interviews List */}
      {loading ? (
        <LoadingSpinner />
      ) : interviews.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 60,
          backgroundColor: 'white',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>No interviews found</h3>
          <p style={{ color: '#6b7280' }}>{filter === 'upcoming' ? 'No upcoming interviews scheduled' : `No ${filter} interviews`}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {interviews.map((interview) => (
            <div
              key={interview.id}
              onClick={() => navigate(`/staff/dept-manager/interviews/${interview.id}`)}
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 8,
                border: `2px solid ${isUpcoming(interview.startTime) ? '#3b82f6' : '#e5e7eb'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              }}
            >
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
                    marginBottom: 6
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

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 16,
                marginBottom: 12
              }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Position</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {interview.positionTitle}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Date & Time</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    📅 {formatDateTime(interview.startTime)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Duration</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    ⏱️ {formatDateTime(interview.startTime)} - {new Date(interview.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div style={{ 
                padding: 12,
                backgroundColor: '#f9fafb',
                borderRadius: 6,
                marginTop: 12
              }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Location</div>
                <div style={{ fontSize: 13, color: '#374151' }}>
                  📍 {interview.location || interview.meetingLink || 'TBA'}
                </div>
              </div>

              {interview.participants && interview.participants.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Interviewers</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {interview.participants.map((p, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#eff6ff',
                          color: '#1e40af',
                          borderRadius: 4,
                          fontSize: 12
                        }}
                      >
                        {p.name} ({p.role})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isUpcoming(interview.startTime) && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  backgroundColor: '#dbeafe',
                  borderRadius: 6,
                  fontSize: 12,
                  color: '#1e40af',
                  fontWeight: 500
                }}>
                  ⚠️ Upcoming interview - Please prepare your evaluation
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
