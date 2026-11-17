import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { build } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'

import { siteMetadataPlugin } from './siteMetadataPlugin'

import type { SiteMetadata } from './buildMetadata'

const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('site metadata build output', () => {
  it.each(['https://example.com/', 'https://example.com/work&notes/'])(
    'emits deterministic crawler files for %s without editing sources',
    async (canonicalUrl) => {
      const directory = mkdtempSync(path.join(tmpdir(), 'portfolio-crawler-'))
      directories.push(directory)
      const html =
        '<!doctype html><html><head><title>__SITE_TITLE__</title></head><body></body></html>'
      writeFileSync(path.join(directory, 'index.html'), html)
      const metadata: SiteMetadata = {
        name: 'Example',
        title: 'Example portfolio',
        description: 'Example description',
        keywords: 'portfolio',
        googleSiteVerification: 'example',
        siteUrl: canonicalUrl.slice(0, -1),
        canonicalUrl,
        ogImageUrl: new URL('assets/cover.png', canonicalUrl).href,
        structuredDataJson: '{}',
      }
      const compile = async () => {
        await build({
          configFile: false,
          root: directory,
          logLevel: 'silent',
          plugins: [siteMetadataPlugin(metadata)],
        })
        return ['sitemap.xml', 'robots.txt', 'index.html'].map((file) =>
          readFileSync(path.join(directory, 'dist', file), 'utf8')
        )
      }
      const [sitemap, robots, outputHtml] = await compile()
      expect(sitemap).toContain(`<loc>${canonicalUrl.replaceAll('&', '&amp;')}</loc>`)
      expect(sitemap).not.toContain('lastmod')
      expect(robots).toBe(
        `User-agent: *\nAllow: /\n\nSitemap: ${canonicalUrl}sitemap.xml\n`
      )
      expect(outputHtml).toContain('<title>Example portfolio</title>')
      expect(await compile()).toEqual([sitemap, robots, outputHtml])
      expect(readFileSync(path.join(directory, 'index.html'), 'utf8')).toBe(html)
      expect(readdirSync(directory).sort()).toEqual(['dist', 'index.html'])
    }
  )
})
