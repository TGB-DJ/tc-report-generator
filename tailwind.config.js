/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563eb',   // Blue 600
          dark: '#1e293b',   // Slate 800
          accent: '#1d4ed8', // Blue 700
        }
      }
    },
  },
  plugins: [],
}
