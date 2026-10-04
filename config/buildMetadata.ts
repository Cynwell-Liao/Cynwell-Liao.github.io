import { readFileSync } from 'node:fs'
import path from 'node:path'

import { z } from 'zod'

const repositoryRoot = process.cwd()

const nonBlankText = z.string().trim().min(1)
const packageJsonSchema = z.object({
  version: nonBlankText.regex(
    /^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/,
    'must be a semantic version'
  ),
})
const siteMetadataSchema = z.strictObject({
  name: nonBlankText,
  title: nonBlankText,
  siteUrl: nonBlankText.refine((value) => {
    try {
      return new URL(value).protocol === 'https:'
    } catch {
      return false
    }
  }, 'must be an absolute HTTPS URL'),
  description: nonBlankText,
  keywords: nonBlankText,
  ogImage: nonBlankText.refine((value) => {
    try {
      return new URL(value, 'https://example.com').protocol === 'https:'
    } catch {
      return false
    }
  }, 'must be a root-relative path or an HTTPS URL'),
  googleSiteVerification: nonBlankText,
  jobTitle: nonBlankText,
  worksFor: nonBlankText,
  sameAs: z.array(
    z
      .string()
      .url()
      .refine((value) => new URL(value).protocol === 'https:')
  ),
})

export interface SiteMetadata {
  readonly name: string
  readonly title: string
  readonly description: string
  readonly keywords: string
  readonly googleSiteVerification: string
  readonly siteUrl: string
  readonly canonicalUrl: string
  readonly ogImageUrl: string
  readonly structuredDataJson: string
}

const parseJsonFile = <T>(filePath: string, schema: z.ZodType<T>, label: string): T => {
  let value: unknown

  try {
    value = JSON.parse(readFileSync(filePath, 'utf8')) as unknown
  } catch (cause) {
    throw new Error(`Unable to read ${label} at ${filePath}`, { cause })
  }

  const result = schema.safeParse(value)
  if (!result.success) {
    throw new Error(`${label} is invalid:\n${z.prettifyError(result.error)}`, {
      cause: result.error,
    })
  }

  return result.data
}

export const readAppVersion = (
  packageJsonPath = path.join(repositoryRoot, 'package.json')
): string => {
  const { version } = parseJsonFile(packageJsonPath, packageJsonSchema, 'package.json')

  return version.startsWith('v') ? version : `v${version}`
}

export const readSiteMetadata = (
  siteMetadataPath = path.join(repositoryRoot, 'site-meta.json')
): SiteMetadata => {
  const rawMetadata = parseJsonFile(
    siteMetadataPath,
    siteMetadataSchema,
    'site-meta.json'
  )
  const siteUrl = new URL(rawMetadata.siteUrl)
  siteUrl.hash = ''
  siteUrl.search = ''
  siteUrl.pathname = siteUrl.pathname.replace(/\/+$/, '')

  const normalizedSiteUrl = siteUrl.href.replace(/\/+$/, '')
  const canonicalUrl = `${normalizedSiteUrl}/`

  return Object.freeze({
    name: rawMetadata.name,
    title: rawMetadata.title,
    description: rawMetadata.description,
    keywords: rawMetadata.keywords,
    googleSiteVerification: rawMetadata.googleSiteVerification,
    siteUrl: normalizedSiteUrl,
    canonicalUrl,
    ogImageUrl: new URL(rawMetadata.ogImage, canonicalUrl).href,
    structuredDataJson: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: rawMetadata.name,
      jobTitle: rawMetadata.jobTitle,
      url: canonicalUrl,
      worksFor: {
        '@type': 'Organization',
        name: rawMetadata.worksFor,
      },
      sameAs: rawMetadata.sameAs,
    })
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026'),
  })
}

export const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character
  )

export const injectSiteMetadata = (html: string, metadata: SiteMetadata): string => {
  const replacements = new Map<string, string>([
    ['__SITE_NAME__', metadata.name],
    ['__SITE_TITLE__', metadata.title],
    ['__SITE_DESCRIPTION__', metadata.description],
    ['__SITE_KEYWORDS__', metadata.keywords],
    ['__SITE_URL__', metadata.siteUrl],
    ['__SITE_CANONICAL_URL__', metadata.canonicalUrl],
    ['__SITE_OG_IMAGE__', metadata.ogImageUrl],
    ['__SITE_GOOGLE_VERIFICATION__', metadata.googleSiteVerification],
  ])

  let transformedHtml = html
  for (const [placeholder, value] of replacements) {
    transformedHtml = transformedHtml.replaceAll(placeholder, escapeHtml(value))
  }
  transformedHtml = transformedHtml.replaceAll(
    '__SITE_STRUCTURED_DATA__',
    metadata.structuredDataJson
  )

  const unresolvedPlaceholders = [
    ...new Set(transformedHtml.match(/__[A-Z][A-Z0-9_]*__/g) ?? []),
  ]
  if (unresolvedPlaceholders.length > 0) {
    throw new Error(
      `Unresolved HTML metadata placeholders: ${unresolvedPlaceholders.join(', ')}`
    )
  }

  return transformedHtml
}
