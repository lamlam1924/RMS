import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import ApplicationProgressBar from '../../../components/hr/ApplicationProgressBar';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import { PriorityBadge, StatusBadge } from '../../../components/shared/Badge';

export default function HRApplicationList() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null);

  const statusOptions = [
    { value: null, label: 'All Applications', color: '#3b82f6' },
    { value: 9, label: 'Applied', color: '#06b6d4' },
    { value: 10, label: 'Screening', color: '#f59e0b' },
    { value: 11, label: 'Interviewing', color: '#8b5cf6' },
    { value: 12, label: 'Offered', color: '#10b981' },
    { value: 13, label: 'Rejected', color: '#ef4444' }
  ];

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await hrService.applications.getByStatus(statusFilter);
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      1: { bg: '#fee2e2', color: '#991b1b', label: 'Urgent' },
      2: { bg: '#fef3c7', color: '#92400e', label: 'High' },
      3: { bg: '#e0e7ff', color: '#3730a3', label: 'Normal' }
    };
    const style = styles[priority] || styles[3];

    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: 16,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.label}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (statusId) => {
    const status = statusOptions.find(s => s.value === statusId);
    return status ? status.color : '#6b7280';
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Applications
        </h1>
        <p style={{ color: '#6b7280' }}>
          Manage candidate applications and move them through the pipeline
        </p>
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {statusOptions.map((option) => (
          <button
            key={option.value || 'all'}
            onClick={() => setStatusFilter(option.value)}
            style={{
              padding: '8px 16px',
              backgroundColor: statusFilter === option.value ? option.color : 'white',
              color: statusFilter === option.value ? 'white' : '#374151',
              border: `1px solid ${statusFilter === option.value ? option.color : '#d1d5db'}`,
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : applications.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: 40,
          textAlign: 'center',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No applications found</div>
          <div style={{ color: '#6b7280' }}>
            {statusFilter ? 'No applications with this status' : 'No applications available'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {applications.map((app) => (
            <div
              key={app.id}
              onClick={() => navigate(`/staff/hr-manager/applications/${app.id}`)}
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
              {/* Candidate Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                    {app.candidateName}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                    {app.candidateEmail} • {app.candidatePhone}
                  </div>
                  <div style={{ fontSize: 14, color: '#3b82f6', fontWeight: 500 }}>
                    Applying for: {app.positionTitle}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {app.departmentName}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {app.priority && getPriorityBadge(app.priority)}
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: `${getStatusColor(app.statusId)}20`,
                    color: getStatusColor(app.statusId),
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 500
                  }}>
                    {app.currentStatus}
                  </span>
                </div>
              </div>

              {/* Progress Bar - HARDCODED for now */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                <ApplicationProgressBar 
                  statusId={app.statusId} 
                  daysInCurrentStatus={
                    // Hardcoded days based on status for demo
                    app.statusId === 9 ? 2 : 
                    app.statusId === 10 ? Math.floor(Math.random() * 15) + 1 : 
                    app.statusId === 11 ? Math.floor(Math.random() * 20) + 1 : 
                    Math.floor(Math.random() * 7) + 1
                  } 
                />
              </div>

              {/* Application Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 16,
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid #e5e7eb'
              }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Applied Date</div>
                  <div style={{ fontWeight: 500 }}>{formatDate(app.appliedDate)}</div>
                </div>
                {app.yearsOfExperience !== null && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Experience</div>
                    <div style={{ fontWeight: 500 }}>{app.yearsOfExperience} years</div>
                  </div>
                )}
                {app.expectedSalary && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Expected Salary</div>
                    <div style={{ fontWeight: 500, color: '#10b981' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(app.expectedSalary)}
                    </div>
                  </div>
                )}
                {app.lastUpdated && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Last Updated</div>
                    <div style={{ fontWeight: 500 }}>{formatDate(app.lastUpdated)}</div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {app.notes && (
                <div style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#374151'
                }}>
                  <span style={{ fontWeight: 600 }}>Notes:</span> {app.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
