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
    uploadJd: (id, file) => {
      const formData = new FormData();
      formData.append('jdFile', file);
      return api.post(`/dept-manager/job-requests/${id}/upload-jd`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    submit: (id, note) => api.post(`/dept-manager/job-requests/${id}/submit`, { note: note || null }),
    reopen: (id) => api.post(`/dept-manager/job-requests/${id}/reopen`),
    cancel: (id, note) => api.post(`/dept-manager/job-requests/${id}/cancel`, { note: note || null }),
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
