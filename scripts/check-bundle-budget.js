import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { gzipSync } from 'node:zlib'

const MAX_RAW_BYTES = 500_000
const MAX_GZIP_BYTES = 170_000
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(scriptDirectory, '..')

const getAttribute = (tag, attribute) => {
  const match = tag.match(new RegExp(`\\b${attribute}=["']([^"']+)["']`, 'i'))
  return match?.[1]
}

const findInitialJavaScript = (html) => {
  const resources = new Set()

  for (const match of html.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
    const tag = match[0]
    const isModuleScript =
      /^<script\b/i.test(tag) && getAttribute(tag, 'type') === 'module'
    const isModulePreload =
      /^<link\b/i.test(tag) && getAttribute(tag, 'rel') === 'modulepreload'
    if (!isModuleScript && !isModulePreload) continue

    const resource = getAttribute(tag, isModuleScript ? 'src' : 'href')
    if (resource && /\.js(?:[?#]|$)/i.test(resource)) resources.add(resource)
  }

  return [...resources]
}

const resolveAssetPath = (distDirectory, resource) => {
  const pathname = decodeURIComponent(
    new URL(resource, 'https://bundle.local/').pathname
  )
  const assetPath = path.resolve(distDirectory, pathname.replace(/^[/\\]+/, ''))
  const relativePath = path.relative(distDirectory, assetPath)
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Initial bundle asset escapes the dist directory: ${resource}`)
  }
  if (!existsSync(assetPath) || !statSync(assetPath).isFile()) {
    throw new Error(`Initial bundle asset is missing: ${assetPath}`)
  }

  return assetPath
}

const formatKilobytes = (bytes) => `${(bytes / 1000).toFixed(2)} kB`

const run = () => {
  const { values } = parseArgs({
    options: {
      dist: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  })

  if (values.help) {
    console.log(`Usage: node scripts/check-bundle-budget.js [--dist <directory>]

Fails when the largest initial JavaScript asset exceeds 500 kB raw or 170 kB gzip.`)
    return
  }

  const distDirectory = path.resolve(values.dist ?? path.join(repositoryRoot, 'dist'))
  const indexPath = path.join(distDirectory, 'index.html')
  if (!existsSync(indexPath) || !statSync(indexPath).isFile()) {
    throw new Error(`Built index.html was not found: ${indexPath}`)
  }

  const resources = findInitialJavaScript(readFileSync(indexPath, 'utf8'))
  if (resources.length === 0) {
    throw new Error(`No initial JavaScript assets were found in ${indexPath}`)
  }

  const measurements = resources.map((resource) => {
    const assetPath = resolveAssetPath(distDirectory, resource)
    const content = readFileSync(assetPath)

    return {
      resource,
      rawBytes: content.byteLength,
      gzipBytes: gzipSync(content, { level: 9 }).byteLength,
    }
  })
  const largestRaw = measurements.reduce((largest, item) =>
    item.rawBytes > largest.rawBytes ? item : largest
  )
  const largestGzip = measurements.reduce((largest, item) =>
    item.gzipBytes > largest.gzipBytes ? item : largest
  )

  for (const measurement of measurements) {
    console.log(
      `${measurement.resource}: ${formatKilobytes(measurement.rawBytes)} raw, ` +
        `${formatKilobytes(measurement.gzipBytes)} gzip`
    )
  }

  const failures = []
  if (largestRaw.rawBytes > MAX_RAW_BYTES) {
    failures.push(
      `raw size ${formatKilobytes(largestRaw.rawBytes)} exceeds 500.00 kB ` +
        `(${largestRaw.resource})`
    )
  }
  if (largestGzip.gzipBytes > MAX_GZIP_BYTES) {
    failures.push(
      `gzip size ${formatKilobytes(largestGzip.gzipBytes)} exceeds 170.00 kB ` +
        `(${largestGzip.resource})`
    )
  }
  if (failures.length > 0) {
    throw new Error(
      `Initial JavaScript bundle budget exceeded:\n- ${failures.join('\n- ')}`
    )
  }
}

try {
  run()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
