import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { injectSiteMetadata, readSiteMetadata } from './config/buildMetadata.ts'
import { sharedViteConfig } from './config/sharedViteConfig.ts'
const siteMetadata = readSiteMetadata()

// https://vite.dev/config/
export default defineConfig({
  ...sharedViteConfig,
  base: '/',
  build: {
    manifest: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'icons', test: /node_modules[\\/]react-icons/ }],
        },
      },
    },
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
})
