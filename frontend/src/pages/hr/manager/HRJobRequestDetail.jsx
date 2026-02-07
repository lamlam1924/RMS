import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters/display';
import { PriorityBadge, StatusBadge } from '../../../components/shared/Badge';

export default function HRJobRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobRequest, setJobRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobRequest();
  }, [id]);

  const loadJobRequest = async () => {
    try {
      setLoading(true);
      const data = await hrService.jobRequests.getById(id);
      setJobRequest(data);
    } catch (error) {
      console.error('Failed to load job request:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = { 1: 'Urgent', 2: 'High', 3: 'Normal' };
    return labels[priority] || 'Normal';
  };

  const getPriorityColor = (priority) => {
    const colors = { 1: '#dc2626', 2: '#f59e0b', 3: '#3b82f6' };
    return colors[priority] || '#3b82f6';
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!jobRequest) {
    return <div style={{ padding: 24 }}>Job request not found</div>;
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/staff/hr-manager/job-requests')}
          style={{
            marginBottom: 16,
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          ← Back to Job Requests
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Job Request Details
        </h1>
      </div>

      {/* Main Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Position</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{jobRequest.positionTitle}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Department</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{jobRequest.departmentName}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Requested By</div>
            <div style={{ fontSize: 16 }}>{jobRequest.requestedByName}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Current Status</div>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              borderRadius: 16,
              fontSize: 14,
              fontWeight: 500
            }}>
              {jobRequest.currentStatus}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Quantity</div>
            <div style={{ fontSize: 16 }}>{jobRequest.quantity} position(s)</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Priority</div>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: `${getPriorityColor(jobRequest.priority)}20`,
              color: getPriorityColor(jobRequest.priority),
              borderRadius: 16,
              fontSize: 14,
              fontWeight: 600
            }}>
              {getPriorityLabel(jobRequest.priority)}
            </div>
          </div>
          {jobRequest.budget && (
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Budget</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(jobRequest.budget)}
              </div>
            </div>
          )}
          {jobRequest.expectedStartDate && (
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Expected Start Date</div>
              <div style={{ fontSize: 16 }}>
                {new Date(jobRequest.expectedStartDate).toLocaleDateString('vi-VN')}
              </div>
            </div>
          )}
        </div>

        {jobRequest.reason && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Reason</div>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              {jobRequest.reason}
            </div>
          </div>
        )}
      </div>

      {/* Status History */}
      {jobRequest.statusHistory && jobRequest.statusHistory.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          padding: 24
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Status History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {jobRequest.statusHistory.map((history, index) => (
              <div key={index} style={{
                padding: 16,
                backgroundColor: '#f9fafb',
                borderRadius: 6,
                borderLeft: '3px solid #3b82f6'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#ef4444' }}>{history.fromStatus}</span>
                    <span style={{ margin: '0 8px', color: '#6b7280' }}>→</span>
                    <span style={{ fontWeight: 600, color: '#10b981' }}>{history.toStatus}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {new Date(history.changedAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  Changed by: {history.changedByName}
                </div>
                {history.note && (
                  <div style={{ marginTop: 8, fontSize: 13, color: '#374151', fontStyle: 'italic' }}>
                    Note: {history.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
