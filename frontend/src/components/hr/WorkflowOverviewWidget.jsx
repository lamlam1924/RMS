import React from 'react';
import { useNavigate } from 'react-router-dom';

const WorkflowOverviewWidget = () => {
  const navigate = useNavigate();

  // HARDCODED data for demo
  const workflowData = [
    {
      statusId: 9,
      statusName: 'Applied',
      color: '#06b6d4',
      count: 23,
      avgDays: 3,
      samples: [
        { id: 1, name: 'John Doe', days: 2 },
        { id: 2, name: 'Jane Smith', days: 3 },
        { id: 3, name: 'Mike Johnson', days: 4 }
      ]
    },
    {
      statusId: 10,
      statusName: 'Screening',
      color: '#f59e0b',
      count: 12,
      avgDays: 5,
      samples: [
        { id: 4, name: 'Sarah Lee', days: 4 },
        { id: 5, name: 'Lisa Wong', days: 6 },
        { id: 6, name: 'Tom Brown', days: 15 }
      ]
    },
    {
      statusId: 11,
      statusName: 'Interviewing',
      color: '#8b5cf6',
      count: 8,
      avgDays: 12,
      isBottleneck: true,
      samples: [
        { id: 7, name: 'David Chen', days: 10 },
        { id: 8, name: 'Alice Kim', days: 18 },
        { id: 9, name: 'Bob Wilson', days: 9 }
      ]
    },
    {
      statusId: 12,
      statusName: 'Passed',
      color: '#10b981',
      count: 5,
      avgDays: 2,
      samples: [
        { id: 10, name: 'Emma Davis', days: 1 },
        { id: 11, name: 'Chris Martin', days: 2 },
        { id: 12, name: 'Anna Taylor', days: 3 }
      ]
    }
  ];

  const handleColumnClick = (statusId) => {
    navigate(`/staff/hr-manager/applications?status=${statusId}`);
  };

  const getDaysColor = (days) => {
    if (days > 14) return '#ef4444';
    if (days > 7) return '#f59e0b';
    return '#6b7280';
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: 8,
      border: '1px solid #e5e7eb',
      padding: 24
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ 
          fontSize: 18, 
          fontWeight: 600, 
          marginBottom: 4,
          color: '#111827'
        }}>
          📊 Workflow Pipeline Overview
        </h3>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          Real-time application flow across recruitment stages
        </p>
      </div>

      {/* Bottleneck Alert */}
      {workflowData.some(s => s.isBottleneck) && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: 6,
          padding: 12,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#92400e' }}>
              Bottleneck Detected
            </div>
            <div style={{ fontSize: 12, color: '#78350f' }}>
              Interviewing stage averaging 12 days (target: 7 days)
            </div>
          </div>
        </div>
      )}

      {/* Kanban Columns */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 16 
      }}>
        {workflowData.map((stage) => (
          <div
            key={stage.statusId}
            onClick={() => handleColumnClick(stage.statusId)}
            style={{
              border: stage.isBottleneck ? `2px solid #fbbf24` : '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 16,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: stage.isBottleneck ? '#fffbeb' : 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Stage Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: `2px solid ${stage.color}`
            }}>
              <div>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: stage.color,
                  marginBottom: 4
                }}>
                  {stage.statusName}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>
                  {stage.count}
                </div>
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: `${stage.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}>
                {stage.statusId === 9 ? '📝' : 
                 stage.statusId === 10 ? '🔍' : 
                 stage.statusId === 11 ? '💬' : '✅'}
              </div>
            </div>

            {/* Average Days */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: 8,
              borderRadius: 6,
              marginBottom: 12
            }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>
                Avg. Time in Stage
              </div>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 600,
                color: getDaysColor(stage.avgDays)
              }}>
                {stage.avgDays} days
              </div>
            </div>

            {/* Sample Candidates */}
            <div>
              <div style={{ 
                fontSize: 11, 
                color: '#6b7280', 
                marginBottom: 8,
                fontWeight: 500 
              }}>
                Latest Applications:
              </div>
              {stage.samples.map((sample) => (
                <div
                  key={sample.id}
                  style={{
                    fontSize: 12,
                    padding: '6px 8px',
                    backgroundColor: 'white',
                    borderRadius: 4,
                    marginBottom: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <span style={{ 
                    color: '#374151',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {sample.name}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: getDaysColor(sample.days),
                    backgroundColor: `${getDaysColor(sample.days)}15`,
                    padding: '2px 6px',
                    borderRadius: 8,
                    marginLeft: 4
                  }}>
                    {sample.days}d
                  </span>
                </div>
              ))}
              {stage.count > 3 && (
                <div style={{ 
                  fontSize: 11, 
                  color: stage.color, 
                  fontWeight: 600,
                  textAlign: 'center',
                  marginTop: 4
                }}>
                  + {stage.count - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div style={{
        marginTop: 20,
        paddingTop: 20,
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Total Active</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
              {workflowData.reduce((sum, s) => sum + s.count, 0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Avg. Time-to-Hire</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
              22 days
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Conversion Rate</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>
              21.7%
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/staff/hr-manager/applications')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          View All Applications →
        </button>
      </div>
    </div>
  );
};

export default WorkflowOverviewWidget;
