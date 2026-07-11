import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '..')
const SVG_PATH = path.join(ROOT_DIR, 'public', 'assets', 'og-cover.svg')
const IMAGE_PATH =
  process.argv[2] || path.join(ROOT_DIR, 'public', 'assets', 'profile-photo.png')

if (!fs.existsSync(IMAGE_PATH)) {
  console.error(`Error: Image file not found at ${IMAGE_PATH}`)
  process.exit(1)
}

if (!fs.existsSync(SVG_PATH)) {
  console.error(`Error: SVG file not found at ${SVG_PATH}`)
  process.exit(1)
}

// Convert image to base64 Data URI
const imgBuffer = fs.readFileSync(IMAGE_PATH)
const ext = path.extname(IMAGE_PATH).toLowerCase()
let mimeType = 'image/png'
if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
if (ext === '.svg') mimeType = 'image/svg+xml'
if (ext === '.webp') mimeType = 'image/webp'
if (ext === '.ico') mimeType = 'image/x-icon'

const base64DataUri = `data:${mimeType};base64,${imgBuffer.toString('base64')}`

// Read the SVG
let svgContent = fs.readFileSync(SVG_PATH, 'utf8')

// Find the Decorative Logo Container block
const logoContainerRegex =
  /(<!-- Decorative Logo Container -->\s*<g transform="translate\(850, 220\)">)([\s\S]*?)(<\/g>)/

if (!logoContainerRegex.test(svgContent)) {
  console.error('Error: Could not find the Decorative Logo Container in og-cover.svg')
  process.exit(1)
}

// Define the perfectly cropped circle layer
const newLogoContent = `
    <circle cx="100" cy="100" r="120" fill="#ffffff" fill-opacity="0.3" filter="blur(20px)" />
    <image x="0" y="0" width="200" height="200" preserveAspectRatio="xMidYMid slice" href="${base64DataUri}" clip-path="url(#avatarClip)" />
    <circle cx="100" cy="100" r="100" fill="none" stroke="#ffffff" stroke-width="4" />
  `

// Apply the replacement
svgContent = svgContent.replace(logoContainerRegex, `$1${newLogoContent}$3`)

// Ensure the clipPath exists in <defs>
if (!svgContent.includes('<clipPath id="avatarClip">')) {
  svgContent = svgContent.replace(
    '</defs>',
    `  <clipPath id="avatarClip">\n      <circle cx="100" cy="100" r="100" />\n    </clipPath>\n  </defs>`
  )
}

fs.writeFileSync(SVG_PATH, svgContent, 'utf8')
console.log(
  `\u2713 Successfully embedded ${path.basename(IMAGE_PATH)} into og-cover.svg!`
)
console.log(
  `\u2713 The image is automatically clipped into a perfect circle with a stroke layer over it.`
)
