import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = () => {
  const { userInfo, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) return null; // or a spinner

  if (!userInfo) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
