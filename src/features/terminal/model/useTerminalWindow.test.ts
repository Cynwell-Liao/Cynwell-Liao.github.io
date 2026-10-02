import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTerminalWindow } from './useTerminalWindow'

import type { PointerEvent as ReactPointerEvent } from 'react'

function setViewport(width: number, height: number) {
  vi.stubGlobal('innerWidth', width)
  vi.stubGlobal('innerHeight', height)
}

function pointerStart(overrides: Partial<ReactPointerEvent<HTMLElement>> = {}) {
  const target = document.createElement('div')
  const setPointerCapture = vi.fn()
  const releasePointerCapture = vi.fn()
  const preventDefault = vi.fn()
  target.setPointerCapture = setPointerCapture
  target.hasPointerCapture = vi.fn(() => true)
  target.releasePointerCapture = releasePointerCapture
  const event = {
    isPrimary: true,
    button: 0,
    pointerId: 1,
    clientX: 400,
    clientY: 100,
    currentTarget: target,
    preventDefault,
    ...overrides,
  } as unknown as ReactPointerEvent<HTMLElement>
  return { event, setPointerCapture, releasePointerCapture, preventDefault }
}

function dispatchPointer(type: string, clientX = 400, clientY = 100, pointerId = 1) {
  const event = new MouseEvent(type, { clientX, clientY })
  Object.defineProperty(event, 'pointerId', { value: pointerId })
  window.dispatchEvent(event)
}

