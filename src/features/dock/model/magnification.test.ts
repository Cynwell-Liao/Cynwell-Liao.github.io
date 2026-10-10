import { describe, expect, it } from 'vitest'

import {
  DOCK_ICON_SIZE,
  DOCK_INFLUENCE,
  DOCK_MAGNIFICATION,
  getDockIconSize,
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
})
