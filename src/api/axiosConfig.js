import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send cookies automatically (essential for httpOnly jwt)
});

// Auto-attach authorization token from localStorage if present
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lumina_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept 401s to handle unauthorized redirect / state resets
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid: clear local token storage
      localStorage.removeItem('lumina_auth_token');
      localStorage.removeItem('lumina_user');
      // Trigger a reload or redirect to force a re-login if on page
      if (window.location.pathname !== '/login') {
        // We can let the react state catch this via global state checks,
        // but resetting localStorage is a great safety net.
      }
    }
    return Promise.reject(error);
  }
);

export default API;
