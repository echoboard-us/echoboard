import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // If still loading auth state, don't render anything yet (or show a loader)
  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner component
  }

  // If loading is finished and there's no user, redirect to signin
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // If loading is finished and there is a user, render the protected component
  return children;
};

export default ProtectedRoute;
