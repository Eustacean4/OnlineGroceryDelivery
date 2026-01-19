import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role = null }) {
  const token = localStorage.getItem('auth_token');
  const user = JSON.parse(localStorage.getItem('auth_user'));

  if (!token) return <Navigate to="/login" />;

  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}
