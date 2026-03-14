/**
 * Director Service - API calls for director approval workflows
 */

import { API_BASE_URL } from "./api";
import { authFetch } from "./authService";

const getAuthHeader = () => {
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
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

const requestJson = async (url, options = {}) => {
  const res = await authFetch(url, {
    ...options,
    headers: {
      ...getAuthHeader(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

// ==================== JOB REQUEST APPROVALS ====================
export const jobRequestService = {
  async getPending() {
    return requestJson(`${API_BASE_URL}/director/job-requests/pending`);
  },

  async getProcessed() {
    return requestJson(`${API_BASE_URL}/director/job-requests/processed`);
  },

  async getDetail(id) {
    return requestJson(`${API_BASE_URL}/director/job-requests/${id}`);
  },

  async approve(id, comment = "") {
    return requestJson(`${API_BASE_URL}/director/job-requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
  },

  async reject(id, comment = "") {
    return requestJson(`${API_BASE_URL}/director/job-requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
  },

  async returnJobRequest(id, comment = "") {
    return requestJson(`${API_BASE_URL}/director/job-requests/${id}/return`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
  },
};

// ==================== OFFER APPROVALS ====================
export const offerService = {
  async getPending() {
    return requestJson(`${API_BASE_URL}/director/offers/pending`);
  },

  async getDetail(id) {
    return requestJson(`${API_BASE_URL}/director/offers/${id}`);
  },

  async approve(id, comment = "") {
    return requestJson(`${API_BASE_URL}/director/offers/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
  },

  async reject(id, comment = "") {
    return requestJson(`${API_BASE_URL}/director/offers/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
  },
};

const directorService = {
  jobRequests: jobRequestService,
  offers: offerService,

  statistics: {
    async getRecruitmentOverview() {
      return requestJson(`${API_BASE_URL}/director/statistics/overview`);
    },
    async getRecruitmentFunnel() {
      return requestJson(`${API_BASE_URL}/director/statistics/funnel`);
    },
  },

  interviews: {
    async getAll() {
      return requestJson(`${API_BASE_URL}/director/interviews`);
    },
    async getUpcoming() {
      return requestJson(`${API_BASE_URL}/director/interviews/upcoming`);
    },
    async getById(id) {
      return requestJson(`${API_BASE_URL}/director/interviews/${id}`);
    },
    async submitFeedback(id, data) {
      return requestJson(`${API_BASE_URL}/director/interviews/${id}/feedback`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  participantRequests: {
    async getForwarded() {
      return requestJson(`${API_BASE_URL}/director/interviews/participant-requests`);
    },
    async getById(reqId) {
      return requestJson(`${API_BASE_URL}/director/interviews/participant-requests/${reqId}`);
    },
    async nominate(reqId, userIds) {
      return requestJson(`${API_BASE_URL}/director/interviews/participant-requests/${reqId}/nominate`, {
        method: 'POST',
        body: JSON.stringify({ userIds }),
      });
    },
  },
};

export default directorService;
