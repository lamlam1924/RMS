import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import deptManagerService from "../../services/deptManagerService";
import { StatCard, LoadingSpinner } from "../../components/shared";
import { getPriorityBadge, getStatusBadge } from "../../utils/helpers/badge";

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
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Department Manager Dashboard
        </h1>
        <p className="text-gray-600">
          Manage recruitment requests and interviews for your department
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">📋</span>
            <span className="text-3xl font-bold">{stats.myJobRequests}</span>
          </div>
          <div className="text-emerald-100 text-sm font-medium">My Job Requests</div>
          <div className="text-emerald-50 text-xs mt-1">Total requests</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">⏳</span>
            <span className="text-3xl font-bold">{stats.pendingApproval}</span>
          </div>
          <div className="text-amber-100 text-sm font-medium">Pending Approval</div>
          <div className="text-amber-50 text-xs mt-1">Awaiting review</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">📅</span>
            <span className="text-3xl font-bold">{stats.upcomingInterviews}</span>
          </div>
          <div className="text-blue-100 text-sm font-medium">Upcoming Interviews</div>
          <div className="text-blue-50 text-xs mt-1">This week</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">👥</span>
            <span className="text-3xl font-bold">{stats.activeCandidates}</span>
          </div>
          <div className="text-purple-100 text-sm font-medium">Active Candidates</div>
          <div className="text-purple-50 text-xs mt-1">In process</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/staff/dept-manager/job-requests/new')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Job Request
          </button>
          <button
            onClick={() => navigate('/staff/dept-manager/job-requests')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all border border-gray-300 font-medium"
          >
            📋 View All Requests
          </button>
          <button
            onClick={() => navigate('/staff/dept-manager/interviews')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all border border-gray-300 font-medium"
          >
            📅 My Interviews
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Job Requests */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Job Requests
              </h2>
              <button
                onClick={() => navigate('/staff/dept-manager/job-requests')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                View All →
              </button>
            </div>
          </div>

          {recentJobRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-5xl mb-3">📋</div>
              <div className="text-sm">No job requests yet</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentJobRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => navigate(`/staff/dept-manager/job-requests/${request.id}`)}
                  className="p-4 hover:bg-blue-50 cursor-pointer transition-all border-l-4 border-transparent hover:border-blue-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-gray-900 text-sm flex-1">
                      {request.positionTitle}
                    </div>
                    {(() => {
                      const badge = getPriorityBadge(request.priority);
                      return (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold ml-2" style={{ backgroundColor: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Quantity: {request.quantity} • Budget: {request.budget ? `${(request.budget / 1000000).toFixed(0)}M VNĐ` : 'N/A'}
                  </div>
                  <div className="flex items-center justify-between">
                    {(() => {
                      const badge = getStatusBadge(request.statusCode);
                      return (
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-gray-400">
                      {formatDate(request.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Upcoming Interviews
              </h2>
              <button
                onClick={() => navigate('/staff/dept-manager/interviews')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                View All →
              </button>
            </div>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-5xl mb-3">📅</div>
              <div className="text-sm">No upcoming interviews</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  onClick={() => navigate(`/staff/dept-manager/interviews/${interview.id}`)}
                  className="p-4 hover:bg-purple-50 cursor-pointer transition-all border-l-4 border-transparent hover:border-purple-600"
                >
                  <div className="font-semibold text-gray-900 text-sm mb-2">
                    {interview.candidateName}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Position: {interview.positionTitle}
                  </div>
                  <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                    <span>📅</span>
                    <span>{formatDateTime(interview.startTime)}</span>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <span>📍</span>
                    <span className="truncate">{interview.location || interview.meetingLink || 'TBA'}</span>
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
