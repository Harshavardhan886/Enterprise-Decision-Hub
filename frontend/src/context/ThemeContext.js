import React, { createContext, useContext, useState, useEffect } from "react";

export const THEME_LIGHT = "light";
export const THEME_DARK = "dark";

export const THEMES = [
  {
    id: THEME_DARK,
    name: "Dark Mode",
    label: "Dark",
    tag: "Dark",
  },
  {
    id: THEME_LIGHT,
    name: "Light Mode",
    label: "Light",
    tag: "Light",
  },
];

const ThemeContext = createContext({
  theme: THEME_DARK,
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
  currentTheme: THEMES[0],
  themes: THEMES,
});

const STORAGE_KEY = "edh_theme";

// Normalize any legacy stored theme to either 'light' or 'dark'
function normalizeTheme(themeKey) {
  if (themeKey === "light" || themeKey === "light-modern") {
    return THEME_LIGHT;
  }
  return THEME_DARK;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return normalizeTheme(stored);
      }
    } catch (e) {
      // ignore
    }
    return THEME_DARK;
  });

  const setTheme = (newTheme) => {
    const normalized = normalizeTheme(newTheme);
    setThemeState(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch (e) {
      // ignore
    }
  };

  const toggleTheme = () => {
    setTheme(theme === THEME_DARK ? THEME_LIGHT : THEME_DARK);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    if (theme === THEME_DARK) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [theme]);

  const isDark = theme === THEME_DARK;
  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        setTheme,
        toggleTheme,
        currentTheme,
        themes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
