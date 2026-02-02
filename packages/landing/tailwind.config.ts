import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#E74C3C',
        'bg-dark': '#1A1A2E',
        'card-dark': '#16213E',
        'text-light': '#EAEAEA',
        accent: '#F39C12',
        'break-green': '#27AE60',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
