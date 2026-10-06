import { expect, test } from './fixtures'

import type { Locator } from '@playwright/test'

function readMaterial(element: Element, pseudo: string | null = null) {
  const style = getComputedStyle(element, pseudo)
  // Normalize rgb() and oklab() through the browser's color conversion so the
  // actual surfaces can be compared regardless of their CSS color notation.
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas color conversion is unavailable')
  context.fillStyle = style.backgroundColor
  context.fillRect(0, 0, 1, 1)
  return {
    background: Array.from(context.getImageData(0, 0, 1, 1).data),
    blur: style.backdropFilter,
    sheen: style.backgroundImage,
  }
}

async function expectGlassChrome(surface: Locator, pseudo: string | null = null) {
  const material = await surface.evaluate(readMaterial, pseudo)
  expect(material.background[3]).toBeGreaterThan(0)
  expect(material.background[3]).toBeLessThan(255)
  expect(material.blur).toMatch(/blur\(/u)
  const details = await surface.evaluate((element, selector) => {
    const style = getComputedStyle(element, selector)
    return {
      radius: parseFloat(style.borderTopLeftRadius),
    }
  }, pseudo)
  expect(material.sheen).toMatch(/gradient\(/u)
  expect(details.radius).toBeGreaterThan(0)
  expect(details.radius).toBeLessThanOrEqual(24)
  await expect(surface).toHaveCSS('opacity', '1')
  expect(
    readColor(await surface.evaluate((element) => getComputedStyle(element).color))
      .alpha
  ).toBe(1)
  return material
}

async function expectSolidChrome(surface: Locator, pseudo: string | null = null) {
  const material = await surface.evaluate(readMaterial, pseudo)
  expect(material.background[3]).toBe(255)
  expect(material.blur).toBe('none')
  expect(
    await surface.evaluate(
      (element, selector) => getComputedStyle(element, selector).backgroundImage,
      pseudo
    )
  ).toBe('none')
}

function readColor(value: string) {
  const components = value.match(/[\d.]+/gu)?.map(Number)
  if (!components || components.length < 3) {
    throw new Error(`Cannot read computed color: ${value}`)
  }
  const [red = 0, green = 0, blue = 0, alpha = 1] = components
  const linear = [red, green, blue].map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4
  })
  const [r = 0, g = 0, b = 0] = linear
  return { alpha, luminance: 0.2126 * r + 0.7152 * g + 0.0722 * b }
}

