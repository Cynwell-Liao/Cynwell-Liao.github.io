import { expect, test } from './fixtures'

import type { Locator } from '@playwright/test'

test.use({
  // Use full Chromium: its headless shell can allow popups even with blocking enabled.
  channel: async ({ browserName }, use) => {
    await use(browserName === 'chromium' ? 'chromium' : undefined)
  },
  launchOptions: { ignoreDefaultArgs: ['--disable-popup-blocking'] },
})

interface LaunchFrame {
  elapsed: number
  y: number
  launching: boolean
  terminalVisible: boolean
}

interface LaunchProbe {
  frames: LaunchFrame[]
  opens: LaunchFrame[]
  finished: boolean
  defaultPrevented?: boolean
}

declare global {
  interface Window {
    dockLaunchProbe: LaunchProbe
  }
}

// Observe the rendered transform and the real open() call in the same clock.
// Keeping the original open() also exercises browser user-activation handling.
const observeLaunch = async (launcher: Locator) => {
  await launcher.evaluate((element) => {
    const probe: LaunchProbe = { frames: [], opens: [], finished: false }
    window.dockLaunchProbe = probe
    let startedAt = 0
    let sawLaunch = false
    const readFrame = (): LaunchFrame => {
      const icon = element.querySelector('.desktop-dock__launch')
      if (!icon) throw new Error('Missing launch animation element')
      return {
        elapsed: performance.now() - startedAt,
        y: new DOMMatrixReadOnly(getComputedStyle(icon).transform).m42,
        launching: element.getAttribute('data-launching') === 'true',
        terminalVisible: document.querySelector('[role="dialog"]') !== null,
      }
    }
    const originalOpen = window.open.bind(window)
    window.open = (url, target, features) => {
      const frame = readFrame()
      probe.opens.push(frame)
      probe.frames.push(frame)
      probe.finished = true
      return originalOpen(url, target, features)
    }
    element.addEventListener(
      'click',
      (event) => {
        startedAt = performance.now()
        queueMicrotask(() => {
          probe.defaultPrevented = event.defaultPrevented
        })
        const sample = () => {
          if (probe.finished) return
          const frame = readFrame()
          probe.frames.push(frame)
          sawLaunch ||= frame.launching
          if ((sawLaunch && !frame.launching) || frame.elapsed > 5000) {
            probe.finished = true
            return
          }
          requestAnimationFrame(sample)
        }
        requestAnimationFrame(sample)
      },
      { capture: true, once: true }
    )
  })
}

const expectThreeCompletedBounces = (frames: LaunchFrame[]) => {
  let bounces = 0
  let rising = true
  let extremum = 0
  // Count substantial direction reversals: low-frame-rate WebKit can miss the
  // brief baseline between hops even while rendering all three distinct peaks.
  for (const frame of frames) {
    if (rising) {
      extremum = Math.min(extremum, frame.y)
      if (extremum < -15 && frame.y - extremum > 8) {
        bounces += 1
        rising = false
        extremum = frame.y
      }
    } else {
      extremum = Math.max(extremum, frame.y)
      if (extremum - frame.y > 8) {
        rising = true
        extremum = frame.y
      }
    }
  }
  const samples = frames
    .map((frame) => `${Math.round(frame.elapsed)}ms:${frame.y.toFixed(1)}px`)
    .join(', ')
  expect(bounces, `Sampled icon positions: ${samples}`).toBe(3)
  expect(frames.at(-1)?.y).toBeCloseTo(0, 1)
  // Allow scheduling variance around 1.8 seconds while rejecting an early launch.
  expect(frames.at(-1)?.elapsed).toBeGreaterThanOrEqual(1600)
  expect(frames.at(-1)?.elapsed).toBeLessThan(4000)
}

test('Terminal finishes three cold-launch bounces before the window appears', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const terminal = page
    .getByRole('navigation', { name: 'Application Dock' })
    .getByRole('button', { name: 'Terminal', exact: true })
  await observeLaunch(terminal)
  if (isMobile) await terminal.tap()
  else await terminal.click()

  const dialog = page.getByRole('dialog', { name: 'Terminal' })
  await expect(dialog).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => window.dockLaunchProbe.finished))
    .toBe(true)
  const frames = await page.evaluate(() => window.dockLaunchProbe.frames)
  expectThreeCompletedBounces(frames)
  expect(
    frames
      .filter((frame) => frame.launching || frame.y < -1)
      .every((frame) => !frame.terminalVisible)
  ).toBe(true)
  await expect(terminal).toHaveAttribute('data-running', 'true')

  await page.getByRole('button', { name: 'Minimize terminal' }).click()
  await expect(dialog).toHaveCount(0)
  await terminal.click()
  await expect(terminal).not.toHaveAttribute('data-launching', 'true')
  await expect(terminal.locator('.desktop-dock__launch')).toHaveCSS('transform', 'none')
  await expect(dialog).toBeVisible()
})

