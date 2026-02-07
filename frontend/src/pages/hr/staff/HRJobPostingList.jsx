import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { formatCurrency, formatDate } from '../../../utils/formatters/display';
import { StatusBadge } from '../../../components/shared/Badge';

export default function HRJobPostingList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drafts'); // 'drafts', 'published', 'closed', 'ready'

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setItems([]);
      
      if (activeTab === 'ready') {
        const requests = await hrService.jobRequests.getAll();
        // Filter for APPROVED requests (StatusId = 4)
        const approved = requests.filter(r => r.statusId === 4 || r.currentStatus === 'APPROVED'); 
        setItems(approved);
      } else if (activeTab === 'drafts') {
        const postings = await hrService.jobPostings.getDrafts();
        setItems(postings);
      } else {
        const postings = await hrService.jobPostings.getAll();
        if (activeTab === 'published') {
          // Assuming 7 is PUBLISHED status ID. 
          // Adjust logic if status filtering is done by backend or different IDs
          setItems(postings.filter(p => p.statusId === 7 || p.currentStatus === 'PUBLISHED')); 
        } else if (activeTab === 'closed') {
          setItems(postings.filter(p => p.statusId === 8 || p.currentStatus === 'CLOSED')); 
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to publish this job posting? Candidates will be able to see it immediately.')) return;

    try {
      await hrService.jobPostings.publish(id);
      loadData();
    } catch (error) {
      console.error('Failed to publish job posting:', error);
      alert('Failed to publish job posting');
    }
  };

  const handleCreatePosting = (jobRequestId) => {
    navigate(`/staff/hr-staff/job-postings/new?jobRequestId=${jobRequestId}`);
  };

  const handleEditPosting = (jobPostingId) => {
    navigate(`/staff/hr-staff/job-postings/${jobPostingId}/edit`);
  };

  const formatItemDate = (date) => {
      if(!date) return '-';
      return formatDate(date);
  }

  const tabs = [
    { id: 'drafts', label: 'My Drafts' },
    { id: 'published', label: 'Published' },
    { id: 'ready', label: 'Ready to Post' }, 
    { id: 'closed', label: 'Closed' }
  ];

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Job Postings Management
        </h1>
        <p style={{ color: '#6b7280' }}>
          Manage public job postings and convert approved requests to postings.
        </p>
      </div>

      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 0',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                fontWeight: 500,
                background: 'none',
                border: 'none',
                borderBottomWidth: 2,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  {activeTab === 'ready' ? 'Request Reason' : 'Title'}
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Position
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Department
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Quantity
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Date
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ divideY: '1px solid #e5e7eb' }}>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
                    No items found in this category.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 500, color: '#111827' }}>
                         {activeTab === 'ready' ? (item.reason || 'No Title') : item.title}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#374151' }}>
                      {item.positionTitle}
                    </td>
                    <td style={{ padding: '16px 24px', color: '#374151' }}>
                      {item.departmentName}
                    </td>
                    <td style={{ padding: '16px 24px', color: '#374151' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '16px 24px', color: '#6b7280' }}>
                      {formatItemDate(activeTab === 'ready' ? item.createdAt : item.postingDate || item.createdAt)}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <StatusBadge status={item.currentStatus || item.statusCode} />
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        {activeTab === 'ready' && (
                          <button
                            onClick={() => handleCreatePosting(item.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              borderRadius: 4,
                              fontSize: 14,
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Create Posting
                          </button>
                        )}
                        {activeTab === 'drafts' && (
                          <>
                            <button
                              onClick={() => handleEditPosting(item.id)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: 'white',
                                border: '1px solid #d1d5db',
                                color: '#374151',
                                borderRadius: 4,
                                fontSize: 14,
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => handlePublish(item.id, e)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                borderRadius: 4,
                                fontSize: 14,
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              Publish
                            </button>
                          </>
                        )}
                        {activeTab === 'published' && (
                             <button
                             onClick={() => handleEditPosting(item.id)}
                             style={{
                               padding: '6px 12px',
                               backgroundColor: 'white',
                               border: '1px solid #d1d5db',
                               color: '#374151',
                               borderRadius: 4,
                               fontSize: 14,
                               cursor: 'pointer'
                             }}
                           >
                             View/Edit
                           </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
