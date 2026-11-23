import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { usePointerHover } from './usePointerHover'

import type { PointerEvent } from 'react'

describe('usePointerHover', () => {
  it('tracks mouse-like pointers and clears on blur', () => {
    const { result } = renderHook(() => usePointerHover())

    act(() => {
      result.current.pointerHoverHandlers.onPointerEnter({
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
    const { result } = renderHook(() => usePointerHover())

    act(() => {
      result.current.pointerHoverHandlers.onPointerEnter({
        pointerType: 'touch',
      } as PointerEvent<HTMLElement>)
    })

    expect(result.current.pointerHovered).toBe(false)
  })

  it('clears hover when the page becomes hidden', () => {
    const { result } = renderHook(() => usePointerHover())
    act(() => {
      result.current.pointerHoverHandlers.onPointerEnter({
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
