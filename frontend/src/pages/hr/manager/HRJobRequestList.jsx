import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { PriorityBadge, StatusBadge } from '../../../components/shared/Badge';

export default function HRJobRequestList() {
  const navigate = useNavigate();
  const [jobRequests, setJobRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all' or 'pending'

  useEffect(() => {
    loadJobRequests();
  }, [filter]);

  const loadJobRequests = async () => {
    try {
      setLoading(true);
      const data = filter === 'pending'
        ? await hrService.jobRequests.getPending()
        : await hrService.jobRequests.getAll();
      setJobRequests(data);
    } catch (error) {
      console.error('Failed to load job requests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Job Requests
        </h1>
        <p style={{ color: '#6b7280' }}>
          Review and manage recruitment requests
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setFilter('pending')}
          style={{
            padding: '8px 16px',
            backgroundColor: filter === 'pending' ? '#3b82f6' : 'white',
            color: filter === 'pending' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Pending ({jobRequests.length})
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
          All Requests
        </button>
      </div>

      {/* Job Requests List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : jobRequests.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: 40,
          textAlign: 'center',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No job requests found</div>
          <div style={{ color: '#6b7280' }}>
            {filter === 'pending' ? 'All requests have been processed' : 'No requests available'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {jobRequests.map((request) => (
            <div
              key={request.id}
              onClick={() => navigate(`/staff/hr-manager/job-requests/${request.id}`)}
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                    {request.positionTitle}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>
                    {request.departmentName} • Requested by {request.requestedByName}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <PriorityBadge priority={request.priority} />
                  <StatusBadge statusId={request.statusId} statusName={request.currentStatus} />
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                marginTop: 16
              }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Quantity</div>
                  <div style={{ fontWeight: 600 }}>{request.quantity} position(s)</div>
                </div>
                {request.budget && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Budget</div>
                    <div style={{ fontWeight: 600, color: '#10b981' }}>
                      {formatCurrency(request.budget)}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Created</div>
                  <div style={{ fontWeight: 500 }}>{formatDate(request.createdAt)}</div>
                </div>
                {request.expectedStartDate && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Expected Start</div>
                    <div style={{ fontWeight: 500 }}>{formatDate(request.expectedStartDate)}</div>
                  </div>
                )}
              </div>

              {request.reason && (
                <div style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#374151'
                }}>
                  <span style={{ fontWeight: 600 }}>Reason:</span> {request.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
