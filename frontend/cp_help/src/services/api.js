import axiosInstance from '../utils/axiosInstance';
import axios from 'axios';

// Auth Endpoints
export const authService = {
  login: (credentials) => axiosInstance.post('/login', credentials),
  register: (userData) => axiosInstance.post('/create-account', userData),
  verifyEmail: (data) => axiosInstance.post('/verify-email', data),
  resendOtp: (data) => axiosInstance.post('/resend-otp', data),
  forgotPassword: (data) => axiosInstance.post('/forgot-password', data),
  resetPassword: (data) => axiosInstance.post('/reset-password', data),
  getUser: () => axiosInstance.get('/get-user'),
};

// Friends Endpoints
export const friendService = {
  add: (data) => axiosInstance.post('/add-friend', data),
  edit: (id, data) => axiosInstance.put(`/edit-friend/${id}`, data),
  delete: (id) => axiosInstance.delete(`/delete-friend/${id}`),
  getAll: (page = 1, sortBy = 'name', order = 'asc') => axiosInstance.get(`/get-all-friends/?page=${page}&sortBy=${sortBy}&order=${order}`),
  search: (query) => axiosInstance.get(`/search-friend/?query=${query}`),
  validateHandle: (handle) => axiosInstance.get(`/validate-handle/${handle}`)
};

// Problems Endpoints
export const problemService = {
  getAll: (page = 1) => axiosInstance.get(`/get-all-problems/?page=${page}`),
  add: (problemData) => axiosInstance.post('/add-problem', problemData),
  delete: (problemId) => axiosInstance.delete(`/delete-problem/${problemId}`),
};

// External Endpoints
export const contestService = {
  getUpcoming: () => axios.get('https://api.digitomize.com/contests'),
};