for (const theme of ['light', 'dark'] as const) {
  test(`${theme} terminal keeps glass chrome, readable content, and native control states @desktop`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
    await page.goto('/')
    if (theme === 'dark') {
      await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    }
    await page.evaluate(() => window.scrollTo(0, 200))
    const opener = page.getByRole('button', { name: 'Terminal', exact: true })
    await opener.click()
    const dialog = page.getByRole('dialog', { name: 'Terminal' })
    const input = page.getByRole('textbox', { name: 'Terminal command input' })
    const titlebar = page.getByTestId('terminal-titlebar')
    const screen = page.locator('.terminal-screen')
    const dots = page.locator('.terminal-window-control-dot')
    const glyphs = page.locator('.terminal-window-control__glyph')
    await expect(dialog).toHaveAttribute('data-theme', theme)
    await expect(input).toBeFocused()
    await expect(dialog).toHaveAttribute('data-active', 'true')
    await expect(dialog).toHaveCSS('backdrop-filter', 'none')
    await expect(dialog).toHaveCSS('filter', 'none')
    const frameRadius = parseFloat(
      await dialog.evaluate((element) => getComputedStyle(element).borderTopLeftRadius)
    )
    expect(frameRadius).toBeGreaterThan(0)
    expect(frameRadius).toBeLessThanOrEqual(24)
    // Keep the titlebar out of the menu's backdrop chain so its glass can blur
    // the terminal content underneath independently of the titlebar material.
    await expect(titlebar).toHaveCSS('backdrop-filter', 'none')
    await expect
      .poll(async () =>
        titlebar.evaluate(
          (element) => getComputedStyle(element, '::before').backdropFilter
        )
      )
      .toMatch(/blur\(/u)
    const titlebarMaterial = await expectGlassChrome(titlebar, '::before')
    // A shared strength keeps light and dark glass equally translucent. Allow
    // one channel of rounding when converting CSS colors to 8-bit canvas data.
    expect(Math.abs(titlebarMaterial.background[3]! - 255 * 0.65)).toBeLessThanOrEqual(
      1
    )
    await expect(screen).toHaveCSS('backdrop-filter', 'blur(24px)')
    const screenMaterial = await screen.evaluate(readMaterial)
    expect(Math.abs(screenMaterial.background[3]! - 255 * 0.7)).toBeLessThanOrEqual(1)
    // Only the background is translucent: output and input stay fully opaque.
    // Readability is also checked by WCAG scans and saved rendered previews;
    // treating a translucent color as an opaque background gives a false ratio.
    const textColor = await screen.evaluate(
      (element) => getComputedStyle(element).color
    )
    expect(readColor(textColor).alpha).toBe(1)
    await expect(screen).toHaveCSS('opacity', '1')
    await expect(page.getByRole('log', { name: 'Terminal output' })).toHaveCSS(
      'opacity',
      '1'
    )
    await expect(input).toHaveCSS('color', textColor)
    await expect(input).toHaveCSS('opacity', '1')
    await expect(input).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')

    for (const [name, capture] of [
      ['page', (path: string) => page.screenshot({ path, fullPage: true })],
      ['window', (path: string) => dialog.screenshot({ path })],
    ] as const) {
      const previewPath = testInfo.outputPath(`terminal-${theme}-glass-${name}.png`)
      await capture(previewPath)
      await testInfo.attach(`terminal-${theme}-glass-${name}`, {
        path: previewPath,
        contentType: 'image/png',
      })
    }

    const activeColors = await dots.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).backgroundColor)
    )
    expect(new Set(activeColors).size).toBe(3)
    for (const glyph of await glyphs.all()) {
      await expect(glyph).toHaveCSS('opacity', '0')
    }

    await opener.focus()
    await expect(dialog).toHaveAttribute('data-active', 'false')
    await expect
      .poll(async () =>
        dots.evaluateAll(
          (elements) =>
            new Set(
              elements.map((element) => getComputedStyle(element).backgroundColor)
            ).size
        )
      )
      .toBe(1)
    await page.getByRole('button', { name: 'Close terminal' }).hover()
    await expect(dialog).toHaveAttribute('data-active', 'false')
    await expect
      .poll(async () =>
        dots.evaluateAll((elements) =>
          elements.map((element) => getComputedStyle(element).backgroundColor)
        )
      )
      .toEqual(activeColors)
    for (const glyph of await glyphs.all()) {
      await expect(glyph).toHaveCSS('opacity', '1')
    }

    await input.click()
    await expect(dialog).toHaveAttribute('data-active', 'true')
    await page.getByRole('button', { name: 'Enter full screen' }).hover()
    const menu = page.getByRole('menu', { name: 'Window arrangement' })
    await expect(menu).toBeVisible()
    expect(await expectGlassChrome(menu)).toEqual(titlebarMaterial)
    const filteredAncestors = await menu.evaluate((element) => {
      const filtered: string[] = []
      for (
        let ancestor = element.parentElement;
        ancestor;
        ancestor = ancestor.parentElement
      ) {
        const style = getComputedStyle(ancestor)
        if (style.backdropFilter !== 'none' || style.filter !== 'none') {
          filtered.push(ancestor.className)
        }
      }
      return filtered
    })
    expect(filteredAncestors).toEqual([])
    for (const item of await menu.getByRole('menuitem').all()) {
      await expect(item).toBeInViewport({ ratio: 1 })
      await expect(item).toHaveCSS('opacity', '1')
      expect(
        readColor(await item.evaluate((element) => getComputedStyle(element).color))
          .alpha
      ).toBe(1)
    }
    await expect(input).toBeFocused()
    const menuPreview = testInfo.outputPath(`terminal-${theme}-hover-menu.png`)
    await dialog.screenshot({ path: menuPreview })
    await testInfo.attach(`terminal-${theme}-hover-menu`, {
      path: menuPreview,
      contentType: 'image/png',
    })

    await page.getByRole('button', { name: 'Minimize terminal' }).click()
    const dock = page.getByRole('button', { name: 'Restore terminal' })
    await expect(dock).toBeFocused()
    expect(await expectGlassChrome(dock)).toEqual(titlebarMaterial)
    const dockPreview = testInfo.outputPath(`terminal-${theme}-glass-dock.png`)
    await dock.screenshot({ path: dockPreview })
    await testInfo.attach(`terminal-${theme}-glass-dock`, {
      path: dockPreview,
      contentType: 'image/png',
    })
    await dock.click()
    await expect(input).toBeFocused()

    // Changing the theme while the window is open changes its tint, without
    // changing how strongly the page shows through the body or glass sheen.
    await input.fill('theme toggle')
    await input.press('Enter')
    await expect(dialog).toHaveAttribute(
      'data-theme',
      theme === 'light' ? 'dark' : 'light'
    )
    for (const [surface, pseudo, original] of [
      [screen, null, screenMaterial],
      [titlebar, '::before', titlebarMaterial],
    ] as const) {
      await expect
        .poll(async () =>
          (await surface.evaluate(readMaterial, pseudo)).background.slice(0, 3)
        )
        .not.toEqual(original.background.slice(0, 3))
      const switched = await surface.evaluate(readMaterial, pseudo)
      expect(
        Math.abs(switched.background[3]! - original.background[3]!)
      ).toBeLessThanOrEqual(1)
      expect(switched.blur).toBe(original.blur)
      expect(switched.sheen).toBe(original.sheen)
    }
    await input.fill(`theme ${theme}`)
    await input.press('Enter')
    await expect(dialog).toHaveAttribute('data-theme', theme)

    // Playwright's media helper does not yet expose reduced transparency.
    const session = await page.context().newCDPSession(page)
    await session.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-reduced-motion', value: 'reduce' },
        { name: 'prefers-reduced-transparency', value: 'reduce' },
      ],
    })
    expect(
      await page.evaluate(
        () => matchMedia('(prefers-reduced-transparency: reduce)').matches
      )
    ).toBe(true)
    await expect(screen).toHaveCSS('backdrop-filter', 'none')
    await expect(screen).toHaveCSS(
      'background-color',
      theme === 'dark' ? 'rgb(30, 30, 30)' : 'rgb(255, 255, 255)'
    )
    await expectSolidChrome(titlebar, '::before')
    await page.getByRole('button', { name: 'Enter full screen' }).press('ArrowDown')
    await expect(menu).toBeVisible()
    await expectSolidChrome(menu)
    await page.getByRole('button', { name: 'Minimize terminal' }).click()
    await expect(dock).toBeVisible()
    await expectSolidChrome(dock)
    await session.detach()
  })
}

