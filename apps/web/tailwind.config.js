/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        sidebar: "var(--sidebar)",
        card: "var(--card)",
        accent: "var(--accent)",
        status: {
          connected: "#10b981",
          disconnected: "#ef4444",
        }
      }
    },
  },
  plugins: [],
}