for (const [label, interaction, viewport] of [
  ['GitHub', 'double-click', '@desktop'],
  ['LinkedIn', 'keyboard-menu', '@desktop'],
  ['GitHub', 'touch', '@mobile'],
] as const) {
  test(`${label} opens one isolated tab only after three launch bounces (${interaction}) ${viewport}`, async ({
    page,
    context,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    const launcher = page
      .getByRole('navigation', { name: 'Application Dock' })
      .getByRole('link', { name: label, exact: true })
    const href = await launcher.getAttribute('href')
    if (!href) throw new Error('Missing profile URL')
    await context.route(href, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<title>Profile</title>' })
    )
    await observeLaunch(launcher)
    const popupPromise = context.waitForEvent('page')
    if (interaction === 'double-click') {
      await launcher.dblclick()
    } else if (interaction === 'touch') {
      await launcher.tap()
    } else {
      await launcher.focus()
      await launcher.press('Shift+F10')
      await page.getByRole('menuitem', { name: 'Open', exact: true }).press('Enter')
    }
    const popup = await popupPromise
    await expect(popup).toHaveURL(href)
    await expect
      .poll(() => page.evaluate(() => window.dockLaunchProbe.finished))
      .toBe(true)
    const probe = await page.evaluate(() => window.dockLaunchProbe)
    expectThreeCompletedBounces(probe.frames)
    expect(probe.opens).toHaveLength(1)
    expect(probe.opens[0].y).toBeCloseTo(0, 1)
    expect(probe.opens[0].elapsed).toBeGreaterThanOrEqual(1600)
    expect(context.pages()).toHaveLength(2)
    expect(await popup.evaluate(() => window.opener)).toBeNull()
    expect(await popup.evaluate(() => document.referrer)).toBe('')
    await popup.close()
  })
}

test('reduced-motion profile launches open without bounces or animation delay', async ({
  page,
  context,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const launcher = page
    .getByRole('navigation', { name: 'Application Dock' })
    .getByRole('link', { name: 'GitHub', exact: true })
  const href = await launcher.getAttribute('href')
  if (!href) throw new Error('Missing profile URL')
  await context.route(href, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<title>Profile</title>' })
  )
  await observeLaunch(launcher)
  const popupPromise = context.waitForEvent('page')
  if (isMobile) await launcher.tap()
  else await launcher.click()
  const popup = await popupPromise
  await expect(popup).toHaveURL(href)
  await expect(launcher).not.toHaveAttribute('data-launching', 'true')
  await expect(launcher.locator('.desktop-dock__launch')).toHaveCSS('transform', 'none')
  const probe = await page.evaluate(() => window.dockLaunchProbe)
  expect(probe.defaultPrevented).toBe(false)
  expect(probe.frames.every((frame) => frame.y === 0 && !frame.launching)).toBe(true)
  await popup.close()
})

test('choosing another profile during launch opens only the latest destination @desktop', async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Application Dock' })
  const github = dock.getByRole('link', { name: 'GitHub', exact: true })
  const linkedin = dock.getByRole('link', { name: 'LinkedIn', exact: true })
  const githubUrl = await github.getAttribute('href')
  const linkedinUrl = await linkedin.getAttribute('href')
  if (!githubUrl || !linkedinUrl) throw new Error('Missing profile URL')
  for (const url of [githubUrl, linkedinUrl]) {
    await context.route(url, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<title>Profile</title>' })
    )
  }
  await observeLaunch(linkedin)
  const popupPromise = context.waitForEvent('page')
  await github.click()
  await expect(github).toHaveAttribute('data-launching', 'true')
  expect(context.pages()).toHaveLength(1)
  // Click during magnification instead of waiting for the moving target to settle.
  await linkedin.click({ force: true })
  await expect(github).not.toHaveAttribute('data-launching', 'true')
  await expect(linkedin).toHaveAttribute('data-launching', 'true')
  const popup = await popupPromise
  await expect(popup).toHaveURL(linkedinUrl)
  const probe = await page.evaluate(() => window.dockLaunchProbe)
  expectThreeCompletedBounces(probe.frames)
  expect(probe.opens).toHaveLength(1)
  expect(probe.opens[0].y).toBeCloseTo(0, 1)
  expect(context.pages()).toHaveLength(2)
  await popup.close()
})
