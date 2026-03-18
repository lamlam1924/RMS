import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { formatDate } from '../../../utils/formatters/display';
import notify from '../../../utils/notification';

/**
 * Luồng:
 * 1. Director phê duyệt Job Request → HR Manager gán cho HR Staff
 * 2. HR Staff thấy ở tab "Sẵn sàng đăng" → nhấn "Tạo Posting" → tạo tin từ request đó
 * 3. Tin tạo xong ở trạng thái DRAFT → tab "Tin Nháp"
 * 4. HR Staff chỉnh sửa nội dung → nhấn Publish → PUBLISHED
 * 5. HR Manager đóng tin → CLOSED → tab "Đã đóng" (read-only)
 */

const TABS = [
  {
    id: 'READY',
    label: 'Sẵn sàng đăng',
    desc: 'Job Request đã duyệt, chờ bạn tạo tin tuyển dụng',
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    id: 'DRAFT',
    label: 'Tin Nháp',
    desc: 'Được gán, chờ bạn chỉnh sửa và đăng tuyển',
    color: '#f59e0b',
    bg: '#fef3c7',
  },
  {
    id: 'PUBLISHED',
    label: 'Đang đăng',
    desc: 'Đã publish, đang chạy tuyển dụng',
    color: '#16a34a',
    bg: '#f0fdf4',
  },
  {
    id: 'CLOSED',
    label: 'Đã đóng',
    desc: 'HR Manager đã đóng, không còn nhận ứng viên',
    color: '#6b7280',
    bg: '#f3f4f6',
  },
];

