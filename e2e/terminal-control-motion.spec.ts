import { expect, test } from './fixtures'

const controlNames = [
  'Close terminal',
  'Minimize terminal',
  'Enter full screen',
] as const

test('traffic lights magnify the hovered dot and expand further on press without moving their targets @desktop', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await page
    .getByRole('banner')
    .getByRole('button', { name: 'Terminal', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  const controls = page.getByRole('group', { name: 'Terminal window controls' })
  const dots = page.locator('.terminal-window-control-dot')
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  await expect(input).toBeFocused()
  await expect(dialog).toHaveAttribute('data-theme', 'dark')
  await expect(dialog).toHaveCSS('transform', 'none')
  await input.fill('keep this draft')

  const originalTargets = await controls.getByRole('button').evaluateAll((buttons) =>
    buttons.map((button) => {
      const { x, y, width, height } = button.getBoundingClientRect()
      return { x, y, width, height }
    })
  )
  for (const target of originalTargets) {
    expect(target.width).toBe(24)
    expect(target.height).toBe(24)
  }
  for (const glyph of await controls.locator('svg').all()) {
    await expect(glyph).toHaveCSS('opacity', '0')
  }
  await testInfo.attach('traffic-lights-normal', {
    body: await controls.screenshot(),
    contentType: 'image/png',
  })

  await page.getByRole('button', { name: 'Enter full screen' }).hover()
  await expect(page.getByRole('menu', { name: 'Window arrangement' })).toBeVisible()
  for (const glyph of await controls.locator('svg').all()) {
    await expect(glyph).toHaveCSS('opacity', '1')
  }
  for (const [index, dot] of (await dots.all()).entries()) {
    await expect
      .poll(async () => (await dot.boundingBox())?.width)
      .toBeCloseTo(index === 2 ? 13.2 : 12, 1)
  }
  await page.keyboard.press('Escape')

  for (const [index, name] of controlNames.entries()) {
    const button = page.getByRole('button', { name, exact: true })
    const dot = button.locator('.terminal-window-control-dot')
    await button.hover()
    await expect.poll(async () => (await dot.boundingBox())?.width).toBeCloseTo(13.2, 1)
    expect(await button.boundingBox()).toEqual(originalTargets[index])
    for (let other = 0; other < controlNames.length; other += 1) {
      if (other !== index) {
        await expect
          .poll(async () => (await dots.nth(other).boundingBox())?.width)
          .toBeCloseTo(12, 1)
      }
    }
    if (index === 0) {
      const previewPath = testInfo.outputPath('terminal-dark-hover-control.png')
      await dialog.screenshot({ path: previewPath })
      await testInfo.attach('terminal-dark-hover-control', {
        path: previewPath,
        contentType: 'image/png',
      })
    }

    await input.hover()
    await expect.poll(async () => (await dot.boundingBox())?.width).toBeCloseTo(12, 1)
    await button.hover()
    await page.mouse.down()
    await expect
      .poll(async () => (await dot.boundingBox())?.width)
      .toBeCloseTo(14.16, 1)
    expect(await button.boundingBox()).toEqual(originalTargets[index])
    for (let other = 0; other < controlNames.length; other += 1) {
      if (other !== index) {
        await expect
          .poll(async () => (await dots.nth(other).boundingBox())?.width)
          .toBeCloseTo(12, 1)
      }
    }
    await testInfo.attach(`traffic-light-${index}-pressed`, {
      body: await controls.screenshot(),
      contentType: 'image/png',
    })
    if (index === 0) {
      const previewPath = testInfo.outputPath('terminal-dark-held-control.png')
      await dialog.screenshot({ path: previewPath })
      await testInfo.attach('terminal-dark-held-control', {
        path: previewPath,
        contentType: 'image/png',
      })
    }

    const target = originalTargets[index]
    const center = {
      x: target.x + target.width / 2,
      y: target.y + target.height / 2,
    }
    await page.mouse.move(center.x + 100, center.y + 60, { steps: 5 })
    await expect
      .poll(async () => {
        const bounds = await dot.boundingBox()
        return bounds ? bounds.x + bounds.width / 2 - center.x : 0
      })
      .toBeCloseTo(1.5, 3)
    await expect
      .poll(async () => {
        const bounds = await dot.boundingBox()
        return bounds ? bounds.y + bounds.height / 2 - center.y : 0
      })
      .toBeCloseTo(1.5, 3)
    const heldBounds = await dot.boundingBox()
    if (!heldBounds) throw new Error('Pressed traffic light is unavailable')
    expect(heldBounds.width).toBeGreaterThan(13)
    expect(heldBounds.x + heldBounds.width / 2 - center.x).toBeLessThanOrEqual(1.6)
    expect(heldBounds.y + heldBounds.height / 2 - center.y).toBeLessThanOrEqual(1.6)
    expect(await button.boundingBox()).toEqual(target)
    for (const glyph of await controls.locator('svg').all()) {
      await expect(glyph).toHaveCSS('opacity', '1')
    }

    // A release outside the target cancels close, minimize, and full screen.
    await input.hover()
    await page.mouse.up()
    await expect.poll(async () => (await dot.boundingBox())?.width).toBeCloseTo(12, 1)
    await expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
    await expect(input).toHaveValue('keep this draft')
    await expect(page.getByRole('button', { name: 'Restore terminal' })).toHaveCount(0)
    for (const glyph of await controls.locator('svg').all()) {
      await expect(glyph).toHaveCSS('opacity', '0')
    }
  }

  await testInfo.attach('terminal-after-canceled-presses', {
    body: await dialog.screenshot(),
    contentType: 'image/png',
  })
})

test('reduced motion keeps hovered and pressed dots still and preserves keyboard activation @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page
    .getByRole('banner')
    .getByRole('button', { name: 'Terminal', exact: true })
    .click()
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  await expect(input).toBeFocused()

  for (const name of controlNames) {
    const button = page.getByRole('button', { name, exact: true })
    const dot = button.locator('.terminal-window-control-dot')
    const originalDot = await dot.boundingBox()
    await button.hover()
    expect(await dot.boundingBox()).toEqual(originalDot)
    await page.mouse.down()
    expect(await dot.boundingBox()).toEqual(originalDot)
    await input.hover()
    expect(await dot.boundingBox()).toEqual(originalDot)
    await page.mouse.up()
    await expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
  }

  const green = page.getByRole('button', { name: 'Enter full screen' })
  await green.focus()
  await page.keyboard.down('Space')
  expect(
    (await green.locator('.terminal-window-control-dot').boundingBox())?.width
  ).toBeCloseTo(12, 1)
  await page.keyboard.up('Space')
  await expect(dialog).toHaveAttribute('data-window-mode', 'fullscreen')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
  await page.getByRole('button', { name: 'Close terminal' }).focus()
  await page.keyboard.press('Enter')
  await expect(dialog).toHaveCount(0)
  await expect(
    page.getByRole('banner').getByRole('button', { name: 'Terminal', exact: true })
  ).toBeFocused()
})

