import type { Config } from "tailwindcss";
import daisyui from "daisyui";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Nunito", "system-ui", "sans-serif"],
        sans: ["Nunito", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
        display: ["Nunito", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.3)',
        'glass-sm': '0 2px 12px rgba(0, 0, 0, 0.2)',
        'glass-lg': '0 8px 40px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px oklch(var(--p) / 0.25), 0 0 60px oklch(var(--p) / 0.08)',
        'glow-sm': '0 0 10px oklch(var(--p) / 0.2)',
        'glow-lg': '0 4px 30px oklch(var(--p) / 0.35), 0 0 80px oklch(var(--p) / 0.12)',
        'inner-glow': 'inset 0 1px 0 oklch(var(--bc) / 0.05)',
      },
      borderWidth: {
        '1': '1px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'mesh': 'linear-gradient(135deg, oklch(var(--b1)) 0%, oklch(var(--b2)) 50%, oklch(var(--b1)) 100%)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        panel: {
          "primary": "#8B5CF6",
          "primary-content": "#0F0A1A",
          "secondary": "#06B6D4",
          "secondary-content": "#041A1F",
          "accent": "#F59E0B",
          "accent-content": "#1A1408",
          "neutral": "#1E1B2E",
          "neutral-content": "#C8C3D8",
          "base-100": "#0B0A12",
          "base-200": "#13121E",
          "base-300": "#1C1A2A",
          "base-content": "#D4D0E0",
          "info": "#06B6D4",
          "info-content": "#041A1F",
          "success": "#10B981",
          "success-content": "#041A0F",
          "warning": "#F59E0B",
          "warning-content": "#1A1408",
          "error": "#EF4444",
          "error-content": "#1A0808",
        },
      },
      {
        "panel-light": {
          "primary": "#7C3AED",
          "primary-content": "#FFFFFF",
          "secondary": "#0891B2",
          "secondary-content": "#FFFFFF",
          "accent": "#D97706",
          "accent-content": "#FFFFFF",
          "neutral": "#F1F0F5",
          "neutral-content": "#1E1B2E",
          "base-100": "#FAFAFE",
          "base-200": "#F0EFF5",
          "base-300": "#E4E2EC",
          "base-content": "#1E1B2E",
          "info": "#0891B2",
          "info-content": "#FFFFFF",
          "success": "#059669",
          "success-content": "#FFFFFF",
          "warning": "#D97706",
          "warning-content": "#FFFFFF",
          "error": "#DC2626",
          "error-content": "#FFFFFF",
        },
      },
    ],
    darkTheme: "panel",
  },
} satisfies Config;
