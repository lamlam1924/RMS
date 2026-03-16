import api from './api';
import { authService } from './authService';
import { ROLES } from '../constants/roles';

const getRoleBasedPrefix = () => {
  const user = authService.getUserInfo();
  const roles = user?.roles || [];

  if (roles.includes(ROLES.DIRECTOR)) return '/director/interviews';
  if (roles.includes(ROLES.DEPARTMENT_MANAGER)) return '/dept-manager/interviews';
  if (roles.includes(ROLES.EMPLOYEE)) return '/employee/interviews';

  return null;
};

const withFallback = async (primaryCall, fallbackCall) => {
  try {
    return await primaryCall();
  } catch (error) {
    if (!String(error?.message || '').includes('404') || !fallbackCall) {
      throw error;
    }
    return fallbackCall();
  }
};

const interviewerService = {
  interviews: {
    getAll: async () => {
      const rolePrefix = getRoleBasedPrefix();
      return withFallback(
        () => api.get('/interviewer/interviews'),
        rolePrefix ? () => api.get(rolePrefix) : null
      );
    },
    getUpcoming: async () => {
      const rolePrefix = getRoleBasedPrefix();
      return withFallback(
        () => api.get('/interviewer/interviews/upcoming'),
        rolePrefix ? () => api.get(`${rolePrefix}/upcoming`) : null
      );
    },
    getById: async (id) => {
      const rolePrefix = getRoleBasedPrefix();
      return withFallback(
        () => api.get(`/interviewer/interviews/${id}`),
        rolePrefix ? () => api.get(`${rolePrefix}/${id}`) : null
      );
    },
    /** Xác nhận hoặc từ chối tham gia (CONFIRM / DECLINE). Khi từ chối có thể gửi note để HR thương lượng/đổi lịch. */
    respond: async (id, response, note) => {
      const rolePrefix = getRoleBasedPrefix();
      const body = { response, note: note || undefined };
      return withFallback(
        () => api.post(`/interviewer/interviews/${id}/respond`, body),
        rolePrefix ? () => api.post(`${rolePrefix}/${id}/respond`, body) : null
      );
    },
    submitFeedback: async (id, feedback) => {
      const rolePrefix = getRoleBasedPrefix();
      return withFallback(
        () => api.post(`/interviewer/interviews/${id}/feedback`, feedback),
        rolePrefix ? () => api.post(`${rolePrefix}/${id}/feedback`, feedback) : null
      );
    },
  },
};

export default interviewerService;