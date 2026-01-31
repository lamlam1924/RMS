import api from './api';

const deptManagerService = {
  // Dashboard
  dashboard: {
    getStats: () => api.get('/api/dept-manager/dashboard/stats'),
  },

  // Job Requests
  jobRequests: {
    getAll: () => api.get('/api/dept-manager/job-requests'),
    getById: (id) => api.get(`/api/dept-manager/job-requests/${id}`),
    create: (data) => api.post('/api/dept-manager/job-requests', data),
    update: (id, data) => api.put(`/api/dept-manager/job-requests/${id}`, data),
    submit: (id) => api.post(`/api/dept-manager/job-requests/${id}/submit`),
    delete: (id) => api.delete(`/api/dept-manager/job-requests/${id}`),
  },

  // Interviews
  interviews: {
    getAll: () => api.get('/api/dept-manager/interviews'),
    getUpcoming: () => api.get('/api/dept-manager/interviews/upcoming'),
    getById: (id) => api.get(`/api/dept-manager/interviews/${id}`),
    submitFeedback: (id, feedback) => 
      api.post(`/api/dept-manager/interviews/${id}/feedback`, feedback),
  },

  // Applications (for reference)
  applications: {
    getByJobRequest: (jobRequestId) => 
      api.get(`/api/dept-manager/job-requests/${jobRequestId}/applications`),
  },
};

export default deptManagerService;
