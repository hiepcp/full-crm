import { Navigate, Outlet, useLocation } from "react-router-dom";
import { tokenHelper } from '@utils/tokenHelper'

export default function RequireAuth() {
  const accessToken = tokenHelper.get(); //localStorage.getItem("accessToken"); // Lấy từ localStorage
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Cho phép render các route con
  return <Outlet />;
}
