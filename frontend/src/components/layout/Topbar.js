import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Bot, ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, User } from "lucide-react";
import ThemeSwitcher from "../ThemeSwitcher";
import { useAuth } from "../../context/AuthContext";
import cn from "../../lib/cn";

const TITLES = {
  "/dashboard": "Dashboard",
  "/invoices": "Invoices",
  "/budgets": "Budgets",
  "/vendors": "Vendors",
  "/policies": "Policies",
  "/alerts": "Alerts",
  "/audit-log": "Audit Log",
  "/reports": "Reports",
};

export default function Topbar({ collapsed, onToggleCollapse, onOpenMobile, alertCount, onLogout }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const currentTitle = TITLES[location.pathname] || "Workspace";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={19} />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className="ml-1 hidden min-w-0 items-center gap-2 text-sm sm:flex">
          <span className="text-ink-subtle">Workspace</span>
          <span className="text-line-strong">/</span>
          <span className="truncate font-semibold text-ink">{currentTitle}</span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-edh-copilot"))}
            title="Enterprise Decision Hub Assistant"
            className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 transition-all mr-1"
          >
            <Bot size={15} className="text-accent" />
            <span className="hidden sm:inline">EDH Assistant</span>
          </button>

          <ThemeSwitcher compact />

          <Link
            to="/alerts"
            title={`${alertCount} active alert${alertCount === 1 ? "" : "s"}`}
            aria-label={`Alerts, ${alertCount} active`}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Bell size={17} />
            {alertCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            )}
          </Link>

          <div className="mx-1 h-6 w-px bg-line" aria-hidden="true" />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-2"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                {user?.username?.charAt(0)?.toUpperCase() || "A"}
              </span>
              <span className="hidden min-w-0 flex-col text-left sm:flex">
                <span className="max-w-[120px] truncate text-xs font-bold leading-tight text-ink">
                  {user?.username || "Admin"}
                </span>
                <span className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-accent">
                  {user?.role || "ADMIN"}
                </span>
              </span>
              <ChevronDown
                size={14}
                className={cn("text-ink-subtle transition-transform", menuOpen && "rotate-180")}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface shadow-pop animate-scale-in"
              >
                <div className="border-b border-line px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                    Signed in as
                  </p>
                  <p className="truncate text-sm font-bold text-ink">{user?.username}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                    <User size={10} />
                    {user?.role} mode
                  </span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout?.();
                    navigate("/login");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-danger transition-colors hover:bg-danger/10"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
