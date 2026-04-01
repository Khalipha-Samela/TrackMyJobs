import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://trackmyjobs-api.onrender.com/api';

const isDevelopment = process.env.NODE_ENV === 'development';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Function to sanitize data (remove passwords)
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  if (sanitized.password) {
    sanitized.password = '********';
  }
  if (sanitized.confirmPassword) {
    sanitized.confirmPassword = '********';
  }
  return sanitized;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log only in development, and sanitize sensitive data
    if (isDevelopment) {
      const logData = config.data ? sanitizeData(config.data) : undefined;
      console.log(`📤 ${config.method.toUpperCase()} ${config.url}`, logData);
    }
    
    return config;
  },
  (error) => {
    if (isDevelopment) console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (isDevelopment) {
      console.log(`📥 ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (isDevelopment) {
      console.error('API Error:', error.response?.status, error.response?.data);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;