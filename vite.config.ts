import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(srcDir, 'app'),
      '@features': path.resolve(srcDir, 'features'),
      '@shared': path.resolve(srcDir, 'shared'),
      '@content': path.resolve(srcDir, 'content'),
    },
  },
})
