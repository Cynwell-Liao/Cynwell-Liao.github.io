import { defineConfig, devices } from '@playwright/test'

import baseConfig from './playwright.config'

export default defineConfig({
  ...baseConfig,
  outputDir: './test-results/webkit',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: './playwright-report/webkit' }],
  ],
  projects: [
    {
      name: 'desktop-webkit',
      grepInvert: /@mobile|@chromium-only/,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-webkit',
      grepInvert: /@desktop|@chromium-only/,
      use: { ...devices['iPhone 13'] },
    },
  ],
})
