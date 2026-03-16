import api from './api';

const employeeService = {
  // Interviews
  interviews: {
    getAll: () => api.get('/employee/interviews'),
    getUpcoming: () => api.get('/employee/interviews/upcoming'),
    getById: (id) => api.get(`/employee/interviews/${id}`),
    /** Xác nhận hoặc từ chối tham gia (CONFIRM / DECLINE). Khi từ chối có thể gửi note để HR thương lượng/đổi lịch. */
    respond: (id, response, note) =>
      api.post(`/employee/interviews/${id}/respond`, { response, note: note || undefined }),
    submitFeedback: (id, feedback) =>
      api.post(`/employee/interviews/${id}/feedback`, feedback),
  },
};

export default employeeService;
