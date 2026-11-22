import { expect, test } from './fixtures'

import type { Locator, Page } from '@playwright/test'

const viewports = [
  { width: 320, height: 844, tag: '@mobile' },
  { width: 390, height: 844, tag: '@mobile' },
  { width: 768, height: 1024, tag: '@desktop' },
  { width: 1280, height: 900, tag: '@desktop' },
] as const

function marqueeElements(page: Page) {
  return {
    marquee: page.locator('.hero-cert-marquee'),
    viewport: page.locator('.hero-cert-marquee__viewport'),
    track: page.locator('.hero-cert-marquee__track'),
    originals: page.locator('.hero-cert-marquee__set:not([data-clone="true"])'),
    clones: page.locator('.hero-cert-marquee__set[data-clone="true"]'),
    badges: page.locator(
      '.hero-cert-marquee__set:not([data-clone="true"]) .hero-cert-marquee__badge-link'
    ),
    themeToggle: page
      .getByRole('banner')
      .getByRole('button', { name: /Switch to (light|dark) mode/ }),
  }
}

async function expectFocusedBadgeVisible(badge: Locator) {
  await expect(badge).toBeFocused()
  await expect
    .poll(() =>
      badge.evaluate((element) => {
        const viewport = element.closest('.hero-cert-marquee__viewport')
        if (!viewport) throw new Error('Certification viewport is missing')
        const badgeBounds = element.getBoundingClientRect()
        const viewportBounds = viewport.getBoundingClientRect()
        // The two-pixel ring and its two-pixel offset must both remain visible.
        const ringSpace = 4 - 0.5

        return {
          keyboardFocus: element.matches(':focus-visible'),
          insideMarquee:
            badgeBounds.left - viewportBounds.left >= ringSpace &&
            viewportBounds.right - badgeBounds.right >= ringSpace &&
            badgeBounds.top - viewportBounds.top >= ringSpace &&
            viewportBounds.bottom - badgeBounds.bottom >= ringSpace,
          insideWindow:
            badgeBounds.left >= ringSpace &&
            badgeBounds.right <= window.innerWidth - ringSpace &&
            badgeBounds.top >= ringSpace &&
            badgeBounds.bottom <= window.innerHeight - ringSpace,
        }
      })
    )
    .toEqual({ keyboardFocus: true, insideMarquee: true, insideWindow: true })
}

async function expectScrollReset(viewport: Locator) {
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBe(0)
}

test('the first certification enters from the right before continuous scrolling @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')

  const { viewport, track, badges } = marqueeElements(page)
  const timing = await track.evaluate((element) => {
    const animations = element.getAnimations()
    for (const animation of element.getAnimations()) {
      animation.pause()
      animation.currentTime = 0
    }
    const entry = animations.find(
      (animation) =>
        animation instanceof CSSAnimation &&
        animation.animationName === 'hero-cert-marquee-enter'
    )
    const scroll = animations.find(
      (animation) =>
        animation instanceof CSSAnimation &&
        animation.animationName === 'hero-cert-marquee-scroll'
    )
    const viewport = element.parentElement
    const originalSet = element.querySelector(
      '.hero-cert-marquee__set:not([data-clone="true"])'
    )
    if (!entry || !scroll || !viewport || !originalSet) {
      throw new Error('Certification marquee animation is incomplete')
    }
    return {
      entryDuration: Number(entry.effect?.getTiming().duration),
      scrollDelay: scroll.effect?.getTiming().delay ?? 0,
      setWidth: originalSet.getBoundingClientRect().width,
      viewportWidth: viewport.clientWidth,
    }
  })
  expect(timing.entryDuration).toBeCloseTo(
    24_000 * (timing.viewportWidth / timing.setWidth),
    0
  )
  expect(timing.scrollDelay).toBeCloseTo(timing.entryDuration, 0)

  const initialPosition = await Promise.all(
    [badges.first(), viewport].map((locator) =>
      locator.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return { left: bounds.left, right: bounds.right }
      })
    )
  )
  expect(initialPosition[0].left).toBeGreaterThanOrEqual(initialPosition[1].right)

  await track.evaluate((element, entryDuration) => {
    for (const animation of element.getAnimations()) {
      animation.currentTime = entryDuration + 1
    }
  }, timing.entryDuration)
  await expect
    .poll(() =>
      badges.first().evaluate((element) => {
        const viewport = element.closest('.hero-cert-marquee__viewport')
        if (!viewport) throw new Error('Certification viewport is missing')
        const badgeBounds = element.getBoundingClientRect()
        const viewportBounds = viewport.getBoundingClientRect()
        return (
          badgeBounds.left >= viewportBounds.left &&
          badgeBounds.right <= viewportBounds.right
        )
      })
    )
    .toBe(true)
})

