import { useCallback, useEffect, useState } from 'react'

import type { PointerEvent } from 'react'

/** Detect real mouse/pen hover without relying on device capability media queries. */
export function usePointerHover() {
  const [pointerHovered, setPointerHovered] = useState(false)
  const clearPointerHover = useCallback(() => {
    setPointerHovered(false)
  }, [])

  useEffect(() => {
    if (!pointerHovered) return

    const handleVisibilityChange = () => {
      if (document.hidden) clearPointerHover()
    }

    window.addEventListener('blur', clearPointerHover)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('blur', clearPointerHover)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [clearPointerHover, pointerHovered])

  return {
    pointerHovered,
    pointerHoverHandlers: {
      onPointerCancel: clearPointerHover,
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== 'touch') setPointerHovered(true)
      },
      onPointerLeave: clearPointerHover,
    },
  }
}
