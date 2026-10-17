import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#870d13", dark: "#5f0a0e", light: "#a8222a", tint: "#f7ecec", alt: "#872c33" },
        // the supplied interactor component styles itself with orange-*; map it onto the brand burgundy
        orange: { 400: "#a8222a", 500: "#870d13", 600: "#870d13" },
      },
      fontFamily: {
        display: ["Gabarito", "system-ui", "sans-serif"],
        sans: ["Gabarito", "system-ui", "sans-serif"],
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      },
      animation: { marquee: "marquee 40s linear infinite" },
    },
  },
  plugins: [],
} satisfies Config;
