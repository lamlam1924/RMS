import React, { useEffect, useMemo, useState } from 'react';
import hrService from '../../../services/hrService';
import notify from '../../../utils/notification';
import { formatDate } from '../../../utils/formatters/display';

export default function HRStaffAssignmentList() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [postings, setPostings] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState('');

  const [assignModal, setAssignModal] = useState({ open: false, request: null });
  const [assigningStaffId, setAssigningStaffId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [approvedRequests, allPostings] = await Promise.all([
        hrService.jobRequests.getByStatus('APPROVED'),
        hrService.jobPostings.getAll(),
      ]);
      setRequests(Array.isArray(approvedRequests) ? approvedRequests : []);
      setPostings(Array.isArray(allPostings) ? allPostings : []);
    } catch (error) {
      notify.error(error?.message || 'Không thể tải danh sách phân công HR Staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const postingByJobRequestId = useMemo(() => {
    const map = new Map();
    postings.forEach((item) => {
      if (item?.jobRequestId != null) map.set(item.jobRequestId, item);
    });
    return map;
  }, [postings]);

  const assignmentCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = requests
      .filter((item) => !postingByJobRequestId.has(item.id) && !item.assignedStaffId)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (!q) return list;

    return list.filter((item) => {
      return [
        item.positionTitle,
        item.departmentName,
        item.requestedByName,
        String(item.id),
      ].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [requests, postingByJobRequestId, search]);

  const openAssignModal = async (request) => {
    try {
      if (staffList.length === 0) {
        const list = await hrService.jobPostings.getStaffList();
        setStaffList(Array.isArray(list) ? list : []);
      }
      setAssignModal({ open: true, request });
      setAssigningStaffId(request?.assignedStaffId ? String(request.assignedStaffId) : '');
    } catch (error) {
      notify.error(error?.message || 'Không thể tải danh sách HR Staff');
    }
  };

  const handleAssign = async () => {
    if (!assignModal.request || !assigningStaffId) return;
    try {
      setAssigning(true);
      await hrService.jobRequests.assignStaff(assignModal.request.id, parseInt(assigningStaffId, 10));
      notify.success('Đã gán HR Staff thành công');
      setAssignModal({ open: false, request: null });
      await loadData();
    } catch (error) {
      notify.error(error?.message || 'Gán HR Staff thất bại');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Phân công HR Staff</h1>
        <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>
          Chỉ hiển thị các Job Request đã APPROVED, chưa gán Staff và chưa có Job Posting.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo vị trí, phòng ban, người yêu cầu, mã yêu cầu..."
          style={{
            width: '100%',
            maxWidth: 520,
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: 14,
            backgroundColor: 'white'
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 36, color: '#6b7280' }}>Đang tải...</div>
      ) : assignmentCandidates.length === 0 ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 32, color: '#6b7280' }}>
          Không có Job Request nào cần phân công. Các request đã tạo posting sẽ không hiện ở đây.
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f3f4f6' }}>
              <tr>
                {['#', 'Vị trí', 'Phòng ban', 'SL', 'Người yêu cầu', 'Ngày tạo', 'Đang gán', 'Thao tác'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignmentCandidates.map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#6b7280' }}>#{item.id}</td>
                  <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 600, color: '#111827' }}>{item.positionTitle}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{item.departmentName}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{item.quantity}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{item.requestedByName}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#6b7280' }}>{formatDate(item.createdAt)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{item.assignedStaffName || 'Chưa gán'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      onClick={() => openAssignModal(item)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    >
                      Gán HR Staff
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {assignModal.open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setAssignModal({ open: false, request: null })}>
          <div style={{ backgroundColor: 'white', borderRadius: 10, width: '100%', maxWidth: 440, margin: 16, padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#111827' }}>Phân công HR Staff</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280' }}>
              Yêu cầu #{assignModal.request?.id} - {assignModal.request?.positionTitle}
            </p>
            <select
              value={assigningStaffId}
              onChange={(e) => setAssigningStaffId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, marginBottom: 16 }}
            >
              <option value="">-- Chọn HR Staff --</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>{staff.fullName}</option>
              ))}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setAssignModal({ open: false, request: null })}
                disabled={assigning}
                style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning || !assigningStaffId}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: (!assigning && assigningStaffId) ? '#16a34a' : '#9ca3af',
                  color: 'white',
                  cursor: (!assigning && assigningStaffId) ? 'pointer' : 'not-allowed',
                  fontWeight: 600
                }}
              >
                {assigning ? 'Đang gán...' : 'Xác nhận gán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
