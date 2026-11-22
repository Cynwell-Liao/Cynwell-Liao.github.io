import { expect, test } from './fixtures'

const viewports = [
  { name: 'mobile', width: 390, height: 844, tag: '@mobile' },
  { name: 'tablet', width: 768, height: 1024, tag: '@desktop' },
  { name: 'desktop', width: 1280, height: 900, tag: '@desktop' },
  { name: 'wide desktop', width: 1920, height: 1080, tag: '@desktop' },
] as const

test('desktop tech-stack cards form content-driven masonry columns @desktop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const cards = page.locator('#tech-stack article')
  await expect(cards.first()).toBeVisible()

  const cardMeasurements = await cards.evaluateAll((elements) =>
    elements.map((card) => {
      const list = card.querySelector('ul')
      if (!list) throw new Error('Tech-stack card list is missing')

      const cardBounds = card.getBoundingClientRect()
      const listBounds = list.getBoundingClientRect()
      const style = getComputedStyle(card)
      return {
        bottomInset: cardBounds.bottom - listBounds.bottom,
        bottom: cardBounds.bottom,
        expectedBottomInset:
          parseFloat(style.paddingBottom) + parseFloat(style.borderBottomWidth),
        height: cardBounds.height,
        left: cardBounds.left,
        top: cardBounds.top,
      }
    })
  )

  expect(
    new Set(cardMeasurements.map(({ height }) => Math.round(height))).size
  ).toBeGreaterThan(1)
  for (const { bottomInset, expectedBottomInset } of cardMeasurements) {
    expect(bottomInset).toBeCloseTo(expectedBottomInset, 0)
  }

  const columns = new Map<number, typeof cardMeasurements>()
  for (const measurement of cardMeasurements) {
    const columnKey = Math.round(measurement.left)
    const column = columns.get(columnKey) ?? []
    column.push(measurement)
    columns.set(columnKey, column)
  }
  expect(columns.size).toBe(3)
  for (const cardsInColumn of columns.values()) {
    const sortedCards = cardsInColumn.toSorted(
      (first, second) => first.top - second.top
    )
    for (let index = 1; index < sortedCards.length; index += 1) {
      const previousCard = sortedCards[index - 1]
      const currentCard = sortedCards[index]
      if (!previousCard || !currentCard) {
        throw new Error('Masonry card measurement is missing')
      }
      expect(currentCard.top - previousCard.bottom).toBeCloseTo(24, 0)
    }
  }
})

test('touch-tablet tech-stack cards form stable masonry without fragmentation @mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 834, height: 1194 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const grid = page.locator('.tech-stack-grid')
  const cards = grid.locator('article')
  await expect(cards.first()).toBeVisible()

  await expect
    .poll(() =>
      grid.evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          columnCount: style.columnCount,
          display: style.display,
          gridAutoFlow: style.gridAutoFlow,
          gridAutoRows: style.gridAutoRows,
          gridTemplateColumns: style.gridTemplateColumns,
          rowGap: style.rowGap,
        }
      })
    )
    .toEqual({
      columnCount: 'auto',
      display: 'grid',
      gridAutoFlow: 'dense',
      gridAutoRows: '1px',
      gridTemplateColumns: '381px 381px',
      rowGap: '0px',
    })

  const measurements = await cards.evaluateAll((elements) =>
    elements.map((card) => {
      const bounds = card.getBoundingClientRect()
      const list = card.querySelector('ul')?.getBoundingClientRect()
      if (!list) throw new Error('Tech-stack card list is missing')
      return {
        bottom: bounds.bottom,
        left: bounds.left,
        listBottom: list.bottom,
        listLeft: list.left,
        listRight: list.right,
        listTop: list.top,
        right: bounds.right,
        top: bounds.top,
      }
    })
  )

  for (const card of measurements) {
    expect(card.listTop).toBeGreaterThan(card.top)
    expect(card.listRight).toBeLessThan(card.right)
    expect(card.listBottom).toBeLessThan(card.bottom)
    expect(card.listLeft).toBeGreaterThan(card.left)
  }

  const columns = new Map<number, typeof measurements>()
  for (const measurement of measurements) {
    const columnKey = Math.round(measurement.left)
    const column = columns.get(columnKey) ?? []
    column.push(measurement)
    columns.set(columnKey, column)
  }
  expect(columns.size).toBe(2)
  for (const cardsInColumn of columns.values()) {
    const sortedCards = cardsInColumn.toSorted(
      (first, second) => first.top - second.top
    )
    for (let index = 1; index < sortedCards.length; index += 1) {
      const previousCard = sortedCards[index - 1]
      const currentCard = sortedCards[index]
      if (!previousCard || !currentCard) {
        throw new Error('Masonry card measurement is missing')
      }
      expect(currentCard.top - previousCard.bottom).toBeCloseTo(24, 0)
    }
  }

  for (let firstIndex = 0; firstIndex < measurements.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < measurements.length;
      secondIndex += 1
    ) {
      const first = measurements[firstIndex]
      const second = measurements[secondIndex]
      if (!first || !second) throw new Error('Tech-stack card is missing')

      const overlaps =
        first.left < second.right &&
        first.right > second.left &&
        first.top < second.bottom &&
        first.bottom > second.top
      expect(overlaps).toBe(false)
    }
  }
})

