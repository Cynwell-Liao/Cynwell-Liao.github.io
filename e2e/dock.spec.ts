import { expect, test } from './fixtures'

import type { Locator } from '@playwright/test'

const boundsFor = async (locator: Locator) => {
  const bounds = await locator.boundingBox()
  if (!bounds) throw new Error('Missing Dock app bounds')
  return bounds
}

test('the Dock has three apps, correct profile links, and inline decorative icons @desktop', async ({
  page,
}) => {
  const dockAssetRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/assets/dock/')) dockAssetRequests.push(request.url())
  })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  await expect(dock.getByRole('link')).toHaveCount(2)
  await expect(dock.getByRole('button')).toHaveCount(1)
  for (const [label, heroLabel] of [
    ['GitHub', 'GitHub'],
    ['LinkedIn', 'LinkedIn Profile'],
  ]) {
    const link = dock.getByRole('link', { name: label, exact: true })
    const href = await page
      .locator('#home')
      .getByRole('link', { name: heroLabel, exact: true })
      .getAttribute('href')
    expect(href).toBeTruthy()
    await expect(link).toHaveAttribute('href', href!)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  }
  await expect(dock.locator('img')).toHaveCount(0)
  for (const app of ['github', 'linkedin', 'terminal']) {
    const icon = dock.locator(`[data-dock-app="${app}"] svg`)
    await expect(icon).toHaveCount(1)
    await expect(icon).toBeVisible()
    await expect(icon).toHaveAttribute('aria-hidden', 'true')
    await expect(icon).toHaveAttribute('focusable', 'false')
  }
  expect(dockAssetRequests).toEqual([])
})

test('app glyphs stay inside their tiles and scale with magnification @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  for (const id of ['github', 'linkedin', 'terminal']) {
    const app = dock.locator(`[data-dock-app="${id}"]`)
    await page.mouse.move(10, 100)
    await expect(app).toHaveCSS('width', '52px')
    const normalizedBounds = () =>
      app.locator('.desktop-dock__icon').evaluate((icon) => {
        const svg = icon.querySelector('svg')
        if (!svg) throw new Error('Missing dock glyph')
        const tile = icon.getBoundingClientRect()
        const glyph = svg.getBoundingClientRect()
        return {
          x: (glyph.x - tile.x) / tile.width,
          y: (glyph.y - tile.y) / tile.height,
          width: glyph.width / tile.width,
          height: glyph.height / tile.height,
        }
      })
    const restingGlyph = await normalizedBounds()
    expect(restingGlyph.x).toBeGreaterThanOrEqual(0)
    expect(restingGlyph.y).toBeGreaterThanOrEqual(0)
    expect(restingGlyph.width).toBeGreaterThan(0.3)
    expect(restingGlyph.height).toBeGreaterThan(0.3)
    expect(restingGlyph.x + restingGlyph.width).toBeLessThanOrEqual(1)
    expect(restingGlyph.y + restingGlyph.height).toBeLessThanOrEqual(1)
    await app.hover()
    await expect.poll(async () => (await boundsFor(app)).width).toBeGreaterThan(74)
    const magnifiedGlyph = await normalizedBounds()
    for (const dimension of ['x', 'y', 'width', 'height'] as const) {
      expect(magnifiedGlyph[dimension], `${id} ${dimension}`).toBeCloseTo(
        restingGlyph[dimension],
        2
      )
    }
  }
})

test('pointer proximity magnifies neighboring apps and resets on leave @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  const apps = dock.locator('[data-dock-app]')
  const linkedin = dock.getByRole('link', { name: 'LinkedIn' })
  for (const app of await apps.all()) await expect(app).toHaveCSS('width', '52px')
  await linkedin.hover()
  await expect
    .poll(async () => (await linkedin.boundingBox())?.width)
    .toBeCloseTo(78, 0)
  for (const index of [0, 2]) {
    await expect
      .poll(async () => (await apps.nth(index).boundingBox())?.width)
      .toBeGreaterThan(52)
  }
  await expect(linkedin.locator('.desktop-dock__tooltip')).toHaveCSS('opacity', '1')
  await page.mouse.move(10, 100)
  for (const app of await apps.all()) await expect(app).toHaveCSS('width', '52px')
  await expect(linkedin.locator('.desktop-dock__tooltip')).toHaveCSS('opacity', '0')
})

