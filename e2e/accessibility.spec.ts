import { AxeBuilder } from '@axe-core/playwright'

import { expect, test } from './fixtures'

import type { Page } from '@playwright/test'

const sectionIds = ['home', 'about', 'tech-stack', 'projects', 'education'] as const
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const prepareAccessiblePage = async (page: Page) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/')

  for (const sectionId of sectionIds) {
    await page.locator(`#${sectionId}`).scrollIntoViewIfNeeded()
  }

  await page.locator('#home').scrollIntoViewIfNeeded()
  await expect(
    page.locator('[aria-labelledby="professional-activity-heading"]')
  ).toHaveAttribute('aria-busy', 'false')
}

const scanForViolations = async (page: Page) => {
  const scan = await new AxeBuilder({ page }).withTags(wcagTags).analyze()

  return scan.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target),
  }))
}

test('desktop has no automated WCAG A/AA violations @desktop', async ({ page }) => {
  await prepareAccessiblePage(page)

  expect(await scanForViolations(page)).toEqual([])
})

test('mobile has no automated WCAG A/AA violations @mobile', async ({ page }) => {
  await prepareAccessiblePage(page)

  expect(await scanForViolations(page)).toEqual([])
})
