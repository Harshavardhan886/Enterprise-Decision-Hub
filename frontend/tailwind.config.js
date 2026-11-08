/** @type {import('tailwindcss').Config} */

// Semantic tokens are stored as RGB triplets in index.css so that Tailwind
// opacity modifiers (e.g. bg-accent/10) keep working across both themes.
const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: token("--c-bg"),
        surface: {
          DEFAULT: token("--c-surface"),
          2: token("--c-surface-2"),
          3: token("--c-surface-3"),
          muted: token("--c-surface-2"),
          sunken: token("--c-surface-3"),
        },
        line: {
          DEFAULT: token("--c-border"),
          strong: token("--c-border-strong"),
        },
        ink: {
          DEFAULT: token("--c-text"),
          muted: token("--c-text-muted"),
          subtle: token("--c-text-subtle"),
        },
        accent: {
          DEFAULT: token("--c-accent"),
          hover: token("--c-accent-hover"),
          contrast: token("--c-accent-contrast"),
        },
        danger: token("--c-danger"),
        success: token("--c-success"),
        warning: token("--c-warning"),
        info: token("--c-info"),
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "Inter", "ui-sans-serif", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)",
        pop: "0 18px 40px -12px rgb(16 24 40 / 0.22)",
        glow: "0 10px 30px -10px rgb(var(--c-accent) / 0.45)",
        inset: "inset 0 1px 0 0 rgb(255 255 255 / 0.06)",
      },
      spacing: {
        18: "4.5rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out both",
        "rise-in": "rise-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 0.2s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
