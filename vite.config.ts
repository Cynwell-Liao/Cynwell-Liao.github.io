import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
