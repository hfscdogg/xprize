import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222 47% 11%)",
        muted: "hsl(210 40% 96%)",
        "muted-foreground": "hsl(215 16% 47%)",
        border: "hsl(214 32% 91%)",
        accent: "hsl(210 40% 96%)",
        primary: "hsl(222 47% 11%)",
        "primary-foreground": "hsl(210 40% 98%)",
      },
    },
  },
  plugins: [],
};

export default config;
