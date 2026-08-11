import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await authService.getUser();
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Cross-tab synchronization: when another tab logs out (removes 'token'),
  // the browser fires a 'storage' event on all OTHER tabs.
  // We catch it here and instantly clear this tab's user state.
  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === 'token' && !event.newValue) {
        // Token was removed in another tab — log this tab out too
        setUser(null);
      }
      if (event.key === 'token' && event.newValue) {
        // Token was added in another tab — fetch user for this tab too
        fetchUser();
      }
    };

    window.addEventListener('storage', syncLogout);
    return () => window.removeEventListener('storage', syncLogout);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    setUser,
    loading,
    logout,
    fetchUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
