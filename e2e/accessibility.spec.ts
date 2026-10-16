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
    details: violation.nodes.map((node) => node.failureSummary),
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
    await page
      .getByRole('navigation', { name: 'Application Dock' })
      .getByRole('button', { name: 'Terminal', exact: true })
      .click()
    const input = page.getByRole('textbox', { name: 'Terminal command input' })
    await expect(input).toBeFocused()
    await input.fill('theme invalid')
    await input.press('Enter')
    await input.fill('theme toggle')
    await input.press('Enter')
    await input.fill(`theme ${theme}`)
    await input.press('Enter')
    await expect(page.getByRole('dialog', { name: 'Terminal' })).toHaveAttribute(
      'data-theme',
      theme
    )
    await expect(page.locator('.terminal-screen')).toHaveCSS(
      'backdrop-filter',
      'blur(24px)'
    )
    await expect(input).toHaveCSS(
      'color',
      theme === 'dark' ? 'rgb(240, 240, 240)' : 'rgb(22, 22, 22)'
    )
    expect(await scanForViolations(page, testInfo)).toEqual([])
  })

  test(`${theme} Dock action menus have no automated WCAG A/AA violations @desktop`, async ({
    page,
  }, testInfo) => {
    await prepareAccessiblePage(page, theme)
    const dock = page.getByRole('navigation', { name: 'Application Dock' })
    const github = dock.getByRole('link', { name: 'GitHub', exact: true })
    await github.focus()
    await github.press('Shift+F10')
    const profileMenu = page.getByRole('menu', { name: 'GitHub actions' })
    await expect(
      profileMenu.getByRole('menuitem', { name: 'Open', exact: true })
    ).toBeFocused()
    expect(await scanForViolations(page, testInfo)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(github).toBeFocused()

    const terminal = dock.getByRole('button', { name: 'Terminal', exact: true })
    await terminal.click()
    await expect(page.getByRole('dialog', { name: 'Terminal' })).toBeVisible()
    await terminal.focus()
    await terminal.press('Shift+F10')
    const terminalMenu = page.getByRole('menu', {
      name: 'Terminal actions',
      exact: true,
    })
    await expect(
      terminalMenu.getByRole('menuitem', { name: 'Show', exact: true })
    ).toBeFocused()
    expect(await scanForViolations(page, testInfo)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(terminal).toBeFocused()
    await expect(page.getByRole('dialog', { name: 'Terminal' })).toBeVisible()
  })
}
