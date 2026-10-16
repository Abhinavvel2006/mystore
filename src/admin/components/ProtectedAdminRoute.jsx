import { Navigate } from "react-router-dom";

function ProtectedAdminRoute({ children }) {
  const admin = localStorage.getItem("admin");

  if (!admin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default ProtectedAdminRoute;
