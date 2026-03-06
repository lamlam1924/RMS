// HR Service - API calls for HR Manager and HR Staff operations
const API_BASE_URL = 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const hrService = {
  // ===== JOB REQUESTS =====
  jobRequests: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-requests`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch job requests');
      return response.json();
    },
    
    getPending: async () => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-requests/pending`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch pending job requests');
      return response.json();
    },
    
    getByStatus: async (statusCode) => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-requests/status/${statusCode}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error(`Failed to fetch job requests with status ${statusCode}`);
      return response.json();
    },
    
    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-requests/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch job request');
      return response.json();
    },
    
    // Cập nhật trạng thái chung
    updateStatus: async (id, toStatusId, note = '') => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-requests/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ toStatusId, note })
      });
      if (!response.ok) throw new Error('Không thể cập nhật trạng thái');
      return response.json();
    },

    // Chuyển tiếp cho Giám đốc duyệt (SUBMITTED -> IN_REVIEW)
    forwardToDirector: async (id, note = '') => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-requests/${id}/forward`, {
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
      const response = await fetch(`${API_BASE_URL}/api/hr/job-requests/${id}/return`, {
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
      const response = await fetch(`${API_BASE_URL}/api/hr/job-requests/${id}/approve-cancel`, {
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
      const response = await fetch(`${API_BASE_URL}/api/hr/job-requests/${id}/reject-cancel`, {
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
      const response = await fetch(`${API_BASE_URL}/api/hr/job-requests/${id}/assign`, {
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
      const response = await fetch(`${API_BASE_URL}/api/hr/job-requests/approved-for-me`, {
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
      const response = await fetch(`${API_BASE_URL}/api/hr/job-postings`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch job postings');
      return response.json();
    },
    
    getDrafts: async () => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-postings/drafts`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch draft job postings');
      return response.json();
    },
    
    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-postings/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch job posting');
      return response.json();
    },

    create: async (data) => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-postings`, {
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
      const response = await fetch(`${API_BASE_URL}/api/hr/job-postings/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update job posting');
      return response.json();
    },
    
    // HR Staff: DRAFT → PUBLISHED
    publish: async (id) => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-postings/${id}/publish`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to publish job posting');
      return response.json();
    },
    
    // HR Manager: PUBLISHED → CLOSED
    close: async (id, reason = '') => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-postings/${id}/close`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Failed to close job posting');
      return response.json();
    },

    // HR Manager: get list of HR Staff to assign
    getStaffList: async () => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-postings/staff-list`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch staff list');
      return response.json();
    },

    // HR Manager: assign HR Staff to a posting
    assignStaff: async (id, staffId) => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-postings/${id}/assign`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ staffId })
      });
      if (!response.ok) throw new Error('Failed to assign staff');
      return response.json();
    },

    // HR Staff: get only postings assigned to me
    getMy: async () => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-postings/my`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch my job postings');
      return response.json();
    }
  },

  // ===== APPLICATIONS =====
  applications: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/api/hr/applications`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    },
    
    getByStatus: async (statusId) => {
      const url = statusId !== null && statusId !== undefined 
        ? `${API_BASE_URL}/api/hr/applications?status=${statusId}`
        : `${API_BASE_URL}/api/hr/applications`;
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    },
    
    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/api/hr/applications/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch application');
      return response.json();
    },
    
    // HR Staff: APPLIED → SCREENING, SCREENING → INTERVIEWING
    // HR Manager: INTERVIEWING → REJECTED
    updateStatus: async (id, toStatusId, note = '') => {
      const response = await fetch(`${API_BASE_URL}/api/hr/applications/${id}/status`, {
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
      const response = await fetch(`${API_BASE_URL}/api/hr/interviews`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch interviews');
      return response.json();
    },
    
    getUpcoming: async () => {
      const response = await fetch(`${API_BASE_URL}/api/hr/interviews/upcoming`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch upcoming interviews');
      return response.json();
    },
    
    create: async (data) => {
      const response = await fetch(`${API_BASE_URL}/api/hr/interviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create interview');
      return response.json();
    },
    
    update: async (id, data) => {
      const response = await fetch(`${API_BASE_URL}/api/hr/interviews/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update interview');
      return response.json();
    }
  },

  // ===== OFFERS =====
  offers: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/api/hr/offers`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch offers');
      return response.json();
    },
    
    getPending: async () => {
      const response = await fetch(`${API_BASE_URL}/api/hr/offers/pending`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch pending offers');
      return response.json();
    },
    
    getApproved: async () => {
      const response = await fetch(`${API_BASE_URL}/api/hr/offers/approved`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch approved offers');
      return response.json();
    },
    
    create: async (data) => {
      const response = await fetch(`${API_BASE_URL}/api/hr/offers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create offer');
      return response.json();
    },
    
    // HR Staff: DRAFT → IN_REVIEW
    submitForReview: async (id) => {
      const response = await fetch(`${API_BASE_URL}/api/hr/offers/${id}/submit`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to submit offer');
      return response.json();
    },
    
    // HR Manager: IN_REVIEW → IN_REVIEW (intermediate), IN_REVIEW → REJECTED
    updateStatus: async (id, toStatusId, note = '') => {
      const response = await fetch(`${API_BASE_URL}/api/hr/offers/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ toStatusId, note })
      });
      if (!response.ok) throw new Error('Failed to update offer status');
      return response.json();
    },
    
    // HR Staff: APPROVED → SENT
    send: async (id) => {
      const response = await fetch(`${API_BASE_URL}/api/hr/offers/${id}/send`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to send offer');
      return response.json();
    }
  },

  // ===== STATISTICS (HR Manager only) =====
  statistics: {
    getDashboard: async () => {
      const response = await fetch(`${API_BASE_URL}/api/hr/statistics/dashboard`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard statistics');
      return response.json();
    },
    
    getRecruitmentFunnel: async () => {
      const response = await fetch(`${API_BASE_URL}/api/hr/statistics/funnel`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch recruitment funnel');
      return response.json();
    }
  }
};

export default hrService;