for (const theme of ['light', 'dark'] as const) {
  test(`${theme} high-contrast controls retain outlines, symbols, and keyboard focus @desktop`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
    await page.goto('/')
    if (theme === 'dark') {
      await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    }
    await page.emulateMedia({ forcedColors: 'active', colorScheme: theme })
    await page.getByRole('button', { name: 'Terminal', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Terminal' })
    const input = page.getByRole('textbox', { name: 'Terminal command input' })
    const controls = page.getByRole('group', { name: 'Terminal window controls' })
    await expect(input).toBeFocused()
    await expect(dialog).toHaveAttribute('data-theme', theme)
    const screen = page.locator('.terminal-screen')
    await expect(screen).toHaveCSS('backdrop-filter', 'none')
    expect((await screen.evaluate(readMaterial)).background[3]).toBe(255)
    await expectSolidChrome(page.getByTestId('terminal-titlebar'), '::before')

    // Forced colors removes the normal glass shadows and colored fills. Keep
    // the circular edge and identifying symbol visible without hover or focus.
    for (const dot of await controls.locator('.terminal-window-control-dot').all()) {
      await expect(dot).toHaveCSS('outline-style', 'solid')
      await expect(dot).toHaveCSS('outline-width', '1px')
      await expect(dot).toHaveCSS('background-image', 'none')
      await expect(dot.locator('svg')).toHaveCSS('opacity', '1')
      const colors = await dot.evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          background: style.backgroundColor,
          edge: style.outlineColor,
          symbol: style.color,
        }
      })
      const background = readColor(colors.background).luminance
      for (const color of [colors.edge, colors.symbol]) {
        const foreground = readColor(color).luminance
        const contrast =
          (Math.max(background, foreground) + 0.05) /
          (Math.min(background, foreground) + 0.05)
        expect(contrast).toBeGreaterThanOrEqual(3)
      }
    }

    const green = page.getByRole('button', { name: 'Enter full screen' })
    await input.press('Shift+Tab')
    await expect(green).toBeFocused()
    await expect(green).toHaveCSS('outline-style', 'solid')
    await expect(green).toHaveCSS('outline-width', '2px')
    const dot = green.locator('.terminal-window-control-dot')
    await page.keyboard.down('Space')
    await expect(green).toHaveAttribute('data-pressed', 'true')
    await expect(dot).toHaveCSS('filter', 'none')
    const previewPath = testInfo.outputPath(`terminal-${theme}-forced-colors.png`)
    await dialog.screenshot({ path: previewPath })
    await testInfo.attach(`terminal-${theme}-forced-colors`, {
      path: previewPath,
      contentType: 'image/png',
    })
    await page.keyboard.up('Space')
    await expect(dialog).toHaveAttribute('data-window-mode', 'fullscreen')
    await page.getByRole('button', { name: 'Exit full screen' }).press('ArrowDown')
    const menu = page.getByRole('menu', { name: 'Window arrangement' })
    await expect(menu).toBeVisible()
    await expectSolidChrome(menu)
    await page.getByRole('button', { name: 'Minimize terminal' }).click()
    const dock = page.getByRole('button', { name: 'Restore terminal' })
    await expect(dock).toBeFocused()
    await expectSolidChrome(dock)
  })
}

