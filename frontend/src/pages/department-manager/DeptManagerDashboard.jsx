import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import deptManagerService from "../../services/deptManagerService";
import { StatCard, LoadingSpinner } from "../../components/shared";
import { getPriorityBadge, getStatusBadge } from "../../utils/badgeHelpers";

const DeptManagerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    myJobRequests: 0,
    pendingApproval: 0,
    upcomingInterviews: 0,
    activeCandidates: 0,
  });
  const [recentJobRequests, setRecentJobRequests] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [jobRequests, interviews] = await Promise.all([
        deptManagerService.jobRequests.getAll(),
        deptManagerService.interviews.getUpcoming(),
      ]);

      const pendingApprovalCount = jobRequests.filter(
        jr => jr.statusCode === 'DRAFT' || jr.statusCode === 'SUBMITTED'
      ).length;

      setStats({
        myJobRequests: jobRequests.length,
        pendingApproval: pendingApprovalCount,
        upcomingInterviews: interviews.length,
        activeCandidates: interviews.length, // Simplified
      });

      setRecentJobRequests(jobRequests.slice(0, 5));
      setUpcomingInterviews(interviews.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Department Manager Dashboard
        </h1>
        <p style={{ color: '#6b7280' }}>
          Manage recruitment requests and interviews for your department
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 16, 
        marginBottom: 32 
      }}>
        <StatCard
          label="My Job Requests"
          value={stats.myJobRequests}
          subtext="Total requests"
          color="#10b981"
          icon="📋"
        />
        <StatCard
          label="Pending Approval"
          value={stats.pendingApproval}
          subtext="Awaiting review"
          color="#f59e0b"
          icon="⏳"
        />
        <StatCard
          label="Upcoming Interviews"
          value={stats.upcomingInterviews}
          subtext="This week"
          color="#3b82f6"
          icon="📅"
        />
        <StatCard
          label="Active Candidates"
          value={stats.activeCandidates}
          subtext="In process"
          color="#10b981"
          icon="👥"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/staff/dept-manager/job-requests/new')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14
            }}
          >
            ➕ Create Job Request
          </button>
          <button
            onClick={() => navigate('/staff/dept-manager/job-requests')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14
            }}
          >
            📋 View All Requests
          </button>
          <button
            onClick={() => navigate('/staff/dept-manager/interviews')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14
            }}
          >
            📅 My Interviews
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: 24 
      }}>
        {/* Recent Job Requests */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: 20, 
          borderRadius: 8, 
          border: '1px solid #e5e7eb' 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16 
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
              Recent Job Requests
            </h2>
            <button
              onClick={() => navigate('/staff/dept-manager/job-requests')}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                color: '#3b82f6',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500
              }}
            >
              View All →
            </button>
          </div>

          {recentJobRequests.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 40, 
              color: '#6b7280' 
            }}>
              No job requests yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentJobRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => navigate(`/staff/dept-manager/job-requests/${request.id}`)}
                  style={{
                    padding: 14,
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: 8 
                  }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>
                      {request.positionTitle}
                    </div>
                    {(() => {
                      const badge = getPriorityBadge(request.priority);
                      return (
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: badge.bg,
                          color: badge.color
                        }}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                    Quantity: {request.quantity} • Budget: {request.budget ? `${(request.budget / 1000000).toFixed(0)}M VNĐ` : 'N/A'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {(() => {
                      const badge = getStatusBadge(request.statusCode);
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
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      {formatDate(request.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Interviews */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: 20, 
          borderRadius: 8, 
          border: '1px solid #e5e7eb' 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16 
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
              Upcoming Interviews
            </h2>
            <button
              onClick={() => navigate('/staff/dept-manager/interviews')}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                color: '#3b82f6',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500
              }}
            >
              View All →
            </button>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 40, 
              color: '#6b7280' 
            }}>
              No upcoming interviews
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  onClick={() => navigate(`/staff/dept-manager/interviews/${interview.id}`)}
                  style={{
                    padding: 14,
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: 14, marginBottom: 6 }}>
                    {interview.candidateName}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                    Position: {interview.positionTitle}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                    📅 {formatDateTime(interview.startTime)}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    📍 {interview.location || interview.meetingLink || 'TBA'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeptManagerDashboard;
