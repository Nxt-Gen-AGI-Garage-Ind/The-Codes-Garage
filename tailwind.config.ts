import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "hazard-orange": "#f97316",
        "charcoal-dark": "#111827",
        "charcoal-medium": "#1f2937",
      },
    },
  },
  plugins: [],
} satisfies Config;
