import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import {
  injectSiteMetadata,
  readAppVersion,
  readSiteMetadata,
} from './config/buildMetadata'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))

const appVersion = readAppVersion()
const siteMetadata = readSiteMetadata()

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'inject-site-meta',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return injectSiteMetadata(html, siteMetadata)
        },
      },
    },
  ],
  resolve: {
    alias: {
      '@app': path.resolve(srcDir, 'app'),
      '@features': path.resolve(srcDir, 'features'),
      '@shared': path.resolve(srcDir, 'shared'),
      '@content': path.resolve(srcDir, 'content'),
    },
  },
})
