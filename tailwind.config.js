/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Calm, low-saturation palette suited to long-session financial work.
        bg: {
          DEFAULT: 'rgb(250 250 249)',
          dark: 'rgb(23 23 23)',
        },
        panel: {
          DEFAULT: 'rgb(255 255 255)',
          dark: 'rgb(38 38 38)',
        },
        border: {
          DEFAULT: 'rgb(229 229 228)',
          dark: 'rgb(64 64 64)',
        },
        ink: {
          DEFAULT: 'rgb(38 38 38)',
          dim: 'rgb(115 115 115)',
          dark: 'rgb(229 229 228)',
          dimDark: 'rgb(163 163 163)',
        },
        // Semantic status colours
        ok: 'rgb(22 163 74)',
        warn: 'rgb(217 119 6)',
        bad: 'rgb(220 38 38)',
        info: 'rgb(37 99 235)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
