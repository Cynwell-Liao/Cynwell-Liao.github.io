import { expect, test } from '@playwright/test'

test('desktop navbar link jumps to the About section @desktop', async ({ page }) => {
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

test('mobile navbar keeps the brand text visible @mobile', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('navbar-brand')).toBeVisible()
})
