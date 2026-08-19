import axios from 'axios';

const api = axios.create({
  // Sesuaikan prefix '/api/v1' dengan konfigurasi FastAPI milikmu
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Interceptor Request: Menyisipkan Token JWT ke setiap Request Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Interceptor Response: Menangani Error Global (misal: Token Expired 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Hapus token yang tidak valid dan redirect ke login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Mencegah redirect berulang jika sudah ada di halaman login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;