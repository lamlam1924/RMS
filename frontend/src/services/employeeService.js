import api from './api';

const employeeService = {
  // Interviews
  interviews: {
    getAll: () => api.get('/api/employee/interviews'),
    getUpcoming: () => api.get('/api/employee/interviews/upcoming'),
    getById: (id) => api.get(`/api/employee/interviews/${id}`),
    submitFeedback: (id, feedback) => 
      api.post(`/api/employee/interviews/${id}/feedback`, feedback),
  },
};

export default employeeService;
