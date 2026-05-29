import type { Config } from "tailwindcss";
import daisyui from "daisyui";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Fredoka", "Comic Neue", "sans-serif"],
        sans: ["Nunito", "Comic Neue", "sans-serif"],
        sketch: ["Caveat", "cursive"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
        comic: ["Bangers", "Impact", "sans-serif"],
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px oklch(var(--bc) / 0.3)',
        'brutal-sm': '2px 2px 0px 0px oklch(var(--bc) / 0.3)',
        'brutal-lg': '6px 6px 0px 0px oklch(var(--bc) / 0.3)',
        'brutal-hover': '6px 6px 0px 0px oklch(var(--bc) / 0.3)',
        'comic': '0 0 12px oklch(var(--p) / 0.2), 0 0 24px oklch(var(--p) / 0.08)',
        'comic-magenta': '0 0 12px oklch(var(--s) / 0.2), 0 0 24px oklch(var(--s) / 0.08)',
        'comic-pop': '0 0 16px oklch(var(--p) / 0.3), 0 0 32px oklch(var(--p) / 0.12)',
        'forge': '0 0 20px oklch(var(--p) / 0.15), 0 0 40px oklch(var(--p) / 0.08)',
        'forge-lg': '0 4px 20px oklch(var(--p) / 0.25), 0 0 60px oklch(var(--p) / 0.1)',
      },
      borderWidth: {
        '3': '3px',
      },
      backgroundImage: {
        'forge-gradient': 'linear-gradient(135deg, oklch(var(--b1)), oklch(var(--b2)))',
        'ember': 'radial-gradient(ellipse at 50% 100%, oklch(var(--p) / 0.06) 0%, transparent 70%)',
      },
      backgroundSize: {
        'halftone': '7px 7px',
        'halftone-dense': '5px 5px',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        doodle: {
          "primary": "#D4953A",
          "primary-content": "#1a1208",
          "secondary": "#C0703A",
          "secondary-content": "#1a1208",
          "accent": "#3A9A9A",
          "accent-content": "#0a1a1a",
          "neutral": "#1E1A14",
          "neutral-content": "#E8D8C8",
          "base-100": "#1A1612",
          "base-200": "#221E18",
          "base-300": "#2C261E",
          "base-content": "#E0D0BC",
          "info": "#3A9A9A",
          "info-content": "#0a1a1a",
          "success": "#5AAF6A",
          "success-content": "#0a1a0a",
          "warning": "#D4953A",
          "warning-content": "#1a1208",
          "error": "#C05050",
          "error-content": "#1a0808",
        },
      },
      {
        "doodle-dark": {
          "primary": "#E8A830",
          "primary-content": "#1a1408",
          "secondary": "#D07840",
          "secondary-content": "#1a1008",
          "accent": "#40B0B0",
          "accent-content": "#081a1a",
          "neutral": "#141210",
          "neutral-content": "#D8C8B0",
          "base-100": "#12100E",
          "base-200": "#1A1612",
          "base-300": "#241E18",
          "base-content": "#D0C0A8",
          "info": "#40B0B0",
          "info-content": "#081a1a",
          "success": "#50B060",
          "success-content": "#081a08",
          "warning": "#E8A830",
          "warning-content": "#1a1408",
          "error": "#D05858",
          "error-content": "#1a0808",
        },
      },
    ],
    darkTheme: "doodle-dark",
  },
} satisfies Config;
