import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

;(async () => {
  console.log('Launching browser to render OG image with web fonts...')
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  })

  const svgPath = path.resolve(__dirname, '../public/assets/og-cover.svg')

  // Navigate to the local SVG file
  await page.goto(`file://${svgPath}`)

  // Wait for Google Fonts to download and apply
  await page.evaluate(async () => {
    await document.fonts.ready
  })

  // Give it an extra fraction of a second to render the drop shadows and filters perfectly
  await page.waitForTimeout(500)

  // Take the screenshot!
  const outPath = path.resolve(__dirname, '../public/assets/og-cover.png')
  await page.screenshot({ path: outPath, omitBackground: true })

  await browser.close()
  console.log('\u2713 Successfully generated perfect og-cover.png using Playwright!')
})()
