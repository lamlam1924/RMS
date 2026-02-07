import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { formatDate, formatCurrency, formatDateTime } from '../../../utils/formatters/display';
import { PriorityBadge, StatusBadge } from '../../../components/shared/Badge';

export default function HRApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatusId, setNewStatusId] = useState(null);
  const [note, setNote] = useState('');

  const statusOptions = [
    { value: 9, label: 'Applied', color: '#06b6d4' },
    { value: 10, label: 'Screening', color: '#f59e0b' },
    { value: 11, label: 'Interviewing', color: '#8b5cf6' },
    { value: 12, label: 'Offered', color: '#10b981' },
    { value: 13, label: 'Rejected', color: '#ef4444' }
  ];

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const data = await hrService.applications.getById(id);
      setApplication(data);
    } catch (error) {
      console.error('Failed to load application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatusId) return;

    try {
      setUpdating(true);
      await hrService.applications.updateStatus(id, {
        toStatusId: newStatusId,
        note: note
      });
      setShowStatusModal(false);
      setNote('');
      await loadApplication();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
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
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusColor = (statusId) => {
    const status = statusOptions.find(s => s.value === statusId);
    return status ? status.color : '#6b7280';
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }

  if (!application) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Application not found</div>;
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/staff/hr-manager/applications')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            marginBottom: 16
          }}
        >
          ← Back to Applications
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              {application.candidateName}
            </h1>
            <p style={{ color: '#6b7280' }}>
              Application #{application.id}
            </p>
          </div>
          <button
            onClick={() => {
              setNewStatusId(application.statusId);
              setShowStatusModal(true);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Update Status
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Candidate Information */}
          <div style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
              Candidate Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Full Name</div>
                <div style={{ fontWeight: 500 }}>{application.candidateName}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Email</div>
                <div style={{ fontWeight: 500, color: '#3b82f6' }}>{application.candidateEmail}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Phone</div>
                <div style={{ fontWeight: 500 }}>{application.candidatePhone}</div>
              </div>
              {application.yearsOfExperience !== null && (
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Experience</div>
                  <div style={{ fontWeight: 500 }}>{application.yearsOfExperience} years</div>
                </div>
              )}
            </div>
          </div>

          {/* Job Information */}
          <div style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
              Job Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Position</div>
                <div style={{ fontWeight: 500 }}>{application.positionTitle}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Department</div>
                <div style={{ fontWeight: 500 }}>{application.departmentName}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Applied Date</div>
                <div style={{ fontWeight: 500 }}>{formatDate(application.appliedDate)}</div>
              </div>
              {application.expectedSalary && (
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Expected Salary</div>
                  <div style={{ fontWeight: 500, color: '#10b981' }}>
                    {formatCurrency(application.expectedSalary)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CV and Documents */}
          {application.cvUrl && (
            <div style={{
              backgroundColor: 'white',
              padding: 24,
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
                Documents
              </h2>
              <a
                href={application.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  backgroundColor: '#eff6ff',
                  color: '#1e40af',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                📄 View CV/Resume
              </a>
            </div>
          )}

          {/* Notes */}
          {application.notes && (
            <div style={{
              backgroundColor: 'white',
              padding: 24,
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
                Notes
              </h2>
              <div style={{ color: '#374151', lineHeight: 1.6 }}>
                {application.notes}
              </div>
            </div>
          )}

          {/* Status History */}
          {application.statusHistory && application.statusHistory.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: 24,
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
                Status History
              </h2>
              <div style={{ position: 'relative', paddingLeft: 24 }}>
                <div style={{
                  position: 'absolute',
                  left: 7,
                  top: 8,
                  bottom: 8,
                  width: 2,
                  backgroundColor: '#e5e7eb'
                }} />
                {application.statusHistory.map((history, index) => (
                  <div key={index} style={{ marginBottom: 20, position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: -20,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(history.toStatusId),
                      border: '2px solid white',
                      boxShadow: '0 0 0 2px ' + getStatusColor(history.toStatusId)
                    }} />
                    <div style={{ paddingLeft: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        {history.fromStatus && (
                          <span style={{ fontSize: 14, color: '#6b7280' }}>
                            {history.fromStatus} →
                          </span>
                        )}
                        <span style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: getStatusColor(history.toStatusId)
                        }}>
                          {history.toStatus}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>
                        by {history.changedByName} • {formatDate(history.changedAt)}
                      </div>
                      {history.note && (
                        <div style={{
                          marginTop: 8,
                          padding: 8,
                          backgroundColor: '#f9fafb',
                          borderRadius: 4,
                          fontSize: 13,
                          color: '#374151'
                        }}>
                          {history.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current Status */}
          <div style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Current Status</div>
            <div style={{
              padding: '8px 16px',
              backgroundColor: `${getStatusColor(application.statusId)}20`,
              color: getStatusColor(application.statusId),
              borderRadius: 6,
              fontWeight: 600,
              textAlign: 'center'
            }}>
              {application.currentStatus}
            </div>
          </div>

          {/* Priority */}
          {application.priority && (
            <div style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Priority</div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {getPriorityBadge(application.priority)}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => navigate(`/staff/hr-manager/interviews/create?applicationId=${id}`)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Schedule Interview
              </button>
              <button
                onClick={() => navigate(`/staff/hr-manager/offers/create?applicationId=${id}`)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Create Offer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 8,
            width: 480,
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
              Update Application Status
            </h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                New Status
              </label>
              <select
                value={newStatusId || ''}
                onChange={(e) => setNewStatusId(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14
                }}
              >
                <option value="">Select status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Add notes about this status change..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setNote('');
                }}
                disabled={updating}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating || !newStatusId}
                style={{
                  padding: '10px 20px',
                  backgroundColor: newStatusId ? '#3b82f6' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: newStatusId && !updating ? 'pointer' : 'not-allowed',
                  fontWeight: 500
                }}
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
