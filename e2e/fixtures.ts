import { expect, test as base } from '@playwright/test'

const CONTRIBUTIONS_HOST = 'github-contributions-api.deno.dev'
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
)

export const test = base.extend({
  page: async ({ baseURL, page }, use, testInfo) => {
    if (!baseURL) {
      throw new Error(
        'Playwright baseURL is required for third-party request isolation.'
      )
    }

    const appOrigin = new URL(baseURL).origin
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })
    page.on('pageerror', (error) => {
      pageErrors.push(error.stack ?? error.message)
    })

    await page.route('**/*', async (route) => {
      const request = route.request()
      const requestUrl = new URL(request.url())

      if (
        (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') ||
        requestUrl.origin === appOrigin
      ) {
        await route.continue()
        return
      }

      if (requestUrl.hostname === CONTRIBUTIONS_HOST) {
        await route.fulfill({
          body: JSON.stringify({ totalContributions: 321 }),
          contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' },
          status: 200,
        })
        return
      }

      if (request.resourceType() === 'image') {
        await route.fulfill({
          body: TRANSPARENT_PNG,
          contentType: 'image/png',
          status: 200,
        })
        return
      }

      await route.fulfill({
        body: '',
        headers: { 'access-control-allow-origin': '*' },
        status: 204,
      })
    })

    await use(page)

    const diagnostics = [
      ...consoleErrors.map((message) => `console.error: ${message}`),
      ...pageErrors.map((message) => `pageerror: ${message}`),
    ]

    if (diagnostics.length > 0) {
      await testInfo.attach('browser-errors', {
        body: diagnostics.join('\n\n'),
        contentType: 'text/plain',
      })
    }

    expect(diagnostics, 'Unexpected browser console or page errors').toEqual([])
  },
})

export { expect }
