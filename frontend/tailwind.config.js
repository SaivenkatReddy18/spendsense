/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0f172a",
        surface: "#1e293b",
        "surface-2": "#334155",
        primary: "#6366f1",
        "primary-hover": "#4f46e5",
      },
    },
  },
  plugins: [],
}