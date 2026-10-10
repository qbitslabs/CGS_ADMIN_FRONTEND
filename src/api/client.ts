/* Admin API client.
 * Admin sessions stay bearer tokens. Staff sessions use a short access token
 * plus an httpOnly refresh cookie. Both clients clear the local session on 401
 * and surface the backend error message. */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/cgs_api/v1/admin';

export const cgs_api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const apiClient = cgs_api;

function adminToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('cgs_admin_token');
}
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = adminToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 / 403 / 500 error interception
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response) {
      const status = error.response.status;
      const payload = error.response.data;
      const message =
        payload?.error?.message ||
        payload?.message ||
        error.message ||
        `Request failed with status ${status}`;

      if (status === 401 && !error.config?.url?.includes('/auth/login') && typeof localStorage !== 'undefined') {
        localStorage.removeItem('cgs_admin_token');
        localStorage.removeItem('cgs_admin_user');
        window.dispatchEvent(new CustomEvent('cgs:admin:session_expired'));
      } else if (status === 403) {
        console.warn('[Admin API 403] Authorization Denied:', payload);
      }

      return Promise.reject(new Error(message));
    }
    return Promise.reject(new Error(error.message || 'Unable to reach the CGS backend.'));
  }
);
