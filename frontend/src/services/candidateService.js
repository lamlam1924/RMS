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
  }
};
