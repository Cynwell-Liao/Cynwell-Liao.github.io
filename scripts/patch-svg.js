import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const svgPath = path.resolve(__dirname, '../public/assets/og-cover.svg')
let svg = fs.readFileSync(svgPath, 'utf8')

if (!svg.includes('<style>')) {
  svg = svg.replace(
    '</defs>',
    `</defs>\n  <style>\n    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700&amp;family=Sora:wght@400;700&amp;display=swap');\n  </style>`
  )
  fs.writeFileSync(svgPath, svg)
  console.log('Successfully patched SVG with Google Fonts style block.')
} else {
  console.log('SVG already contains style block.')
}
