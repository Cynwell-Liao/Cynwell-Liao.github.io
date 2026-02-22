import { expect, test } from '@playwright/test'

test('desktop navbar link jumps to the About section', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop-only section jump check')

  await page.goto('/')
  await page.getByRole('link', { name: 'About' }).click()

  await expect(page).toHaveURL(/#about/)
  await expect(page.locator('#about')).toBeVisible()
})

test('theme toggle switches dark mode class', async ({ page }) => {
  await page.goto('/')

  const toggleButton = page.getByRole('button', {
    name: 'Switch to dark mode',
  })
  await expect(toggleButton).toBeVisible()

  await toggleButton.click()

  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
})

test('mobile navbar keeps the brand text visible', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile-only branding visibility check')

  await page.goto('/')
  await expect(
    page.locator('header span').filter({ hasText: /^Cynwell-Liao$/ })
  ).toBeVisible()
})
