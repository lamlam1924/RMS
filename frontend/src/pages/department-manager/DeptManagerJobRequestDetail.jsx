import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import deptManagerService from '../../services/deptManagerService';

export default function DeptManagerJobRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobRequest, setJobRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id !== 'new') {
      loadJobRequest();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadJobRequest = async () => {
    try {
      setLoading(true);
      const data = await deptManagerService.jobRequests.getById(id);
      setJobRequest(data);
    } catch (error) {
      console.error('Failed to load job request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!jobRequest) return;
    
    try {
      setSubmitting(true);
      await deptManagerService.jobRequests.submit(jobRequest.id);
      alert('Job request submitted successfully!');
      navigate('/staff/dept-manager/job-requests');
    } catch (error) {
      console.error('Failed to submit job request:', error);
      alert('Failed to submit job request. Please try again.');
    } finally {
      setSubmitting(false);
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
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (id !== 'new' && !jobRequest) {
    return <div style={{ padding: 24 }}>Job request not found</div>;
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/staff/dept-manager/job-requests')}
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
          {id === 'new' ? 'Create New Job Request' : 'Job Request Details'}
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
            <div style={{ fontSize: 18, fontWeight: 600 }}>{jobRequest?.positionTitle || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Department</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{jobRequest?.departmentName || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Requested By</div>
            <div style={{ fontSize: 16 }}>{jobRequest?.requestedByName || 'You'}</div>
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
              {jobRequest?.currentStatus || 'Draft'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Quantity</div>
            <div style={{ fontSize: 16 }}>{jobRequest?.quantity || 0} position(s)</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Priority</div>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: `${getPriorityColor(jobRequest?.priority || 3)}20`,
              color: getPriorityColor(jobRequest?.priority || 3),
              borderRadius: 16,
              fontSize: 14,
              fontWeight: 600
            }}>
              {getPriorityLabel(jobRequest?.priority || 3)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Budget</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {formatCurrency(jobRequest?.budget)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Expected Start Date</div>
            <div style={{ fontSize: 16 }}>
              {formatDate(jobRequest?.expectedStartDate)}
            </div>
          </div>
        </div>

        {jobRequest?.reason && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Reason</div>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              {jobRequest.reason}
            </div>
          </div>
        )}

        {/* Actions */}
        {jobRequest && jobRequest.statusCode === 'DRAFT' && (
          <div style={{ 
            marginTop: 24, 
            paddingTop: 24, 
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: 12
          }}>
            <button
              onClick={() => navigate(`/staff/dept-manager/job-requests/${id}/edit`)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              ✏️ Edit Request
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                opacity: submitting ? 0.6 : 1
              }}
            >
              {submitting ? 'Submitting...' : '📤 Submit for Approval'}
            </button>
          </div>
        )}
      </div>

      {/* Status History */}
      {jobRequest?.statusHistory && jobRequest.statusHistory.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          padding: 24
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Status History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {jobRequest.statusHistory.map((history, index) => (
              <div
                key={index}
                style={{
                  padding: 16,
                  backgroundColor: '#f9fafb',
                  borderRadius: 6,
                  borderLeft: '3px solid #3b82f6'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>
                    {history.toStatus}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {formatDate(history.changedAt)}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
                  By: {history.changedByName}
                </div>
                {history.comment && (
                  <div style={{ fontSize: 13, color: '#374151', marginTop: 8 }}>
                    {history.comment}
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
