import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeSwitcher({ className = "", compact = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 cursor-pointer select-none shadow-xs hover:scale-105 active:scale-95 ${
        isDark
          ? "bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200 hover:text-white"
          : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
      } ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <>
          <Sun size={15} className="text-amber-400 animate-in spin-in-90 duration-300" />
          {!compact && <span>Light Mode</span>}
        </>
      ) : (
        <>
          <Moon size={15} className="text-indigo-600 animate-in -spin-in-90 duration-300" />
          {!compact && <span>Dark Mode</span>}
        </>
      )}
    </button>
  );
}
