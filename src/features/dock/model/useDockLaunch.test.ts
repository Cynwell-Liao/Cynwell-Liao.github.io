import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDockLaunch } from './useDockLaunch'

describe('useDockLaunch', () => {
  it('waits for the launch animation to finish before opening an app', () => {
    const openApp = vi.fn()
    const { result } = renderHook(() => useDockLaunch())

    act(() => {
      result.current.startLaunch(0, openApp, false)
    })

    expect(result.current.launching).toEqual([0])
    expect(openApp).not.toHaveBeenCalled()

    act(() => {
      result.current.completeLaunch(0)
    })

    expect(result.current.launching).toEqual([])
    expect(openApp).toHaveBeenCalledExactlyOnceWith()
  })

  it('ignores repeated activation while the same app is launching', () => {
    const openApp = vi.fn()
    const repeatedOpen = vi.fn()
    const { result } = renderHook(() => useDockLaunch())

    act(() => {
      result.current.startLaunch(0, openApp, false)
      result.current.startLaunch(0, repeatedOpen, false)
    })

    expect(result.current.launching).toEqual([0])

    act(() => {
      result.current.completeLaunch(0)
      result.current.completeLaunch(0)
    })

    expect(openApp).toHaveBeenCalledExactlyOnceWith()
    expect(repeatedOpen).not.toHaveBeenCalled()
    expect(result.current.launching).toEqual([])
  })

  it('lets different apps complete their launch animations independently', () => {
    const openGithub = vi.fn()
    const openTerminal = vi.fn()
    const { result } = renderHook(() => useDockLaunch())

    act(() => {
      result.current.startLaunch(0, openGithub, false)
      result.current.startLaunch(2, openTerminal, false)
    })

    expect(result.current.launching).toEqual([0, 2])

    act(() => {
      result.current.completeLaunch(2)
    })

    expect(openTerminal).toHaveBeenCalledExactlyOnceWith()
    expect(openGithub).not.toHaveBeenCalled()
    expect(result.current.launching).toEqual([0])

    act(() => {
      result.current.completeLaunch(0)
    })

    expect(openGithub).toHaveBeenCalledExactlyOnceWith()
    expect(result.current.launching).toEqual([])
  })

  it('opens immediately when animation is skipped for reduced motion or a running app', () => {
    const openReducedMotionApp = vi.fn()
    const activateRunningApp = vi.fn()
    const { result } = renderHook(() => useDockLaunch())

    act(() => {
      result.current.startLaunch(0, openReducedMotionApp, true)
      result.current.startLaunch(2, activateRunningApp, true)
    })

    expect(openReducedMotionApp).toHaveBeenCalledExactlyOnceWith()
    expect(activateRunningApp).toHaveBeenCalledExactlyOnceWith()
    expect(result.current.launching).toEqual([])

    act(() => {
      result.current.completeLaunch(0)
      result.current.completeLaunch(2)
    })

    expect(openReducedMotionApp).toHaveBeenCalledTimes(1)
    expect(activateRunningApp).toHaveBeenCalledTimes(1)
  })

  it('can launch the same app again after its previous launch completes', () => {
    const firstOpen = vi.fn()
    const nextOpen = vi.fn()
    const { result } = renderHook(() => useDockLaunch())

    act(() => {
      result.current.startLaunch(1, firstOpen, false)
    })
    act(() => {
      result.current.completeLaunch(1)
    })
    act(() => {
      result.current.startLaunch(1, nextOpen, false)
    })

    expect(result.current.launching).toEqual([1])
    expect(nextOpen).not.toHaveBeenCalled()

    act(() => {
      result.current.completeLaunch(1)
    })

    expect(firstOpen).toHaveBeenCalledExactlyOnceWith()
    expect(nextOpen).toHaveBeenCalledExactlyOnceWith()
    expect(result.current.launching).toEqual([])
  })

  it('ignores completion for an app with no pending launch', () => {
    const openApp = vi.fn()
    const { result } = renderHook(() => useDockLaunch())

    act(() => {
      result.current.startLaunch(0, openApp, false)
    })
    act(() => {
      result.current.completeLaunch(2)
    })

    expect(openApp).not.toHaveBeenCalled()
    expect(result.current.launching).toEqual([0])
  })

  it('cancels one pending launch without interrupting another app', () => {
    const openCancelledApp = vi.fn()
    const openOtherApp = vi.fn()
    const { result } = renderHook(() => useDockLaunch())

    act(() => {
      result.current.startLaunch(0, openCancelledApp, false)
      result.current.startLaunch(2, openOtherApp, false)
    })
    act(() => {
      result.current.cancelLaunch(0)
    })

    expect(result.current.launching).toEqual([2])

    act(() => {
      result.current.completeLaunch(0)
    })

    expect(openCancelledApp).not.toHaveBeenCalled()
    expect(openOtherApp).not.toHaveBeenCalled()
    expect(result.current.launching).toEqual([2])

    act(() => {
      result.current.completeLaunch(2)
    })

    expect(openOtherApp).toHaveBeenCalledExactlyOnceWith()
    expect(result.current.launching).toEqual([])
  })

  it('cancels pending launches when the dock unmounts', () => {
    const openApp = vi.fn()
    const { result, unmount } = renderHook(() => useDockLaunch())

    act(() => {
      result.current.startLaunch(0, openApp, false)
    })
    const completeLaunch = result.current.completeLaunch

    unmount()
    act(() => {
      completeLaunch(0)
    })

    expect(openApp).not.toHaveBeenCalled()
  })
})