test('magnification stays stable under a stationary pointer and preserves the icon baseline @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  const apps = await dock.locator('[data-dock-app]').all()
  for (const active of apps) {
    await page.mouse.move(10, 100)
    for (const app of apps) await expect(app).toHaveCSS('width', '52px')
    const resting = await boundsFor(active)
    const pointer = {
      x: resting.x + resting.width / 2,
      y: resting.y + resting.height / 2,
    }
    await page.mouse.move(pointer.x, pointer.y)
    await expect.poll(async () => (await boundsFor(active)).width).toBeGreaterThan(74)
    // Wait for the spring to settle, then repeatedly deliver the same pointer
    // position. Animated icon bounds must not feed back into the size calculation.
    await expect
      .poll(() =>
        active.evaluate(async (element) => {
          const before = element.getBoundingClientRect()
          for (let frame = 0; frame < 4; frame += 1) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
          }
          const after = element.getBoundingClientRect()
          return Math.max(
            Math.abs(after.width - before.width),
            Math.abs(after.x - before.x)
          )
        })
      )
      .toBeLessThan(0.05)
    const settled = await Promise.all(apps.map(boundsFor))
    for (let repeat = 0; repeat < 5; repeat += 1) {
      await page.mouse.move(pointer.x, pointer.y)
      await page.evaluate(async () => {
        for (let frame = 0; frame < 3; frame += 1) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
        }
      })
      const current = await Promise.all(apps.map(boundsFor))
      for (const [index, bounds] of current.entries()) {
        expect(bounds.width).toBeLessThanOrEqual(78.5)
        expect(bounds.y + bounds.height).toBeCloseTo(resting.y + resting.height, 0)
        for (const dimension of ['x', 'y', 'width', 'height'] as const) {
          expect(bounds[dimension]).toBeCloseTo(settled[index][dimension], 0)
        }
        if (index > 0) {
          expect(bounds.x).toBeGreaterThanOrEqual(
            current[index - 1].x + current[index - 1].width
          )
        }
      }
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(page.viewportSize()!.width)
  }
})

test('the minimized preview magnifies without stretching its thumbnail or app badge @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  await dock.getByRole('button', { name: 'Terminal', exact: true }).click()
  await page.getByRole('button', { name: 'Minimize terminal' }).click()
  await page.mouse.move(10, 100)
  const preview = dock.getByRole('button', { name: 'Restore terminal' })
  await expect(preview).toHaveCSS('width', '52px')
  await expect(preview).toHaveCSS('height', '52px')

  // Record before moving the real pointer so the first spring frames are covered.
  const recording = await preview.evaluateHandle((element) => {
    const frames: { width: number; height: number }[] = []
    const record = () => {
      const { width, height } = element.getBoundingClientRect()
      frames.push({ width, height })
    }
    const state = { frames, record, stopped: false }
    const sample = () => {
      record()
      if (!state.stopped) requestAnimationFrame(sample)
    }
    sample()
    return state
  })
  await preview.hover()
  await expect.poll(async () => (await boundsFor(preview)).width).toBeGreaterThan(74)
  const frames = await recording.evaluate((state) => {
    state.stopped = true
    state.record()
    return state.frames
  })
  await recording.dispose()
  expect(frames.length).toBeGreaterThan(1)
  expect(Math.max(...frames.map((frame) => frame.width))).toBeGreaterThan(74)
  for (const frame of frames) {
    expect(Math.abs(frame.width - frame.height)).toBeLessThan(0.5)
  }
})

