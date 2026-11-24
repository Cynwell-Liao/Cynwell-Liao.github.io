import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { usePointerFeedback } from './usePointerFeedback'

import type { PointerEvent } from 'react'

describe('usePointerFeedback', () => {
  it('tracks mouse-like pointers and clears on blur', () => {
    const { result } = renderHook(() => usePointerFeedback())

    act(() => {
      result.current.pointerFeedbackHandlers.onPointerEnter({
        pointerType: 'mouse',
      } as PointerEvent<HTMLElement>)
    })
    expect(result.current.pointerHovered).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('blur'))
    })
    expect(result.current.pointerHovered).toBe(false)
  })

  it('does not turn touch contact into sticky hover', () => {
    const { result } = renderHook(() => usePointerFeedback())

    act(() => {
      result.current.pointerFeedbackHandlers.onPointerEnter({
        pointerType: 'touch',
      } as PointerEvent<HTMLElement>)
    })

    expect(result.current.pointerHovered).toBe(false)
  })

  it('exposes brief touch-press feedback and clears it after release', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => usePointerFeedback())

    act(() => {
      result.current.pointerFeedbackHandlers.onPointerDown({
        isPrimary: true,
        pointerType: 'touch',
      } as PointerEvent<HTMLElement>)
    })
    expect(result.current.pointerActive).toBe(true)
    expect(result.current.pointerHovered).toBe(false)

    act(() => {
      result.current.pointerFeedbackHandlers.onPointerUp({
        pointerType: 'touch',
      } as PointerEvent<HTMLElement>)
      vi.advanceTimersByTime(149)
    })
    expect(result.current.pointerActive).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.pointerActive).toBe(false)
    vi.useRealTimers()
  })

  it('ignores non-primary touch contact and clears active touch on cancellation', () => {
    const { result } = renderHook(() => usePointerFeedback())

    act(() => {
      result.current.pointerFeedbackHandlers.onPointerDown({
        isPrimary: false,
        pointerType: 'touch',
      } as PointerEvent<HTMLElement>)
    })
    expect(result.current.pointerActive).toBe(false)

    act(() => {
      result.current.pointerFeedbackHandlers.onPointerDown({
        isPrimary: true,
        pointerType: 'touch',
      } as PointerEvent<HTMLElement>)
      result.current.pointerFeedbackHandlers.onPointerCancel()
    })
    expect(result.current.pointerActive).toBe(false)
  })

  it('clears hover when the page becomes hidden', () => {
    const { result } = renderHook(() => usePointerFeedback())
    act(() => {
      result.current.pointerFeedbackHandlers.onPointerEnter({
        pointerType: 'pen',
      } as PointerEvent<HTMLElement>)
    })
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current.pointerHovered).toBe(false)
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  })
})
