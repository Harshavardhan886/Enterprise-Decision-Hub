import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Building2,
  Sliders,
  Bell,
  ClipboardList,
  BarChart3,
  X,
  LogOut,
} from "lucide-react";
import Logo from "../Logo";
import { useAuth } from "../../context/AuthContext";
import cn from "../../lib/cn";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", path: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { label: "Invoices", path: "/invoices", icon: Receipt },
      { label: "Budgets", path: "/budgets", icon: Wallet },
      { label: "Vendors", path: "/vendors", icon: Building2 },
    ],
  },
  {
    label: "Governance",
    items: [
      { label: "Policies", path: "/policies", icon: Sliders },
      { label: "Alerts", path: "/alerts", icon: Bell },
      { label: "Audit Log", path: "/audit-log", icon: ClipboardList },
    ],
  },
  {
    label: "Insights",
    items: [{ label: "Reports", path: "/reports", icon: BarChart3 }],
  },
];

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile, alertCount, onLogout }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile scrim */}
      <div
        onClick={onCloseMobile}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-surface transition-[width,transform] duration-200 ease-out",
          collapsed ? "lg:w-[76px]" : "lg:w-[264px]",
          "w-[264px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center gap-3 border-b border-line px-4",
            collapsed && "lg:justify-center lg:px-0"
          )}
        >
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 rounded-lg text-left outline-none"
            aria-label="Go to dashboard"
          >
            <Logo size={34} />
            <span className={cn("min-w-0", collapsed && "lg:hidden")}>
              <span className="block truncate text-sm font-extrabold leading-tight tracking-tight text-ink">
                Decision Hub
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
                AI Risk Console
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-2 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={17} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p
                className={cn(
                  "mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-subtle",
                  collapsed && "lg:hidden"
                )}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const showBadge = item.path === "/alerts" && alertCount > 0;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          "nav-item",
                          isActive && "nav-item-active",
                          collapsed && "lg:justify-center lg:px-0"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent transition-opacity",
                              isActive ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <Icon size={17} className="shrink-0" />
                          <span className={cn("truncate", collapsed && "lg:hidden")}>
                            {item.label}
                          </span>
                          {showBadge && (
                            <span
                              className={cn(
                                "num ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                                isActive
                                  ? "bg-accent text-white"
                                  : "bg-danger/10 text-danger",
                                collapsed && "lg:absolute lg:right-1.5 lg:top-1.5 lg:ml-0 lg:h-4 lg:min-w-[16px] lg:px-1 lg:text-[9px]"
                              )}
                            >
                              {alertCount}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: signed-in user */}
        <div className="shrink-0 border-t border-line p-3">
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-xl bg-surface-2 p-2",
              collapsed && "lg:justify-center lg:bg-transparent lg:p-0"
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
              {user?.username?.charAt(0)?.toUpperCase() || "A"}
            </span>
            <span className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
              <span className="block truncate text-xs font-bold leading-tight text-ink">
                {user?.username || "Admin"}
              </span>
              <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-accent">
                {user?.role || "ADMIN"}
              </span>
            </span>
            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-danger/10 hover:text-danger",
                collapsed && "lg:hidden"
              )}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
