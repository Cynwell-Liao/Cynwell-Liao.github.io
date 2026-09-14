import { AxeBuilder } from '@axe-core/playwright'

import { expect, test } from './fixtures'

import type { Page, TestInfo } from '@playwright/test'

const sectionIds = ['home', 'about', 'tech-stack', 'projects', 'education'] as const
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const prepareAccessiblePage = async (page: Page, colorScheme: 'light' | 'dark') => {
  await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
  await page.goto('/')

  for (const sectionId of sectionIds) {
    await page.locator(`#${sectionId}`).scrollIntoViewIfNeeded()
  }

  await page.locator('#home').scrollIntoViewIfNeeded()
  await expect(
    page.locator('[aria-labelledby="professional-activity-heading"]')
  ).toHaveAttribute('aria-busy', 'false')
}

const scanForViolations = async (page: Page, testInfo: TestInfo) => {
  const scan = await new AxeBuilder({ page }).withTags(wcagTags).analyze()

  await testInfo.attach('accessibility-manual-review', {
    body: JSON.stringify(
      scan.incomplete.map((result) => ({
        id: result.id,
        help: result.help,
        nodes: result.nodes.map((node) => ({
          target: node.target,
          summary: node.failureSummary,
        })),
      })),
      null,
      2
    ),
    contentType: 'application/json',
  })

  return scan.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target),
  }))
}

for (const theme of ['light', 'dark'] as const) {
  for (const viewport of ['desktop', 'mobile'] as const) {
    test(`${viewport} ${theme} theme has no automated WCAG A/AA violations @${viewport}`, async ({
      page,
    }, testInfo) => {
      await prepareAccessiblePage(page, theme)
      expect(await scanForViolations(page, testInfo)).toEqual([])
    })
  }

  test(`${theme} terminal has no automated WCAG A/AA violations @desktop`, async ({
    page,
  }, testInfo) => {
    await prepareAccessiblePage(page, theme)
    await page.getByRole('button', { name: 'Terminal', exact: true }).click()
    const input = page.getByRole('textbox', { name: 'Terminal command input' })
    await expect(input).toBeFocused()
    await input.fill('theme invalid')
    await input.press('Enter')
    await input.fill('theme toggle')
    await input.press('Enter')
    await input.fill(`theme ${theme}`)
    await input.press('Enter')
    expect(await scanForViolations(page, testInfo)).toEqual([])
  })
}
