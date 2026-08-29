import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../pages/auth/AuthContext";

const ProtectedRoute = ({ children, allowedLevels = [] }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Government Super Admin can access and inspect all tiers
  if (currentUser.level === "government") {
    return children;
  }

  // If specific levels are specified, verify user permission
  if (allowedLevels.length > 0 && !allowedLevels.includes(currentUser.level)) {
    // Redirect user to their own authorized dashboard
    const homeMap = {
      government: "/government/dashboard",
      department: "/department/dashboard",
      organization: "/organization/dashboard",
      team: "/team/dashboard",
      employee: "/employee/dashboard",
    };
    const defaultHome = homeMap[currentUser.level] || "/login";
    return <Navigate to={defaultHome} replace />;
  }

  return children;
};

export default ProtectedRoute;