describe('useTerminalWindow', () => {
  beforeEach(() => {
    setViewport(1200, 800)
  })

  it('centers a window and restores its size after entering full screen', () => {
    const { result } = renderHook(useTerminalWindow)
    expect(result.current.bounds).toEqual({ x: 280, y: 96, width: 640, height: 420 })

    act(() => {
      result.current.resizeBy(40, 60)
    })
    const resized = result.current.bounds
    act(() => {
      result.current.toggleExpanded()
    })
    expect(result.current.mode).toBe('fullscreen')
    expect(result.current.bounds).toEqual({ x: 0, y: 0, width: 1200, height: 800 })

    act(() => {
      result.current.resizeBy(-100, -100)
    })
    expect(result.current.bounds.width).toBe(1200)
    act(() => {
      result.current.toggleExpanded()
    })
    expect(result.current.mode).toBe('windowed')
    expect(result.current.bounds).toEqual(resized)
  })

  it('tiles either half with a gap and preserves the original window', () => {
    const { result } = renderHook(useTerminalWindow)
    const original = result.current.bounds
    act(() => {
      result.current.tile('left')
    })
    expect(result.current.mode).toBe('left')
    expect(result.current.bounds).toEqual({ x: 8, y: 8, width: 590, height: 784 })
    act(() => {
      result.current.tile('right')
    })
    expect(result.current.bounds).toEqual({ x: 602, y: 8, width: 590, height: 784 })
    act(() => {
      result.current.restoreWindowed()
    })
    expect(result.current.mode).toBe('windowed')
    expect(result.current.bounds).toEqual(original)
  })

  it('zooms inside the viewport and restores each mode after full screen', () => {
    const { result } = renderHook(useTerminalWindow)
    act(() => {
      result.current.resizeBy(40, 60)
    })
    const original = result.current.bounds
    act(() => {
      result.current.toggleZoom()
    })
    expect(result.current.mode).toBe('zoomed')
    expect(result.current.bounds).toEqual({ x: 12, y: 12, width: 1176, height: 776 })

    act(() => {
      result.current.toggleExpanded()
    })
    expect(result.current.mode).toBe('fullscreen')
    expect(result.current.bounds).toEqual({ x: 0, y: 0, width: 1200, height: 800 })
    act(() => {
      result.current.toggleZoom()
    })
    expect(result.current.mode).toBe('fullscreen')
    act(() => {
      result.current.toggleExpanded()
    })
    expect(result.current.mode).toBe('zoomed')
    expect(result.current.bounds).toEqual({ x: 12, y: 12, width: 1176, height: 776 })

    act(() => {
      result.current.toggleZoom()
    })
    expect(result.current.mode).toBe('windowed')
    expect(result.current.bounds).toEqual(original)
  })

  it.each(['left', 'right'] as const)(
    'restores the %s tile after full screen without losing the original window',
    (side) => {
      const { result } = renderHook(useTerminalWindow)
      const original = result.current.bounds
      act(() => {
        result.current.tile(side)
      })
      const tiled = result.current.bounds
      act(() => {
        result.current.toggleExpanded()
      })
      expect(result.current.mode).toBe('fullscreen')
      act(() => {
        result.current.toggleExpanded()
      })
      expect(result.current.mode).toBe(side)
      expect(result.current.bounds).toEqual(tiled)
      act(() => {
        result.current.restoreWindowed()
      })
      expect(result.current.bounds).toEqual(original)
    }
  )

  it('recalculates zoomed bounds after viewport changes and preserves the manual size', () => {
    const { result } = renderHook(useTerminalWindow)
    const original = result.current.bounds
    act(() => {
      result.current.toggleZoom()
    })
    act(() => {
      setViewport(1400, 1000)
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.mode).toBe('zoomed')
    expect(result.current.bounds).toEqual({ x: 12, y: 12, width: 1376, height: 976 })
    act(() => {
      result.current.toggleExpanded()
    })
    act(() => {
      setViewport(1600, 1100)
      window.dispatchEvent(new Event('resize'))
    })
    act(() => {
      result.current.toggleExpanded()
    })
    expect(result.current.mode).toBe('zoomed')
    expect(result.current.bounds).toEqual({ x: 12, y: 12, width: 1576, height: 1076 })
    act(() => {
      result.current.restoreWindowed()
    })
    expect(result.current.bounds).toEqual(original)
  })

  it('keeps zoom inset on a narrow viewport and ignores manual resizing and dragging', () => {
    const { result } = renderHook(useTerminalWindow)
    act(() => {
      result.current.tile('left')
    })
    act(() => {
      result.current.toggleZoom()
    })
    const drag = pointerStart()
    act(() => {
      result.current.startDrag(drag.event)
      result.current.resizeBy(-100, -100)
    })
    expect(drag.preventDefault).not.toHaveBeenCalled()
    expect(result.current.bounds).toEqual({ x: 12, y: 12, width: 1176, height: 776 })
    act(() => {
      setViewport(375, 500)
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.mode).toBe('zoomed')
    expect(result.current.bounds).toEqual({ x: 12, y: 12, width: 351, height: 476 })
    act(() => {
      result.current.toggleZoom()
    })
    expect(result.current.bounds).toEqual({ x: 12, y: 68, width: 351, height: 420 })
  })

  it('keeps small windows and expanded windows within a resized viewport', () => {
    setViewport(375, 500)
    const { result } = renderHook(useTerminalWindow)
    expect(result.current.bounds).toEqual({ x: 12, y: 96, width: 351, height: 380 })
    act(() => {
      result.current.tile('right')
    })
    expect(result.current.mode).toBe('fullscreen')
    expect(result.current.bounds).toEqual({ x: 0, y: 0, width: 375, height: 500 })

    act(() => {
      setViewport(280, 180)
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.bounds).toEqual({ x: 0, y: 0, width: 280, height: 180 })
    act(() => {
      result.current.toggleExpanded()
    })
    expect(result.current.bounds).toEqual({ x: 12, y: 12, width: 256, height: 156 })
  })

  it('clamps keyboard resizing and viewport changes without losing the title bar', () => {
    const { result } = renderHook(useTerminalWindow)
    act(() => {
      result.current.resizeBy(-1000, -1000)
    })
    expect(result.current.bounds).toEqual({ x: 280, y: 96, width: 320, height: 200 })
    act(() => {
      result.current.resizeBy(2000, 2000)
    })
    expect(result.current.bounds).toEqual({ x: 280, y: 96, width: 908, height: 692 })
    act(() => {
      setViewport(500, 400)
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.bounds).toEqual({ x: 12, y: 12, width: 476, height: 376 })
  })

  it('switches a tiled window to full screen on a narrow viewport and restores its windowed bounds', () => {
    const { result } = renderHook(useTerminalWindow)
    act(() => {
      result.current.resizeBy(-300, -200)
    })
    act(() => {
      result.current.tile('right')
    })
    act(() => {
      setViewport(500, 600)
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current.mode).toBe('fullscreen')
    expect(result.current.bounds).toEqual({ x: 0, y: 0, width: 500, height: 600 })

    act(() => {
      result.current.toggleExpanded()
    })
    expect(result.current.mode).toBe('windowed')
    expect(result.current.bounds).toEqual({ x: 148, y: 96, width: 340, height: 220 })
  })

  it('restores a manual window when a fullscreen tile no longer fits the viewport', () => {
    const { result } = renderHook(useTerminalWindow)
    act(() => {
      result.current.resizeBy(-300, -200)
    })
    act(() => {
      result.current.tile('left')
    })
    act(() => {
      result.current.toggleExpanded()
    })
    act(() => {
      setViewport(500, 600)
      window.dispatchEvent(new Event('resize'))
    })
    act(() => {
      result.current.toggleExpanded()
    })

    expect(result.current.mode).toBe('windowed')
    expect(result.current.bounds).toEqual({ x: 148, y: 96, width: 340, height: 220 })
  })

  it('captures a drag, ignores other pointers and stops moving on pointer up', () => {
    const { result } = renderHook(useTerminalWindow)
    const event = pointerStart()
    act(() => {
      result.current.startDrag(event.event)
    })
    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.setPointerCapture).toHaveBeenCalledWith(1)
    act(() => {
      dispatchPointer('pointermove', 450, 150, 2)
    })
    expect(result.current.bounds.x).toBe(280)
    act(() => {
      dispatchPointer('pointerup', 450, 150, 2)
    })
    act(() => {
      dispatchPointer('pointermove', 450, 150)
    })
    expect(result.current.bounds).toEqual({ x: 330, y: 146, width: 640, height: 420 })
    act(() => {
      dispatchPointer('pointermove', -1000, -1000)
    })
    expect(result.current.bounds.x).toBe(12)
    expect(result.current.bounds.y).toBe(12)
    act(() => {
      dispatchPointer('pointerup')
    })
    expect(event.releasePointerCapture).toHaveBeenCalledWith(1)
    act(() => {
      dispatchPointer('pointermove', 600, 300)
    })
    expect(result.current.bounds.x).toBe(12)
  })

  it('resizes with the corner and stops on pointer cancellation', () => {
    const { result } = renderHook(useTerminalWindow)
    const event = pointerStart()
    act(() => {
      result.current.startResize(event.event)
    })
    act(() => {
      dispatchPointer('pointermove', 500, 200)
    })
    expect(result.current.bounds).toEqual({ x: 280, y: 96, width: 740, height: 520 })
    act(() => {
      dispatchPointer('pointercancel')
    })
    act(() => {
      dispatchPointer('pointermove', 600, 300)
    })
    expect(result.current.bounds.width).toBe(740)
  })

  it('ignores secondary pointers, right clicks, and dragging expanded windows', () => {
    const { result } = renderHook(useTerminalWindow)
    const secondary = pointerStart({ isPrimary: false })
    const rightClick = pointerStart({ button: 2 })
    act(() => {
      result.current.startDrag(secondary.event)
    })
    act(() => {
      result.current.startResize(rightClick.event)
    })
    expect(secondary.preventDefault).not.toHaveBeenCalled()
    expect(rightClick.preventDefault).not.toHaveBeenCalled()
    act(() => {
      result.current.toggleExpanded()
    })
    const expandedDrag = pointerStart()
    act(() => {
      result.current.startDrag(expandedDrag.event)
    })
    expect(expandedDrag.preventDefault).not.toHaveBeenCalled()
  })

  it('releases pointer capture and removes listeners on unmount', () => {
    const { result, unmount } = renderHook(useTerminalWindow)
    const event = pointerStart()
    const removeListener = vi.spyOn(window, 'removeEventListener')
    act(() => {
      result.current.startDrag(event.event)
    })
    unmount()
    expect(event.releasePointerCapture).toHaveBeenCalledWith(1)
    expect(removeListener).toHaveBeenCalledWith('pointermove', expect.any(Function))
    expect(removeListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
