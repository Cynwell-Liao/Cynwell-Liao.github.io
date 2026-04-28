import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))

interface PackageJson {
  version?: unknown
}

const normalizeAppVersion = (version: string) =>
  version.startsWith('v') ? version : `v${version}`

const readAppVersion = () => {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8')) as PackageJson

  if (typeof packageJson.version !== 'string' || packageJson.version.length === 0) {
    throw new Error('package.json version must be a non-empty string')
  }

  return normalizeAppVersion(packageJson.version)
}

const appVersion = readAppVersion()

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(srcDir, 'app'),
      '@features': path.resolve(srcDir, 'features'),
      '@shared': path.resolve(srcDir, 'shared'),
      '@content': path.resolve(srcDir, 'content'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
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
        lines: 75,
        branches: 75,
        functions: 75,
        statements: 75,
      },
    },
  },
})
