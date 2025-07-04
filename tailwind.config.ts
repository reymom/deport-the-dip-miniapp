/** @type {import('tailwindcss').Config} */
const defaultConfig: import("tailwindcss").Config = {
  content: [] as string[],
  theme: {
    extend: {
      colors: {},
      borderRadius: {},
    },
  },
  plugins: [],
};
import tailwindcssAnimate from "tailwindcss-animate";

module.exports = {
  ...defaultConfig,
  content: [
    ...(Array.isArray(defaultConfig.content)
      ? defaultConfig.content
      : defaultConfig.content?.files ?? []),
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    ...defaultConfig.theme,
    extend: {
      ...defaultConfig.theme?.extend,
      colors: {
        ...defaultConfig.theme?.extend?.colors,
        border: "rgb(51 65 85)",
        input: "rgb(51 65 85)",
        ring: "rgb(59 130 246)",
        background: "rgb(15 23 42)",
        foreground: "rgb(248 250 252)",
        primary: {
          DEFAULT: "rgb(59 130 246)",
          foreground: "rgb(15 23 42)",
        },
        secondary: {
          DEFAULT: "rgb(51 65 85)",
          foreground: "rgb(248 250 252)",
        },
        destructive: {
          DEFAULT: "rgb(239 68 68)",
          foreground: "rgb(248 250 252)",
        },
        muted: {
          DEFAULT: "rgb(51 65 85)",
          foreground: "rgb(148 163 184)",
        },
        accent: {
          DEFAULT: "rgb(51 65 85)",
          foreground: "rgb(248 250 252)",
        },
        popover: {
          DEFAULT: "rgb(15 23 42)",
          foreground: "rgb(248 250 252)",
        },
        card: {
          DEFAULT: "rgb(15 23 42)",
          foreground: "rgb(248 250 252)",
        },
      },
      borderRadius: {
        ...defaultConfig.theme?.extend?.borderRadius,
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [...(defaultConfig.plugins ?? []), tailwindcssAnimate],
};
