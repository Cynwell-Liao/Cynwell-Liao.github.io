import { useCallback, useEffect, useRef, useState } from 'react'

import type { PointerEvent } from 'react'

/** Normalize mouse/pen hover and brief touch-press feedback across browsers. */
export function usePointerFeedback() {
  const [pointerHovered, setPointerHovered] = useState(false)
  const [touchPressed, setTouchPressed] = useState(false)
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearReleaseTimer = useCallback(() => {
    if (releaseTimer.current === null) return
    clearTimeout(releaseTimer.current)
    releaseTimer.current = null
  }, [])

  const clearPointerHover = useCallback(() => {
    setPointerHovered(false)
  }, [])

  const clearPointerState = useCallback(() => {
    clearReleaseTimer()
    setPointerHovered(false)
    setTouchPressed(false)
  }, [clearReleaseTimer])

  const releaseTouchPress = useCallback(() => {
    clearReleaseTimer()
    releaseTimer.current = setTimeout(() => {
      releaseTimer.current = null
      setTouchPressed(false)
    }, 150)
  }, [clearReleaseTimer])

  useEffect(() => {
    if (!pointerHovered && !touchPressed) return

    const handleVisibilityChange = () => {
      if (document.hidden) clearPointerState()
    }
    const handlePointerUp = (event: globalThis.PointerEvent) => {
      if (event.pointerType === 'touch') releaseTouchPress()
    }
    const handlePointerCancel = (event: globalThis.PointerEvent) => {
      if (event.pointerType === 'touch') clearPointerState()
    }

    window.addEventListener('blur', clearPointerState)
    window.addEventListener('pointercancel', handlePointerCancel)
    window.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('blur', clearPointerState)
      window.removeEventListener('pointercancel', handlePointerCancel)
      window.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [clearPointerState, pointerHovered, releaseTouchPress, touchPressed])

  useEffect(() => clearReleaseTimer, [clearReleaseTimer])

  return {
    pointerActive: pointerHovered || touchPressed,
    pointerHovered,
    pointerFeedbackHandlers: {
      onPointerCancel: clearPointerState,
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== 'touch' || !event.isPrimary) return
        clearReleaseTimer()
        setTouchPressed(true)
      },
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== 'touch') setPointerHovered(true)
      },
      onPointerLeave: clearPointerHover,
      onPointerUp: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType === 'touch') releaseTouchPress()
      },
    },
  }
}
