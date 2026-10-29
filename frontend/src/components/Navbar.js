import Logo from "./Logo";
import ThemeSwitcher from "./ThemeSwitcher";
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Building2,
  Bell,
  ClipboardList,
  BarChart3,
  Sliders,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// Decision Hub Neural Web Logo

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Invoices", path: "/invoices", icon: Receipt },
  { label: "Policies", path: "/policies", icon: Sliders },
  { label: "Budgets", path: "/budgets", icon: Wallet },
  { label: "Vendors", path: "/vendors", icon: Building2 },
  { label: "Alerts", path: "/alerts", icon: Bell },
  { label: "Audit Log", path: "/audit-log", icon: ClipboardList },
  { label: "Reports", path: "/reports", icon: BarChart3 },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const dropRef = useRef(null);

  const fetchAlertCount = () => {
    if (!user) return;
    api
      .get("/alerts")
      .then((res) => {
        const active = res.data.filter((a) => a.status !== "RESOLVED").length;
        setAlertCount(active);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAlertCount();

    const handler = () => fetchAlertCount();
    window.addEventListener("alerts-updated", handler);

    const interval = setInterval(fetchAlertCount, 8000);
    return () => {
      window.removeEventListener("alerts-updated", handler);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropRef.current && !dropRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#192837]/10 transition-all">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="p-1 rounded-xl group-hover:scale-105 transition-transform">
            <Logo />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-base font-bold tracking-tight text-[#192837] leading-none">
              Decision Hub
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-[#192837]/60 uppercase mt-0.5">
              AI Risk Console
            </span>
          </div>
        </div>

        {/* Navigation Modules */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            const isAlertTab = item.path === "/alerts";
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  active
                    ? "bg-[#7342E2] text-white shadow-xs font-semibold"
                    : "text-[#192837]/70 hover:text-[#192837] hover:bg-[#192837]/5"
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {isAlertTab && alertCount > 0 && (
                  <span
                    className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      active ? "bg-white text-[#7342E2]" : "bg-rose-500 text-white"
                    }`}
                  >
                    {alertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Theme Switcher & User Profile */}
        <div className="flex items-center gap-2.5">
          <ThemeSwitcher />

          {/* User Profile */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-black/5 transition-all text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#7342E2]/15 text-[#7342E2] flex items-center justify-center font-bold text-xs">
                {user?.username?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-[#192837] leading-tight">
                  {user?.username || "Admin"}
                </span>
                <span className="text-[10px] text-[#7342E2] font-semibold leading-tight">
                  {user?.role || "ADMIN"}
                </span>
              </div>
              <ChevronDown size={14} className="text-[#192837]/50" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500">Signed in as</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.username}</p>
                  <span className="inline-block mt-1 text-[10px] bg-purple-50 text-[#7342E2] font-bold px-2 py-0.5 rounded-full">
                    {user?.role} Mode
                  </span>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
