import { defineConfig, devices } from '@playwright/test'

const playwrightHost = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1'
const playwrightPort = Number(process.env.PLAYWRIGHT_PORT ?? '5180')
const playwrightBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://${playwrightHost}:${playwrightPort}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: playwrightBaseUrl,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run preview -- --host ${playwrightHost} --port ${playwrightPort} --strictPort`,
    url: playwrightBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      grepInvert: /@mobile/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      grepInvert: /@desktop/,
      use: { ...devices['Pixel 7'] },
    },
  ],
})
