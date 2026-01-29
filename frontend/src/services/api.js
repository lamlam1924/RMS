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

export async function apiGet(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function apiPost(path, body) {
    const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function apiPatch(path, body) {
    const res = await fetch(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function apiDelete(path) {
    const res = await fetch(path, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(await res.text());
    return true;
}
