import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { formatCurrency, formatDate } from '../../../utils/formatters/display';
import { StatusBadge } from '../../../components/shared/Badge';

export default function HRJobPostingList() {
  const navigate = useNavigate();
  const [jobPostings, setJobPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('draft'); // 'draft', 'published', 'all'

  useEffect(() => {
    loadJobPostings();
  }, [filter]);

  const loadJobPostings = async () => {
    try {
      setLoading(true);
      let data;
      if (filter === 'draft') {
        data = await hrService.jobPostings.getDrafts();
      } else {
        data = await hrService.jobPostings.getAll();
        if (filter === 'published') {
          data = data.filter(jp => jp.currentStatus === 'PUBLISHED');
        }
      }
      setJobPostings(data);
    } catch (error) {
      console.error('Failed to load job postings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to publish this job posting?')) return;

    try {
      await hrService.jobPostings.publish(id);
      await loadJobPostings();
    } catch (error) {
      console.error('Failed to publish job posting:', error);
      alert('Failed to publish job posting');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const styles = {
      'DRAFT': { bg: '#f3f4f6', color: '#374151', icon: '📝' },
      'PUBLISHED': { bg: '#dcfce7', color: '#166534', icon: '✓' },
      'CLOSED': { bg: '#fee2e2', color: '#991b1b', icon: '✕' }
    };
    const style = styles[status] || { bg: '#f3f4f6', color: '#374151', icon: '📋' };

    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: 16,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.icon} {status}
      </span>
    );
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Job Postings
            </h1>
            <p style={{ color: '#6b7280' }}>
              Create and manage job postings for recruitment
            </p>
          </div>
          <button
            onClick={() => navigate('/staff/hr-staff/job-postings/create')}
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
            + Create Job Posting
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setFilter('draft')}
          style={{
            padding: '8px 16px',
            backgroundColor: filter === 'draft' ? '#6b7280' : 'white',
            color: filter === 'draft' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Drafts ({jobPostings.filter(jp => jp.currentStatus === 'DRAFT').length})
        </button>
        <button
          onClick={() => setFilter('published')}
          style={{
            padding: '8px 16px',
            backgroundColor: filter === 'published' ? '#10b981' : 'white',
            color: filter === 'published' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Published ({jobPostings.filter(jp => jp.currentStatus === 'PUBLISHED').length})
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
          All Postings
        </button>
      </div>

      {/* Job Postings List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : jobPostings.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: 40,
          textAlign: 'center',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📢</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No job postings found</div>
          <div style={{ color: '#6b7280', marginBottom: 16 }}>
            {filter === 'draft' ? 'No draft postings' : filter === 'published' ? 'No published postings' : 'No postings available'}
          </div>
          <button
            onClick={() => navigate('/staff/hr-staff/job-postings/create')}
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
            Create First Job Posting
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
          {jobPostings.map((posting) => (
            <div
              key={posting.id}
              onClick={() => navigate(`/staff/hr-staff/job-postings/${posting.id}`)}
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column'
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
              {/* Status Badge */}
              <div style={{ marginBottom: 12 }}>
                {getStatusBadge(posting.currentStatus)}
              </div>

              {/* Position Info */}
              <div style={{ flex: 1, marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
                  {posting.positionTitle}
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                  {posting.departmentName}
                </div>
                {posting.location && (
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    📍 {posting.location}
                  </div>
                )}
              </div>

              {/* Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                paddingTop: 12,
                borderTop: '1px solid #e5e7eb',
                marginBottom: 12
              }}>
                {posting.quantity && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Positions</div>
                    <div style={{ fontWeight: 600 }}>{posting.quantity}</div>
                  </div>
                )}
                {posting.deadline && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Deadline</div>
                    <div style={{ fontWeight: 600 }}>{formatDate(posting.deadline)}</div>
                  </div>
                )}
                {posting.createdAt && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Created</div>
                    <div style={{ fontWeight: 500 }}>{formatDate(posting.createdAt)}</div>
                  </div>
                )}
                {posting.publishedAt && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Published</div>
                    <div style={{ fontWeight: 500 }}>{formatDate(posting.publishedAt)}</div>
                  </div>
                )}
              </div>

              {/* Description Preview */}
              {posting.description && (
                <div style={{
                  fontSize: 13,
                  color: '#6b7280',
                  marginBottom: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {posting.description}
                </div>
              )}

              {/* Action Button */}
              {posting.currentStatus === 'DRAFT' && (
                <button
                  onClick={(e) => handlePublish(posting.id, e)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 500,
                    width: '100%'
                  }}
                >
                  📢 Publish Now
                </button>
              )}
              {posting.currentStatus === 'PUBLISHED' && (
                <div style={{
                  padding: '8px 16px',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  borderRadius: 6,
                  fontWeight: 500,
                  textAlign: 'center',
                  fontSize: 13
                }}>
                  ✓ Live on job board
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
