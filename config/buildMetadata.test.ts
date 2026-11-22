import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  escapeHtml,
  injectSiteMetadata,
  readAppVersion,
  readSiteMetadata,
  resolveSiteMetadataPath,
  type SiteMetadata,
} from './buildMetadata'

const metadata: SiteMetadata = {
  name: 'Ada & <Team>',
  title: 'Ada & <Team> | Software Engineer',
  description: 'Build "safe" software',
  keywords: 'portfolio, software',
  googleSiteVerification: 'verification-token',
  siteUrl: 'https://example.com',
  canonicalUrl: 'https://example.com/',
  ogImageUrl: 'https://example.com/assets/cover.png',
  structuredDataJson: '{"@context":"https://schema.org","@type":"Person"}',
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
      '__SITE_NAME__|__SITE_TITLE__|__SITE_DESCRIPTION__|__SITE_KEYWORDS__|__SITE_URL__|' +
      '__SITE_CANONICAL_URL__|__SITE_OG_IMAGE__|__SITE_GOOGLE_VERIFICATION__|' +
      '__SITE_STRUCTURED_DATA__'

    expect(injectSiteMetadata(template, metadata)).toBe(
      'Ada &amp; &lt;Team&gt;|Ada &amp; &lt;Team&gt; | Software Engineer|Build &quot;safe&quot; software|portfolio, software|' +
        'https://example.com|https://example.com/|' +
        'https://example.com/assets/cover.png|verification-token|' +
        '{"@context":"https://schema.org","@type":"Person"}'
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
    const metadataPath = writeTemporaryJson('site.json', {
      name: 'Ada Lovelace',
      title: 'Ada Lovelace | Software Engineer',
      siteUrl: 'https://example.com/portfolio/?draft=true#preview',
      description: 'A software portfolio',
      keywords: 'portfolio, software',
      ogImage: '/assets/cover.png',
      googleSiteVerification: 'verification-token',
      jobTitle: 'Software Engineer',
      worksFor: 'Example Corp',
      sameAs: ['https://github.com/ada', 'https://www.linkedin.com/in/ada'],
    })

    expect(readAppVersion(packagePath)).toBe('v1.2.3')
    expect(readSiteMetadata(metadataPath)).toEqual({
      name: 'Ada Lovelace',
      title: 'Ada Lovelace | Software Engineer',
      siteUrl: 'https://example.com/portfolio',
      canonicalUrl: 'https://example.com/portfolio/',
      description: 'A software portfolio',
      keywords: 'portfolio, software',
      ogImageUrl: 'https://example.com/assets/cover.png',
      googleSiteVerification: 'verification-token',
      structuredDataJson:
        '{"@context":"https://schema.org","@type":"Person","name":"Ada Lovelace",' +
        '"jobTitle":"Software Engineer","url":"https://example.com/portfolio/",' +
        '"worksFor":{"@type":"Organization","name":"Example Corp"},' +
        '"sameAs":["https://github.com/ada","https://www.linkedin.com/in/ada"]}',
    })
  })

  it('prefers centralized metadata while retaining the legacy fork fallback', () => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'portfolio-metadata-'))
    const legacyPath = path.join(temporaryDirectory, 'site-meta.json')
    writeFileSync(legacyPath, '{}', 'utf8')

    expect(resolveSiteMetadataPath(temporaryDirectory)).toBe(legacyPath)

    const centralizedPath = path.join(
      temporaryDirectory,
      'src',
      'content',
      'data',
      'site.json'
    )
    mkdirSync(path.dirname(centralizedPath), { recursive: true })
    writeFileSync(centralizedPath, '{}', 'utf8')

    expect(resolveSiteMetadataPath(temporaryDirectory)).toBe(centralizedPath)
  })

  it.each([
    ['assets/cover.png', 'https://example.com/portfolio/assets/cover.png'],
    ['/assets/cover.png', 'https://example.com/assets/cover.png'],
    ['https://cdn.example.com/cover.png', 'https://cdn.example.com/cover.png'],
  ])(
    'resolves OG image %s deliberately for a project-site deployment',
    (ogImage, expected) => {
      const metadataPath = writeTemporaryJson('site.json', {
        name: 'Example',
        title: 'Example portfolio',
        siteUrl: 'https://example.com/portfolio/',
        description: 'A software portfolio',
        keywords: 'portfolio',
        ogImage,
        googleSiteVerification: 'verification-token',
        jobTitle: 'Engineer',
        worksFor: 'Example',
        sameAs: [],
      })

      expect(readSiteMetadata(metadataPath).ogImageUrl).toBe(expected)
    }
  )

  it('rejects malformed versions, unsafe URLs, and unknown metadata keys', () => {
    const packagePath = writeTemporaryJson('package.json', { version: 'latest' })
    const metadataPath = writeTemporaryJson('site.json', {
      name: 'Ada Lovelace',
      siteUrl: 'http://example.com',
      description: 'A software portfolio',
      keywords: 'portfolio, software',
      ogImage: 'javascript:alert(1)',
      googleSiteVerification: 'verification-token',
      unexpected: true,
    })

    expect(() => readAppVersion(packagePath)).toThrow('package.json is invalid')
    expect(() => readSiteMetadata(metadataPath)).toThrow(
      'content/data/site.json is invalid'
    )
  })
})
