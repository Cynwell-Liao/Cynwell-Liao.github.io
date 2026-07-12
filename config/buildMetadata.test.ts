import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  escapeHtml,
  injectSiteMetadata,
  readAppVersion,
  readSiteMetadata,
  type SiteMetadata,
} from './buildMetadata'

const metadata: SiteMetadata = {
  name: 'Ada & <Team>',
  description: 'Build "safe" software',
  keywords: 'portfolio, software',
  googleSiteVerification: 'verification-token',
  siteUrl: 'https://example.com',
  canonicalUrl: 'https://example.com/',
  ogImageUrl: 'https://example.com/assets/cover.png',
}
let temporaryDirectory: string | undefined

const writeTemporaryJson = (fileName: string, value: unknown): string => {
  temporaryDirectory ??= mkdtempSync(path.join(tmpdir(), 'portfolio-metadata-'))
  const filePath = path.join(temporaryDirectory, fileName)
  writeFileSync(filePath, JSON.stringify(value), 'utf8')

  return filePath
}

afterEach(() => {
  if (temporaryDirectory) rmSync(temporaryDirectory, { force: true, recursive: true })
  temporaryDirectory = undefined
})

describe('build metadata helpers', () => {
  it('escapes values before injecting every supported placeholder', () => {
    const template =
      '__SITE_NAME__|__SITE_DESCRIPTION__|__SITE_KEYWORDS__|__SITE_URL__|' +
      '__SITE_CANONICAL_URL__|__SITE_OG_IMAGE__|__SITE_GOOGLE_VERIFICATION__'

    expect(injectSiteMetadata(template, metadata)).toBe(
      'Ada &amp; &lt;Team&gt;|Build &quot;safe&quot; software|portfolio, software|' +
        'https://example.com|https://example.com/|' +
        'https://example.com/assets/cover.png|verification-token'
    )
  })

  it('fails when a template contains an unsupported placeholder', () => {
    expect(() => injectSiteMetadata('__SITE_UNKNOWN__', metadata)).toThrow(
      'Unresolved HTML metadata placeholders: __SITE_UNKNOWN__'
    )
  })

  it('escapes apostrophes', () => {
    expect(escapeHtml("Ada's site")).toBe('Ada&#39;s site')
  })

  it('validates and normalizes package and site metadata', () => {
    const packagePath = writeTemporaryJson('package.json', { version: '1.2.3' })
    const metadataPath = writeTemporaryJson('site-meta.json', {
      name: 'Ada Lovelace',
      siteUrl: 'https://example.com/portfolio/?draft=true#preview',
      description: 'A software portfolio',
      keywords: 'portfolio, software',
      ogImage: '/assets/cover.png',
      googleSiteVerification: 'verification-token',
    })

    expect(readAppVersion(packagePath)).toBe('v1.2.3')
    expect(readSiteMetadata(metadataPath)).toEqual({
      name: 'Ada Lovelace',
      siteUrl: 'https://example.com/portfolio',
      canonicalUrl: 'https://example.com/portfolio/',
      description: 'A software portfolio',
      keywords: 'portfolio, software',
      ogImageUrl: 'https://example.com/assets/cover.png',
      googleSiteVerification: 'verification-token',
    })
  })

  it('rejects malformed versions, unsafe URLs, and unknown metadata keys', () => {
    const packagePath = writeTemporaryJson('package.json', { version: 'latest' })
    const metadataPath = writeTemporaryJson('site-meta.json', {
      name: 'Ada Lovelace',
      siteUrl: 'http://example.com',
      description: 'A software portfolio',
      keywords: 'portfolio, software',
      ogImage: 'javascript:alert(1)',
      googleSiteVerification: 'verification-token',
      unexpected: true,
    })

    expect(() => readAppVersion(packagePath)).toThrow('package.json is invalid')
    expect(() => readSiteMetadata(metadataPath)).toThrow('site-meta.json is invalid')
  })
})
