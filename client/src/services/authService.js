import api from './api';

const isDevelopment = process.env.NODE_ENV === 'development';

export const authService = {
  async login(email, password) {
    try {
      // Don't log the request here - it's handled in api.js interceptor
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      if (isDevelopment) {
        console.error('Login error:', error.message);
      }
      throw error;
    }
  },

  async register(email, display_name, password, confirmPassword) {
    try {
      const response = await api.post('/auth/register', { 
        email, 
        display_name, 
        password, 
        confirmPassword 
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      if (isDevelopment) {
        console.error('Registration error:', error.message);
      }
      throw error;
    }
  },

  async verify() {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      if (isDevelopment) {
        console.error('Verify error:', error.message);
      }
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};