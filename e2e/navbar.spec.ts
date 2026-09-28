import { expect, test } from './fixtures'

import type { Locator } from '@playwright/test'

const expectNoSelection = async (navigation: Locator) => {
  await expect(navigation.locator('[aria-current]')).toHaveCount(0)
  await expect
    .poll(() =>
      navigation
        .getByTestId('navbar-indicator')
        .evaluateAll((indicators) =>
          indicators.some((indicator) => getComputedStyle(indicator).opacity !== '0')
        )
    )
    .toBe(false)
}

const expectIndicatorToMatch = async (navigation: Locator, label: string) => {
  const activeLink = navigation.getByRole('link', { name: label, exact: true })
  const indicator = navigation.getByTestId('navbar-indicator')

  await expect(activeLink).toHaveAttribute('aria-current', 'location')
  await expect(navigation.locator('[aria-current="location"]')).toHaveCount(1)
  await expect(indicator).toBeVisible()
  await expect(indicator).toHaveCSS('opacity', '1')
  await expect
    .poll(async () => {
      const [linkBounds, indicatorBounds] = await Promise.all([
        activeLink.boundingBox(),
        indicator.boundingBox(),
      ])
      if (!linkBounds || !indicatorBounds) return Number.POSITIVE_INFINITY

      return Math.max(
        Math.abs(linkBounds.x - indicatorBounds.x),
        Math.abs(linkBounds.y - indicatorBounds.y),
        Math.abs(linkBounds.width - indicatorBounds.width),
        Math.abs(linkBounds.height - indicatorBounds.height)
      )
    })
    .toBeLessThan(2)
}

test('one pill follows the selected section and clears at home @desktop', async ({
  page,
}) => {
  await page.goto('/')
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' })

  await expectNoSelection(navigation)

  for (const label of ['About', 'Education', 'Tech Stack']) {
    await navigation.getByRole('link', { name: label, exact: true }).click()
    await expectIndicatorToMatch(navigation, label)
  }

  await page.getByRole('link', { name: /home$/u }).click()
  await expectNoSelection(navigation)
})

