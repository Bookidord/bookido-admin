import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-geist-sans)", "system-ui"],
        future: ["var(--font-syne)", "var(--font-geist-sans)", "system-ui"],
      },
      letterSpacing: {
        future: "0.22em",
        elegant: "0.04em",
      },
      colors: {
        ink: {
          950: "#0a0a0c",
          900: "#121218",
          800: "#1a1a22",
          700: "#252530",
        },
        rose: {
          glow: "#f9a8d4",
          deep: "#be185d",
          neon: "#fda4af",
        },
        crimson: {
          glow: "#fb7185",
          deep: "#be123c",
        },
      },
      boxShadow: {
        "neon-rose":
          "0 0 32px -6px rgba(251, 113, 133, 0.45), 0 0 64px -16px rgba(225, 29, 72, 0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
        "neon-rose-lg":
          "0 0 48px -8px rgba(251, 113, 133, 0.55), 0 0 96px -24px rgba(190, 18, 60, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, transparent, rgb(10 10 12)), radial-gradient(circle at 50% 0%, rgba(251, 113, 133, 0.14), transparent 52%), radial-gradient(circle at 80% 20%, rgba(190, 18, 60, 0.08), transparent 45%)",
        "gradient-hero-text":
          "linear-gradient(120deg, #fda4af 0%, #f472b6 35%, #fb7185 65%, #f43f5e 100%)",
        "gradient-wa":
          "linear-gradient(135deg, #fbcfe8 0%, #f472b6 40%, #fb7185 70%, #e11d48 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
