import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../services/hrService';

const STAGES = [
  { statusId: 9, statusName: 'Applied', color: '#06b6d4' },
  { statusId: 10, statusName: 'Screening', color: '#f59e0b' },
  { statusId: 11, statusName: 'Interviewing', color: '#8b5cf6' },
  { statusId: 12, statusName: 'Offered', color: '#10b981' },
];

const TARGET_DAYS = 7;

const daysSince = (dateValue) => {
  if (!dateValue) return 0;
  const from = new Date(dateValue).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - from) / (1000 * 60 * 60 * 24)));
};

export default function WorkflowOverviewWidget() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await hrService.applications.getAll();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu pipeline');
    } finally {
      setLoading(false);
    }
  };

  const workflowData = useMemo(() => {
    return STAGES.map((stage) => {
      const inStage = applications.filter((item) => item.statusId === stage.statusId);
      const avgDays = inStage.length === 0
        ? 0
        : Math.round(inStage.reduce((sum, item) => sum + daysSince(item.appliedDate), 0) / inStage.length);

      const samples = [...inStage]
        .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
        .slice(0, 3)
        .map((item) => ({
          id: item.id,
          name: item.candidateName,
          days: daysSince(item.appliedDate),
        }));

      return {
        ...stage,
        count: inStage.length,
        avgDays,
        samples,
        isBottleneck: avgDays > TARGET_DAYS && inStage.length > 0,
      };
    });
  }, [applications]);

  const bottleneckStage = useMemo(() => {
    const stages = workflowData.filter((s) => s.isBottleneck);
    if (stages.length === 0) return null;
    return stages.sort((a, b) => b.avgDays - a.avgDays)[0];
  }, [workflowData]);

  const totalActive = workflowData.reduce((sum, stage) => sum + stage.count, 0);
  const weightedDays = workflowData.reduce((sum, stage) => sum + (stage.avgDays * stage.count), 0);
  const avgTimeInPipeline = totalActive > 0 ? Math.round(weightedDays / totalActive) : 0;
  const appliedCount = workflowData.find((x) => x.statusId === 9)?.count || 0;
  const offeredCount = workflowData.find((x) => x.statusId === 12)?.count || 0;
  const conversionRate = appliedCount > 0 ? ((offeredCount / appliedCount) * 100).toFixed(1) : '0.0';

  const getDaysColor = (days) => {
    if (days > 14) return '#ef4444';
    if (days > 7) return '#f59e0b';
    return '#6b7280';
  };

  const handleColumnClick = () => {
    navigate('/staff/hr-manager/applications');
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 24 }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>Đang tải workflow pipeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 24 }}>
        <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>
        <button
          onClick={loadData}
          style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, color: '#111827' }}>
          Workflow Pipeline Overview
        </h3>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          Dữ liệu thực tế từ hồ sơ ứng tuyển hiện tại
        </p>
      </div>

      {bottleneckStage && (
        <div
          style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: 6,
            padding: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, color: '#92400e' }}>
            Bottleneck detected: {bottleneckStage.statusName}
          </div>
          <div style={{ fontSize: 12, color: '#78350f' }}>
            Average {bottleneckStage.avgDays} days (target {TARGET_DAYS} days)
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {workflowData.map((stage) => (
          <div
            key={stage.statusId}
            onClick={handleColumnClick}
            style={{
              border: stage.isBottleneck ? '2px solid #fbbf24' : '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 16,
              cursor: 'pointer',
              backgroundColor: stage.isBottleneck ? '#fffbeb' : 'white',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: `2px solid ${stage.color}`,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: stage.color, marginBottom: 4 }}>
                  {stage.statusName}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{stage.count}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f9fafb', padding: 8, borderRadius: 6, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Avg. time in stage</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: getDaysColor(stage.avgDays) }}>
                {stage.avgDays} days
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Latest applications:</div>
              {stage.samples.length === 0 ? (
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Không có dữ liệu</div>
              ) : (
                stage.samples.map((sample) => (
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
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <span
                      style={{
                        color: '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {sample.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: getDaysColor(sample.days),
                        backgroundColor: `${getDaysColor(sample.days)}15`,
                        padding: '2px 6px',
                        borderRadius: 8,
                        marginLeft: 4,
                      }}
                    >
                      {sample.days}d
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 20,
          paddingTop: 20,
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Total Active</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{totalActive}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Avg. Pipeline Days</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>{avgTimeInPipeline} days</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Applied to Offered</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>{conversionRate}%</div>
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
          }}
        >
          View All Applications
        </button>
      </div>
    </div>
  );
}
