import { expect, test } from './fixtures'

const desktopNavigationTargets = [
  { label: 'About', fragment: '#about' },
  { label: 'Tech Stack', fragment: '#tech-stack' },
  { label: 'Projects', fragment: '#projects' },
  { label: 'Education', fragment: '#education' },
] as const

test('desktop navigation reaches every portfolio section @desktop', async ({
  page,
}) => {
  await page.goto('/')

  const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
  await expect(navigation.getByRole('link')).toHaveCount(
    desktopNavigationTargets.length
  )

  for (const target of desktopNavigationTargets) {
    const link = navigation.getByRole('link', { name: target.label, exact: true })
    await expect(link).toHaveAttribute('href', target.fragment)
    await link.click()

    await expect(page).toHaveURL(new RegExp(`${target.fragment}$`, 'u'))
    await expect(page.locator(target.fragment)).toBeVisible()
    await expect(page.locator(target.fragment)).toBeInViewport()
  }

  const homeLink = page.getByRole('link', { name: /home$/u })
  await expect(homeLink).toHaveAttribute('href', '#home')
  await homeLink.click()
  await expect(page).toHaveURL(/#home$/u)
  await expect(page.locator('#home')).toBeInViewport()
})

test('theme choice persists across page reloads @desktop', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')

  await page.getByRole('button', { name: 'Switch to dark mode' }).click()

  await expect(page.locator('html')).toHaveClass(/dark/u)
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('portfolio-theme')))
    .toBe('dark')

  await page.reload()

  await expect(page.locator('html')).toHaveClass(/dark/u)
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()

  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/u)
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('portfolio-theme')))
    .toBe('light')

  await page.reload()
  await expect(page.locator('html')).not.toHaveClass(/dark/u)
})

test('terminal opens, submits a command, closes, and restores focus @desktop', async ({
  page,
}) => {
  await page.goto('/')

  const opener = page.getByRole('button', { name: 'Terminal', exact: true })
  await opener.click()

  const dialog = page.getByRole('dialog', { name: 'Linux terminal' })
  const input = page.getByRole('textbox', { name: 'Terminal command input' })
  const output = page.getByRole('log', { name: 'Terminal output' })
  await expect(dialog).toBeVisible()
  await expect(dialog).not.toHaveAttribute('aria-modal')
  await expect(input).toBeFocused()

  await input.fill('pwd')
  await input.press('Enter')

  await expect(output).toContainText('~/stack % pwd')
  await expect(output).toContainText('~/stack')
  await expect(input).toHaveValue('')

  await page.getByRole('button', { name: 'Close terminal' }).click()

  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
})

test('reduced-motion users receive static motion alternatives @desktop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  await expect
    .poll(() =>
      page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    )
    .toBe(true)

  const rootScrollBehavior = await page
    .locator('html')
    .evaluate((element) => getComputedStyle(element).scrollBehavior)
  const marqueeAnimationName = await page
    .locator('.hero-cert-marquee__track')
    .evaluate((element) => getComputedStyle(element).animationName)

  expect(rootScrollBehavior).toBe('auto')
  expect(marqueeAnimationName).toBe('none')
  await expect(page.locator('.hero-cert-marquee__set[data-clone="true"]')).toBeHidden()
})

test('outbound links expose specific accessible names @desktop', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'LinkedIn Profile' })).toHaveAttribute(
    'target',
    '_blank'
  )
  await expect(page.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute(
    'target',
    '_blank'
  )
  await expect(page.getByRole('link', { name: 'View Live: Cheapguide' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View Live: ParkPie' })).toBeVisible()
  await expect(
    page.getByRole('link', {
      name: 'AWS Certified Solutions Architect - Associate badge',
    })
  ).toBeVisible()

  const outboundLinks = page.locator('a[target="_blank"]:not([tabindex="-1"])')
  const outboundLinkMetadata = await outboundLinks.evaluateAll((links) =>
    links.map((link) => {
      const imageAlt = link.querySelector('img')?.getAttribute('alt') ?? ''

      return {
        name: [
          link.getAttribute('aria-label') ?? '',
          link.getAttribute('title') ?? '',
          link.textContent ?? '',
          imageAlt,
        ]
          .join(' ')
          .trim(),
        rel: link.getAttribute('rel') ?? '',
      }
    })
  )

  expect(outboundLinkMetadata.length).toBeGreaterThan(0)
  expect(outboundLinkMetadata.filter(({ name }) => name.length === 0)).toEqual([])
  expect(
    outboundLinkMetadata.filter(({ rel }) => !rel.split(/\s+/u).includes('noreferrer'))
  ).toEqual([])
})

test('mobile navbar intentionally exposes only brand and theme controls @mobile', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.getByTestId('navbar-brand')).toBeVisible()
  await expect(page.getByRole('link', { name: /home$/u })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation', includeHidden: true })
  ).toBeHidden()
  await expect(
    page.getByRole('button', { name: 'Terminal', exact: true, includeHidden: true })
  ).toBeHidden()
  await expect(page.getByRole('dialog', { name: 'Linux terminal' })).toHaveCount(0)
})
