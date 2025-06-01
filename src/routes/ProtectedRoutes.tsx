import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/authContext";
const ProtectedRoutes = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};
export default ProtectedRoutes;
