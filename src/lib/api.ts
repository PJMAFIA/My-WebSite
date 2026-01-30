import axios from 'axios';
import { useAuthStore } from '@/store';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Ensure this matches your backend port
  // ❌ REMOVED: headers: { 'Content-Type': 'application/json' } 
  // Let axios set this automatically based on data type (JSON vs FormData)
});

// Request Interceptor: Attaches the Token automatically
api.interceptors.request.use(
  (config) => {
    // We access the token directly from the store's state
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ Session expired or invalid token.');
      // Optional: Trigger logout if 401 happens globally
      // useAuthStore.getState().logout(); 
    }
    return Promise.reject(error);
  }
);

export default api;