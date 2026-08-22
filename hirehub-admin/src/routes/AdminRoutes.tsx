import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectCurrentToken, logout } from "../redux/features/Auth/AuthSlice";
import { jwtDecode } from "jwt-decode";

const AdminRoutes = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);

  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        dispatch(logout());
        return <Navigate to="/auth/sign-in" state={{ from: location.pathname }} replace />;
      }
    } catch (error) {
      dispatch(logout());
      return <Navigate to="/auth/sign-in" state={{ from: location.pathname }} replace />;
    }
  }

  if (token && user) {
    return children;
  }

  return <Navigate to="/auth/sign-in" state={{ from: location.pathname }} replace />;
};

export default AdminRoutes;