export default function HRJobPostingList() {
  const navigate = useNavigate();
  const [allPostings, setAllPostings] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('READY');
  const [publishing, setPublishing] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postings, requests] = await Promise.all([
        hrService.jobPostings.getMy(),
        hrService.jobRequests.getApprovedForMe(),
      ]);
      setAllPostings(postings || []);
      setApprovedRequests(requests || []);
    } catch (error) {
      console.error('Không thể tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = activeTab === 'READY'
    ? approvedRequests
    : allPostings.filter(p => p.currentStatus === activeTab);

  const handlePublish = async (id, e) => {
    e.stopPropagation();
    
    notify.confirm(
      'Xác nhận publish tin này? Ứng viên sẽ thấy ngay lập tức.',
      async () => {
        try {
          setPublishing(id);
          await hrService.jobPostings.publish(id);
          notify.success('Đăng tin tuyển dụng thành công!');
          await loadData();
        } catch (error) {
          console.error('Publish thất bại:', error);
          notify.error('Publish thất bại: ' + error.message);
        } finally {
          setPublishing(null);
        }
      }
    );
  };

  const countByTab = (tabId) => {
    if (tabId === 'READY') return approvedRequests.length;
    return allPostings.filter(p => p.currentStatus === tabId).length;
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>
          Tin tuyển dụng của tôi
        </h1>
        <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>
          Quản lý các tin tuyển dụng được HR Manager gán cho bạn
        </p>
      </div>

      {/* Stat cards — click để filter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              backgroundColor: activeTab === tab.id ? tab.bg : 'white',
              border: `1px solid ${activeTab === tab.id ? tab.color + '66' : '#e5e7eb'}`,
              borderRadius: 10, padding: '14px 18px', cursor: 'pointer'
            }}
          >
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{tab.label}</p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 8px' }}>{tab.desc}</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: tab.color, margin: 0 }}>
              {countByTab(tab.id)}
            </p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 0',
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent',
                color: activeTab === tab.id ? tab.color : '#6b7280',
                fontWeight: activeTab === tab.id ? 600 : 400,
                background: 'none', cursor: 'pointer', fontSize: 14
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: 6, fontSize: 11, fontWeight: 600,
                padding: '2px 6px', borderRadius: 10,
                backgroundColor: activeTab === tab.id ? tab.bg : '#f3f4f6',
                color: activeTab === tab.id ? tab.color : '#9ca3af'
              }}>
                {countByTab(tab.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Đang tải...</div>
      ) : filteredItems.length === 0 ? (
        <div style={{
          backgroundColor: 'white', borderRadius: 10, padding: 48,
          textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {activeTab === 'READY' ? '📋' : activeTab === 'DRAFT' ? '✏️' : activeTab === 'PUBLISHED' ? '📢' : '🗂️'}
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: 0 }}>
            {activeTab === 'READY' && 'Chưa có yêu cầu tuyển dụng nào được gán cho bạn'}
            {activeTab === 'DRAFT' && 'Chưa có tin nháp nào'}
            {activeTab === 'PUBLISHED' && 'Chưa có tin nào đang đăng tuyển'}
            {activeTab === 'CLOSED' && 'Chưa có tin nào đã đóng'}
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
            {activeTab === 'READY' && 'HR Manager cần gán yêu cầu tuyển dụng đã được duyệt cho bạn'}
            {activeTab === 'DRAFT' && 'Tạo tin từ tab "Sẵn sàng đăng" để tin xuất hiện ở đây'}
            {activeTab === 'PUBLISHED' && 'Hãy publish các tin nháp được gán cho bạn'}
            {activeTab === 'CLOSED' && 'Các tin bị đóng bởi HR Manager sẽ hiển thị ở đây'}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                {activeTab === 'READY'
                  ? ['#', 'Vị trí', 'Phòng ban', 'SL', 'Ngày gửi', 'Người yêu cầu', 'Thao tác'].map(h => (
                      <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))
                  : ['Tiêu đề', 'Vị trí', 'Phòng ban', 'SL', 'Deadline', 'Ngày tạo', 'Thao tác'].map(h => (
                      <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))
                }
              </tr>
            </thead>
            <tbody>
              {activeTab === 'READY' ? (
                filteredItems.map(req => (
                  <tr key={req.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#9ca3af' }}>#{req.id}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{req.positionTitle}</div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#374151' }}>{req.departmentName}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#374151', textAlign: 'center' }}>{req.quantity}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{formatDate(req.createdAt)}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#374151' }}>{req.requestedByName}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        onClick={() => navigate(`/staff/hr-staff/job-postings/new?jobRequestId=${req.id}`)}
                        style={{
                          padding: '6px 14px', border: 'none', borderRadius: 6,
                          backgroundColor: '#2563eb', color: 'white',
                          fontSize: 13, cursor: 'pointer', fontWeight: 500
                        }}
                      >
                        + Tạo Posting
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>#{item.id}</div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#374151' }}>{item.positionTitle}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#374151' }}>{item.departmentName}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#374151', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>
                      {item.deadline ? formatDate(item.deadline) : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#9ca3af' }}>{formatDate(item.createdAt)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {activeTab === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => navigate(`/staff/hr-staff/job-postings/${item.id}/edit`)}
                              style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', color: '#374151', fontSize: 13, cursor: 'pointer' }}
                            >
                              Chỉnh sửa
                            </button>
                            <button
                              onClick={(e) => handlePublish(item.id, e)}
                              disabled={publishing === item.id}
                              style={{ padding: '6px 14px', border: 'none', borderRadius: 6, backgroundColor: publishing === item.id ? '#9ca3af' : '#10b981', color: 'white', fontSize: 13, cursor: publishing === item.id ? 'not-allowed' : 'pointer', fontWeight: 500 }}
                            >
                              {publishing === item.id ? 'Đang đăng...' : '▶ Publish'}
                            </button>
                          </>
                        )}
                        {activeTab === 'PUBLISHED' && (
                          <button
                            onClick={() => navigate(`/staff/hr-staff/job-postings/${item.id}/edit`)}
                            style={{ padding: '6px 14px', border: '1px solid #3b82f6', borderRadius: 6, backgroundColor: 'white', color: '#3b82f6', fontSize: 13, cursor: 'pointer' }}
                          >
                            Xem / Sửa
                          </button>
                        )}
                        {activeTab === 'CLOSED' && (
                          <span style={{ fontSize: 12, color: '#9ca3af', padding: '6px 14px', backgroundColor: '#f3f4f6', borderRadius: 6 }}>
                            Đã đóng
                          </span>
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
