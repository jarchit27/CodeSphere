import axiosInstance from '../utils/axiosInstance';
import axios from 'axios';

// Auth Endpoints
export const authService = {
  login: (credentials) => axiosInstance.post('/login', credentials),
  register: (userData) => axiosInstance.post('/create-account', userData),
  getUser: () => axiosInstance.get('/get-user'),
};

// Friends Endpoints
export const friendService = {
  add: (data) => axiosInstance.post('/add-friend', data),
  edit: (id, data) => axiosInstance.put(`/edit-friend/${id}`, data),
  delete: (id) => axiosInstance.delete(`/delete-friend/${id}`),
  getAll: () => axiosInstance.get('/get-all-friends'),
  search: (query) => axiosInstance.get(`/search-friend/?query=${query}`),
  getStats: (handle) => axiosInstance.get(`/friend-stats/${handle}`)
};

// Problems Endpoints
export const problemService = {
  getAll: () => axiosInstance.get('/get-all-problems/'),
  add: (problemData) => axiosInstance.post('/add-problem', problemData),
  delete: (problemId) => axiosInstance.delete(`/delete-problem/${problemId}`),
};

// External Endpoints
export const contestService = {
  getUpcoming: () => axios.get('https://api.digitomize.com/contests'),
};
