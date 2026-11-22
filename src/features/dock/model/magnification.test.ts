import { describe, expect, it } from 'vitest'

import { getRequired } from '../../../test/getRequired'

import {
  DOCK_ICON_SIZE,
  DOCK_GAP,
  DOCK_INFLUENCE,
  DOCK_MAGNIFICATION,
  getDockIconSize,
  getDockSizes,
} from './magnification'

describe('Dock magnification', () => {
  it('peaks at the pointer and smoothly falls off across neighboring apps', () => {
    expect(getDockIconSize(0)).toBe(DOCK_ICON_SIZE + DOCK_MAGNIFICATION)
    expect(getDockIconSize(64)).toBeGreaterThan(DOCK_ICON_SIZE)
    expect(getDockIconSize(64)).toBeLessThan(getDockIconSize(0))
    expect(getDockIconSize(128)).toBeLessThan(getDockIconSize(64))
    expect(getDockIconSize(-64)).toBe(getDockIconSize(64))
  })

  it('leaves icons at their resting size outside the influence radius', () => {
    for (const distance of [-1000, -DOCK_INFLUENCE, DOCK_INFLUENCE, 1000]) {
      expect(getDockIconSize(distance)).toBe(DOCK_ICON_SIZE)
    }
  })

  it('centers the lens with symmetric neighboring icons', () => {
    const sizes = getDockSizes(0, false)
    expect(sizes).toHaveLength(3)
    const first = getRequired(sizes, 0, 'first Dock size')
    const center = getRequired(sizes, 1, 'center Dock size')
    const last = getRequired(sizes, 2, 'last Dock size')
    expect(center).toBeCloseTo(DOCK_ICON_SIZE + DOCK_MAGNIFICATION, 3)
    expect(first).toBeCloseTo(last, 6)
    expect(first).toBeGreaterThan(DOCK_ICON_SIZE)
    expect(first).toBeLessThan(center)
  })

  it.each([false, true])(
    'converges to the visual icon positions (minimized: %s)',
    (minimized) => {
      for (const pointer of [-160, -85, -20, 0, 45, 110, 180]) {
        const sizes = getDockSizes(pointer, minimized)
        const width =
          sizes.reduce((sum, size) => sum + size, 0) +
          DOCK_GAP * (sizes.length - 1) +
          (minimized ? DOCK_GAP + 1 : 0)
        let left = -width / 2
        sizes.forEach((size, index) => {
          if (minimized && index === 3) left += DOCK_GAP + 1
          expect(size).toBeGreaterThanOrEqual(DOCK_ICON_SIZE)
          expect(size).toBeLessThanOrEqual(DOCK_ICON_SIZE + DOCK_MAGNIFICATION)
          expect(size).toBeCloseTo(getDockIconSize(pointer - left - size / 2), 2)
          left += size + DOCK_GAP
        })
        expect(getDockSizes(pointer, minimized)).toEqual(sizes)
      }
    }
  )

  it('leaves all items at rest away from the shelf, including a minimized window', () => {
    expect(getDockSizes(1000, false)).toEqual([52, 52, 52])
    expect(getDockSizes(-1000, true)).toEqual([52, 52, 52, 52])
  })

  it('fits the lens within narrow viewports without shrinking touch targets', () => {
    const availableWidth = 272
    const sizes = getDockSizes(0, true, availableWidth)
    const width = sizes.reduce((sum, size) => sum + size, 0) + DOCK_GAP * 4 + 1
    expect(width).toBeCloseTo(availableWidth, 5)
    for (const size of sizes) expect(size).toBeGreaterThanOrEqual(DOCK_ICON_SIZE)
    expect(getDockSizes(0, true, 100)).toEqual([52, 52, 52, 52])
  })
})
