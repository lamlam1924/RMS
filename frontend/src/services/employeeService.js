import api from './api';

const employeeService = {
  // Interviews
  interviews: {
    getAll: () => api.get('/employee/interviews'),
    getUpcoming: () => api.get('/employee/interviews/upcoming'),
    getById: (id) => api.get(`/employee/interviews/${id}`),
    submitFeedback: (id, feedback) => 
      api.post(`/employee/interviews/${id}/feedback`, feedback),
  },
};

export default employeeService;
