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

// Caching layer for Problems using localStorage
const PROBLEM_CACHE_KEY = 'cp_help_problems_cache';
const PROBLEM_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getProblemCache = () => {
  try {
    const data = localStorage.getItem(PROBLEM_CACHE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) { return {}; }
};

const setProblemCache = (key, data) => {
  try {
    const cache = getProblemCache();
    cache[key] = { data, timestamp: Date.now() };
    localStorage.setItem(PROBLEM_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {}
};

const clearProblemCache = () => {
  localStorage.removeItem(PROBLEM_CACHE_KEY);
};

// Problems Endpoints
export const problemService = {
  getAll: async (params = {}) => {
    const { page = 1, query = '', platform = 'All', difficulty = 'All', tag = '', sortBy = '', order = '' } = params;
    
    const cacheKey = JSON.stringify({ page, query, platform, difficulty, tag, sortBy, order });
    const cache = getProblemCache();
    const cached = cache[cacheKey];
    
    if (cached && (Date.now() - cached.timestamp < PROBLEM_CACHE_TTL)) {
      // Axios responses have a data object. We store the response data, 
      // but axiosInstance callers expect res.data. Let's simulate an axios response.
      return { data: cached.data }; 
    }

    let url = `/get-all-problems/?page=${page}`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    if (platform && platform !== 'All') url += `&platform=${encodeURIComponent(platform)}`;
    if (difficulty && difficulty !== 'All') url += `&difficulty=${encodeURIComponent(difficulty)}`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;
    if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`;
    if (order) url += `&order=${encodeURIComponent(order)}`;
    
    const res = await axiosInstance.get(url);
    setProblemCache(cacheKey, res.data); // Store only the data payload
    return res;
  },
  add: async (problemData) => {
    clearProblemCache(); // Invalidate cache on mutation
    return axiosInstance.post('/add-problem', problemData);
  },
  delete: async (problemId) => {
    clearProblemCache(); // Invalidate cache on mutation
    return axiosInstance.delete(`/delete-problem/${problemId}`);
  },
};

// Caching layer for Contests using localStorage
const CONTESTS_CACHE_KEY = 'cp_help_contests_cache';
const CONTESTS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// External Endpoints
export const contestService = {
  getUpcoming: async () => {
    try {
      const cachedString = localStorage.getItem(CONTESTS_CACHE_KEY);
      if (cachedString) {
        const cached = JSON.parse(cachedString);
        if (Date.now() - cached.timestamp < CONTESTS_CACHE_TTL) {
          return { data: cached.data };
        }
      }
    } catch (e) {}

    const res = await axios.get('https://api.digitomize.com/contests');
    try {
      localStorage.setItem(CONTESTS_CACHE_KEY, JSON.stringify({
        data: res.data,
        timestamp: Date.now()
      }));
    } catch (e) {}
    
    return res;
  },
};