test('keyboard menu selection stays visible and full screen removes every window corner @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Terminal', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  await expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
  const green = page.getByRole('button', { name: 'Enter full screen' })
  const originalRadius = await dialog.evaluate(
    (element) => getComputedStyle(element).borderTopLeftRadius
  )
  expect(parseFloat(originalRadius)).toBeGreaterThan(0)

  await green.focus()
  await green.press('ArrowDown')
  const menu = page.getByRole('menu', { name: 'Window arrangement' })
  const first = menu.getByRole('menuitem').first()
  const last = menu.getByRole('menuitem').last()
  await expect(first).toBeFocused()
  await expect
    .poll(
      async () =>
        readColor(
          await first.evaluate((element) => getComputedStyle(element).backgroundColor)
        ).alpha
    )
    .toBeGreaterThan(0)
  const selectedBackground = await first.evaluate(
    (element) => getComputedStyle(element).backgroundColor
  )
  const unselectedBackground = await last.evaluate(
    (element) => getComputedStyle(element).backgroundColor
  )
  expect(selectedBackground).not.toBe(unselectedBackground)
  await first.press('End')
  await expect(last).toBeFocused()
  await expect(last).toHaveCSS('background-color', selectedBackground)
  await expect(first).toHaveCSS('background-color', unselectedBackground)
  await last.press('Home')
  await first.press('Enter')

  await expect(dialog).toHaveAttribute('data-window-mode', 'fullscreen')
  for (const surface of [
    dialog,
    page.getByTestId('terminal-titlebar'),
    page.locator('.terminal-screen'),
  ]) {
    await expect(surface).toHaveCSS('border-radius', '0px')
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
  await expect(dialog).toHaveCSS('border-top-left-radius', originalRadius)
})

test('the glass arrangement menu fits a narrow mobile viewport without clipping items @mobile', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Terminal', exact: true }).click()
  await expect(
    page.getByRole('textbox', { name: 'Terminal command input' })
  ).toBeFocused()
  const viewport = { width: 320, height: 568 }
  await page.setViewportSize(viewport)
  const green = page.getByRole('button', { name: 'Enter full screen' })
  await green.focus()
  await green.press('ArrowDown')
  const menu = page.getByRole('menu', { name: 'Window arrangement' })
  await expect(menu).toBeVisible()
  const bounds = await menu.boundingBox()
  if (!bounds) throw new Error('Window arrangement menu bounds are unavailable')
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.y).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height)
  for (const item of await menu.getByRole('menuitem').all()) {
    await expect(item).toBeInViewport({ ratio: 1 })
    expect(
      await item.evaluate((element) => element.scrollWidth <= element.clientWidth)
    ).toBe(true)
  }
  await expect(menu.getByRole('menuitem').first()).toBeFocused()
  await testInfo.attach('terminal-narrow-mobile-menu', {
    body: await page.screenshot(),
    contentType: 'image/png',
  })
})