for (const viewport of viewports) {
  test(`hero certifications align with About, keep compact vertical padding, and fill the marquee on ${viewport.name} ${viewport.tag}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const marquee = page.locator('.hero-cert-marquee')
    const aboutContent = page.locator('#about > div:not([aria-hidden="true"])')
    await expect(marquee).toBeVisible()
    await expect(aboutContent).toBeVisible()

    const readHorizontalBounds = (element: Element) => {
      const bounds = element.getBoundingClientRect()
      return { left: bounds.left, right: bounds.right }
    }
    const marqueeBounds = await marquee.evaluate(readHorizontalBounds)
    const aboutBounds = await aboutContent.evaluate(readHorizontalBounds)

    expect(marqueeBounds.left).toBeCloseTo(aboutBounds.left, 0)
    expect(marqueeBounds.right).toBeCloseTo(aboutBounds.right, 0)
    expect(marqueeBounds.left).toBeGreaterThanOrEqual(0)
    expect(marqueeBounds.right).toBeLessThanOrEqual(viewport.width)

    const staticBadges = await page
      .locator('.hero-cert-marquee__set:not([data-clone="true"]) li')
      .evaluateAll((badges) =>
        badges.map((badge) => {
          const bounds = badge.getBoundingClientRect()
          return { left: bounds.left, right: bounds.right }
        })
      )

    expect(staticBadges.length).toBeGreaterThan(0)
    for (const badge of staticBadges) {
      expect(badge.left).toBeGreaterThanOrEqual(marqueeBounds.left)
      expect(badge.right).toBeLessThanOrEqual(marqueeBounds.right)
    }

    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect(
      page.locator('.hero-cert-marquee__set[data-clone="true"]')
    ).toBeVisible()

    const viewportContentWidth = await page
      .locator('.hero-cert-marquee__viewport')
      .evaluate((element) => {
        const style = getComputedStyle(element)
        return (
          element.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight)
        )
      })
    const setWidths = await page
      .locator('.hero-cert-marquee__set')
      // Measure layout width without floating-point rounding from the scrolling transform.
      .evaluateAll((sets) => sets.map((set) => parseFloat(getComputedStyle(set).width)))

    expect(setWidths).toHaveLength(2)
    const [firstSetWidth, secondSetWidth] = setWidths
    if (firstSetWidth === undefined || secondSetWidth === undefined) {
      throw new Error('Expected two certification set widths')
    }
    expect(firstSetWidth).toBeCloseTo(secondSetWidth, 0)
    for (const width of setWidths) {
      expect(width).toBeGreaterThanOrEqual(viewportContentWidth)
    }

    const cardPaddings = await page
      .locator(
        '#about .glass-panel, #education article, #projects article, #tech-stack article'
      )
      .evaluateAll((cards) =>
        cards.map((card) => {
          const style = getComputedStyle(card)
          return {
            top: parseFloat(style.paddingTop),
            right: parseFloat(style.paddingRight),
            bottom: parseFloat(style.paddingBottom),
            left: parseFloat(style.paddingLeft),
          }
        })
      )
    expect(cardPaddings.length).toBeGreaterThan(0)
    for (const padding of cardPaddings) {
      expect(padding).toEqual({ top: 32, right: 32, bottom: 32, left: 32 })
    }

    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      await page.emulateMedia({ reducedMotion })
      const contentInsets = await page
        .locator('.hero-cert-marquee__track')
        .evaluate((track) => {
          const viewport = track.parentElement
          if (!viewport) throw new Error('Certification viewport is missing')
          const viewportBounds = viewport.getBoundingClientRect()
          const trackBounds = track.getBoundingClientRect()
          return {
            top: trackBounds.top - viewportBounds.top,
            bottom: viewportBounds.bottom - trackBounds.bottom,
          }
        })

      expect(contentInsets.top).toBeCloseTo(8, 0)
      expect(contentInsets.bottom).toBeCloseTo(8, 0)
    }
  })
}
