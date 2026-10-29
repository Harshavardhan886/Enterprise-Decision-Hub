/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Helvetica Now Display Bold'", 'sans-serif'],
        body: ["'Inter'", 'sans-serif'],
      },
      colors: {
        text: 'var(--color-text)',
        accent: 'var(--color-accent)',
        'login-bg': 'var(--color-login-bg)',
      }
    },
  },
  plugins: [],
}
