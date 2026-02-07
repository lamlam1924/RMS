/**
 * API Configuration & Helpers
 */

// Auto-detect protocol based on environment
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

// Export for debugging
if (import.meta.env.DEV) {
    console.log('API Base URL:', API_BASE_URL);
}

// Helper to get auth token
function getAuthToken() {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
}

// Helper to create auth headers
function getAuthHeaders() {
    const token = getAuthToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

export async function apiGet(path) {
    const url = `${API_BASE_URL}${path}`;
    const token = getAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function apiPost(path, body) {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function apiPut(path, body) {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function apiPatch(path, body) {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function apiDelete(path) {
    const url = `${API_BASE_URL}${path}`;
    const token = getAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: "DELETE", headers });
    if (!res.ok && res.status !== 204) throw new Error(await res.text());
    return true;
}

const api = {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    patch: apiPatch,
    delete: apiDelete,
};

export default api;
