import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = () => {
  const { user, isLoading } = useContext(AuthContext);
  
  // Wait for auth hydration to complete
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Allow user role to access protected routes
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Only allow "user" role
  if (user.role && user.role !== "user") {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default PrivateRoute;
