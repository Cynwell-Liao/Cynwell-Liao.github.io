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
  const dialog = page.getByRole('dialog', { name: 'Linux terminal' })
  await expect(
    page.getByRole('textbox', { name: 'Terminal command input' })
  ).toBeFocused()
  const titleBar = dialog.locator('div').first()
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