test('arrow keys move through apps and Enter opens Terminal @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  const github = dock.getByRole('link', { name: 'GitHub' })
  const linkedin = dock.getByRole('link', { name: 'LinkedIn' })
  const terminal = dock.getByRole('button', { name: 'Terminal', exact: true })
  await github.focus()
  await page.keyboard.press('Tab')
  await expect(linkedin).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(github).toBeFocused()
  await github.press('ArrowRight')
  await expect(linkedin).toBeFocused()
  await linkedin.press('End')
  await expect(terminal).toBeFocused()
  await terminal.press('ArrowRight')
  await expect(github).toBeFocused()
  await github.press('ArrowLeft')
  await expect(terminal).toBeFocused()
  await terminal.press('Home')
  await expect(github).toBeFocused()
  await github.press('End')
  await terminal.press('Enter')
  await expect(
    page.getByRole('textbox', { name: 'Terminal command input' })
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(terminal).toBeFocused()
})

test('profile app menus open by pointer or keyboard and dismiss without launching an app @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  for (const label of ['GitHub', 'LinkedIn']) {
    const app = dock.getByRole('link', { name: label, exact: true })
    await app.click({ button: 'right' })
    const menu = page.getByRole('menu', { name: `${label} actions` })
    await expect(menu).toBeVisible()
    await expect(menu).toHaveCSS('border-radius', '14px')
    await expect(menu).toHaveCSS('backdrop-filter', 'blur(24px) saturate(1.5)')
    await expect(menu.getByRole('menuitem')).toHaveCount(1)
    await expect(
      menu.getByRole('menuitem', { name: 'Open', exact: true })
    ).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(app).toBeFocused()
    await app.press('ArrowUp')
    await expect(menu).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await app.click({ modifiers: ['Control'] })
    await expect(menu).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await app.press('Shift+F10')
    await expect(menu).toBeVisible()
    await page.mouse.click(10, 300)
    await expect(menu).toHaveCount(0)
  }
  await expect(page.getByRole('dialog', { name: 'Terminal' })).toHaveCount(0)
})

test('pressing a Dock icon dims only the tile and holding opens its menu without launching @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  const terminal = dock.getByRole('button', { name: 'Terminal', exact: true })
  const icon = terminal.locator('.desktop-dock__icon')
  const tooltip = terminal.locator('.desktop-dock__tooltip')
  await terminal.hover()
  await expect(tooltip).toHaveCSS('opacity', '1')
  await expect(tooltip).toHaveCSS('border-radius', '999px')
  await expect(tooltip).toHaveCSS('backdrop-filter', 'blur(24px) saturate(1.5)')

  await page.mouse.down()
  await expect(terminal).toHaveAttribute('data-pressed', 'true')
  await expect(icon).toHaveCSS('filter', 'brightness(0.75)')
  await expect(tooltip).toHaveCSS('filter', 'none')

  const menu = page.getByRole('menu', { name: 'Terminal actions', exact: true })
  await expect(menu).toBeVisible()
  await expect(terminal).not.toHaveAttribute('data-pressed')
  await page.mouse.up()
  await expect(page.getByRole('dialog', { name: 'Terminal' })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
})

