/**
 * Resume Builder API - Fetch client for Node.js Resume API
 * Base URL from environment: VITE_RESUME_API_URL (default http://localhost:4000)
 */
const BASE_URL = import.meta.env.VITE_RESUME_API_URL || 'http://localhost:4000/api';

async function request(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

/**
 * Create a new resume
 * @param {object} payload - { candidateId: number, data: object }
 */
export async function createResume(payload) {
  return request('POST', '/resume', payload);
}

/**
 * Get resume by ID
 */
export async function getResume(id) {
  return request('GET', `/resume/${id}`);
}

/**
 * Update resume by ID
 * @param {number} id
 * @param {object} payload - { data: object }
 */
export async function updateResume(id, payload) {
  return request('PUT', `/resume/${id}`, payload);
}

/**
 * Delete resume by ID
 */
export async function deleteResume(id) {
  const res = await fetch(`${BASE_URL}/resume/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
}
