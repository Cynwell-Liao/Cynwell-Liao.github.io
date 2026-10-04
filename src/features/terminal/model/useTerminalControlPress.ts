import { useCallback, useEffect, useRef, useState } from 'react'

import type { KeyboardEvent, PointerEvent } from 'react'

const restingPose = { pressed: false, x: 0, y: 0 }
const flex = (distance: number) => Math.max(-1.5, Math.min(1.5, distance * 0.12))

/** Keep the native button target stationary while its glass surface responds. */
export function useTerminalControlPress(reducedMotion: boolean | null) {
  const [pose, setPose] = useState(restingPose)
  const [hovered, setHovered] = useState(false)
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null)

  const reset = useCallback(() => {
    pointer.current = null
    setPose(restingPose)
  }, [])

  const cancel = useCallback(() => {
    reset()
    setHovered(false)
  }, [reset])

  useEffect(() => {
    if (!pose.pressed && !hovered) return

    const move = (event: globalThis.PointerEvent) => {
      const origin = pointer.current
      if (!origin || event.pointerId !== origin.id) return
      if ((event.buttons & 1) === 0) {
        reset()
        return
      }
      setPose({
        pressed: true,
        x: flex(event.clientX - origin.x),
        y: flex(event.clientY - origin.y),
      })
    }
    const release = (event: globalThis.PointerEvent) => {
      if (event.pointerId === pointer.current?.id) reset()
    }
    const cancelPointer = (event: globalThis.PointerEvent) => {
      if (event.pointerId === pointer.current?.id) cancel()
    }

    // Do not capture the pointer: releasing outside must cancel the button's click.
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', cancelPointer)
    window.addEventListener('blur', cancel)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', cancelPointer)
      window.removeEventListener('blur', cancel)
    }
  }, [pose.pressed, hovered, reset, cancel])

  return {
    pressed: pose.pressed,
    hovered,
    animation: {
      // A subtle hover lift, with a stronger response while pressing the glass.
      scale: reducedMotion ? 1 : pose.pressed ? 1.18 : hovered ? 1.1 : 1,
      x: reducedMotion ? 0 : pose.x,
      y: reducedMotion ? 0 : pose.y,
    },
    handlers: {
      onPointerEnter: (event: PointerEvent<HTMLButtonElement>) => {
        if (event.pointerType !== 'touch' && event.buttons === 0) setHovered(true)
      },
      onPointerLeave: () => {
        setHovered(false)
      },
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0 || !event.isPrimary) return
        if (event.pointerType === 'touch') setHovered(false)
        const bounds = event.currentTarget.getBoundingClientRect()
        pointer.current = {
          id: event.pointerId,
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2,
        }
        setPose({ pressed: true, x: 0, y: 0 })
      },
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === ' ' || event.key === 'Enter') {
          setPose({ pressed: true, x: 0, y: 0 })
        }
      },
      onKeyUp: (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === ' ' || event.key === 'Enter') reset()
      },
      onBlur: cancel,
    },
  }
}
