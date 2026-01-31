import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import deptManagerService from '../../services/deptManagerService';
import { FilterTabs, EmptyState, LoadingSpinner } from '../../components/shared';
import { getPriorityBadge, getStatusBadge } from '../../utils/badgeHelpers';

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
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            Job Requests
          </h1>
          <p style={{ color: '#6b7280' }}>
            Manage recruitment requests for your department
          </p>
        </div>
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
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          ➕ New Request
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {jobRequests.map((request) => (
            <div
              key={request.id}
              onClick={() => navigate(`/staff/dept-manager/job-requests/${request.id}`)}
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
                    {request.positionTitle}
                  </h3>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    Request #{request.id}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {(() => {
                    const badge = getPriorityBadge(request.priority);
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
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 16,
                marginBottom: 12
              }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Quantity</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {request.quantity} positions
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Budget</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {formatCurrency(request.budget)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Expected Start</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {formatDate(request.expectedStartDate)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Created</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {formatDate(request.createdAt)}
                  </div>
                </div>
              </div>

              {request.reason && (
                <div style={{ 
                  padding: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 6,
                  marginTop: 12
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Reason</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>
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
