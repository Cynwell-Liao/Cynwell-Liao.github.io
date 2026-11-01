import { useEffect, useState } from 'react'

interface TerminalViewport {
  width: number
  height: number
  offsetLeft: number
  offsetTop: number
}

const MOBILE_QUERY = '(max-width: 639px), (hover: none) and (pointer: coarse)'

function readViewport(
  mobile: boolean,
  previous: TerminalViewport | null
): TerminalViewport | null {
  if (!mobile) return null

  const viewport = window.visualViewport
  // Follow the keyboard and browser chrome, but leave manual pinch zoom alone.
  if (viewport && Math.abs(viewport.scale - 1) > 0.01 && previous) return previous

  const next =
    viewport && Math.abs(viewport.scale - 1) <= 0.01
      ? {
          width: viewport.width,
          height: viewport.height,
          offsetLeft: viewport.offsetLeft,
          offsetTop: viewport.offsetTop,
        }
      : {
          width: window.innerWidth,
          height: window.innerHeight,
          offsetLeft: 0,
          offsetTop: 0,
        }

  return previous &&
    previous.width === next.width &&
    previous.height === next.height &&
    previous.offsetLeft === next.offsetLeft &&
    previous.offsetTop === next.offsetTop
    ? previous
    : next
}

export function useTerminalViewport() {
  const [mobileQuery] = useState(() => window.matchMedia(MOBILE_QUERY))
  const [viewport, setViewport] = useState(() =>
    readViewport(mobileQuery.matches, null)
  )

  useEffect(() => {
    const visualViewport = window.visualViewport
    let frame: number | null = null
    const scheduleUpdate = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        setViewport((previous) => readViewport(mobileQuery.matches, previous))
      })
    }

    mobileQuery.addEventListener('change', scheduleUpdate)
    window.addEventListener('resize', scheduleUpdate)
    visualViewport?.addEventListener('resize', scheduleUpdate)
    visualViewport?.addEventListener('scroll', scheduleUpdate)
    return () => {
      mobileQuery.removeEventListener('change', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      visualViewport?.removeEventListener('resize', scheduleUpdate)
      visualViewport?.removeEventListener('scroll', scheduleUpdate)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [mobileQuery])

  return viewport
}
