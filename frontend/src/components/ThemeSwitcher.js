import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import cn from "../lib/cn";

/**
 * Theme toggle. Keeps the `compact` prop for icon-only placements in the
 * top bar; the labelled variant is used on the public pages.
 */
export default function ThemeSwitcher({ className = "", compact = false }) {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-lg border border-line bg-surface text-xs font-semibold text-ink-muted",
        "transition-all duration-150 hover:border-line-strong hover:bg-surface-2 hover:text-ink",
        compact ? "h-9 w-9" : "h-10 px-3.5",
        className
      )}
    >
      {isDark ? (
        <Sun size={16} className="text-amber-500" />
      ) : (
        <Moon size={16} className="text-accent" />
      )}
      {!compact && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
