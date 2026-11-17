import { escapeHtml, injectSiteMetadata } from './buildMetadata.ts'

import type { SiteMetadata } from './buildMetadata.ts'
import type { Plugin } from 'vite'

/** Emit deployment metadata without rewriting tracked source files. */
export function siteMetadataPlugin(metadata: SiteMetadata): Plugin {
  return {
    name: 'site-metadata',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => injectSiteMetadata(html, metadata),
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeHtml(metadata.canonicalUrl)}</loc>
  </url>
</urlset>
`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', metadata.canonicalUrl).href}\n`,
      })
    },
  }
}
