import { expect, test } from './fixtures'

test('the Dock has three apps, correct profile links, and loaded original artwork @desktop', async ({
  page,
}) => {
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
  await expect(dock.locator('img')).toHaveCount(3)
  await expect
    .poll(() =>
      dock
        .locator('img')
        .evaluateAll((images) =>
          images.every(
            (image) =>
              image instanceof HTMLImageElement &&
              image.complete &&
              image.naturalWidth > 0
          )
        )
    )
    .toBe(true)
  await expect(dock.locator('[data-dock-app="github"] img')).toHaveAttribute(
    'src',
    '/assets/dock/github.svg'
  )
  await expect(dock.locator('[data-dock-app="terminal"] img')).toHaveAttribute(
    'src',
    '/assets/dock/terminal.svg'
  )
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
  expect(viewport.height - before.y - before.height).toBeCloseTo(12, 0)
  await expect(glass).toHaveCSS('backdrop-filter', 'blur(24px) saturate(1.7)')
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
