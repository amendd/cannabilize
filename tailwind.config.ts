import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Suporte a dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00A859",
          dark: "#008048",
          light: "#00C96A",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#00A859",
          600: "#008048",
          700: "#006638",
          800: "#004d2a",
          900: "#00331c",
        },
        secondary: {
          DEFAULT: "#FFD700",
          dark: "#CCAA00",
          light: "#FFE44D",
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#FFD700",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        semantic: {
          success: {
            DEFAULT: "#10b981",
            light: "#d1fae5",
            dark: "#059669",
          },
          warning: {
            DEFAULT: "#f59e0b",
            light: "#fef3c7",
            dark: "#d97706",
          },
          error: {
            DEFAULT: "#ef4444",
            light: "#fee2e2",
            dark: "#dc2626",
          },
          info: {
            DEFAULT: "#3b82f6",
            light: "#dbeafe",
            dark: "#2563eb",
          },
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
