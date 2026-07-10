import type { Config } from "tailwindcss";

// Nocturne design tokens.
// Kept in one place so every component pulls from the same palette
// instead of re-declaring hex values ad hoc.
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lavender: {
          DEFAULT: "#8B7FE8",
          dark: "#7267D8",
        },
        "soft-purple": "#A98BE8",
        sky: "#5FC0E8",
        surface: {
          bg: "#FAF8FC",
          alt: "#F3EFFB",
          card: "#FFFFFF",
          "bg-dark": "#15121F",
          "alt-dark": "#1C1830",
          "card-dark": "#211C34",
        },
        ink: {
          primary: "#241F35",
          secondary: "#6B6580",
          muted: "#9691A8",
          "primary-dark": "#F1EEFA",
          "secondary-dark": "#B3AAC9",
          "muted-dark": "#786F94",
        },
        line: {
          DEFAULT: "#EAE5F5",
          dark: "#332C4D",
        },
        mint: "#5FD6A8",
        "pastel-orange": "#F5A66B",
        coral: "#F27C7C",
      },
      fontFamily: {
        display: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        lg: "24px",
        md: "16px",
        sm: "10px",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(114,103,216,0.08)",
        floating: "0 20px 60px rgba(114,103,216,0.16)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(120deg, #7267D8, #A98BE8)",
      },
    },
  },
  plugins: [],
};

export default config;
