// HR Service - API calls for HR Manager and HR Staff operations
import { authFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response, fallbackMessage) => {
  if (response.status === 401) {
    const msg = 'Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại bằng tài khoản HR.';
    throw new Error(msg);
  }
  if (!response.ok) throw new Error(await response.text().catch(() => fallbackMessage));
  if (response.status === 204) return null;
  return response.json();
};
const hrService = {
  // ===== JOB REQUESTS =====
  jobRequests: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-requests`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch job requests');
      return response.json();
    },
    
    getPending: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-requests/pending`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch pending job requests');
      return response.json();
    },
    
    getByStatus: async (statusCode) => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-requests/status/${statusCode}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error(`Failed to fetch job requests with status ${statusCode}`);
      return response.json();
    },
    
    getById: async (id) => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-requests/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch job request');
      return response.json();
    },
    
    // Cập nhật trạng thái chung
    updateStatus: async (id, toStatusId, note = '') => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-requests/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ toStatusId, note })
      });
      if (!response.ok) throw new Error('Không thể cập nhật trạng thái');
      return response.json();
    },

    // Chuyển tiếp cho Giám đốc duyệt (SUBMITTED -> IN_REVIEW)
    forwardToDirector: async (id, note = '') => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-requests/${id}/forward`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ note })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể chuyển tiếp yêu cầu');
      }
      return response.json();
    },

    // Trả về cho Trưởng phòng ban chỉnh sửa (SUBMITTED -> RETURNED)
    returnToDeptManager: async (id, note = '') => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-requests/${id}/return`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ note })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể trả về yêu cầu');
      }
      return response.json();
    },

    // Phê duyệt yêu cầu hủy (CANCEL_PENDING -> CANCELLED)
    approveCancelRequest: async (id, note = '') => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-requests/${id}/approve-cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ note })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể phê duyệt yêu cầu hủy');
      }
      return response.json();
    },

    // Từ chối yêu cầu hủy (CANCEL_PENDING -> trạng thái trước)
    rejectCancelRequest: async (id, note = '') => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-requests/${id}/reject-cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ note })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể từ chối yêu cầu hủy');
      }
      return response.json();
    },

    // Gán HR Staff vào Job Request đã APPROVED (HR Manager only)
    assignStaff: async (id, staffId) => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-requests/${id}/assign`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ staffId })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể gán HR Staff');
      }
      return response.json();
    },

    // HR Staff lấy các Job Request APPROVED được gán cho mình
    getApprovedForMe: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-requests/approved-for-me`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Không thể lấy danh sách yêu cầu tuyển dụng');
      return response.json();
    },

    // ===== BULK OPERATIONS =====
    /**
     * Bulk forward multiple job requests to director
     * @param {Array<number>} ids - Array of job request IDs
     * @param {string} note - Optional note for all requests
     * @returns {Promise<{succeeded: Array, failed: Array, total: number}>}
     */
    bulkForward: async (ids, note = '') => {
      const results = {
        succeeded: [],
        failed: [],
        total: ids.length
      };

      for (const id of ids) {
        try {
          await hrService.jobRequests.forwardToDirector(id, note);
          results.succeeded.push({ id, success: true });
        } catch (error) {
          results.failed.push({ id, success: false, error: error.message });
        }
      }

      return results;
    },

    /**
     * Bulk return multiple job requests to department manager
     * @param {Array<number>} ids - Array of job request IDs
     * @param {string} note - Optional note for all requests
     * @returns {Promise<{succeeded: Array, failed: Array, total: number}>}
     */
    bulkReturn: async (ids, note = '') => {
      const results = {
        succeeded: [],
        failed: [],
        total: ids.length
      };

      for (const id of ids) {
        try {
          await hrService.jobRequests.returnToDeptManager(id, note);
          results.succeeded.push({ id, success: true });
        } catch (error) {
          results.failed.push({ id, success: false, error: error.message });
        }
      }

      return results;
    },

    /**
     * Bulk update status for multiple job requests
     * @param {Array<number>} ids - Array of job request IDs
     * @param {number} toStatusId - Target status ID
     * @param {string} note - Optional note for all requests
     * @returns {Promise<{succeeded: Array, failed: Array, total: number}>}
     */
    bulkUpdateStatus: async (ids, toStatusId, note = '') => {
      const results = {
        succeeded: [],
        failed: [],
        total: ids.length
      };

      for (const id of ids) {
        try {
          await hrService.jobRequests.updateStatus(id, toStatusId, note);
          results.succeeded.push({ id, success: true });
        } catch (error) {
          results.failed.push({ id, success: false, error: error.message });
        }
      }

      return results;
    }
  },

  // ===== JOB POSTINGS =====
  jobPostings: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-postings`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch job postings');
      return response.json();
    },
    
    getDrafts: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-postings/drafts`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch draft job postings');
      return response.json();
    },
    
    getById: async (id) => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-postings/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch job posting');
      return response.json();
    },

    create: async (data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-postings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Lỗi ${response.status}`);
      }
      return response.json();
    },

    update: async (id, data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-postings/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update job posting');
      return response.json();
    },
    
    // HR Staff: DRAFT → PUBLISHED
    publish: async (id) => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-postings/${id}/publish`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to publish job posting');
      return response.json();
    },
    
    // HR Manager: PUBLISHED → CLOSED
    close: async (id, reason = '') => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-postings/${id}/close`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Failed to close job posting');
      return response.json();
    },

    // HR Manager: get list of HR Staff to assign
    getStaffList: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-postings/staff-list`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch staff list');
      return response.json();
    },

    // HR Manager: assign HR Staff to a posting
    assignStaff: async (id, staffId) => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-postings/${id}/assign`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ staffId })
      });
      if (!response.ok) throw new Error('Failed to assign staff');
      return response.json();
    },

    // HR Staff: get only postings assigned to me
    getMy: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/job-postings/my`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch my job postings');
      return response.json();
    }
  },

  // ===== APPLICATIONS =====
  applications: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/applications`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response, 'Failed to fetch applications');
    },

    getByStatus: async (statusId) => {
      const url = statusId !== null && statusId !== undefined 
        ? `${API_BASE_URL}/hr/applications?statusId=${statusId}`
        : `${API_BASE_URL}/hr/applications`;
      const response = await authFetch(url, {
        headers: getAuthHeaders()
      });
      return handleResponse(response, 'Failed to fetch applications');
    },
    
    getById: async (id) => {
      const response = await authFetch(`${API_BASE_URL}/hr/applications/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch application');
      return response.json();
    },
    
    // HR Staff: APPLIED → SCREENING, SCREENING → INTERVIEWING
    // HR Manager: INTERVIEWING → REJECTED
    updateStatus: async (id, toStatusId, note = '') => {
      const response = await authFetch(`${API_BASE_URL}/hr/applications/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ toStatusId, note })
      });
      if (!response.ok) throw new Error('Failed to update application status');
      return response.json();
    }
  },

  // ===== INTERVIEWS =====
  interviews: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response, 'Failed to fetch interviews');
    },

    getUpcoming: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/upcoming`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response, 'Failed to fetch upcoming interviews');
    },

    /** Danh sách phỏng vấn có ghi chú từ chối (ứng viên hoặc interviewer) cần HR xử lý. */
    getNeedingAttention: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/needing-attention`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Không thể tải danh sách cần xử lý từ chối');
      return response.json();
    },
    
    create: async (data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create interview');
      return response.json();
    },

    checkConflicts: async (data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/check-conflicts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to check interview conflicts');
      return response.json();
    },

    findAvailableSlots: async (data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/find-available-slots`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to find available time slots');
      return response.json();
    },
    
    update: async (id, data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update interview');
      return response.json();
    },

    getById: async (id) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch interview');
      return response.json();
    },

    getHistory: async (id) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}/history`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Không thể tải lịch sử');
      return response.json();
    },

    requestParticipantsAfterReschedule: async (id) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}/request-participants-after-reschedule`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Gửi yêu cầu đề cử thất bại');
      }
      return response.json();
    },

    finalize: async (id, data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}/finalize`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to finalize interview');
      return response.json();
    },

    cancel: async (id) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to cancel interview');
      return response.json();
    },

    /** Sau khi chọn online/offline: gửi thông báo chỉ cho người phỏng vấn (không gửi ứng viên). */
    sendInvitation: async (id, data = {}) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}/send-invitation`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Gửi thông báo thất bại');
      }
      return response.json();
    },

    /** Gửi thông báo theo block (chỉ người phỏng vấn). */
    sendInvitationBatch: async (data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/send-invitation-batch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Gửi thông báo thất bại');
      }
      return response.json();
    },

    /** Gửi yêu cầu xác nhận tham gia cho ứng viên (sau khi interviewer xác nhận). Ứng viên mới thấy buổi trong "Phỏng vấn của tôi". */
    sendCandidateConfirmation: async (id) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}/send-candidate-confirmation`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Gửi thất bại');
      }
      return response.json();
    },

    /** Gửi hàng loạt yêu cầu xác nhận tham gia cho ứng viên. */
    sendCandidateConfirmationBatch: async (data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/send-candidate-confirmation-batch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Gửi thất bại');
      }
      return response.json();
    },

    submitFeedback: async (id, data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}/feedback`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      return response.json();
    },

    getParticipantRequests: async (interviewId) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${interviewId}/participant-requests`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch participant requests');
      return response.json();
    },

    createParticipantRequest: async (interviewId, data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${interviewId}/participant-requests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create participant request');
      return response.json();
    },

    createParticipantRequestBatch: async (data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/participant-requests/batch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create batch request');
      }
      return response.json();
    },

    getAssignedParticipantRequests: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/participant-requests/assigned`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch assigned participant requests');
      return response.json();
    },

    forwardParticipantRequest: async (reqId, data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/participant-requests/${reqId}/forward`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to forward participant request');
      return response.json();
    },

    nominateParticipants: async (reqId, data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/participant-requests/${reqId}/nominate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to nominate participants');
      return response.json();
    },

    getDeptManagers: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/utilities/dept-managers`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch dept managers');
      return response.json();
    },

    getDirectors: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/utilities/directors`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch directors');
      return response.json();
    },

    markNoShow: async (id, data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}/mark-no-show`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to mark interview as no-show');
      }
      return response.json();
    },

    getCandidateNoShowStats: async (candidateId) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/no-shows/candidate/${candidateId}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch candidate no-show stats');
      return response.json();
    },

    getNoShowStatistics: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/no-shows/statistics`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch no-show statistics');
      return response.json();
    },

    isCandidateBlacklisted: async (candidateId) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/no-shows/candidate/${candidateId}/is-blacklisted`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to check blacklist status');
      return response.json();
    },

    checkNextRound: async (id) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}/check-next-round`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to check next round');
      }
      return response.json();
    },

    reviewRound: async (id, data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}/review-round`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Không thể chốt kết quả vòng');
      }
      return response.json();
    },

    scheduleNextRound: async (id, data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}/schedule-next-round`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to schedule next round');
      }
      return response.json();
    },

    getRoundProgress: async (applicationId) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/application/${applicationId}/round-progress`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch round progress');
      return response.json();
    },

    getPendingFeedbacks: async (params = {}) => {
      const search = new URLSearchParams();
      if (params.interviewerId) search.set('interviewerId', params.interviewerId);
      if (params.overdueOnly) search.set('overdueOnly', 'true');
      const suffix = search.toString() ? `?${search.toString()}` : '';
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/pending-feedbacks${suffix}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch pending feedbacks');
      return response.json();
    },

    /** Lên lịch vòng phỏng vấn tiếp theo theo lô cho nhiều hồ sơ (cùng vị trí). */
    scheduleNextRoundBatch: async (data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/next-round/batch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Không thể tạo vòng phỏng vấn tiếp theo theo lô');
      }
      return response.json();
    },

    sendFeedbackReminder: async (id) => {
      const response = await authFetch(`${API_BASE_URL}/hr/interviews/${id}/send-feedback-reminder`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to send feedback reminder');
      }
      return response.json();
    }
  },

  // ===== CANDIDATES (for offer creation) =====
  candidates: {
    getList: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/candidates`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch candidates');
      return response.json();
    }
  },

  // ===== OFFERS =====
  offers: {
    getById: async (id) => {
      const response = await authFetch(`${API_BASE_URL}/hr/offers/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch offer');
      return response.json();
    },
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/offers`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch offers');
      return response.json();
    },
    
    getPending: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/offers/pending`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch pending offers');
      return response.json();
    },
    
    getApproved: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/offers/approved`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch approved offers');
      return response.json();
    },
    
    create: async (data) => {
      const response = await authFetch(`${API_BASE_URL}/hr/offers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create offer');
      return response.json();
    },
    
    // HR Staff: DRAFT → IN_REVIEW
    submitForReview: async (id) => {
      const response = await authFetch(`${API_BASE_URL}/hr/offers/${id}/submit`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to submit offer');
      return response.json();
    },
    
    // HR Manager/Staff: Chỉnh sửa offer (DRAFT hoặc IN_REVIEW)
    update: async (id, data) => {
      const response = await fetch(`${API_BASE_URL}/hr/offers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          salary: data.salary,
          benefits: data.benefits || null,
          startDate: data.startDate || null
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Không thể cập nhật thư mời');
      }
      return response.json();
    },

    // HR Manager: IN_REVIEW → IN_REVIEW (intermediate), IN_REVIEW → REJECTED
    updateStatus: async (id, toStatusId, note = '') => {
      const response = await fetch(`${API_BASE_URL}/hr/offers/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ toStatusId, note })
      });
      if (!response.ok) throw new Error('Failed to update offer status');
      return response.json();
    },
    
    // HR Staff: APPROVED → SENT
    send: async (id) => {
      const response = await fetch(`${API_BASE_URL}/hr/offers/${id}/send`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to send offer');
      return response.json();
    },

    // HR: Cập nhật offer sau khi ứng viên thương lượng, rồi gửi lại (status phải là NEGOTIATING)
    updateAfterNegotiation: async (id, data) => {
      const response = await fetch(`${API_BASE_URL}/hr/offers/${id}/negotiation`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          proposedSalary: data.salary,
          benefits: data.benefits || null,
          startDate: data.startDate || null
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Không thể cập nhật thư mời');
      }
      return response.json();
    }
  },

  // ===== STATISTICS (HR Manager only) =====
  statistics: {
    getDashboard: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/statistics/dashboard`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard statistics');
      return response.json();
    },
    
    getRecruitmentFunnel: async () => {
      const response = await authFetch(`${API_BASE_URL}/hr/statistics/funnel`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch recruitment funnel');
      return response.json();
    }
  }
};

export default hrService;

