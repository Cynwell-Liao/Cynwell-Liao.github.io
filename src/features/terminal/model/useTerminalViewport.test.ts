import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTerminalViewport } from './useTerminalViewport'

function createMediaQuery(matches: boolean) {
  return Object.assign(new EventTarget(), { matches })
}

function createVisualViewport() {
  return Object.assign(new EventTarget(), {
    width: 390,
    height: 780,
    offsetLeft: 0,
    offsetTop: 0,
    scale: 1,
  })
}

describe('useTerminalViewport', () => {
  let media: ReturnType<typeof createMediaQuery>
  let viewport: ReturnType<typeof createVisualViewport>
  let frames: Map<number, FrameRequestCallback>
  let nextFrame: number
  let queries: string[]

  function flushFrame() {
    act(() => {
      const pending = [...frames.values()]
      frames.clear()
      pending.forEach((callback) => {
        callback(0)
      })
    })
  }

  beforeEach(() => {
    media = createMediaQuery(true)
    viewport = createVisualViewport()
    frames = new Map()
    nextFrame = 0
    queries = []
    vi.stubGlobal('innerWidth', 390)
    vi.stubGlobal('innerHeight', 844)
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => {
        queries.push(query)
        return media
      })
    )
    vi.stubGlobal('visualViewport', viewport)
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        nextFrame += 1
        frames.set(nextFrame, callback)
        return nextFrame
      })
    )
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((frame: number) => {
        frames.delete(frame)
      })
    )
  })

  it('reads the visible mobile viewport synchronously', () => {
    viewport.offsetTop = 8
    const { result } = renderHook(useTerminalViewport)

    expect(queries).toEqual(['(max-width: 639px), (hover: none) and (pointer: coarse)'])
    expect(result.current).toEqual({
      width: 390,
      height: 780,
      offsetLeft: 0,
      offsetTop: 8,
    })
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('follows keyboard resizing and panning, then restores the visible area', () => {
    const { result } = renderHook(useTerminalViewport)
    const original = result.current

    viewport.height = 360
    viewport.dispatchEvent(new Event('resize'))
    flushFrame()
    expect(result.current?.height).toBe(360)
    expect(window.innerHeight).toBe(844)

    viewport.offsetTop = 50
    viewport.offsetLeft = 3
    viewport.dispatchEvent(new Event('scroll'))
    flushFrame()
    expect(result.current).toEqual({
      width: 390,
      height: 360,
      offsetLeft: 3,
      offsetTop: 50,
    })

    Object.assign(viewport, { height: 780, offsetLeft: 0, offsetTop: 0 })
    viewport.dispatchEvent(new Event('resize'))
    flushFrame()
    expect(result.current).toEqual(original)
  })

  it('coalesces viewport events and ignores unchanged geometry', () => {
    const { result } = renderHook(useTerminalViewport)
    const original = result.current
    viewport.dispatchEvent(new Event('resize'))
    viewport.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('resize'))
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1)
    flushFrame()
    expect(result.current).toBe(original)

    viewport.height = 380
    viewport.dispatchEvent(new Event('resize'))
    viewport.height = 340
    viewport.dispatchEvent(new Event('resize'))
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2)
    flushFrame()
    expect(result.current?.height).toBe(340)
  })

  it('freezes dimensions and offsets while pinching and resumes at normal scale', () => {
    const { result } = renderHook(useTerminalViewport)
    const original = result.current
    Object.assign(viewport, {
      scale: 2,
      width: 195,
      height: 390,
      offsetLeft: 70,
      offsetTop: 120,
    })
    viewport.dispatchEvent(new Event('resize'))
    viewport.dispatchEvent(new Event('scroll'))
    flushFrame()
    expect(result.current).toBe(original)

    Object.assign(viewport, {
      scale: 1.001,
      width: 390,
      height: 780,
      offsetLeft: 0,
      offsetTop: 10,
    })
    viewport.dispatchEvent(new Event('resize'))
    flushFrame()
    expect(result.current).toEqual({
      width: 390,
      height: 780,
      offsetLeft: 0,
      offsetTop: 10,
    })
  })

  it('uses layout dimensions when opened while already zoomed', () => {
    Object.assign(viewport, { scale: 2, width: 195, height: 390, offsetTop: 150 })
    const { result } = renderHook(useTerminalViewport)
    expect(result.current).toEqual({
      width: 390,
      height: 844,
      offsetLeft: 0,
      offsetTop: 0,
    })
    viewport.offsetTop = 200
    viewport.dispatchEvent(new Event('scroll'))
    flushFrame()
    expect(result.current?.offsetTop).toBe(0)
  })

  it('falls back to window dimensions when the visual viewport API is unavailable', () => {
    vi.stubGlobal('visualViewport', undefined)
    const { result, unmount } = renderHook(useTerminalViewport)
    expect(result.current).toEqual({
      width: 390,
      height: 844,
      offsetLeft: 0,
      offsetTop: 0,
    })

    vi.stubGlobal('innerWidth', 844)
    vi.stubGlobal('innerHeight', 390)
    window.dispatchEvent(new Event('resize'))
    flushFrame()
    expect(result.current).toEqual({
      width: 844,
      height: 390,
      offsetLeft: 0,
      offsetTop: 0,
    })
    unmount()
  })

  it('adapts to mobile media changes and touch landscape orientation', () => {
    media.matches = false
    const { result } = renderHook(useTerminalViewport)
    expect(result.current).toBeNull()

    media.matches = true
    media.dispatchEvent(new Event('change'))
    flushFrame()
    expect(result.current?.width).toBe(390)

    Object.assign(viewport, { width: 844, height: 340 })
    vi.stubGlobal('innerWidth', 844)
    window.dispatchEvent(new Event('resize'))
    flushFrame()
    expect(result.current).toEqual({
      width: 844,
      height: 340,
      offsetLeft: 0,
      offsetTop: 0,
    })

    media.matches = false
    media.dispatchEvent(new Event('change'))
    flushFrame()
    expect(result.current).toBeNull()
  })

  it('removes listeners and cancels pending frame updates on unmount', () => {
    const removeMediaListener = vi.spyOn(media, 'removeEventListener')
    const removeViewportListener = vi.spyOn(viewport, 'removeEventListener')
    const removeWindowListener = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(useTerminalViewport)
    viewport.dispatchEvent(new Event('resize'))
    expect(frames.size).toBe(1)

    unmount()

    expect(removeMediaListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(removeViewportListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(removeViewportListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(removeWindowListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1)
    expect(frames.size).toBe(0)
    viewport.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('resize'))
    media.dispatchEvent(new Event('change'))
    expect(frames.size).toBe(0)
  })
})
