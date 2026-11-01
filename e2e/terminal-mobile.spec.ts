import { expect, test } from './fixtures'

import type { Page } from '@playwright/test'

async function openTerminal(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page
    .getByRole('navigation', { name: 'Application Dock' })
    .getByRole('button', { name: 'Terminal', exact: true })
    .tap()
  await expect(page.getByRole('dialog', { name: 'Terminal' })).toBeVisible()
}

test('mobile terminal has readable input and touch controls without opening the keyboard @mobile', async ({
  page,
}) => {
  await openTerminal(page)
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  await expect(dialog).toBeFocused()
  await expect(input).not.toBeFocused()
  expect(
    await input.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize)
    )
  ).toBeGreaterThanOrEqual(16)
  await expect(input).toHaveAttribute('enterkeyhint', 'enter')
  expect((await input.boundingBox())?.height).toBeGreaterThanOrEqual(44)
  await expect(page.getByRole('button', { name: 'Resize terminal' })).toHaveCount(0)

  for (const name of ['Close terminal', 'Minimize terminal', 'Enter full screen']) {
    const control = page.getByRole('button', { name })
    await expect(control).toBeInViewport()
    const bounds = await control.boundingBox()
    expect(bounds?.width).toBeGreaterThanOrEqual(44)
    expect(bounds?.height).toBeGreaterThanOrEqual(44)
  }
  const viewportMeta = await page
    .locator('meta[name="viewport"]')
    .getAttribute('content')
  expect(viewportMeta).not.toMatch(/user-scalable\s*=\s*(?:no|0)|maximum-scale\s*=/iu)

  await input.tap()
  await input.fill('saved mobile draft')
  await page.getByRole('button', { name: 'Enter full screen' }).tap()
  await expect(input).not.toBeFocused()
  await expect(input).toHaveValue('saved mobile draft')
  await page.getByRole('button', { name: 'Minimize terminal' }).tap()
  await expect(dialog).toHaveCount(0)
  await page
    .getByRole('navigation', { name: 'Application Dock' })
    .getByRole('button', { name: 'Terminal', exact: true })
    .tap()
  await expect(dialog).toBeVisible()
  await expect(input).not.toBeFocused()
  await expect(input).toHaveValue('saved mobile draft')
})

test('reading mobile scrollback keeps the prompt visible and does not steal focus or move the page @mobile', async ({
  page,
}) => {
  await openTerminal(page)
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  const output = page.getByRole('log', { name: 'Terminal output' })
  for (let command = 0; command < 3; command += 1) {
    await input.fill('help')
    await input.press('Enter')
  }
  await input.fill('unfinished command')
  await dialog.focus()
  await expect
    .poll(async () =>
      output.evaluate((element) => element.scrollHeight > element.clientHeight)
    )
    .toBe(true)
  const originalBounds = await dialog.boundingBox()
  const originalPageScroll = await page.evaluate(() => window.scrollY)

  // Desktop browser emulation has no OS keyboard or native momentum scrolling.
  // Exercise the touch pointer path around an actual scroll of the output element.
  await output.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: 100,
    clientY: 180,
  })
  await output.dispatchEvent('pointermove', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: 100,
    clientY: 280,
  })
  await output.evaluate((element) => {
    element.scrollTop = 0
  })
  await output.dispatchEvent('pointerup', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: 100,
    clientY: 280,
  })
  await output.tap({ position: { x: 30, y: 30 } })

  await expect(input).not.toBeFocused()
  await expect(input).toHaveValue('unfinished command')
  await expect(input).toBeInViewport()
  await expect.poll(async () => output.evaluate((element) => element.scrollTop)).toBe(0)
  await expect.poll(async () => dialog.boundingBox()).toEqual(originalBounds)
  expect(await page.evaluate(() => window.scrollY)).toBe(originalPageScroll)
  const outputBounds = await output.boundingBox()
  const inputBounds = await input.boundingBox()
  expect(outputBounds).not.toBeNull()
  expect(inputBounds).not.toBeNull()
  if (outputBounds && inputBounds) {
    expect(inputBounds.y).toBeGreaterThanOrEqual(outputBounds.y + outputBounds.height)
  }
})

