import { expect, test } from './fixtures'

const terminalAsset = /\/assets\/terminal-[^/]+\.js$/u

test('terminal can be dismissed while downloading without reopening later @desktop', async ({
  page,
}) => {
  let releaseDownload!: () => void
  const downloadGate = new Promise<void>((resolve) => {
    releaseDownload = resolve
  })
  await page.route(terminalAsset, async (route) => {
    await downloadGate
    await route.continue()
  })
  await page.goto('/')
  const opener = page.getByRole('button', { name: 'Terminal', exact: true })
  await opener.click()
  await expect(page.getByRole('status')).toHaveText('Loading terminal…')
  await page.keyboard.press('Escape')
  await expect(opener).toBeFocused()
  const loaded = page.waitForResponse(terminalAsset)
  releaseDownload()
  await loaded
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await opener.click()
  await expect(
    page.getByRole('textbox', { name: 'Terminal command input' })
  ).toBeFocused()
})

test.describe('terminal download recovery', () => {
  test.use({ expectedAssetFailures: [terminalAsset] })

  test('a failed download keeps the page usable and offers retry and reload @desktop', async ({
    page,
  }) => {
    let failures = 0
    await page.route(terminalAsset, async (route) => {
      failures += 1
      await route.abort('failed')
    })
    await page.goto('/')
    const opener = page.getByRole('button', { name: 'Terminal', exact: true })
    await opener.click()
    await expect(page.getByRole('alert')).toContainText('could not load')
    expect(failures).toBe(1)
    await expect(page.getByRole('main')).toBeVisible()
    await page.getByRole('button', { name: 'Retry', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('could not load')
    await page.getByRole('button', { name: 'Close terminal' }).click()
    await expect(opener).toBeFocused()
    await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/u)
    await opener.click()
    await expect(page.getByRole('alert')).toBeVisible()
    await page.unroute(terminalAsset)
    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', { name: 'Reload page' }).click(),
    ])
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await opener.click()
    await expect(
      page.getByRole('textbox', { name: 'Terminal command input' })
    ).toBeFocused()
    await expect(page.locator('html')).toHaveClass(/dark/u)
  })
})

test('terminal drag stays within the viewport and Escape restores its opener @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const opener = page.getByRole('button', { name: 'Terminal', exact: true })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  await expect(
    page.getByRole('textbox', { name: 'Terminal command input' })
  ).toBeFocused()
  const titleBar = page.getByTestId('terminal-titlebar')
  const before = await dialog.boundingBox()
  const handle = await titleBar.boundingBox()
  if (!before || !handle) throw new Error('Terminal bounds are unavailable')
  const x = handle.x + handle.width / 2
  const y = handle.y + handle.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 90, y + 60, { steps: 10 })
  await page.mouse.up()
  await expect
    .poll(async () => (await dialog.boundingBox())?.x)
    .toBeGreaterThan(before.x + 30)
  const after = await dialog.boundingBox()
  const viewport = page.viewportSize()
  if (!after || !viewport) throw new Error('Terminal bounds are unavailable')
  expect(after.x).toBeGreaterThanOrEqual(0)
  expect(after.x + after.width).toBeLessThanOrEqual(viewport.width)
  expect(after.y + after.height).toBeLessThanOrEqual(viewport.height)
  await page.keyboard.press('Escape')
  await expect(opener).toBeFocused()
  await expect(dialog).toHaveCount(0)
})

test('all traffic-light symbols appear together on hover and minimize preserves the session @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Terminal', exact: true }).click()
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  const output = page.getByRole('log', { name: 'Terminal output' })
  await input.fill('pwd')
  await input.press('Enter')
  await input.fill('unfinished command')

  const glyphs = page.locator('.terminal-window-control__glyph')
  await expect(glyphs).toHaveCount(3)
  for (const glyph of await glyphs.all()) {
    await expect(glyph).toHaveCSS('opacity', '0')
  }
  await page.getByRole('button', { name: 'Close terminal' }).hover()
  for (const glyph of await glyphs.all()) {
    await expect(glyph).toHaveCSS('opacity', '1')
  }
  await input.hover()
  for (const glyph of await glyphs.all()) {
    await expect(glyph).toHaveCSS('opacity', '0')
  }

  await page.getByRole('button', { name: 'Minimize terminal' }).click()
  await expect(page.getByRole('dialog', { name: 'Terminal' })).toHaveCount(0)
  const restore = page.getByRole('button', { name: 'Restore terminal' })
  await expect(restore).toBeFocused()
  await restore.click()
  await expect(input).toBeFocused()
  await expect(input).toHaveValue('unfinished command')
  await expect(output).toContainText('~/stack % pwd')
})