test('Terminal menus open, restore and quit the app with keyboard navigation @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  const terminal = dock.getByRole('button', { name: 'Terminal', exact: true })
  const menu = page.getByRole('menu', { name: 'Terminal actions', exact: true })
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  await terminal.click({ button: 'right' })
  await expect(menu.getByRole('menuitem', { name: 'Open', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(menu).toHaveCount(0)
  await expect(input).toBeFocused()
  await input.fill('pwd')
  await input.press('Enter')
  await input.fill('unfinished command')

  await terminal.focus()
  await terminal.press('Shift+F10')
  const show = menu.getByRole('menuitem', { name: 'Show', exact: true })
  const quit = menu.getByRole('menuitem', { name: 'Quit', exact: true })
  await expect(menu.getByRole('menuitem')).toHaveCount(2)
  await expect(show).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(quit).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(show).toBeFocused()
  await page.keyboard.press('End')
  await expect(quit).toBeFocused()
  await page.keyboard.press('Home')
  await expect(show).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
  await expect(terminal).toBeFocused()
  await expect(dialog).toBeVisible()

  await page.getByRole('button', { name: 'Minimize terminal' }).click()
  const preview = dock.getByRole('button', { name: 'Restore terminal' })
  await expect(preview).toBeFocused()
  await preview.press('Shift+F10')
  const previewMenu = page.getByRole('menu', { name: 'Terminal actions', exact: true })
  await expect(
    previewMenu.getByRole('menuitem', { name: 'Open', exact: true })
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(previewMenu).toHaveCount(0)
  await expect(input).toBeFocused()
  await expect(input).toHaveValue('unfinished command')

  await page.getByRole('button', { name: 'Minimize terminal' }).click()
  await terminal.focus()
  await terminal.press('ContextMenu')
  await show.click()
  await expect(input).toBeFocused()
  await expect(input).toHaveValue('unfinished command')
  await expect(page.getByRole('log', { name: 'Terminal output' })).toContainText(
    '% pwd'
  )
  await expect(preview).toHaveCount(0)

  await terminal.click({ button: 'right' })
  await quit.click()
  await expect(menu).toHaveCount(0)
  await expect(dialog).toHaveCount(0)
  await expect(preview).toHaveCount(0)
  await expect(terminal).toHaveAttribute('data-running', 'false')
  await expect(terminal).toBeFocused()
})

test('Tab dismisses app menus and continues through the Dock in either direction @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  const github = dock.getByRole('link', { name: 'GitHub', exact: true })
  const linkedin = dock.getByRole('link', { name: 'LinkedIn', exact: true })
  await github.focus()
  await github.press('Shift+F10')
  await expect(page.getByRole('menu', { name: 'GitHub actions' })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(linkedin).toBeFocused()
  await linkedin.press('Shift+F10')
  await expect(page.getByRole('menu', { name: 'LinkedIn actions' })).toBeVisible()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(github).toBeFocused()
})

test('the minimized preview and running app both restore the same Terminal session @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  const terminal = dock.getByRole('button', { name: 'Terminal', exact: true })
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  await terminal.click()
  await input.fill('pwd')
  await input.press('Enter')
  await input.fill('unfinished command')
  for (const restoreViaPreview of [true, false]) {
    await page.getByRole('button', { name: 'Minimize terminal' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(terminal).toHaveAttribute('data-running', 'true')
    await expect(terminal.locator('.desktop-dock__running')).toBeVisible()
    const preview = dock.getByRole('button', { name: 'Restore terminal' })
    await expect(preview).toBeFocused()
    const badgeIcon = preview.locator('.desktop-dock__badge svg')
    await expect(badgeIcon).toBeVisible()
    await expect(badgeIcon).toHaveAttribute('aria-hidden', 'true')
    await expect(badgeIcon).toHaveAttribute('focusable', 'false')
    await expect(preview.locator('img')).toHaveCount(0)
    await (restoreViaPreview ? preview : terminal).click()
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('unfinished command')
    await expect(page.getByRole('log', { name: 'Terminal output' })).toContainText(
      '% pwd'
    )
    await expect(preview).toHaveCount(0)
  }
  await page.getByRole('button', { name: 'Close terminal' }).click()
  await expect(terminal).toBeFocused()
  await expect(terminal).toHaveAttribute('data-running', 'false')
})

test('reduced motion disables magnification and bounce while retaining labels @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  const linkedin = dock.getByRole('link', { name: 'LinkedIn' })
  await linkedin.hover()
  await expect(linkedin.locator('.desktop-dock__tooltip')).toHaveCSS('opacity', '1')
  for (const app of await dock.locator('[data-dock-app]').all())
    await expect(app).toHaveCSS('width', '52px')
  const terminal = dock.getByRole('button', { name: 'Terminal', exact: true })
  await terminal.click()
  await expect(page.getByRole('dialog', { name: 'Terminal' })).toBeVisible()
  await expect(terminal.locator('.desktop-dock__launch')).toHaveCSS('transform', 'none')
})

test('the glass Dock stays centered in both themes and while scrolling @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/')
  const tray = page.getByRole('toolbar', { name: 'Dock apps' })
  const glass = tray.locator('.desktop-dock__glass')
  const before = await tray.boundingBox()
  const viewport = page.viewportSize()
  if (!before || !viewport) throw new Error('Missing Dock bounds')
  expect(before.x + before.width / 2).toBeCloseTo(viewport.width / 2, 0)
  expect(viewport.height - before.y - before.height).toBeCloseTo(8, 0)
  expect(before.height).toBeCloseTo(76, 0)
  await expect(glass).toHaveCSS('backdrop-filter', 'blur(28px) saturate(1.8)')
  const lightGlass = await glass.evaluate(
    (element) => getComputedStyle(element).backgroundColor
  )
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await expect
    .poll(() => glass.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe(lightGlass)
  await page.locator('#education').scrollIntoViewIfNeeded()
  await expect.poll(() => tray.boundingBox()).toEqual(before)
})

test('full-screen auto-hide reveals the Dock at the bottom edge and on keyboard focus @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  await dock.getByRole('button', { name: 'Terminal', exact: true }).click()
  await page.getByRole('button', { name: 'Enter full screen' }).click()
  const position = page.locator('.desktop-dock-position')
  await expect(position).toHaveAttribute('data-auto-hidden', 'true')
  await expect(dock).not.toBeInViewport()
  const viewport = page.viewportSize()!
  await page.mouse.move(viewport.width / 2, viewport.height - 1)
  await expect(dock).toBeInViewport()
  await page.mouse.move(100, 100)
  await expect(dock).not.toBeInViewport()
  await dock.getByRole('link', { name: 'GitHub' }).focus()
  await expect(dock).toBeInViewport()
})

test('the Dock stays visible and centered when scrolling to the footer @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  const position = page.locator('.desktop-dock-position')
  await expect(dock).toBeInViewport()
  await expect(position).toHaveAttribute('data-auto-hidden', 'false')
  const before = await boundsFor(dock)

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect(page.getByRole('contentinfo')).toBeInViewport()
  await expect(position).toHaveAttribute('data-auto-hidden', 'false')
  await expect(dock).toBeInViewport()
  await expect.poll(() => dock.boundingBox()).toEqual(before)

  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(position).toHaveAttribute('data-auto-hidden', 'false')
  await expect(dock).toBeInViewport()
})

