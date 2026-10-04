import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml')
const today = new Date().toISOString().slice(0, 10)
const sitemap = readFileSync(sitemapPath, 'utf8').replace(
  /<lastmod>[^<]+<\/lastmod>/,
  `<lastmod>${today}</lastmod>`
)

writeFileSync(sitemapPath, sitemap, 'utf8')