test('keyboard presses animate and interrupted hover or pointer presses reset without activating a control @desktop', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await page
    .getByRole('banner')
    .getByRole('button', { name: 'Terminal', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  await expect(input).toBeFocused()
  const green = page.getByRole('button', { name: 'Enter full screen' })
  const greenDot = green.locator('.terminal-window-control-dot')

  await green.focus()
  await page.keyboard.down('Space')
  await expect
    .poll(async () => (await greenDot.boundingBox())?.width)
    .toBeGreaterThan(13)
  await page.keyboard.up('Space')
  await expect(dialog).toHaveAttribute('data-window-mode', 'fullscreen')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveAttribute('data-window-mode', 'windowed')

  const close = page.getByRole('button', { name: 'Close terminal' })
  const closeDot = close.locator('.terminal-window-control-dot')
  await close.hover()
  await expect
    .poll(async () => (await closeDot.boundingBox())?.width)
    .toBeCloseTo(13.2, 1)
  const previewPath = testInfo.outputPath('terminal-light-hover-control.png')
  await dialog.screenshot({ path: previewPath })
  await testInfo.attach('terminal-light-hover-control', {
    path: previewPath,
    contentType: 'image/png',
  })
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await expect
    .poll(async () => (await closeDot.boundingBox())?.width)
    .toBeCloseTo(12, 1)
  await input.hover()

  for (const interruption of ['pointercancel', 'blur'] as const) {
    await close.hover()
    await page.mouse.down()
    await expect
      .poll(async () => (await closeDot.boundingBox())?.width)
      .toBeCloseTo(14.16, 1)
    if (interruption === 'pointercancel') {
      await close.dispatchEvent('pointercancel', {
        pointerId: 1,
        pointerType: 'mouse',
      })
    } else {
      await page.evaluate(() => window.dispatchEvent(new Event('blur')))
    }
    await expect
      .poll(async () => (await closeDot.boundingBox())?.width)
      .toBeCloseTo(12, 1)
    await input.hover()
    await page.mouse.up()
    await expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
    await expect(page.getByRole('button', { name: 'Restore terminal' })).toHaveCount(0)
  }
})

test('touching a traffic light does not leave hover symbols or open a delayed arrangement menu @mobile', async ({
  page,
}) => {
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('Mobile viewport is unavailable')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page
    .getByRole('banner')
    .getByRole('button', { name: 'Terminal', exact: true })
    .tap()
  await expect(
    page.getByRole('textbox', { name: 'Terminal command input' })
  ).toBeFocused()
  await page.setViewportSize(viewport)
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  await page.getByRole('button', { name: 'Enter full screen' }).tap()
  await expect(dialog).toHaveAttribute('data-window-mode', 'fullscreen')
  // Let the mouse-only hover-menu delay expire after a real touchscreen tap.
  await page.waitForTimeout(650)
  await expect(page.getByRole('menu', { name: 'Window arrangement' })).toHaveCount(0)
  for (const glyph of await page.locator('.terminal-window-control__glyph').all()) {
    await expect(glyph).toHaveCSS('opacity', '0')
  }
  for (const dot of await page.locator('.terminal-window-control-dot').all()) {
    expect((await dot.boundingBox())?.width).toBeCloseTo(12, 1)
  }
  await page.getByRole('button', { name: 'Exit full screen' }).tap()
  await expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
})
