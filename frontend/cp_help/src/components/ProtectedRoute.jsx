import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  // If no token or no user (and auth check is done), redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise render the protected component
  return <Outlet />;
};

export default ProtectedRoute;
