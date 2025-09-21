import axios from 'axios';

// API base URL - update this to match your backend
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on unauthorized
      localStorage.removeItem('auth_token');
      // Optionally redirect to login
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/api/v1/auth/login',
    me: '/api/v1/auth/me',
    verifyToken: '/api/v1/auth/verify-token',
  },
  // Generation
  generation: {
    create: '/api/v1/generate',
    getJob: (jobId: string) => `/api/v1/generate/${jobId}`,
    listJobs: '/api/v1/generate',
    models: '/api/v1/models',
  },
  // WebSocket
  websocket: {
    job: (jobId: string) => `ws://localhost:8000/api/v1/generate/${jobId}`,
  },
} as const;

export type ApiError = {
  message: string;
  detail?: string;
  status?: number;
};

export default api;
