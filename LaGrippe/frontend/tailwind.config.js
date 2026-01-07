/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'covid-confirmed': '#FF4444',
        'covid-deaths': '#666666',
        'covid-recovered': '#4CAF50',
        'covid-active': '#FF9800',
      }
    },
  },
  plugins: [],
}
