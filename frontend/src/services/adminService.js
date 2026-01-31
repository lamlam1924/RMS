/**
 * Admin Service - API calls for admin management
 */

import { API_BASE_URL } from "./api";

const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ==================== USER MANAGEMENT ====================
export const userService = {
  async getAll(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/admin/users${queryParams ? `?${queryParams}` : ""}`;
    const res = await fetch(url, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getById(id) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async create(userData) {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(id, userData) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "PUT",
      headers: getAuthHeader(),
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete(id) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok && res.status !== 204) throw new Error(await res.text());
    return true;
  },

  async updateStatus(id, isActive) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async resetPassword(id) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/reset-password`, {
      method: "POST",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

// ==================== ROLE MANAGEMENT ====================
export const roleService = {
  async getAll(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/admin/roles${queryParams ? `?${queryParams}` : ""}`;
    const res = await fetch(url, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getById(id) {
    const res = await fetch(`${API_BASE_URL}/admin/roles/${id}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async create(roleData) {
    const res = await fetch(`${API_BASE_URL}/admin/roles`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(roleData),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(id, roleData) {
    const res = await fetch(`${API_BASE_URL}/admin/roles/${id}`, {
      method: "PUT",
      headers: getAuthHeader(),
      body: JSON.stringify(roleData),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete(id) {
    const res = await fetch(`${API_BASE_URL}/admin/roles/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok && res.status !== 204) throw new Error(await res.text());
    return true;
  },

  async getPermissions() {
    const res = await fetch(`${API_BASE_URL}/admin/roles/permissions`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

// ==================== DEPARTMENT MANAGEMENT ====================
export const departmentService = {
  async getAll(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/admin/departments${queryParams ? `?${queryParams}` : ""}`;
    const res = await fetch(url, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getById(id) {
    const res = await fetch(`${API_BASE_URL}/admin/departments/${id}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async create(departmentData) {
    const res = await fetch(`${API_BASE_URL}/admin/departments`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(departmentData),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(id, departmentData) {
    const res = await fetch(`${API_BASE_URL}/admin/departments/${id}`, {
      method: "PUT",
      headers: getAuthHeader(),
      body: JSON.stringify(departmentData),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete(id) {
    const res = await fetch(`${API_BASE_URL}/admin/departments/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok && res.status !== 204) throw new Error(await res.text());
    return true;
  },

  async updateStatus(id, isActive) {
    const res = await fetch(`${API_BASE_URL}/admin/departments/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

// ==================== SYSTEM CONFIGURATION ====================
export const systemConfigService = {
  async getAll() {
    const res = await fetch(`${API_BASE_URL}/admin/config`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async get(key) {
    const res = await fetch(`${API_BASE_URL}/admin/config/${key}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(key, value) {
    const res = await fetch(`${API_BASE_URL}/admin/config/${key}`, {
      method: "PUT",
      headers: getAuthHeader(),
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateBulk(configs) {
    const res = await fetch(`${API_BASE_URL}/admin/config/bulk`, {
      method: "PUT",
      headers: getAuthHeader(),
      body: JSON.stringify(configs),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

// ==================== WORKFLOW MANAGEMENT ====================
export const workflowService = {
  async getStatusTypes() {
    const res = await fetch(`${API_BASE_URL}/admin/workflow/status-types`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('getStatusTypes error:', res.status, errorText);
      throw new Error(`API Error (${res.status}): ${errorText || 'Failed to fetch status types'}`);
    }
    return res.json();
  },

  async getStatusesByType(typeId) {
    const res = await fetch(`${API_BASE_URL}/admin/workflow/status-types/${typeId}/statuses`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getTransitionsByType(typeId) {
    const res = await fetch(`${API_BASE_URL}/admin/workflow/status-types/${typeId}/transitions`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getRoles() {
    const res = await fetch(`${API_BASE_URL}/admin/roles`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('getRoles error:', res.status, errorText);
      throw new Error(`API Error (${res.status}): ${errorText || 'Failed to fetch roles'}`);
    }
    const data = await res.json();
    // Transform RoleListDto to simple { id, name } format
    return data.map(role => ({
      id: role.roleId,
      name: role.roleName,
      code: role.roleCode
    }));
  },

  async createTransition(data) {
    const res = await fetch(`${API_BASE_URL}/admin/workflow/transitions`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateTransition(id, data) {
    const res = await fetch(`${API_BASE_URL}/admin/workflow/transitions/${id}`, {
      method: "PUT",
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteTransition(id) {
    const res = await fetch(`${API_BASE_URL}/admin/workflow/transitions/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok && res.status !== 204) throw new Error(await res.text());
    return true;
  },
};
