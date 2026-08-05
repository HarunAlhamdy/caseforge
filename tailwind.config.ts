import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary: "var(--brand-primary)",
          accent: "var(--brand-accent)",
        },
        slate: {
          850: "#1e293b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--brand-font)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [forms, typography],
};

export default config;
