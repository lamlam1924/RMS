import { authFetch } from "./authService";
import { API_BASE_URL } from "./api";

export const candidateService = {
  async getJobPostings() {
    const res = await fetch(`${API_BASE_URL}/candidate/job-postings`);
    if (!res.ok) {
        throw new Error("Failed to fetch job postings");
    }
    return res.json();
  },

  async getJobDetail(id) {
    const res = await fetch(`${API_BASE_URL}/candidate/job-postings/${id}`);
    if (!res.ok) {
        throw new Error("Job posting not found");
    }
    return res.json();
  },

  async getMyCv() {
    const res = await authFetch(`${API_BASE_URL}/candidate/cv`);
    if (!res.ok) throw new Error("Không thể tải CV");
    const data = await res.json();
    return data; // null if no CV yet
  },

  async createCv(data) {
    const res = await authFetch(`${API_BASE_URL}/candidate/cv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn("[createCv] API lỗi:", res.status, res.statusText, "| Body:", text.slice(0, 200));
      let message = "Tạo CV thất bại";
      try {
        const err = JSON.parse(text);
        message = err.message || err.detail || err.title || message;
        if (err.errors && typeof err.errors === "object") {
          const first = Object.values(err.errors).flat()[0];
          if (first) message = first;
        }
      } catch {
        if (text) message = text;
      }
      if (res.status === 401) message = message || "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      if (res.status === 403) message = "Bạn không có quyền thực hiện thao tác này.";
      throw new Error(message);
    }
    return res.json();
  },

  async updateCv(id, data) {
    const res = await authFetch(`${API_BASE_URL}/candidate/cv/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Cập nhật CV thất bại");
    }
    return res.json();
  },

  // Offers (thư mời nhận việc)
  async getMyOffers() {
    const res = await authFetch(`${API_BASE_URL}/candidate/offers`);
    if (!res.ok) throw new Error("Không thể tải danh sách thư mời");
    return res.json();
  },

  async getOfferById(id) {
    const res = await authFetch(`${API_BASE_URL}/candidate/offers/${id}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error("Không tìm thấy thư mời");
      throw new Error("Không thể tải thông tin thư mời");
    }
    return res.json();
  },

  async respondToOffer(id, response, comment = "") {
    const res = await authFetch(`${API_BASE_URL}/candidate/offers/${id}/respond`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response, comment }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Phản hồi thất bại");
    }
    return res.json();
  },
};
