/**
 * API Configuration
 * Centralized API base URL configuration
 */

// Auto-detect protocol based on environment
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

// Export for debugging
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}