test('minimize and restore preserve the editing caret @desktop', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Terminal', exact: true }).click()
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  await input.fill('abcdef')
  await input.press('Home')
  await input.press('ArrowRight')
  await input.press('ArrowRight')

  await page.getByRole('button', { name: 'Minimize terminal' }).click()
  await page.getByRole('button', { name: 'Restore terminal' }).click()
  await expect(input).toBeFocused()
  await input.press('X')

  await expect(input).toHaveValue('abXcdef')
  await expect(page.locator('.terminal-caret-prefix')).toHaveText('abX')
})

test('minimize and restore preserve the scrollback position @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Terminal', exact: true }).click()
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  const screen = page.locator('.terminal-screen')
  for (let index = 0; index < 4; index += 1) {
    await input.fill('help')
    await input.press('Enter')
  }
  await expect
    .poll(async () => screen.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
  await screen.evaluate((element) => {
    element.scrollTop = 0
  })

  await page.getByRole('button', { name: 'Minimize terminal' }).click()
  await page.getByRole('button', { name: 'Restore terminal' }).click()

  await expect(input).toBeFocused()
  await expect.poll(async () => screen.evaluate((element) => element.scrollTop)).toBe(0)
  await expect(page.getByRole('log')).toContainText("Type 'help' to explore commands.")
})

test('title-bar zoom survives a full-screen round trip and restores the original bounds @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Terminal', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  await expect(input).toBeFocused()
  const initialBounds = await dialog.boundingBox()
  const viewport = page.viewportSize()
  if (!initialBounds || !viewport) throw new Error('Terminal bounds are unavailable')
  await input.fill('saved draft')

  await page.getByTestId('terminal-titlebar').dblclick()
  await expect(dialog).toHaveAttribute('data-window-mode', 'zoomed')
  const zoomedBounds = {
    x: 12,
    y: 12,
    width: viewport.width - 24,
    height: viewport.height - 24,
  }
  await expect.poll(async () => await dialog.boundingBox()).toEqual(zoomedBounds)

  await page.getByRole('button', { name: 'Enter full screen' }).click()
  await expect(dialog).toHaveAttribute('data-window-mode', 'fullscreen')
  await expect
    .poll(async () => await dialog.boundingBox())
    .toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height })
  await expect(input).toHaveValue('saved draft')

  await page.getByTestId('terminal-titlebar').dblclick()
  await expect(dialog).toHaveAttribute('data-window-mode', 'fullscreen')
  await page.getByRole('button', { name: 'Exit full screen' }).click()
  await expect(dialog).toHaveAttribute('data-window-mode', 'zoomed')
  await expect.poll(async () => await dialog.boundingBox()).toEqual(zoomedBounds)

  await page.getByTestId('terminal-titlebar').dblclick()
  await expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
  await expect.poll(async () => await dialog.boundingBox()).toEqual(initialBounds)

  const resize = page.getByRole('button', { name: 'Resize terminal' })
  await resize.focus()
  await resize.press('ArrowRight')
  await resize.press('ArrowDown')
  await expect
    .poll(async () => (await dialog.boundingBox())?.width)
    .toBeGreaterThan(initialBounds.width)
  await expect
    .poll(async () => (await dialog.boundingBox())?.height)
    .toBeGreaterThan(initialBounds.height)
})

test('an open terminal remains usable when the viewport becomes narrow @mobile', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const mobileViewport = page.viewportSize()
  if (!mobileViewport) throw new Error('Mobile viewport is unavailable')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Terminal', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  await expect(input).toBeFocused()
  await page.setViewportSize(mobileViewport)

  await expect
    .poll(async () => {
      const bounds = await dialog.boundingBox()
      return Boolean(
        bounds &&
        bounds.x >= 0 &&
        bounds.y >= 0 &&
        bounds.x + bounds.width <= mobileViewport.width &&
        bounds.y + bounds.height <= mobileViewport.height
      )
    })
    .toBe(true)
  await input.fill('pwd')
  await input.press('Enter')
  await expect(page.getByRole('log', { name: 'Terminal output' })).toContainText(
    '~/stack % pwd'
  )
  await expect(input).toBeInViewport()
  await expect(page.getByRole('button', { name: 'Close terminal' })).toBeInViewport()
  await expect(page.getByRole('button', { name: 'Minimize terminal' })).toBeInViewport()
  await expect(page.getByRole('button', { name: 'Enter full screen' })).toBeInViewport()
})

