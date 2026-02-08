import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const DoctorRoute = () => {
  const { user } = useContext(AuthContext);
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== "doctor") {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default DoctorRoute;
