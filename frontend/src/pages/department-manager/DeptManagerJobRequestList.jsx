import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import deptManagerService from '../../services/deptManagerService';
import { FilterTabs, EmptyState, LoadingSpinner } from '../../components/shared';
import { getPriorityBadge, getStatusBadge } from '../../utils/helpers/badge';

export default function DeptManagerJobRequestList() {
  const navigate = useNavigate();
  const [jobRequests, setJobRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'draft', 'pending', 'approved'

  useEffect(() => {
    loadJobRequests();
  }, [filter]);

  const loadJobRequests = async () => {
    try {
      setLoading(true);
      const data = await deptManagerService.jobRequests.getAll();
      
      // Apply filter
      let filtered = data;
      if (filter === 'draft') {
        filtered = data.filter(jr => jr.statusCode === 'DRAFT');
      } else if (filter === 'pending') {
        filtered = data.filter(jr => jr.statusCode === 'SUBMITTED' || jr.statusCode === 'IN_REVIEW');
      } else if (filter === 'approved') {
        filtered = data.filter(jr => jr.statusCode === 'APPROVED');
      }
      
      setJobRequests(filtered);
    } catch (error) {
      console.error('Failed to load job requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0 
    }).format(amount);
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Job Requests
          </h1>
          <p className="text-gray-600">
            Manage recruitment requests for your department
          </p>
        </div>
        <button
          onClick={() => navigate('/staff/dept-manager/job-requests/new')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Request
        </button>
      </div>

      {/* Filter Tabs */}
      <FilterTabs
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'draft', label: 'Draft' },
          { id: 'pending', label: 'Pending' },
          { id: 'approved', label: 'Approved' }
        ]}
        activeTab={filter}
        onChange={setFilter}
      />

      {/* Job Requests List */}
      {loading ? (
        <LoadingSpinner />
      ) : jobRequests.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No job requests found"
          message={filter === 'all' ? 'Create your first job request to get started' : `No ${filter} requests`}
          action={filter === 'all' ? {
            label: '➨ Create Request',
            onClick: () => navigate('/staff/dept-manager/job-requests/new')
          } : null}
        />
      ) : (
        <div className="space-y-4">
          {jobRequests.map((request) => (
            <div
              key={request.id}
              onClick={() => navigate(`/staff/dept-manager/job-requests/${request.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {request.positionTitle}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Request #{request.id}</span>
                    <span>•</span>
                    <span>{request.departmentName}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const badge = getPriorityBadge(request.priority);
                    return (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    );
                  })()}
                  {(() => {
                    const badge = getStatusBadge(request.statusCode);
                    return (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Quantity</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {request.quantity} {request.quantity > 1 ? 'positions' : 'position'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Budget</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(request.budget)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Expected Start</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(request.expectedStartDate)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Created</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(request.createdAt)}
                  </div>
                </div>
              </div>

              {request.reason && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 mb-1">Reason</div>
                  <div className="text-sm text-gray-700 line-clamp-2">
                    {request.reason}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
