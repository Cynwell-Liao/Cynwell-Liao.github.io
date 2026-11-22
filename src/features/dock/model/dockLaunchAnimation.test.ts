import { describe, expect, it } from 'vitest'

import {
  DOCK_LAUNCH_BOUNCES,
  DOCK_LAUNCH_HOP_DURATION_SECONDS,
  dockLaunchTransition,
} from './dockLaunchAnimation'

describe('dockLaunchTransition', () => {
  it('runs three complete rise-and-fall hops before launch completion', () => {
    expect(DOCK_LAUNCH_BOUNCES).toBe(3)
    expect(dockLaunchTransition).toEqual({
      duration: DOCK_LAUNCH_HOP_DURATION_SECONDS,
      repeat: DOCK_LAUNCH_BOUNCES - 1,
      times: [0, 0.5, 1],
      ease: ['easeOut', 'easeIn'],
    })
    expect(
      dockLaunchTransition.duration * (dockLaunchTransition.repeat + 1)
    ).toBeCloseTo(1.8)
  })
})
