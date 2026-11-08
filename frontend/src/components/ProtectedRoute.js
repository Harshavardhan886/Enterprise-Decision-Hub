import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppShell from "./layout/AppShell";

/**
 * Guards authenticated routes and mounts them inside the application shell.
 * Unauthenticated visitors are redirected to the login screen.
 */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell>{children}</AppShell>;
}
