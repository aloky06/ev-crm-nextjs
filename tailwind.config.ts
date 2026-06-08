import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        ev: {
          green:  '#10b981',
          blue:   '#0ea5e9',
          orange: '#f59e0b',
          red:    '#ef4444',
          dark:   '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 12px 28px rgba(0,0,0,0.08)',
        'glow-blue': '0 0 20px rgba(37,99,235,0.3)',
        'glow-green': '0 0 20px rgba(16,185,129,0.3)',
        'btn': '0 4px 14px rgba(37,99,235,0.4)',
      },
      backgroundImage: {
        'gradient-ev': 'linear-gradient(135deg, #2563eb, #10b981)',
        'gradient-sidebar': 'linear-gradient(180deg, #0f172a 0%, #0d1421 100%)',
        'gradient-card': 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.35s ease forwards',
        'slide-in': 'slide-in-row 0.25s ease forwards',
        'mesh-drift': 'mesh-drift 12s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
      },
    },
  },
  plugins: [],
}

export default config