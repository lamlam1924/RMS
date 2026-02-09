/**
 * Director Service - API calls for director approval workflows
 */

import { API_BASE_URL } from "./api";

const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ==================== JOB REQUEST APPROVALS ====================
export const jobRequestService = {
  async getPending() {
    const res = await fetch(`${API_BASE_URL}/director/job-requests/pending`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getDetail(id) {
    const res = await fetch(`${API_BASE_URL}/director/job-requests/${id}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async approve(id, comment = "") {
    const res = await fetch(`${API_BASE_URL}/director/job-requests/${id}/approve`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ comment }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async reject(id, comment = "") {
    const res = await fetch(`${API_BASE_URL}/director/job-requests/${id}/reject`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ comment }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async returnJobRequest(id, comment = "") {
    const res = await fetch(`${API_BASE_URL}/director/job-requests/${id}/return`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ comment }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

// ==================== OFFER APPROVALS ====================
export const offerService = {
  async getPending() {
    const res = await fetch(`${API_BASE_URL}/director/offers/pending`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getDetail(id) {
    const res = await fetch(`${API_BASE_URL}/director/offers/${id}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async approve(id, comment = "") {
    const res = await fetch(`${API_BASE_URL}/director/offers/${id}/approve`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ comment }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async reject(id, comment = "") {
    const res = await fetch(`${API_BASE_URL}/director/offers/${id}/reject`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ comment }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

const directorService = {
  jobRequests: jobRequestService,
  offers: offerService,
};

export default directorService;
