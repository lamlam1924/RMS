import api from './api';
import { API_BASE_URL } from './api';
import { authFetch } from './authService';

const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const parseError = async (res) => {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return json.message || text || `Request failed (${res.status})`;
  } catch {
    return text || `Request failed (${res.status})`;
  }
};

const authGet = async (path) => {
  const res = await authFetch(`${API_BASE_URL}${path}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

const deptManagerService = {
  // Dashboard
  dashboard: {
    getStats: () => authGet('/dept-manager/dashboard/stats'),
  },

  // Job Requests
  jobRequests: {
    getAll: () => authGet('/dept-manager/job-requests'),
    getById: (id) => api.get(`/dept-manager/job-requests/${id}`),
    create: (data) => api.post('/dept-manager/job-requests', data),
    update: (id, data) => api.put(`/dept-manager/job-requests/${id}`, data),
    uploadJd: (id, file) => {
      const formData = new FormData();
      formData.append('jdFile', file);
      return api.post(`/dept-manager/job-requests/${id}/upload-jd`, formData);
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
    getUpcoming: () => authGet('/dept-manager/interviews/upcoming'),
    getById: (id) => api.get(`/dept-manager/interviews/${id}`),
    submitFeedback: (id, feedback) => 
      api.post(`/dept-manager/interviews/${id}/feedback`, feedback),
  },

  // Participant Requests (single + block gộp chung: mỗi item có interviews[])
  participantRequests: {
    getMyAssigned: () => api.get('/dept-manager/participant-requests'),
    getById: (reqId) => api.get(`/dept-manager/participant-requests/${reqId}`),
    getTeamMembers: () => api.get('/dept-manager/participant-requests/team-members'),
    nominate: (reqId, userIds) =>
      api.post(`/dept-manager/participant-requests/${reqId}/nominate`, { userIds }),
  },

  // Applications (for reference)
  applications: {
    getByJobRequest: (jobRequestId) => 
      api.get(`/dept-manager/job-requests/${jobRequestId}/applications`),
  },
};

export default deptManagerService;
