import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

import { sharedViteConfig } from './config/sharedViteConfig.ts'

export default defineConfig({
  ...sharedViteConfig,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'config/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/app/main.tsx',
        'src/vite-env.d.ts',
        'src/**/index.ts',
        'src/**/*.types.ts',
      ],
      thresholds: {
        perFile: true,
        lines: 75,
        branches: 75,
        functions: 75,
        statements: 75,
      },
    },
  },
})
