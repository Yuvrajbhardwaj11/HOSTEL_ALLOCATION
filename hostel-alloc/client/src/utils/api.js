import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const studentsAPI = {
  getAll: (params) => api.get('/api/students', { params }),
  getById: (id) => api.get(`/api/students/${id}`),
  create: (data) => api.post('/api/students', data),
  update: (id, data) => api.put(`/api/students/${id}`, data),
  delete: (id) => api.delete(`/api/students/${id}`),
  getRanked: () => api.get('/api/students/ranked/list'),
};

export const roomsAPI = {
  getAll: (params) => api.get('/api/rooms', { params }),
  getById: (id) => api.get(`/api/rooms/${id}`),
  create: (data) => api.post('/api/rooms', data),
  update: (id, data) => api.put(`/api/rooms/${id}`, data),
  delete: (id) => api.delete(`/api/rooms/${id}`),
  bulkCreate: (rooms) => api.post('/api/rooms/bulk', { rooms }),
};

export const allocationsAPI = {
  getAll: (params) => api.get('/api/allocations', { params }),
  create: (data) => api.post('/api/allocations', data),
  autoAllocate: (data) => api.post('/api/allocations/auto-allocate', data),
  vacate: (id) => api.delete(`/api/allocations/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
};

export default api;