for (const size of viewports) {
  test(`certification keyboard traversal reveals every badge after animation at ${String(size.width)}px ${size.tag}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: size.width, height: size.height })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')

    const { marquee, viewport, track, clones, badges, themeToggle } =
      marqueeElements(page)
    await expect(marquee).toBeVisible()
    const normalHeight = await marquee.evaluate((element) => element.clientHeight)
    const count = await badges.count()
    expect(count).toBeGreaterThan(0)
    await track.evaluate((element) => {
      const animation = element
        .getAnimations()
        .find(
          (item) =>
            item instanceof CSSAnimation &&
            item.animationName === 'hero-cert-marquee-scroll'
        )
      if (!animation) throw new Error('Expected the running certification animation')
      const delay = animation.effect?.getTiming().delay ?? 0
      animation.currentTime = delay + 20_000
    })
    await expect
      .poll(() =>
        badges.first().evaluate((element) => {
          const viewport = element.closest('.hero-cert-marquee__viewport')
          if (!viewport) throw new Error('Certification viewport is missing')
          return (
            element.getBoundingClientRect().right <
            viewport.getBoundingClientRect().left
          )
        })
      )
      .toBe(true)

    await themeToggle.focus()
    for (let index = 0; index < count; index += 1) {
      await page.keyboard.press('Tab')
      await expectFocusedBadgeVisible(badges.nth(index))
      await expect(track).toHaveCSS('animation-name', 'none')
      await expect(clones).toBeHidden()
      expect(await marquee.evaluate((element) => element.clientHeight)).toBe(
        normalHeight
      )
    }

    const scroll = await viewport.evaluate((element) => ({
      overflows: element.scrollWidth > element.clientWidth,
      left: element.scrollLeft,
    }))
    if (scroll.overflows) expect(scroll.left).toBeGreaterThan(0)

    await page.keyboard.press('Tab')
    await expectScrollReset(viewport)
    await expect(track).toHaveCSS('animation-name', /hero-cert-marquee-scroll/)
    await expect(clones).toBeVisible()

    for (let index = count - 1; index >= 0; index -= 1) {
      await page.keyboard.press('Shift+Tab')
      await expectFocusedBadgeVisible(badges.nth(index))
      expect(await marquee.evaluate((element) => element.clientHeight)).toBe(
        normalHeight
      )
    }
    await page.keyboard.press('Shift+Tab')
    await expect(themeToggle).toBeFocused()
    await expectScrollReset(viewport)
    await expect(track).toHaveCSS('animation-name', /hero-cert-marquee-scroll/)
    await expect(clones).toBeVisible()
  })
}

for (const size of [viewports[1], viewports[3]]) {
  test(`reduced-motion certification badges retain wrapping and keyboard visibility at ${String(size.width)}px ${size.tag}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: size.width, height: size.height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const { marquee, viewport, track, originals, clones, badges, themeToggle } =
      marqueeElements(page)
    await expect(marquee).toBeVisible()
    await expect(track).toHaveCSS('animation-name', 'none')
    await expect(originals).toHaveCSS('flex-wrap', 'wrap')
    await expect(clones).toBeHidden()
    const normalHeight = await marquee.evaluate((element) => element.clientHeight)
    const count = await badges.count()
    expect(count).toBeGreaterThan(0)

    await themeToggle.focus()
    for (let index = 0; index < count; index += 1) {
      await page.keyboard.press('Tab')
      await expectFocusedBadgeVisible(badges.nth(index))
    }
    for (let index = count - 2; index >= 0; index -= 1) {
      await page.keyboard.press('Shift+Tab')
      await expectFocusedBadgeVisible(badges.nth(index))
    }
    await page.keyboard.press('Shift+Tab')
    await expect(themeToggle).toBeFocused()
    await expectScrollReset(viewport)
    await expect(track).toHaveCSS('animation-name', 'none')
    await expect(originals).toHaveCSS('flex-wrap', 'wrap')
    await expect(clones).toBeHidden()
    expect(await marquee.evaluate((element) => element.clientHeight)).toBe(normalHeight)
  })
}

test('rapid reverse traversal cancels page scrolling away from the focused badge @desktop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const { badges, themeToggle } = marqueeElements(page)
  await themeToggle.focus()
  const count = await badges.count()
  for (let index = 0; index < count; index += 1) {
    await page.keyboard.press('Tab')
    await expectFocusedBadgeVisible(badges.nth(index))
  }

  // Reverse at different stages of the browser's smooth focus scroll to the
  // next section, including before its first animation frame.
  for (const frames of [0, 1, 2, 4, 8]) {
    await page.keyboard.press('Tab')
    await expect(badges.last()).not.toBeFocused()
    await page.evaluate(async (count) => {
      for (let frame = 0; frame < count; frame += 1) {
        await new Promise(requestAnimationFrame)
      }
    }, frames)
    await page.keyboard.press('Shift+Tab')
    await expectFocusedBadgeVisible(badges.last())
    const remainsVisible = await badges.last().evaluate(async (element) => {
      for (let frame = 0; frame < 30; frame += 1) {
        await new Promise(requestAnimationFrame)
        const bounds = element.getBoundingClientRect()
        if (bounds.top < 4 || bounds.bottom > window.innerHeight - 4) return false
      }
      return true
    })
    expect(remainsVisible).toBe(true)
  }
})

test('pointer focus preserves the animated certification row @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')

  const { marquee, viewport, track, clones, badges } = marqueeElements(page)
  await marquee.hover()
  await track.evaluate((element) => {
    for (const animation of element.getAnimations()) {
      const timing = animation.effect?.getTiming()
      animation.currentTime =
        animation instanceof CSSAnimation &&
        animation.animationName === 'hero-cert-marquee-enter'
          ? Number(timing?.duration)
          : (timing?.delay ?? 0)
    }
  })
  const badge = badges.first()
  await badge.evaluate((element) => {
    element.addEventListener('click', (event) => event.preventDefault(), { once: true })
  })
  await badge.click()

  await expect(badge).toBeFocused()
  expect(await badge.evaluate((element) => element.matches(':focus-visible'))).toBe(
    false
  )
  await expect(track).toHaveCSS('animation-name', /hero-cert-marquee-scroll/)
  await expect(track).toHaveCSS('animation-play-state', 'running, paused')
  await expect(viewport).toHaveCSS('overflow-x', 'hidden')
  await expect(clones).toBeVisible()
})