test('mobile terminal fits keyboard viewport changes and leaves pinch zoom to the browser @mobile', async ({
  page,
}) => {
  const viewportSize = page.viewportSize()
  if (!viewportSize) throw new Error('Mobile viewport is unavailable')
  // Init scripts run before the viewport meta tag is parsed. Seed the mock from
  // the configured device size instead of the temporary desktop layout viewport.
  await page.addInitScript(({ width, height }) => {
    const state = {
      width,
      height,
      offsetLeft: 0,
      offsetTop: 0,
      scale: 1,
    }
    const viewport = new EventTarget()
    for (const key of Object.keys(state) as (keyof typeof state)[]) {
      Object.defineProperty(viewport, key, { get: () => state[key] })
    }
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: viewport,
    })
    window.addEventListener('terminal-test-viewport', (event) => {
      Object.assign(state, (event as CustomEvent<Partial<typeof state>>).detail)
      viewport.dispatchEvent(new Event('resize'))
      viewport.dispatchEvent(new Event('scroll'))
    })
  }, viewportSize)
  await openTerminal(page)
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  const originalBounds = await dialog.boundingBox()
  expect(originalBounds).not.toBeNull()
  if (originalBounds) {
    expect(originalBounds.x + originalBounds.width).toBeLessThanOrEqual(
      viewportSize.width
    )
    expect(originalBounds.y + originalBounds.height).toBeLessThanOrEqual(
      viewportSize.height
    )
  }
  await input.fill('keyboard draft')
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('terminal-test-viewport', {
        detail: { height: 300, offsetTop: 75 },
      })
    )
  })
  await expect
    .poll(async () => {
      const bounds = await dialog.boundingBox()
      return Boolean(bounds && bounds.y >= 75 && bounds.y + bounds.height <= 375)
    })
    .toBe(true)
  for (const element of [input, page.getByRole('button', { name: 'Close terminal' })]) {
    const bounds = await element.boundingBox()
    expect(bounds).not.toBeNull()
    if (bounds) {
      expect(bounds.y).toBeGreaterThanOrEqual(75)
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(375)
    }
  }
  const keyboardBounds = await dialog.boundingBox()
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('terminal-test-viewport', {
        detail: { width: 200, height: 150, offsetTop: 110, offsetLeft: 30, scale: 2 },
      })
    )
  })
  // Allow the coalesced viewport update to run before checking frozen geometry.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await expect(dialog).toHaveCSS('transform', 'none')
  expect(await dialog.boundingBox()).toEqual(keyboardBounds)
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('terminal-test-viewport', {
        detail: {
          width: window.innerWidth,
          height: window.innerHeight,
          offsetLeft: 0,
          offsetTop: 0,
          scale: 1,
        },
      })
    )
  })
  await expect.poll(async () => dialog.boundingBox()).toEqual(originalBounds)
  await expect(input).toHaveValue('keyboard draft')
})

test('mobile terminal keeps its prompt and controls usable in narrow portrait and landscape @mobile', async ({
  page,
}) => {
  await openTerminal(page)
  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  await input.fill('orientation draft')
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport)
    await expect
      .poll(async () => {
        const bounds = await dialog.boundingBox()
        return Boolean(
          bounds &&
          bounds.x >= 0 &&
          bounds.y >= 0 &&
          bounds.x + bounds.width <= viewport.width &&
          bounds.y + bounds.height <= viewport.height
        )
      })
      .toBe(true)
    await expect(input).toBeInViewport()
    await expect(input).toHaveValue('orientation draft')
    await expect(page.getByRole('button', { name: 'Close terminal' })).toBeInViewport()
    await expect(page.getByRole('button', { name: 'Resize terminal' })).toHaveCount(0)
    // In landscape the Dock sits behind this row; it must not intercept typing.
    await expect
      .poll(async () =>
        input.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          return (
            document.elementFromPoint(
              bounds.x + bounds.width / 2,
              bounds.y + bounds.height / 2
            ) === element
          )
        })
      )
      .toBe(true)
  }
})
