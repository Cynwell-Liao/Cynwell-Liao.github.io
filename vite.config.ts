import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  version: string
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'emit-deploy-version-manifest',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: packageJson.version }, null, 2),
        })
      },
    },
    {
      name: 'inject-site-meta',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          const siteMeta = JSON.parse(readFileSync('./site-meta.json', 'utf-8'))

          return html
            .replaceAll('__SITE_NAME__', siteMeta.name)
            .replaceAll('__SITE_DESCRIPTION__', siteMeta.description)
            .replaceAll('__SITE_KEYWORDS__', siteMeta.keywords)
            .replaceAll('__SITE_URL__', siteMeta.siteUrl)
            .replaceAll('__SITE_OG_IMAGE__', `${siteMeta.siteUrl}${siteMeta.ogImage}`)
            .replaceAll('__SITE_GOOGLE_VERIFICATION__', siteMeta.googleSiteVerification)
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
