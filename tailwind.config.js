/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Sora Variable', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono Variable', 'ui-monospace', 'SFMono-Regular'],
      },
      colors: {
        accent: {
          50: '#fcf3f8',
          100: '#f9e6f0',
          200: '#f4cde0',
          300: '#efa2c7',
          400: '#e86aa7',
          500: '#e384b2', // Primary Logo Pink
          600: '#c52875',
          700: '#a31a59',
          800: '#87194d',
          900: '#711a43',
        },
        secondary: {
          50: '#f0f9fb',
          100: '#daf1f6',
          200: '#b8e3ef',
          300: '#87cfe4',
          400: '#4fb4d1',
          500: '#37bedc', // Secondary Logo Cyan
          600: '#2b7b96',
          700: '#26637a',
          800: '#265165',
          900: '#234455',
        },
        primary: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #37bedc 0deg, #a853ba 180deg, #e384b2 360deg)',
      },
      boxShadow: {
        soft: '0 16px 40px -24px rgba(15, 23, 42, 0.45)',
        glow: '0 0 20px rgba(227, 132, 178, 0.4)',
        'glow-lg': '0 0 40px rgba(227, 132, 178, 0.6)',
      },
      animation: {
        'blob': 'blob 7s infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
