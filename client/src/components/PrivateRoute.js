import { Navigate } from "react-router-dom";

function PrivateRoute({ element }) {
  const token = localStorage.getItem("token"); // Check if user is authenticated
  return token ? element : <Navigate to="/login" />;
}

export default PrivateRoute;
