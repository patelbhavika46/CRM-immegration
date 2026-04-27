import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 30_000,
});

// ── Request interceptor — attach token ────────────────────────────────────────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — single-attempt token refresh ───────────────────────
//
// Only one refresh call runs at a time. While it's in-flight, other 401 requests
// are queued and replayed with the new token (or rejected if refresh fails).
// Auth endpoints are never retried to prevent infinite loops.

type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };

let isRefreshing = false;
let pendingQueue: QueueEntry[] = [];

function flushQueue(token: string | null, error: unknown = null) {
  pendingQueue.forEach((entry) => (token ? entry.resolve(token) : entry.reject(error)));
  pendingQueue = [];
}

const AUTH_URLS = ['/auth/refresh', '/auth/login', '/auth/forgot-password'];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Skip refresh for non-401 errors, already-retried requests, or auth endpoints
    const requestUrl = original?.url ?? '';
    const isAuthEndpoint = AUTH_URLS.some((u) => requestUrl.endsWith(u));

    if (error.response?.status !== 401 || original?._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    // If another refresh is already running, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(original);
        })
        .catch(() => Promise.reject(error));
    }

    // This request kicks off the refresh
    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await apiClient.post('/auth/refresh');
      const newToken: string = data.data.token;

      useAuthStore.getState().setToken(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;

      flushQueue(newToken);
      return apiClient(original);
    } catch (refreshError) {
      flushQueue(null, refreshError);
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code: number;
}