test('the Dock fits narrow phones, launches by touch, and restores minimized Terminal @mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  const terminal = dock.getByRole('button', { name: 'Terminal', exact: true })
  await expect(dock).toBeInViewport()
  await terminal.tap()
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  await expect(input).toBeFocused()
  await page.getByRole('button', { name: 'Minimize terminal' }).tap()
  const preview = dock.getByRole('button', { name: 'Restore terminal' })
  await expect(preview).toBeInViewport()
  await expect(terminal).toHaveCSS('width', '52px')
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  ).toBe(true)
  await preview.tap()
  await expect(input).toBeFocused()
})

test('app menus stay inside a narrow viewport at both ends of the Dock @mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  await dock.getByRole('button', { name: 'Terminal', exact: true }).tap()
  await page.getByRole('button', { name: 'Minimize terminal' }).tap()
  const apps = [
    dock.getByRole('link', { name: 'GitHub', exact: true }),
    dock.getByRole('button', { name: 'Restore terminal', exact: true }),
  ]
  for (const app of apps) {
    await app.focus()
    await app.press('Shift+F10')
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await expect
      .poll(async () => {
        const bounds = await boundsFor(menu)
        return bounds.x >= 11.5 && bounds.x + bounds.width <= 308.5
      })
      .toBe(true)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(320)
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(app).toBeFocused()
  }
})
