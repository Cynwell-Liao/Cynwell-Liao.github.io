import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(scriptDirectory, '..')
const defaultSvgPath = path.join(repositoryRoot, 'public', 'assets', 'og-cover.svg')
const defaultImagePath = path.join(
  repositoryRoot,
  'public',
  'assets',
  'profile-photo.png'
)
const supportedImageTypes = new Map([
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
])

const printUsage = () => {
  console.log(`Usage: node scripts/embed-og-avatar.js [options]

Options:
  --image <file>       Avatar image (PNG, JPEG, WebP, SVG, or ICO)
  --svg <file.svg>     Source OG SVG (default: public/assets/og-cover.svg)
  --output <file.svg>  Destination SVG (default: overwrite the source SVG)
  -h, --help           Show this help`)
}

const resolveExistingFile = (value, label) => {
  const filePath = path.resolve(value)
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    throw new Error(`${label} does not exist or is not a file: ${filePath}`)
  }

  return filePath
}

const hasExpectedSignature = (extension, buffer) => {
  switch (extension) {
    case '.png':
      return buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    case '.jpg':
    case '.jpeg':
      return (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      )
    case '.webp':
      return (
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      )
    case '.ico':
      return buffer.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0]))
    case '.svg':
      return /^\s*(?:<\?xml[^>]*>\s*)?<svg\b[\s\S]*<\/svg>\s*$/i.test(
        buffer.toString('utf8')
      )
    default:
      return false
  }
}

const run = () => {
  const { values } = parseArgs({
    options: {
      image: { type: 'string' },
      svg: { type: 'string' },
      output: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  })

  if (values.help) {
    printUsage()
    return
  }

  const imagePath = resolveExistingFile(
    values.image ?? defaultImagePath,
    'Avatar image'
  )
  const svgPath = resolveExistingFile(values.svg ?? defaultSvgPath, 'Source SVG')
  const outputPath = path.resolve(values.output ?? svgPath)
  const imageExtension = path.extname(imagePath).toLowerCase()
  const mimeType = supportedImageTypes.get(imageExtension)

  if (!mimeType) {
    throw new Error(`Unsupported avatar image extension: ${imageExtension || '(none)'}`)
  }
  if (path.extname(svgPath).toLowerCase() !== '.svg') {
    throw new Error(`OG source must have an .svg extension: ${svgPath}`)
  }
  if (path.extname(outputPath).toLowerCase() !== '.svg') {
    throw new Error(`OG output must have an .svg extension: ${outputPath}`)
  }
  if (existsSync(outputPath) && !statSync(outputPath).isFile()) {
    throw new Error(`OG output exists and is not a file: ${outputPath}`)
  }

  const imageBuffer = readFileSync(imagePath)
  if (!hasExpectedSignature(imageExtension, imageBuffer)) {
    throw new Error(`Avatar contents do not match the ${imageExtension} extension`)
  }

  const base64DataUri = `data:${mimeType};base64,${imageBuffer.toString('base64')}`
  let svgContent = readFileSync(svgPath, 'utf8')
  if (!/^\s*(?:<\?xml[^>]*>\s*)?<svg\b[\s\S]*<\/svg>\s*$/i.test(svgContent)) {
    throw new Error(`OG source is not a complete SVG document: ${svgPath}`)
  }

  const logoContainerPattern =
    /(<!-- Decorative Logo Container -->\s*<g transform="translate\(850, 220\)">)([\s\S]*?)(<\/g>)/
  const matches = [...svgContent.matchAll(new RegExp(logoContainerPattern, 'g'))]
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one Decorative Logo Container in the OG source; found ${matches.length}`
    )
  }

  const newLogoContent = `
    <circle cx="100" cy="100" r="120" fill="#ffffff" fill-opacity="0.3" filter="blur(20px)" />
    <image x="0" y="0" width="200" height="200" preserveAspectRatio="xMidYMid slice" href="${base64DataUri}" clip-path="url(#avatarClip)" />
    <circle cx="100" cy="100" r="100" fill="none" stroke="#ffffff" stroke-width="4" />
  `
  svgContent = svgContent.replace(logoContainerPattern, `$1${newLogoContent}$3`)

  if (!svgContent.includes('<clipPath id="avatarClip">')) {
    if (!svgContent.includes('</defs>')) {
      throw new Error('OG source has no <defs> block for the avatar clip path')
    }
    svgContent = svgContent.replace(
      '</defs>',
      `  <clipPath id="avatarClip">\n      <circle cx="100" cy="100" r="100" />\n    </clipPath>\n  </defs>`
    )
  }

  mkdirSync(path.dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, svgContent, 'utf8')
  console.log(`Embedded ${path.basename(imagePath)} into ${outputPath}`)
}

try {
  run()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
