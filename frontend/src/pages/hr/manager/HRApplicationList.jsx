import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';
import ApplicationProgressBar from '../../../components/hr/ApplicationProgressBar';
import { formatDate, formatCurrency } from '../../../utils/formatters/display';

export default function HRApplicationList() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [focusMode, setFocusMode] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

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

  useEffect(() => {
    setSelectedIds([]);
  }, [statusFilter, searchText, focusMode]);

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
      1: { bg: '#fee2e2', color: '#991b1b', label: 'Khẩn cấp' },
      2: { bg: '#ffedd5', color: '#9a3412', label: 'Cao' },
      3: { bg: '#dbeafe', color: '#1d4ed8', label: 'Bình thường' }
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

  const getStatusColor = (statusId) => {
    const status = statusOptions.find(s => s.value === statusId);
    return status ? status.color : '#6b7280';
  };

  const stats = useMemo(() => {
    const total = applications.length;
    const interviewing = applications.filter((item) => item.statusId === 11).length;
    const highPriority = applications.filter((item) => (item.priority ?? 3) <= 2).length;
    return { total, interviewing, highPriority };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return applications.filter((app) => {
      if (focusMode === 'interviewing' && app.statusId !== 11) return false;
      if (focusMode === 'priority' && (app.priority ?? 3) > 2) return false;

      if (!keyword) return true;

      return [
        app.candidateName,
        app.candidateEmail,
        app.positionTitle,
        app.departmentName,
        app.currentStatus
      ].some((value) => String(value || '').toLowerCase().includes(keyword));
    });
  }, [applications, searchText, focusMode]);

  const allVisibleSelected = filteredApplications.length > 0 && filteredApplications.every((item) => selectedIds.includes(item.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(filteredApplications.map((item) => item.id));
  };

  const toggleSelection = (applicationId) => {
    setSelectedIds((prev) => (
      prev.includes(applicationId)
        ? prev.filter((id) => id !== applicationId)
        : [...prev, applicationId]
    ));
  };

  const handleQuickSchedule = () => {
    if (selectedIds.length === 0) {
      notify.warning('Vui lòng chọn ít nhất 1 hồ sơ để xếp lịch');
      return;
    }

    const query = selectedIds.length > 1
      ? `applicationIds=${selectedIds.join(',')}`
      : `applicationId=${selectedIds[0]}`;

    navigate(`/staff/hr-manager/interviews/create?${query}`);
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 12,
        marginBottom: 16
      }}>
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Tổng hồ sơ</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{stats.total}</div>
        </div>
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Đang phỏng vấn</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed' }}>{stats.interviewing}</div>
        </div>
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Ưu tiên cao/khẩn</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{stats.highPriority}</div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center'
      }}>
        <input
          placeholder='Tìm theo ứng viên, email, vị trí, phòng ban...'
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            padding: '8px 10px',
            borderRadius: 6,
            border: '1px solid #d1d5db'
          }}
        />
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'interviewing', label: 'Cần xếp lịch' },
          { id: 'priority', label: 'Ưu tiên cao' }
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setFocusMode(mode.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${focusMode === mode.id ? '#2563eb' : '#d1d5db'}`,
              backgroundColor: focusMode === mode.id ? '#2563eb' : 'white',
              color: focusMode === mode.id ? 'white' : '#374151',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13
            }}
          >
            {mode.label}
          </button>
        ))}
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
      ) : filteredApplications.length === 0 ? (
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
              <input type='checkbox' checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
              Chọn tất cả kết quả ({filteredApplications.length})
            </label>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Đã chọn: {selectedIds.length}</div>
          </div>

          {filteredApplications.map((app) => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <input
                      type='checkbox'
                      checked={selectedIds.includes(app.id)}
                      onChange={() => toggleSelection(app.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div style={{ fontSize: 12, color: '#6b7280' }}>ID #{app.id}</div>
                  </div>
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
                  {getPriorityBadge(app.priority ?? 3)}
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
                      {formatCurrency(app.expectedSalary)}
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

      {selectedIds.length > 0 && (
        <div style={{
          position: 'sticky',
          bottom: 12,
          marginTop: 16,
          backgroundColor: '#111827',
          color: 'white',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{ fontSize: 14 }}>
            Đã chọn <strong>{selectedIds.length}</strong> hồ sơ để xếp lịch.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setSelectedIds([])}
              style={{
                padding: '8px 12px',
                border: '1px solid #4b5563',
                borderRadius: 6,
                backgroundColor: 'transparent',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Bỏ chọn
            </button>
            <button
              onClick={handleQuickSchedule}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: 6,
                backgroundColor: '#3b82f6',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Lên lịch nhanh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
