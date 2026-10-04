import { expect, test } from './fixtures'

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

    const colors = await screen.evaluate((element) => {
      const style = getComputedStyle(element)
      return { background: style.backgroundColor, text: style.color }
    })
    const background = readColor(colors.background)
    const foreground = readColor(colors.text)
    expect(background.alpha).toBe(1)
    expect(foreground.alpha).toBe(1)
    const contrast =
      (Math.max(background.luminance, foreground.luminance) + 0.05) /
      (Math.min(background.luminance, foreground.luminance) + 0.05)
    expect(contrast).toBeGreaterThanOrEqual(7)
    await expect(input).toHaveCSS('color', colors.text)

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
    await expect(menu).toHaveCSS('backdrop-filter', /blur\(/u)
    await expect(input).toBeFocused()
    await testInfo.attach(`terminal-${theme}-hover-menu`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
    await testInfo.attach(`terminal-${theme}-window`, {
      body: await dialog.screenshot(),
      contentType: 'image/png',
    })
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
