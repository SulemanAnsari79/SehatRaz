import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const AdminRoute = () => {
  const { user, isLoading } = useContext(AuthContext);
  
  // Wait for auth hydration to complete
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== "admin") {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default AdminRoute;
