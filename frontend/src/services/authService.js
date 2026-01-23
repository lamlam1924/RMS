const API_BASE = 'http://localhost:3000/api';

// Storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_INFO_KEY = 'userInfo';

/**
 * Auth API Service
 */
export const authService = {
  /**
   * Login with email and password
   */
  async login(email, password, rememberMe = false) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    this.saveTokens(data, rememberMe);
    return data;
  },

  /**
   * Get Google OAuth URL
   */
  async getGoogleAuthUrl() {
    const response = await fetch(`${API_BASE}/auth/google/url`);
    if (!response.ok) throw new Error('Failed to get Google auth URL');
    const data = await response.json();
    return data.url;
  },

  /**
   * Login with Google (callback)
   */
  async loginWithGoogle(code) {
    const response = await fetch(`${API_BASE}/auth/google/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Google login failed');
    }

    const data = await response.json();
    this.saveTokens(data);
    return data;
  },

  /**
   * Refresh access token
   */
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      this.logout();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.saveTokens(data);
    return data;
  },

  /**
   * Logout
   */
  async logout() {
    const refreshToken = this.getRefreshToken();
    
    if (refreshToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAccessToken()}`
          },
          body: JSON.stringify({ refreshToken })
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.clearTokens();
  },

  /**
   * Get current user info
   */
  async getCurrentUser() {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${this.getAccessToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    return await response.json();
  },

  /**
   * Save tokens to storage
   * If rememberMe = true → localStorage (lưu lâu dài)
   * If rememberMe = false → sessionStorage (mất khi đóng browser)
   */
  saveTokens(data, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    if (data.refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    if (data.user) {
      storage.setItem(USER_INFO_KEY, JSON.stringify(data.user));
    }
    
    // Clear the other storage to avoid conflicts
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem(ACCESS_TOKEN_KEY);
    otherStorage.removeItem(REFRESH_TOKEN_KEY);
    otherStorage.removeItem(USER_INFO_KEY);
  },

  /**
   * Clear tokens from both localStorage and sessionStorage
   */
  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_INFO_KEY);
  },

  /**
   * Get access token from localStorage or sessionStorage
   */
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
  },

  /**
   * Get refresh token from localStorage or sessionStorage
   */
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Get user info from localStorage or sessionStorage
   */
  getUserInfo() {
    const userInfo = localStorage.getItem(USER_INFO_KEY) || sessionStorage.getItem(USER_INFO_KEY);
    return userInfo ? JSON.parse(userInfo) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  },

  /**
   * Decode JWT token (simple decode, no verification)
   */
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch {
      return null;
    }
  },

  /**
   * Check if token is expired
   */
  isTokenExpired(token) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  }
};

/**
 * Fetch wrapper with automatic token refresh
 */
export async function authFetch(url, options = {}) {
  const accessToken = authService.getAccessToken();
  
  // Check if token is expired
  if (accessToken && authService.isTokenExpired(accessToken)) {
    try {
      await authService.refreshToken();
    } catch (error) {
      window.location.href = '/login';
      throw error;
    }
  }

  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${authService.getAccessToken()}`
  };

  const response = await fetch(url, { ...options, headers });

  // If 401, try to refresh token once
  if (response.status === 401) {
    try {
      await authService.refreshToken();
      
      // Retry the request
      const retryHeaders = {
        ...options.headers,
        'Authorization': `Bearer ${authService.getAccessToken()}`
      };
      return await fetch(url, { ...options, headers: retryHeaders });
    } catch (error) {
      window.location.href = '/login';
      throw error;
    }
  }

  return response;
}
