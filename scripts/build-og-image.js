import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import { chromium } from '@playwright/test'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(scriptDirectory, '..')
const defaultInputPath = path.join(repositoryRoot, 'public', 'assets', 'og-cover.svg')
const defaultOutputPath = path.join(repositoryRoot, 'public', 'assets', 'og-cover.png')

const printUsage = () => {
  console.log(`Usage: node scripts/build-og-image.js [options]

Options:
  --input <file.svg>   Source SVG (default: public/assets/og-cover.svg)
  --output <file.png>  Destination PNG (default: public/assets/og-cover.png)
  -h, --help           Show this help`)
}

const resolveInputPath = (value) => {
  const inputPath = path.resolve(value)
  if (path.extname(inputPath).toLowerCase() !== '.svg') {
    throw new Error(`OG image input must be an SVG file: ${inputPath}`)
  }
  if (!existsSync(inputPath) || !statSync(inputPath).isFile()) {
    throw new Error(`OG image input does not exist or is not a file: ${inputPath}`)
  }

  const svg = readFileSync(inputPath, 'utf8')
  if (!/^\s*(?:<\?xml[^>]*>\s*)?<svg\b[\s\S]*<\/svg>\s*$/i.test(svg)) {
    throw new Error(`OG image input is not a complete SVG document: ${inputPath}`)
  }

  return inputPath
}

const resolveOutputPath = (value, inputPath) => {
  const outputPath = path.resolve(value)
  if (path.extname(outputPath).toLowerCase() !== '.png') {
    throw new Error(`OG image output must be a PNG file: ${outputPath}`)
  }
  if (outputPath === inputPath) {
    throw new Error('OG image input and output paths must be different')
  }
  if (existsSync(outputPath) && !statSync(outputPath).isFile()) {
    throw new Error(`OG image output exists and is not a file: ${outputPath}`)
  }

  return outputPath
}

const run = async () => {
  const { values } = parseArgs({
    options: {
      input: { type: 'string' },
      output: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  })

  if (values.help) {
    printUsage()
    return
  }

  const inputPath = resolveInputPath(values.input ?? defaultInputPath)
  const outputPath = resolveOutputPath(values.output ?? defaultOutputPath, inputPath)
  const soraFontUrl = pathToFileURL(
    path.join(
      repositoryRoot,
      'node_modules',
      '@fontsource-variable',
      'sora',
      'files',
      'sora-latin-wght-normal.woff2'
    )
  ).href
  const jetBrainsMonoFontUrl = pathToFileURL(
    path.join(
      repositoryRoot,
      'node_modules',
      '@fontsource-variable',
      'jetbrains-mono',
      'files',
      'jetbrains-mono-latin-wght-normal.woff2'
    )
  ).href

  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
    await page.route(/^https?:\/\//, (route) => route.abort())
    await page.goto(pathToFileURL(inputPath).href, { waitUntil: 'load' })
    await page.evaluate(
      (styleContent) => {
        const style = globalThis.document.createElementNS(
          'http://www.w3.org/2000/svg',
          'style'
        )
        style.textContent = styleContent
        globalThis.document.documentElement.prepend(style)
      },
      `
        @font-face {
          font-family: 'Sora';
          src: url('${soraFontUrl}') format('woff2');
          font-style: normal;
          font-weight: 100 900;
          font-display: block;
        }
        @font-face {
          font-family: 'JetBrains Mono';
          src: url('${jetBrainsMonoFontUrl}') format('woff2');
          font-style: normal;
          font-weight: 100 800;
          font-display: block;
        }
        svg {
          width: 1200px;
          height: 630px;
          margin: 0;
          display: block;
          overflow: hidden;
        }
      `
    )
    await page.evaluate(async () => {
      const browserDocument = globalThis.document

      if (!(browserDocument.documentElement instanceof globalThis.SVGSVGElement)) {
        throw new Error('The input document root is not an SVG element')
      }

      await Promise.all([
        browserDocument.fonts.load('700 72px Sora'),
        browserDocument.fonts.load('700 22px "JetBrains Mono"'),
        browserDocument.fonts.ready,
      ])
      await new Promise((resolve) =>
        globalThis.requestAnimationFrame(() => resolve(undefined))
      )
      await new Promise((resolve) =>
        globalThis.requestAnimationFrame(() => resolve(undefined))
      )
    })

    mkdirSync(path.dirname(outputPath), { recursive: true })
    await page.screenshot({ path: outputPath, omitBackground: true })
    console.log(`Generated OG cover: ${outputPath}`)
  } finally {
    await browser?.close()
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
