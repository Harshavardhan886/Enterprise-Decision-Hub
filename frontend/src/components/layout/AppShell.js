import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import CopilotWidget from "../chat/CopilotWidget";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import cn from "../../lib/cn";

const COLLAPSE_KEY = "edh_sidebar_collapsed";

/**
 * Application frame for every authenticated route: fixed sidebar, sticky top
 * bar and the scrolling content column.
 */
export default function AppShell({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  const toggleCollapse = () => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable — collapse still works for this session */
      }
      return next;
    });
  };

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const refreshAlertCount = useCallback(() => {
    api
      .get("/alerts")
      .then((res) => {
        const active = (res.data || []).filter((alert) => alert.status !== "RESOLVED").length;
        setAlertCount(active);
      })
      .catch(() => {
        /* keep the previous count when the backend is unreachable */
      });
  }, []);

  useEffect(() => {
    refreshAlertCount();
    const handler = () => refreshAlertCount();
    window.addEventListener("alerts-updated", handler);
    const interval = setInterval(refreshAlertCount, 8000);
    return () => {
      window.removeEventListener("alerts-updated", handler);
      clearInterval(interval);
    };
  }, [refreshAlertCount]);

  // Close the mobile drawer and reset scroll whenever the route changes.
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      previousPath.current = location.pathname;
      setMobileOpen(false);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        alertCount={alertCount}
        onLogout={handleLogout}
      />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200 ease-out",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]"
        )}
      >
        <Topbar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onOpenMobile={() => setMobileOpen(true)}
          alertCount={alertCount}
          onLogout={handleLogout}
        />

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </div>
        </main>

        <CopilotWidget />
      </div>
    </div>
  );
}