test('selection follows deep links, history, and scrolling independently of the hash @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#projects')
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' })

  await expectIndicatorToMatch(navigation, 'Projects')
  await navigation.getByRole('link', { name: 'About', exact: true }).click()
  await expectIndicatorToMatch(navigation, 'About')
  await page.goBack()
  await expect(page).toHaveURL(/#projects$/u)
  await expectIndicatorToMatch(navigation, 'Projects')

  await page.locator('#tech-stack').evaluate((section) => {
    section.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await expectIndicatorToMatch(navigation, 'Tech Stack')
  await expect(page).toHaveURL(/#projects$/u)

  await page.locator('#home').evaluate((section) => {
    section.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await expectNoSelection(navigation)
})

test('section links keep their keyboard order and activate with Enter @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
  await navigation.getByRole('link', { name: 'About', exact: true }).focus()

  for (const label of ['Tech Stack', 'Projects', 'Education']) {
    await page.keyboard.press('Tab')
    await expect(
      navigation.getByRole('link', { name: label, exact: true })
    ).toBeFocused()
  }

  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#education$/u)
  await expectIndicatorToMatch(navigation, 'Education')
  await expect(page.locator('#education')).toBeInViewport()
})

test('reduced motion places the indicator without sliding between sections @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#about')
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
  await expectIndicatorToMatch(navigation, 'About')

  const alignmentErrors = await navigation.evaluate(async (element) => {
    const nextLink = element.querySelector<HTMLAnchorElement>('a[href="#education"]')
    if (!nextLink) throw new Error('Education link is missing')
    nextLink.click()

    // Allow React and Motion to commit the new target before observing frames.
    for (let frame = 0; frame < 2; frame += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }

    const errors: number[] = []
    for (let frame = 0; frame < 6; frame += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      const indicator = element.querySelector('[data-testid="navbar-indicator"]')
      if (!indicator) throw new Error('Selected section indicator is missing')
      const target = nextLink.getBoundingClientRect()
      const current = indicator.getBoundingClientRect()
      errors.push(Math.abs(target.left - current.left))
    }
    return errors
  })

  expect(Math.max(...alignmentErrors)).toBeLessThan(2)
  await expectIndicatorToMatch(navigation, 'Education')
})

const headerViewports = [
  {
    name: 'narrow mobile',
    width: 320,
    height: 844,
    tag: '@mobile',
    platterHeight: 66,
    navigationHeight: 0,
    themeHeight: 40,
    outerInsets: [21, 15, 15, 21, 13, 13],
  },
  {
    name: 'tablet',
    width: 768,
    height: 1024,
    tag: '@desktop',
    platterHeight: 70,
    navigationHeight: 44,
    themeHeight: 40,
    outerInsets: [25, 17, 17, 25, 15, 15],
  },
  {
    name: 'desktop',
    width: 1280,
    height: 900,
    tag: '@desktop',
    platterHeight: 70,
    navigationHeight: 44,
    themeHeight: 40,
    outerInsets: [25, 17, 17, 25, 15, 15],
  },
] as const

for (const viewport of headerViewports) {
  test(`the complete header keeps its roomier platter on ${viewport.name} before and after scrolling ${viewport.tag}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const navigation = page.getByRole('navigation', {
      name: 'Primary navigation',
      includeHidden: true,
    })
    if (viewport.tag === '@desktop') await expect(navigation).toBeVisible()
    else await expect(navigation).toBeHidden()

    for (const scrolled of [false, true]) {
      if (scrolled) {
        await page.locator('#projects').evaluate((section) => {
          section.scrollIntoView({ behavior: 'instant', block: 'start' })
        })
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(50)
        if (viewport.tag === '@desktop') {
          await expectIndicatorToMatch(navigation, 'Projects')
        }
      }

      const bounds = await page.locator('header').evaluate((header) => {
        const brand = header.querySelector('a[href="#home"]')
        const platter = brand?.parentElement
        const navigation = header.querySelector('nav')
        const theme = header.querySelector('button[aria-label^="Switch to"]')
        const controls = theme?.parentElement
        if (!brand || !platter || !navigation || !theme || !controls) {
          throw new Error('Header platter, brand, navigation, or controls are missing')
        }
        const platterBounds = platter.getBoundingClientRect()
        const brandBounds = brand.getBoundingClientRect()
        const themeBounds = theme.getBoundingClientRect()
        const navigationBounds = navigation.getBoundingClientRect()
        return {
          platterHeight: platterBounds.height,
          platterLeft: platterBounds.left,
          platterRight: platterBounds.right,
          brandHeight: brandBounds.height,
          themeHeight: themeBounds.height,
          outerInsets: [
            brandBounds.left - platterBounds.left,
            brandBounds.top - platterBounds.top,
            platterBounds.bottom - brandBounds.bottom,
            platterBounds.right - themeBounds.right,
            themeBounds.top - platterBounds.top,
            platterBounds.bottom - themeBounds.bottom,
          ],
          brandRight: brandBounds.right,
          navigationLeft: navigationBounds.left,
          navigationRight: navigationBounds.right,
          navigationHeight: navigationBounds.height,
          controlsLeft: controls.getBoundingClientRect().left,
          pageWidth: document.documentElement.scrollWidth,
        }
      })

      expect(bounds.platterHeight).toBeCloseTo(viewport.platterHeight, 1)
      expect(bounds.brandHeight).toBeCloseTo(36, 1)
      expect(bounds.themeHeight).toBeCloseTo(viewport.themeHeight, 1)
      bounds.outerInsets.forEach((inset, index) => {
        expect(inset).toBeCloseTo(viewport.outerInsets[index], 1)
      })
      expect(bounds.brandRight).toBeLessThanOrEqual(bounds.controlsLeft)
      expect(bounds.platterLeft).toBeGreaterThanOrEqual(0)
      expect(bounds.platterRight).toBeLessThanOrEqual(viewport.width)
      expect(bounds.pageWidth).toBeLessThanOrEqual(viewport.width)

      if (viewport.tag === '@desktop') {
        expect(bounds.navigationHeight).toBeCloseTo(viewport.navigationHeight, 1)
        expect(bounds.brandRight).toBeLessThanOrEqual(bounds.navigationLeft)
        expect(bounds.navigationRight).toBeLessThanOrEqual(bounds.controlsLeft)
      }
    }
  })
}
