import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartskale_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('smartskale_token');
      localStorage.removeItem('smartskale_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
