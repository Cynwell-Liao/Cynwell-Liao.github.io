import { expect, test } from './fixtures'

test('ambient backgrounds avoid blur filters and respect desktop motion preferences @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')

  const backgrounds = page.locator('.ambient-glow')
  await expect(backgrounds).toHaveCount(9)
  const paints = await backgrounds.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element)
      const paint = getComputedStyle(element, '::before')
      return {
        decorative: Boolean(element.closest('[aria-hidden="true"]')),
        filter: style.filter,
        blend: style.mixBlendMode,
        paintFilter: paint.filter,
        gradient: paint.backgroundImage,
      }
    })
  )
  for (const paint of paints) {
    expect(paint.decorative).toBe(true)
    expect(paint.filter).toBe('none')
    expect(paint.paintFilter).toBe('none')
    expect(paint.blend).toBe('normal')
    expect(paint.gradient).toContain('radial-gradient(')
  }

  const ornaments = page.locator('.hero-orb')
  await expect(ornaments).toHaveCount(3)
  const movingOrnaments = () =>
    ornaments.evaluateAll(
      (elements) =>
        elements.filter((element) =>
          element.getAnimations().some((animation) => animation.playState === 'running')
        ).length
    )
  await expect.poll(movingOrnaments).toBe(3)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(movingOrnaments).toBe(0)
})

for (const viewport of [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${viewport.name} ${colorScheme} loads and reveals every section with static ambient backgrounds @mobile`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ colorScheme, reducedMotion: 'no-preference' })
      await page.goto('/')
      await page.evaluate(() => document.fonts.ready)
      expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(
        true
      )

      const ornaments = page.locator('.hero-orb')
      await expect(ornaments).toHaveCount(3)
      for (const ornament of await ornaments.all()) {
        await expect(ornament).toHaveCSS('animation-name', 'none')
      }

      // Check completed entrance/reveal animations, not only element visibility:
      // an opacity-zero ancestor still counts as visible in Playwright.
      for (const section of [
        'home',
        'about',
        'tech-stack',
        'projects',
        'education',
        'home',
      ]) {
        const heading = page.locator(`#${section}-heading`)
        await heading.scrollIntoViewIfNeeded()
        await expect(heading).toBeInViewport()
        await expect
          .poll(() =>
            heading.evaluate((element) => {
              let ancestor: Element | null = element
              while (ancestor) {
                if (Number(getComputedStyle(ancestor).opacity) < 1) return false
                ancestor = ancestor.parentElement
              }
              return true
            })
          )
          .toBe(true)
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          )
        ).toBe(true)
      }

      await expect(
        page.getByRole('navigation', { name: 'Application Dock' })
      ).toBeInViewport()
    })
  }
}
