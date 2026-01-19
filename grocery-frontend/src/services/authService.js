// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Laravel backend
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Automatically attach token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ Auth APIs
export const login = (credentials) => api.post('/login', credentials);
export const register = (user) => api.post('/register', user);
export const logout = () => api.post('/logout');

// ✅ MyAccount APIs
export const fetchProfile = () => api.get('/profile');
export const updateProfile = (id, data) => api.put(`/users/${id}`, data);
export const deleteAccount = (id) => api.delete(`/users/${id}`);
