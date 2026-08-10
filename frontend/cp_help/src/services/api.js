import axiosInstance from '../utils/axiosInstance';

// Auth Endpoints
export const authService = {
  login: (credentials) => axiosInstance.post('/login', credentials),
  register: (userData) => axiosInstance.post('/create-account', userData),
  getUser: () => axiosInstance.get('/get-user'),
};

// Friends Endpoints
export const friendService = {
  getAll: () => axiosInstance.get('/get-all-friends/'),
  add: (friendData) => axiosInstance.post('/add-friend', friendData),
  edit: (friendId, data) => axiosInstance.put(`/edit-friend/${friendId}`, data),
  delete: (friendId) => axiosInstance.delete(`/delete-friend/${friendId}`),
  search: (query) => axiosInstance.get(`/search-friend/?query=${query}`),
};

// Problems Endpoints
export const problemService = {
  getAll: () => axiosInstance.get('/get-all-problems/'),
  add: (problemData) => axiosInstance.post('/add-problem', problemData),
  delete: (problemId) => axiosInstance.delete(`/delete-problem/${problemId}`),
};
