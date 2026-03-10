import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#f7f5ef",
        foreground: "#111827",
        brand: {
          DEFAULT: "#0f766e",
          dark: "#115e59",
          light: "#ccfbf1"
        },
        accent: "#f59e0b",
        border: "#d1d5db",
        muted: "#f3f4f6"
      },
      boxShadow: {
        card: "0 20px 60px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xl: "1rem",
        '2xl': "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;
