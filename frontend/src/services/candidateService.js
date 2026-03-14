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
    const text = await res.text();
    if (!text || text.trim() === 'null' || text.trim() === '') return null;
    return JSON.parse(text);
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

  async applyToJob(jobPostingId, cvFile) {
    const formData = new FormData();
    if (cvFile) formData.append('cvFile', cvFile);
    const res = await authFetch(`${API_BASE_URL}/candidate/applications/apply/${jobPostingId}`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Nộp đơn thất bại');
    return data;
  },

  async getMyApplications() {
    const res = await authFetch(`${API_BASE_URL}/candidate/applications`);
    if (!res.ok) throw new Error('Không thể tải danh sách đơn ứng tuyển');
    return res.json();
  },

  async getMyApplicationById(id) {
    const res = await authFetch(`${API_BASE_URL}/candidate/applications/${id}`);
    if (!res.ok) throw new Error('Không tìm thấy đơn ứng tuyển');
    return res.json();
  },

  async uploadCvFile(cvFile) {
    const formData = new FormData();
    formData.append('file', cvFile);

    const res = await authFetch(`${API_BASE_URL}/candidate/cv/upload-file`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Tải file CV lên thất bại');
    return data;
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

  async getMyInterviews() {
    const res = await authFetch(`${API_BASE_URL}/candidate/interviews`);
    if (!res.ok) throw new Error("Không thể tải danh sách phỏng vấn");
    return res.json();
  },

  async getInterviewDetail(id) {
    const res = await authFetch(`${API_BASE_URL}/candidate/interviews/${id}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("Lịch phỏng vấn không tồn tại hoặc bạn không có quyền xem");
      }
      if (res.status === 401) {
        throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      }
      throw new Error("Không thể tải chi tiết phỏng vấn");
    }
    return res.json();
  },

  async respondInterview(id, response) {
    const res = await authFetch(`${API_BASE_URL}/candidate/interviews/${id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Không thể phản hồi lịch phỏng vấn");
    }
    return res.json();
  },
};
