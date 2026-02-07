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
    
    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-requests/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch job request');
      return response.json();
    },
    
    // HR Manager: SUBMITTED → IN_REVIEW, IN_REVIEW → IN_REVIEW, IN_REVIEW → REJECTED
    updateStatus: async (id, toStatusId, note = '') => {
      const response = await fetch(`${API_BASE_URL}/api/hr/job-requests/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ toStatusId, note })
      });
      if (!response.ok) throw new Error('Failed to update job request status');
      return response.json();
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
      if (!response.ok) throw new Error('Failed to create job posting');
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
