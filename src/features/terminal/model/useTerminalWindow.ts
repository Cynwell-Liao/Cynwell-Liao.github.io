import { useEffect, useRef, useState } from 'react'

import type { PointerEvent as ReactPointerEvent } from 'react'

type WindowMode = 'windowed' | 'zoomed' | 'fullscreen' | 'left' | 'right'

interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

interface WindowLayout {
  mode: WindowMode
  bounds: WindowBounds
  windowedBounds: WindowBounds
  fullscreenRestoreMode: Exclude<WindowMode, 'fullscreen'>
}

const MARGIN = 12

function clampBounds(bounds: WindowBounds): WindowBounds {
  const width = Math.min(
    Math.max(320, bounds.width),
    Math.max(1, window.innerWidth - 24)
  )
  const height = Math.min(
    Math.max(200, bounds.height),
    Math.max(1, window.innerHeight - 24)
  )
  const marginX = Math.min(MARGIN, Math.max(0, (window.innerWidth - width) / 2))
  const marginY = Math.min(MARGIN, Math.max(0, (window.innerHeight - height) / 2))

  return {
    width,
    height,
    x: Math.max(marginX, Math.min(bounds.x, window.innerWidth - width - marginX)),
    y: Math.max(marginY, Math.min(bounds.y, window.innerHeight - height - marginY)),
  }
}

function expandedBounds(mode: Exclude<WindowMode, 'windowed'>): WindowBounds {
  if (mode === 'zoomed') {
    return clampBounds({
      x: MARGIN,
      y: MARGIN,
      width: window.innerWidth - MARGIN * 2,
      height: window.innerHeight - MARGIN * 2,
    })
  }

  if (mode === 'fullscreen' || window.innerWidth < 640) {
    return { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }
  }

  const width = (window.innerWidth - 20) / 2
  return {
    x: mode === 'left' ? 8 : width + 12,
    y: 8,
    width,
    height: Math.max(1, window.innerHeight - 16),
  }
}

function initialLayout(): WindowLayout {
  const width = Math.min(640, window.innerWidth - 24)
  const bounds = clampBounds({
    x: (window.innerWidth - width) / 2,
    y: 96,
    width,
    height: Math.min(420, Math.max(240, window.innerHeight - 120)),
  })
  return {
    mode: 'windowed',
    bounds,
    windowedBounds: bounds,
    fullscreenRestoreMode: 'windowed',
  }
}

function windowedLayout(bounds: WindowBounds): WindowLayout {
  const clamped = clampBounds(bounds)
  return {
    mode: 'windowed',
    bounds: clamped,
    windowedBounds: clamped,
    fullscreenRestoreMode: 'windowed',
  }
}

function resizedBounds(bounds: WindowBounds, widthDelta: number, heightDelta: number) {
  return clampBounds({
    ...bounds,
    width: Math.min(bounds.width + widthDelta, window.innerWidth - bounds.x - MARGIN),
    height: Math.min(
      bounds.height + heightDelta,
      window.innerHeight - bounds.y - MARGIN
    ),
  })
}

export function useTerminalWindow() {
  const [layout, setLayout] = useState(initialLayout)
  const stopPointerInteraction = useRef<(() => void) | null>(null)

  useEffect(() => {
    const handleResize = () => {
      stopPointerInteraction.current?.()
      setLayout((previous) => {
        const mode =
          (previous.mode === 'left' || previous.mode === 'right') &&
          window.innerWidth < 640
            ? 'fullscreen'
            : previous.mode
        return {
          ...previous,
          mode,
          bounds:
            mode === 'windowed' ? clampBounds(previous.bounds) : expandedBounds(mode),
          windowedBounds: clampBounds(previous.windowedBounds),
          fullscreenRestoreMode:
            (mode === 'fullscreen' && previous.mode !== 'fullscreen') ||
            (window.innerWidth < 640 &&
              (previous.fullscreenRestoreMode === 'left' ||
                previous.fullscreenRestoreMode === 'right'))
              ? 'windowed'
              : previous.fullscreenRestoreMode,
        }
      })
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      stopPointerInteraction.current?.()
    }
  }, [])

  function toggleExpanded() {
    stopPointerInteraction.current?.()
    setLayout((previous) => {
      if (previous.mode !== 'fullscreen') {
        return {
          ...previous,
          mode: 'fullscreen',
          bounds: expandedBounds('fullscreen'),
          fullscreenRestoreMode: previous.mode,
        }
      }

      const mode = previous.fullscreenRestoreMode
      return mode === 'windowed'
        ? windowedLayout(previous.windowedBounds)
        : { ...previous, mode, bounds: expandedBounds(mode) }
    })
  }

  function toggleZoom() {
    stopPointerInteraction.current?.()
    setLayout((previous) => {
      if (previous.mode === 'fullscreen') return previous
      return previous.mode === 'zoomed'
        ? windowedLayout(previous.windowedBounds)
        : { ...previous, mode: 'zoomed', bounds: expandedBounds('zoomed') }
    })
  }

  function restoreWindowed() {
    stopPointerInteraction.current?.()
    setLayout((previous) => windowedLayout(previous.windowedBounds))
  }

  function tile(side: 'left' | 'right') {
    stopPointerInteraction.current?.()
    const mode = window.innerWidth < 640 ? 'fullscreen' : side
    setLayout((previous) => ({
      ...previous,
      mode,
      bounds: expandedBounds(mode),
      fullscreenRestoreMode: 'windowed',
    }))
  }

  function startPointerInteraction(
    event: ReactPointerEvent<HTMLElement>,
    resizing: boolean
  ) {
    if (layout.mode !== 'windowed' || !event.isPrimary || event.button !== 0) return

    event.preventDefault()
    stopPointerInteraction.current?.()

    const target = event.currentTarget
    const pointerId = event.pointerId
    const initialX = event.clientX
    const initialY = event.clientY
    const initialBounds = layout.bounds

    const move = (pointer: PointerEvent) => {
      if (pointer.pointerId !== pointerId) return
      const deltaX = pointer.clientX - initialX
      const deltaY = pointer.clientY - initialY
      setLayout(
        windowedLayout(
          resizing
            ? resizedBounds(initialBounds, deltaX, deltaY)
            : {
                ...initialBounds,
                x: initialBounds.x + deltaX,
                y: initialBounds.y + deltaY,
              }
        )
      )
    }

    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      target.removeEventListener('lostpointercapture', end)
      stopPointerInteraction.current = null
      if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId)
    }

    const end = (pointer: PointerEvent) => {
      if (pointer.pointerId === pointerId) stop()
    }

    stopPointerInteraction.current = stop
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    target.addEventListener('lostpointercapture', end)
    target.setPointerCapture(pointerId)
  }

  function resizeBy(widthDelta: number, heightDelta: number) {
    setLayout((previous) =>
      previous.mode === 'windowed'
        ? windowedLayout(resizedBounds(previous.bounds, widthDelta, heightDelta))
        : previous
    )
  }

  return {
    mode: layout.mode,
    bounds: layout.bounds,
    toggleExpanded,
    toggleZoom,
    restoreWindowed,
    tile,
    startDrag: (event: ReactPointerEvent<HTMLElement>) => {
      startPointerInteraction(event, false)
    },
    startResize: (event: ReactPointerEvent<HTMLElement>) => {
      startPointerInteraction(event, true)
    },
    resizeBy,
  }
}
