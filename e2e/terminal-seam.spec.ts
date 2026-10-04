import { expect, test } from './fixtures'

for (const theme of ['light', 'dark'] as const) {
  test(`the ${theme} titlebar divider filters the page behind the entire window @desktop`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    if (theme === 'dark') {
      await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    }
    await page.getByRole('button', { name: 'Terminal', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Terminal' })
    await expect(dialog).toHaveAttribute('data-theme', theme)
    await expect(dialog).toHaveCSS('transform', 'none')
    await expect(
      page.getByRole('textbox', { name: 'Terminal command input' })
    ).toBeFocused()

    // High-contrast page detail exposes any unfiltered gap between the glass panes.
    await page.addStyleTag({
      content: `.terminal-desktop {
        background: repeating-linear-gradient(to right, #000 0 4px, #fff 4px 8px);
      }`,
    })
    const titlebar = await page.getByTestId('terminal-titlebar').boundingBox()
    const screen = await page.locator('.terminal-screen').boundingBox()
    if (!titlebar || !screen) throw new Error('Terminal panes are unavailable')
    expect(titlebar.y + titlebar.height).toBeCloseTo(screen.y, 3)

    const divider = await page.screenshot({
      path: testInfo.outputPath(`${theme}-titlebar-divider.png`),
      clip: {
        x: Math.ceil(titlebar.x) + 100,
        y: Math.floor(screen.y) - 1,
        width: Math.floor(titlebar.width) - 200,
        height: 1,
      },
      scale: 'css',
    })
    await testInfo.attach(`${theme}-titlebar-divider`, {
      body: divider,
      contentType: 'image/png',
    })

    const channelRanges = await page.evaluate(async (bytes) => {
      const bitmap = await createImageBitmap(
        new Blob([new Uint8Array(bytes)], { type: 'image/png' })
      )
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Cannot inspect divider pixels')
      context.drawImage(bitmap, 0, 0)
      bitmap.close()
      const pixels = context.getImageData(0, 0, canvas.width, 1).data
      return [0, 1, 2].map((channel) => {
        let minimum = 255
        let maximum = 0
        for (let offset = channel; offset < pixels.length; offset += 4) {
          minimum = Math.min(minimum, pixels[offset])
          maximum = Math.max(maximum, pixels[offset])
        }
        return maximum - minimum
      })
    }, Array.from(divider))
    await testInfo.attach(`${theme}-divider-channel-ranges`, {
      body: JSON.stringify(channelRanges),
      contentType: 'application/json',
    })
    await dialog.screenshot({
      path: testInfo.outputPath(`${theme}-terminal-seam.png`),
    })

    // Blurred 4px stripes should be nearly uniform, not alternate black and white.
    for (const range of channelRanges) {
      expect(
        range,
        'The titlebar divider must not expose unfiltered page detail'
      ).toBeLessThan(20)
    }
  })
}
