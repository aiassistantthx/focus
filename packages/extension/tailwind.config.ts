import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#E74C3C',
        'work-red': '#E74C3C',
        'break-green': '#27AE60',
        'bg-dark': '#1A1A2E',
        'card-dark': '#16213E',
        'text-light': '#EAEAEA',
        accent: '#F39C12',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
