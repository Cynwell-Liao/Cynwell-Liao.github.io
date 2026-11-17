import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DOCK_ICON_SIZE } from './magnification'
import { useDockInteraction } from './useDockInteraction'

import type { PointerEvent } from 'react'

const options = { fullscreen: false, reducedMotion: false, showMinimized: false }

const pointerEvent = (overrides: Partial<PointerEvent<HTMLElement>> = {}) =>
  ({
    button: 0,
    clientX: 0,
    ctrlKey: false,
    currentTarget: document.createElement('button'),
    pointerType: 'mouse',
    ...overrides,
  }) as PointerEvent<HTMLElement>

afterEach(() => {
  vi.useRealTimers()
})

describe('useDockInteraction', () => {
  it('magnifies nearby items, includes the minimized tile, and resets on pointer exit', () => {
    const { result } = renderHook(() =>
      useDockInteraction({ ...options, showMinimized: true })
    )
    expect(result.current.sizeAt(0)).toBe(DOCK_ICON_SIZE)

    act(() => {
      result.current.toolbarInteraction.onPointerMove(pointerEvent())
    })
    expect(result.current.sizeAt(1)).toBeGreaterThan(DOCK_ICON_SIZE)
    expect(result.current.sizeAt(2)).toBeGreaterThan(DOCK_ICON_SIZE)
    expect(result.current.sizeAt(3)).toBeGreaterThan(DOCK_ICON_SIZE)

    act(() => {
      result.current.toolbarInteraction.onPointerLeave()
    })
    for (const index of [0, 1, 2, 3]) {
      expect(result.current.sizeAt(index)).toBe(DOCK_ICON_SIZE)
    }
  })

  it('keeps touch interaction static and suppresses hover labels', () => {
    const { result } = renderHook(() => useDockInteraction(options))
    const event = pointerEvent({ pointerType: 'touch' })
    act(() => {
      result.current.toolbarInteraction.onPointerMove(event)
      result.current.interactionFor(0).onPointerEnter(event)
    })
    expect(result.current.activeLabel).toBeNull()
    expect(result.current.sizeAt(1)).toBe(DOCK_ICON_SIZE)
  })

  it('uses resting sizes when reduced motion is enabled after magnification', () => {
    const { result, rerender } = renderHook(useDockInteraction, {
      initialProps: options,
    })
    act(() => {
      result.current.toolbarInteraction.onPointerMove(pointerEvent())
    })
    expect(result.current.sizeAt(1)).toBeGreaterThan(DOCK_ICON_SIZE)
    rerender({ ...options, reducedMotion: true })
    act(() => {
      result.current.toolbarInteraction.onPointerMove(pointerEvent())
    })
    expect(result.current.sizeAt(1)).toBe(DOCK_ICON_SIZE)
  })

  it('cancels a pending long press when the pointer leaves the item', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useDockInteraction(options))
    act(() => {
      result.current.interactionFor(0).onPointerDown(pointerEvent())
    })
    expect(result.current.interactionFor(0)['data-pressed']).toBe('true')
    act(() => {
      vi.advanceTimersByTime(400)
      result.current.interactionFor(0).onPointerLeave()
    })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current.interactionFor(0)['data-pressed']).toBeUndefined()
    expect(result.current.menu).toBeNull()
  })

  it('keeps a fullscreen Dock revealed while its long-press menu is open', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useDockInteraction({ ...options, fullscreen: true })
    )
    expect(result.current.isHidden).toBe(true)
    act(() => {
      result.current.reveal()
      result.current.interactionFor(0).onPointerDown(pointerEvent())
    })
    expect(result.current.isHidden).toBe(false)
    act(() => {
      vi.advanceTimersByTime(500)
    })
    act(() => {
      result.current.positionInteraction.onPointerLeave()
      result.current.toolbarInteraction.onPointerMove(pointerEvent())
    })
    expect(result.current.menu?.index).toBe(0)
    expect(result.current.isHidden).toBe(false)
    expect(result.current.sizeAt(1)).toBe(DOCK_ICON_SIZE)
    act(() => {
      result.current.dismissMenu(false)
    })
    expect(result.current.isHidden).toBe(true)
  })
})
