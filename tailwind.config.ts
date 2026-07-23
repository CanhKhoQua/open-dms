import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        "tnm-teal": {
          50: "#ecfafa",
          100: "#cff3f3",
          200: "#9fe7e7",
          300: "#6ddada",
          400: "#2dc4c4",
          500: "#14b1b1",
          600: "#0e9a9a",
          700: "#0b7d7d",
          800: "#095f5f",
          900: "#074545",
        },
        "tnm-red": { 500: "#e01020", 600: "#c20d1c" },
        gray: {
          50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db",
          400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151",
          800: "#1f2937", 900: "#111827",
        },
        blue: { 50: "#eff6ff", 100: "#dbeafe", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 900: "#1e3a8a" },
        violet: { 50: "#f5f3ff", 600: "#7c3aed", 700: "#5b21b6" },
        amber: {
          50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 400: "#fbbf24",
          500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e",
        },
        emerald: {
          50: "#ecfdf5", 100: "#d1fae5", 300: "#6ee7b7", 400: "#34d399",
          500: "#10b981", 600: "#059669", 700: "#047857",
        },
        green: { 100: "#dcfce7", 300: "#86efac", 600: "#16a34a", 700: "#15803d" },
        red: { 50: "#fef2f2", 100: "#fecaca", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c" },
      },
    },
  },
  plugins: [],
};
export default config;
