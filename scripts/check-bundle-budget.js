import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { gzipSync } from 'node:zlib'

const MAX_RAW_BYTES = 500_000
const MAX_GZIP_BYTES = 170_000
const MAX_TOTAL_RAW_BYTES = 600_000
const MAX_TOTAL_GZIP_BYTES = 195_000
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(scriptDirectory, '..')

const findInitialJavaScript = (manifest) => {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Build manifest must be an object of output chunks')
  }

  const visited = new Set()
  const resources = new Set()
  const visit = (key) => {
    if (visited.has(key)) return
    visited.add(key)

    const chunk = Object.hasOwn(manifest, key) ? manifest[key] : undefined
    if (!chunk || typeof chunk.file !== 'string' || !chunk.file) {
      throw new Error(`Build manifest chunk is missing or invalid: ${key}`)
    }
    if (/\.m?js$/i.test(chunk.file)) resources.add(chunk.file)

    const imports = chunk.imports ?? []
    if (!Array.isArray(imports) || imports.some((key) => typeof key !== 'string')) {
      throw new Error(`Build manifest chunk imports are invalid: ${key}`)
    }
    // Dynamic imports are deferred until the feature is opened.
    imports.forEach(visit)
  }

  for (const [key, chunk] of Object.entries(manifest)) {
    if (chunk?.isEntry === true) visit(key)
  }

  return [...resources]
}

const resolveAssetPath = (distDirectory, resource) => {
  // Manifest files are output-relative, independent of the deployed base URL.
  const pathname = decodeURIComponent(resource).replaceAll('\\', '/')
  const assetPath = path.resolve(distDirectory, pathname)
  const relativePath = path.relative(distDirectory, assetPath)
  if (
    path.posix.isAbsolute(pathname) ||
    path.win32.isAbsolute(pathname) ||
    /^[a-z][a-z\d+.-]*:/i.test(pathname) ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
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

Reads .vite/manifest.json and checks all statically imported initial JavaScript.
Limits: 500 kB raw / 170 kB gzip per asset; 600 kB raw / 195 kB gzip in total.`)
    return
  }

  const distDirectory = path.resolve(values.dist ?? path.join(repositoryRoot, 'dist'))
  const indexPath = path.join(distDirectory, 'index.html')
  if (!existsSync(indexPath) || !statSync(indexPath).isFile()) {
    throw new Error(`Built index.html was not found: ${indexPath}`)
  }

  const manifestPath = path.join(distDirectory, '.vite', 'manifest.json')
  if (!existsSync(manifestPath) || !statSync(manifestPath).isFile()) {
    throw new Error(`Build manifest was not found: ${manifestPath}`)
  }
  const resources = findInitialJavaScript(
    JSON.parse(readFileSync(manifestPath, 'utf8'))
  )
  if (resources.length === 0) {
    throw new Error(`No initial JavaScript assets were found in ${manifestPath}`)
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
  const totals = measurements.reduce(
    (total, item) => ({
      rawBytes: total.rawBytes + item.rawBytes,
      gzipBytes: total.gzipBytes + item.gzipBytes,
    }),
    { rawBytes: 0, gzipBytes: 0 }
  )

  for (const measurement of measurements) {
    console.log(
      `${measurement.resource}: ${formatKilobytes(measurement.rawBytes)} raw, ` +
        `${formatKilobytes(measurement.gzipBytes)} gzip`
    )
  }
  console.log(
    `Total initial JavaScript: ${formatKilobytes(totals.rawBytes)} raw, ` +
      `${formatKilobytes(totals.gzipBytes)} gzip`
  )

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
  if (totals.rawBytes > MAX_TOTAL_RAW_BYTES) {
    failures.push(
      `total raw size ${formatKilobytes(totals.rawBytes)} exceeds 600.00 kB`
    )
  }
  if (totals.gzipBytes > MAX_TOTAL_GZIP_BYTES) {
    failures.push(
      `total gzip size ${formatKilobytes(totals.gzipBytes)} exceeds 195.00 kB`
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
