/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#fff1f2',
          600: '#e11d48', // SacredHearts brand color
          700: '#be123c',
        }
      }
    },
  },
  plugins: [],
}