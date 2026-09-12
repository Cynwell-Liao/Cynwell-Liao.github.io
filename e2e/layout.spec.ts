import { expect, test } from './fixtures'

const viewports = [
  { name: 'mobile', width: 390, height: 844, tag: '@mobile' },
  { name: 'tablet', width: 768, height: 1024, tag: '@desktop' },
  { name: 'desktop', width: 1280, height: 900, tag: '@desktop' },
  { name: 'wide desktop', width: 1920, height: 1080, tag: '@desktop' },
] as const

for (const viewport of viewports) {
  test(`hero certifications align with About, keep compact vertical padding, and fill the marquee on ${viewport.name} ${viewport.tag}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const marquee = page.locator('.hero-cert-marquee')
    const aboutContent = page.locator('#about > div:not([aria-hidden="true"])')
    await expect(marquee).toBeVisible()
    await expect(aboutContent).toBeVisible()

    const [marqueeBounds, aboutBounds] = await Promise.all(
      [marquee, aboutContent].map((locator) =>
        locator.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          return { left: bounds.left, right: bounds.right }
        })
      )
    )

    expect(marqueeBounds.left).toBeCloseTo(aboutBounds.left, 0)
    expect(marqueeBounds.right).toBeCloseTo(aboutBounds.right, 0)
    expect(marqueeBounds.left).toBeGreaterThanOrEqual(0)
    expect(marqueeBounds.right).toBeLessThanOrEqual(viewport.width)

    const staticBadges = await page
      .locator('.hero-cert-marquee__set:not([data-clone="true"]) li')
      .evaluateAll((badges) =>
        badges.map((badge) => {
          const bounds = badge.getBoundingClientRect()
          return { left: bounds.left, right: bounds.right }
        })
      )

    expect(staticBadges.length).toBeGreaterThan(0)
    for (const badge of staticBadges) {
      expect(badge.left).toBeGreaterThanOrEqual(marqueeBounds.left)
      expect(badge.right).toBeLessThanOrEqual(marqueeBounds.right)
    }

    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect(
      page.locator('.hero-cert-marquee__set[data-clone="true"]')
    ).toBeVisible()

    const viewportContentWidth = await page
      .locator('.hero-cert-marquee__viewport')
      .evaluate((element) => {
        const style = getComputedStyle(element)
        return (
          element.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight)
        )
      })
    const setWidths = await page
      .locator('.hero-cert-marquee__set')
      .evaluateAll((sets) => sets.map((set) => set.getBoundingClientRect().width))

    expect(setWidths).toHaveLength(2)
    expect(setWidths[0]).toBeCloseTo(setWidths[1], 0)
    for (const width of setWidths) {
      expect(width).toBeGreaterThanOrEqual(viewportContentWidth)
    }

    const cardPaddings = await page
      .locator(
        '#about .glass-panel, #education article, #projects article, #tech-stack article'
      )
      .evaluateAll((cards) =>
        cards.map((card) => {
          const style = getComputedStyle(card)
          return {
            top: parseFloat(style.paddingTop),
            right: parseFloat(style.paddingRight),
            bottom: parseFloat(style.paddingBottom),
            left: parseFloat(style.paddingLeft),
          }
        })
      )
    expect(cardPaddings.length).toBeGreaterThan(0)
    for (const padding of cardPaddings) {
      expect(padding).toEqual({ top: 32, right: 32, bottom: 32, left: 32 })
    }

    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      await page.emulateMedia({ reducedMotion })
      const contentInsets = await page
        .locator('.hero-cert-marquee__track')
        .evaluate((track) => {
          const viewport = track.parentElement
          if (!viewport) throw new Error('Certification viewport is missing')
          const viewportBounds = viewport.getBoundingClientRect()
          const trackBounds = track.getBoundingClientRect()
          return {
            top: trackBounds.top - viewportBounds.top,
            bottom: viewportBounds.bottom - trackBounds.bottom,
          }
        })

      expect(contentInsets.top).toBeCloseTo(8, 0)
      expect(contentInsets.bottom).toBeCloseTo(8, 0)
    }
  })
}
