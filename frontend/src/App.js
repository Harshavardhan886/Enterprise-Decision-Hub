import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Budgets from "./pages/Budgets";
import Alerts from "./pages/Alerts";
import Vendors from "./pages/Vendors";
import AuditLog from "./pages/AuditLog";
import Reports from "./pages/Reports";
import Policies from "./pages/Policies";

const PUBLIC_ROUTES = [
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
];

const PRIVATE_ROUTES = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/invoices", element: <Invoices /> },
  { path: "/budgets", element: <Budgets /> },
  { path: "/vendors", element: <Vendors /> },
  { path: "/alerts", element: <Alerts /> },
  { path: "/audit-log", element: <AuditLog /> },
  { path: "/reports", element: <Reports /> },
  { path: "/policies", element: <Policies /> },
];

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {PUBLIC_ROUTES.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {PRIVATE_ROUTES.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<ProtectedRoute>{route.element}</ProtectedRoute>}
              />
            ))}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
