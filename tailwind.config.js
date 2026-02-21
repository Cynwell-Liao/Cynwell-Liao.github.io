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
          50: '#eefbf8',
          100: '#d5f4ee',
          200: '#aee8dc',
          300: '#7dd7c5',
          400: '#46bca7',
          500: '#1f9d8c',
          600: '#157f72',
          700: '#14655d',
          800: '#144f4a',
          900: '#133f3b',
        },
        primary: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)',
      },
      boxShadow: {
        soft: '0 16px 40px -24px rgba(15, 23, 42, 0.45)',
        glow: '0 0 20px rgba(125, 215, 197, 0.4)',
        'glow-lg': '0 0 40px rgba(125, 215, 197, 0.6)',
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