test('the delayed green-button menu tiles the window and keeps the prompt usable @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Terminal', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('Viewport is unavailable')
  await input.fill('saved draft')
  await page.getByRole('button', { name: 'Enter full screen' }).hover()
  await expect(page.getByRole('menu', { name: 'Window arrangement' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Tile Window to Left of Screen' }).click()
  await expect(dialog).toHaveAttribute('data-window-mode', 'left')
  await expect
    .poll(async () => (await dialog.boundingBox())?.x)
    .toBeGreaterThanOrEqual(0)
  await expect
    .poll(async () => {
      const bounds = await dialog.boundingBox()
      return bounds ? bounds.x + bounds.width : undefined
    })
    .toBeLessThanOrEqual(viewport.width / 2)
  await expect(input).toHaveValue('saved draft')
  await expect(input).toBeInViewport()

  const green = page.getByRole('button', { name: /full screen/u })
  await green.focus()
  await green.press('ArrowDown')
  await page.getByRole('menuitem', { name: 'Tile Window to Right of Screen' }).click()
  await expect(dialog).toHaveAttribute('data-window-mode', 'right')
  await expect
    .poll(async () => (await dialog.boundingBox())?.x)
    .toBeGreaterThanOrEqual(viewport.width / 2)
  await expect
    .poll(async () => {
      const bounds = await dialog.boundingBox()
      return bounds ? bounds.x + bounds.width : undefined
    })
    .toBeLessThanOrEqual(viewport.width)
  const rightBounds = await dialog.boundingBox()
  if (!rightBounds) throw new Error('Terminal bounds are unavailable')
  await expect(input).toHaveValue('saved draft')
  await expect(input).toBeInViewport()

  await page.getByRole('button', { name: 'Enter full screen' }).click()
  await expect(dialog).toHaveAttribute('data-window-mode', 'fullscreen')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveAttribute('data-window-mode', 'right')
  await expect.poll(async () => await dialog.boundingBox()).toEqual(rightBounds)
  await expect(input).toHaveValue('saved draft')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
})

test('the block caret follows Unicode and horizontally scrolled drafts @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Terminal', exact: true }).click()
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  const prefix = page.locator('.terminal-caret-prefix')

  for (const draft of ['你好🙂help', '你好🙂help'.repeat(30)]) {
    await input.fill(draft)
    await input.press('End')
    await expect(prefix).toHaveText(draft)
    await expect
      .poll(async () =>
        page.locator('.terminal-input-wrap').evaluate((wrapper) => {
          const inputBounds = wrapper.querySelector('input')?.getBoundingClientRect()
          const prefixBounds = wrapper
            .querySelector('.terminal-caret-prefix')
            ?.getBoundingClientRect()
          const cursorBounds = wrapper
            .querySelector('.terminal-cursor')
            ?.getBoundingClientRect()
          return Boolean(
            inputBounds &&
            prefixBounds &&
            cursorBounds &&
            Math.abs(cursorBounds.left - prefixBounds.right) < 1 &&
            cursorBounds.left >= inputBounds.left &&
            cursorBounds.right <= inputBounds.right + 1
          )
        })
      )
      .toBe(true)
  }
  await expect
    .poll(async () => input.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0)
})

test('the dark terminal retains readable prompt, input, and title colors @desktop', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await page.getByRole('button', { name: 'Terminal', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Terminal' })).toHaveAttribute(
    'data-theme',
    'dark'
  )
  await expect(page.locator('.terminal-prompt')).toHaveCSS(
    'color',
    'rgb(240, 240, 240)'
  )
  await expect(page.getByRole('textbox', { name: 'Terminal command input' })).toHaveCSS(
    'color',
    'rgb(240, 240, 240)'
  )
  await expect(page.locator('.terminal-title')).toHaveCSS('color', 'rgb(222, 222, 222)')
})

test('Escape dismisses the hover-opened green menu while preserving input focus @desktop', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Terminal', exact: true }).click()
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  const menu = page.getByRole('menu', { name: 'Window arrangement' })
  await page.getByRole('button', { name: 'Enter full screen' }).hover()
  await expect(menu).toBeVisible()
  await expect(input).toBeFocused()

  await page.keyboard.press('Escape')

  await expect(menu).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: 'Terminal' })).toBeVisible()
  await expect(input).toBeFocused()
})
