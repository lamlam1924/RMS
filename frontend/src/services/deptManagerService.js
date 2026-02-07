import api from './api';

const deptManagerService = {
  // Dashboard
  dashboard: {
    getStats: () => api.get('/dept-manager/dashboard/stats'),
  },

  // Job Requests
  jobRequests: {
    getAll: () => api.get('/dept-manager/job-requests'),
    getById: (id) => api.get(`/dept-manager/job-requests/${id}`),
    create: (data) => api.post('/dept-manager/job-requests', data),
    update: (id, data) => api.put(`/dept-manager/job-requests/${id}`, data),
    submit: (id) => api.post(`/dept-manager/job-requests/${id}/submit`),
    delete: (id) => api.delete(`/dept-manager/job-requests/${id}`),
    getPositions: () => api.get('/dept-manager/job-requests/positions'),
  },

  // Interviews
  interviews: {
    getAll: () => api.get('/dept-manager/interviews'),
    getUpcoming: () => api.get('/dept-manager/interviews/upcoming'),
    getById: (id) => api.get(`/dept-manager/interviews/${id}`),
    submitFeedback: (id, feedback) => 
      api.post(`/dept-manager/interviews/${id}/feedback`, feedback),
  },

  // Applications (for reference)
  applications: {
    getByJobRequest: (jobRequestId) => 
      api.get(`/dept-manager/job-requests/${jobRequestId}/applications`),
  },
};

export default deptManagerService;
