import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useTerminalControlPress } from './useTerminalControlPress'

import type { KeyboardEvent, PointerEvent } from 'react'

function pointerDown(overrides: Partial<PointerEvent<HTMLButtonElement>> = {}) {
  const button = document.createElement('button')
  button.getBoundingClientRect = () => new DOMRect(100, 50, 24, 24)
  return {
    button: 0,
    buttons: 0,
    isPrimary: true,
    pointerId: 1,
    pointerType: 'mouse',
    currentTarget: button,
    ...overrides,
  } as PointerEvent<HTMLButtonElement>
}

function dispatchPointer(
  type: string,
  pointerId = 1,
  clientX = 112,
  clientY = 62,
  buttons = type === 'pointermove' ? 1 : 0
) {
  const event = new MouseEvent(type, { buttons, clientX, clientY })
  Object.defineProperty(event, 'pointerId', { value: pointerId })
  window.dispatchEvent(event)
}

function keyboardEvent(key: string) {
  return { key } as KeyboardEvent<HTMLButtonElement>
}

describe('useTerminalControlPress', () => {
  it.each(['mouse', 'pen'] as const)(
    'slightly magnifies on %s hover and settles when the pointer leaves',
    (pointerType) => {
      const { result } = renderHook(() => useTerminalControlPress(false))

      act(() => {
        result.current.handlers.onPointerEnter(pointerDown({ pointerType }))
      })
      expect(result.current.hovered).toBe(true)
      expect(result.current.pressed).toBe(false)
      expect(result.current.animation).toEqual({ scale: 1.1, x: 0, y: 0 })

      act(() => {
        result.current.handlers.onPointerLeave()
      })
      expect(result.current.hovered).toBe(false)
      expect(result.current.animation).toEqual({ scale: 1, x: 0, y: 0 })
    }
  )

  it.each([{ pointerType: 'touch' }, { buttons: 1 }, { buttons: 2 }] as const)(
    'does not magnify on touch or a held pointer entering: %j',
    (overrides) => {
      const { result } = renderHook(() => useTerminalControlPress(false))

      act(() => {
        result.current.handlers.onPointerEnter(pointerDown(overrides))
      })
      expect(result.current.hovered).toBe(false)
      expect(result.current.animation).toEqual({ scale: 1, x: 0, y: 0 })
    }
  )

  it('gives pressing precedence over hover and returns to hover on release inside', () => {
    const { result } = renderHook(() => useTerminalControlPress(false))
    act(() => {
      result.current.handlers.onPointerEnter(pointerDown())
      result.current.handlers.onPointerDown(pointerDown())
    })
    expect(result.current.hovered).toBe(true)
    expect(result.current.pressed).toBe(true)
    expect(result.current.animation.scale).toBe(1.18)

    act(() => {
      dispatchPointer('pointerup')
    })
    expect(result.current.hovered).toBe(true)
    expect(result.current.pressed).toBe(false)
    expect(result.current.animation).toEqual({ scale: 1.1, x: 0, y: 0 })
  })

  it('keeps a held press when leaving but settles fully after release outside', () => {
    const { result } = renderHook(() => useTerminalControlPress(false))
    act(() => {
      result.current.handlers.onPointerEnter(pointerDown())
      result.current.handlers.onPointerDown(pointerDown())
    })
    act(() => {
      result.current.handlers.onPointerLeave()
      dispatchPointer('pointermove', 1, 500, 500)
    })
    expect(result.current.hovered).toBe(false)
    expect(result.current.pressed).toBe(true)
    expect(result.current.animation).toEqual({ scale: 1.18, x: 1.5, y: 1.5 })

    act(() => {
      dispatchPointer('pointerup', 1, 500, 500)
    })
    expect(result.current.pressed).toBe(false)
    expect(result.current.animation).toEqual({ scale: 1, x: 0, y: 0 })
  })

  it('clears previous mouse hover when a touch press starts', () => {
    const { result } = renderHook(() => useTerminalControlPress(false))
    act(() => {
      result.current.handlers.onPointerEnter(pointerDown())
    })
    act(() => {
      result.current.handlers.onPointerDown(pointerDown({ pointerType: 'touch' }))
    })
    expect(result.current.hovered).toBe(false)
    expect(result.current.pressed).toBe(true)

    act(() => {
      dispatchPointer('pointerup')
    })
    expect(result.current.animation).toEqual({ scale: 1, x: 0, y: 0 })
  })

  it.each(['window blur', 'button blur'])(
    'clears an unpressed hover on %s',
    (reason) => {
      const { result } = renderHook(() => useTerminalControlPress(false))
      act(() => {
        result.current.handlers.onPointerEnter(pointerDown())
      })

      act(() => {
        if (reason === 'window blur') window.dispatchEvent(new Event('blur'))
        else result.current.handlers.onBlur()
      })
      expect(result.current.hovered).toBe(false)
      expect(result.current.animation).toEqual({ scale: 1, x: 0, y: 0 })
    }
  )

  it.each([{ button: 2 }, { isPrimary: false }])(
    'ignores non-primary presses: %j',
    (overrides) => {
      const { result } = renderHook(() => useTerminalControlPress(false))

      act(() => {
        result.current.handlers.onPointerDown(pointerDown(overrides))
      })

      expect(result.current.pressed).toBe(false)
      expect(result.current.animation).toEqual({ scale: 1, x: 0, y: 0 })
    }
  )

  it('responds only to the pressed pointer and resets when released outside', () => {
    const { result } = renderHook(() => useTerminalControlPress(false))
    act(() => {
      result.current.handlers.onPointerDown(pointerDown())
    })
    expect(result.current.pressed).toBe(true)
    expect(result.current.animation.scale).toBeGreaterThan(1)

    act(() => {
      dispatchPointer('pointermove', 2, 200, 200)
      dispatchPointer('pointerup', 2)
      dispatchPointer('pointercancel', 2)
    })
    expect(result.current.pressed).toBe(true)
    expect(result.current.animation).toMatchObject({ x: 0, y: 0 })

    act(() => {
      dispatchPointer('pointermove', 1, 117, 59)
    })
    expect(result.current.animation.x).toBeGreaterThan(0)
    expect(result.current.animation.y).toBeLessThan(0)

    act(() => {
      dispatchPointer('pointerup', 1, 500, 500)
    })
    expect(result.current.pressed).toBe(false)
    expect(result.current.animation).toEqual({ scale: 1, x: 0, y: 0 })

    act(() => {
      dispatchPointer('pointermove', 1, 500, 500)
    })
    expect(result.current.animation).toEqual({ scale: 1, x: 0, y: 0 })
  })

  it('bounds the glass displacement while the pointer moves far outside the target', () => {
    const { result } = renderHook(() => useTerminalControlPress(false))
    act(() => {
      result.current.handlers.onPointerDown(pointerDown())
    })

    act(() => {
      dispatchPointer('pointermove', 1, 1000, -1000)
    })
    expect(result.current.animation).toMatchObject({ x: 1.5, y: -1.5 })

    act(() => {
      dispatchPointer('pointermove', 1, -1000, 1000)
    })
    expect(result.current.animation).toMatchObject({ x: -1.5, y: 1.5 })

    act(() => {
      dispatchPointer('pointermove', 1, 112, 62)
    })
    expect(result.current.animation).toMatchObject({ x: 0, y: 0 })
  })

  it.each([0, 2])(
    'resets when the primary button is released without a pointerup, leaving buttons=%s',
    (buttons) => {
      const { result } = renderHook(() => useTerminalControlPress(false))
      act(() => {
        result.current.handlers.onPointerDown(pointerDown())
      })

      act(() => {
        dispatchPointer('pointermove', 1, 120, 70, 3)
        dispatchPointer('pointermove', 2, 120, 70, buttons)
      })
      expect(result.current.pressed).toBe(true)

      act(() => {
        dispatchPointer('pointermove', 1, 120, 70, buttons)
      })
      expect(result.current.pressed).toBe(false)
      expect(result.current.animation).toEqual({ scale: 1, x: 0, y: 0 })

      act(() => {
        dispatchPointer('pointermove', 1, 120, 70)
      })
      expect(result.current.pressed).toBe(false)
    }
  )

  it.each(['pointercancel', 'window blur', 'button blur'])(
    'clears hover and a held press on %s',
    (reason) => {
      const { result } = renderHook(() => useTerminalControlPress(false))
      act(() => {
        result.current.handlers.onPointerEnter(pointerDown())
        result.current.handlers.onPointerDown(pointerDown())
      })
      act(() => {
        dispatchPointer('pointermove', 1, 120, 70)
      })

      act(() => {
        if (reason === 'pointercancel') dispatchPointer('pointercancel')
        else if (reason === 'window blur') window.dispatchEvent(new Event('blur'))
        else result.current.handlers.onBlur()
      })

      expect(result.current.pressed).toBe(false)
      expect(result.current.hovered).toBe(false)
      expect(result.current.animation).toEqual({ scale: 1, x: 0, y: 0 })
    }
  )

  it.each([' ', 'Enter'])(
    'animates keyboard activation with %j without treating arrow navigation as a press',
    (key) => {
      const { result } = renderHook(() => useTerminalControlPress(false))
      act(() => {
        result.current.handlers.onKeyDown(keyboardEvent('ArrowDown'))
      })
      expect(result.current.pressed).toBe(false)

      act(() => {
        result.current.handlers.onKeyDown(keyboardEvent(key))
      })
      expect(result.current.pressed).toBe(true)
      expect(result.current.animation.scale).toBeGreaterThan(1)

      act(() => {
        dispatchPointer('pointermove', 1, 500, 500)
        result.current.handlers.onKeyUp(keyboardEvent('ArrowDown'))
      })
      expect(result.current.pressed).toBe(true)
      expect(result.current.animation).toMatchObject({ x: 0, y: 0 })

      act(() => {
        result.current.handlers.onKeyUp(keyboardEvent(key))
      })
      expect(result.current.pressed).toBe(false)
      expect(result.current.animation).toEqual({ scale: 1, x: 0, y: 0 })
    }
  )

  it('keeps hover and pressed feedback without scaling or displacement when motion is reduced', () => {
    const { result } = renderHook(() => useTerminalControlPress(true))
    act(() => {
      result.current.handlers.onPointerEnter(pointerDown())
    })
    expect(result.current.hovered).toBe(true)
    expect(result.current.animation).toEqual({ scale: 1, x: 0, y: 0 })

    act(() => {
      result.current.handlers.onPointerDown(pointerDown())
    })
    act(() => {
      dispatchPointer('pointermove', 1, 500, 500)
    })

    expect(result.current.pressed).toBe(true)
    expect(result.current.animation).toEqual({ scale: 1, x: 0, y: 0 })

    act(() => {
      dispatchPointer('pointerup')
    })
    expect(result.current.pressed).toBe(false)
  })

  it('removes the active pointer and blur listeners on unmount', () => {
    const addListener = vi.spyOn(window, 'addEventListener')
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const { result, unmount } = renderHook(() => useTerminalControlPress(false))
    act(() => {
      result.current.handlers.onPointerDown(pointerDown())
    })
    unmount()

    for (const type of ['pointermove', 'pointerup', 'pointercancel', 'blur']) {
      const registeredListener = addListener.mock.calls.find(
        ([eventType]) => eventType === type
      )?.[1]
      expect(registeredListener).toBeTypeOf('function')
      expect(removeListener).toHaveBeenCalledWith(type, registeredListener)
    }
  })
})
