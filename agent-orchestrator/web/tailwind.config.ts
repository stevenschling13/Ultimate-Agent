import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        panel: '#111827',
        accent: '#38bdf8'
      }
    }
  },
  plugins: []
};

export default config;
