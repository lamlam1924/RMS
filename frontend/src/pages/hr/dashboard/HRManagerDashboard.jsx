import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import WorkflowOverviewWidget from '../../../components/hr/WorkflowOverviewWidget';
import { formatCurrency, formatDate, formatDateRelative, formatTime } from '../../../utils/formatters/display';
import { PriorityBadge } from '../../../components/shared/Badge';

export default function HRManagerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingJobRequests: 0,
    totalApplications: 0,
    upcomingInterviews: 0,
    pendingOffers: 0,
    screeningApplications: 0,
    interviewingApplications: 0,
    activeJobPostings: 0
  });
  const [funnelData, setFunnelData] = useState([]);
  const [recentJobRequests, setRecentJobRequests] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [pendingOffers, setPendingOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load statistics
      const statsData = await hrService.statistics.getDashboard();
      setStats(statsData);

      // Load funnel
      const funnel = await hrService.statistics.getRecruitmentFunnel();
      setFunnelData(funnel);

      // Load recent job requests
      const jobRequests = await hrService.jobRequests.getPending();
      setRecentJobRequests(jobRequests.slice(0, 5));

      // Load upcoming interviews
      const interviews = await hrService.interviews.getUpcoming();
      setUpcomingInterviews(interviews.slice(0, 5));

      // Load pending offers
      const offers = await hrService.offers.getPending();
      setPendingOffers(offers.slice(0, 6));

    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString('vi-VN');
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      1: { bg: '#fee2e2', color: '#991b1b', label: 'Khẩn cấp' },
      2: { bg: '#ffedd5', color: '#9a3412', label: 'Cao' },
      3: { bg: '#dbeafe', color: '#1d4ed8', label: 'Bình thường' }
    };
    const style = styles[priority] || styles[3];
    
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          HR Manager Dashboard
        </h1>
        <p style={{ color: '#6b7280' }}>
          Strategic oversight and approval management
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        <div style={{ 
          background: 'white', 
          padding: 20, 
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            Pending Job Requests
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>
            {stats.pendingJobRequests}
          </div>
          <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 8, cursor: 'pointer' }}
               onClick={() => navigate('/staff/hr-manager/job-requests')}>
            View all →
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: 20, 
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            Total Applications
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>
            {stats.totalApplications}
          </div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 8 }}>
            {stats.screeningApplications} screening, {stats.interviewingApplications} interviewing
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: 20, 
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            Upcoming Interviews
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>
            {stats.upcomingInterviews}
          </div>
          <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 8, cursor: 'pointer' }}
               onClick={() => navigate('/staff/interviews')}>
            Manage →
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: 20, 
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #8b5cf6'
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            Pending Offers
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>
            {stats.pendingOffers}
          </div>
          <div style={{ fontSize: 12, color: '#8b5cf6', marginTop: 8, cursor: 'pointer' }}
               onClick={() => navigate('/staff/hr-manager/offers')}>
            Review →
          </div>
        </div>
      </div>

      {/* Workflow Overview Widget */}
      <div style={{ marginBottom: 32 }}>
        <WorkflowOverviewWidget />
      </div>

      {/* Recruitment Funnel */}
      <div style={{ 
        background: 'white', 
        padding: 24, 
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        marginBottom: 24
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Recruitment Funnel
        </h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 200 }}>
          {funnelData.map((stage, index) => {
            const maxCount = Math.max(...funnelData.map(s => s.count));
            const height = (stage.count / maxCount) * 160;
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            
            return (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '100%',
                  height: height,
                  backgroundColor: colors[index % colors.length],
                  borderRadius: '4px 4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 18
                }}>
                  {stage.count}
                </div>
                <div style={{ 
                  marginTop: 8, 
                  fontSize: 12, 
                  fontWeight: 500,
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  {stage.stage}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Recent Job Requests */}
        <div style={{ 
          background: 'white', 
          padding: 24, 
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Recent Job Requests</h2>
            <button 
              onClick={() => navigate('/staff/hr-manager/job-requests')}
              style={{ 
                fontSize: 12, 
                color: '#3b82f6', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer' 
              }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentJobRequests.length === 0 ? (
              <div style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>
                No pending job requests
              </div>
            ) : (
              recentJobRequests.map((req) => (
                <div 
                  key={req.id}
                  style={{ 
                    padding: 12, 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => navigate(`/staff/hr-manager/job-requests/${req.id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{req.positionTitle}</div>
                    {getPriorityBadge(req.priority)}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    {req.departmentName} • {req.quantity} position{req.quantity > 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    {formatDate(req.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div style={{ 
          background: 'white', 
          padding: 24, 
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Upcoming Interviews</h2>
            <button 
              onClick={() => navigate('/staff/interviews')}
              style={{ 
                fontSize: 12, 
                color: '#3b82f6', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer' 
              }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcomingInterviews.length === 0 ? (
              <div style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>
                No upcoming interviews
              </div>
            ) : (
              upcomingInterviews.map((interview) => (
                <div 
                  key={interview.id}
                  style={{ 
                    padding: 12, 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/staff/interviews/${interview.id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {interview.candidateName}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    {interview.positionTitle}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    📅 {new Date(interview.scheduledAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pending Offers */}
      <div style={{ 
        background: 'white', 
        padding: 24, 
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Pending Offers for Review</h2>
          <button 
            onClick={() => navigate('/staff/hr-manager/offers')}
            style={{ 
              fontSize: 12, 
              color: '#3b82f6', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer' 
            }}>
            View all →
          </button>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16 
        }}>
          {pendingOffers.length === 0 ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: 20, gridColumn: '1 / -1' }}>
              No pending offers
            </div>
          ) : (
            pendingOffers.map((offer) => (
              <div 
                key={offer.id}
                style={{ 
                  padding: 16, 
                  border: '1px solid #e5e7eb', 
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/staff/hr-manager/offers/${offer.id}`)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                  {offer.candidateName}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                  {offer.positionTitle}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>
                  {formatCurrency(offer.salary)}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  Start: {new Date(offer.startDate).toLocaleDateString('vi-VN')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Key Responsibilities */}
      <div style={{ 
        background: 'white', 
        padding: 24, 
        borderRadius: 8,
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Your Key Responsibilities
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, backgroundColor: '#f0f9ff', borderRadius: 6 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#0369a1' }}>
              📋 Job Request Approval
            </div>
            <div style={{ fontSize: 13, color: '#475569' }}>
              Review and approve recruitment requests from departments (SUBMITTED → IN_REVIEW)
            </div>
          </div>
          <div style={{ padding: 16, backgroundColor: '#f0fdf4', borderRadius: 6 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#15803d' }}>
              📄 Offer Management
            </div>
            <div style={{ fontSize: 13, color: '#475569' }}>
              Review offer packages before director approval (IN_REVIEW → IN_REVIEW)
            </div>
          </div>
          <div style={{ padding: 16, backgroundColor: '#fef3c7', borderRadius: 6 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#92400e' }}>
              🎯 Job Posting Control
            </div>
            <div style={{ fontSize: 13, color: '#475569' }}>
              Close job postings when recruitment is complete (PUBLISHED → CLOSED)
            </div>
          </div>
          <div style={{ padding: 16, backgroundColor: '#fef2f2', borderRadius: 6 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#991b1b' }}>
              ❌ Rejection Authority
            </div>
            <div style={{ fontSize: 13, color: '#475569' }}>
              Reject unsuitable applications or offers (INTERVIEWING/IN_REVIEW → REJECTED)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
