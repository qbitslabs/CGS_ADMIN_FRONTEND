/* Admin frontend client for client endpoints.
 * Talks to CGS admin routes with the operator bearer token. */
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

// Request Interceptor: Attach Admin Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('cgs_admin_token');
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

      if (status === 401 && !error.config?.url?.includes('/auth/login')) {
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
