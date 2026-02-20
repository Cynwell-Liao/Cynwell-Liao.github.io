/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora Variable', 'ui-sans-serif', 'system-ui'],
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
      },
      boxShadow: {
        soft: '0 16px 40px -24px rgba(15, 23, 42, 0.45)',
      },
    },
  },
  plugins: [],
}
