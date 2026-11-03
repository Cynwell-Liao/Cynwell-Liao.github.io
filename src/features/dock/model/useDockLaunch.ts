import { useEffect, useRef, useState } from 'react'

/**
 * Open a Dock profile destination after the three-bounce launch animation completes.
 *
 * Desktop browsers with a fine pointer and active transient user activation open an
 * isolated tab. Touch/mobile browsers (including Safari and in-app WebViews such as
 * LinkedIn) and browsers whose transient activation expired during the bounce block
 * asynchronous `_blank` popups, so redirect the current browsing context instead.
 */
export function openLaunchedProfile(
  url: string,
  location: Pick<Location, 'assign'> = window.location
) {
  const isTouchPrimary = window.matchMedia('(pointer: coarse), (hover: none)').matches

  if (!isTouchPrimary && navigator.userActivation.isActive) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  location.assign(url)
}

/** Keep each launch pending until its icon has landed, without queuing repeat clicks. */
export function useDockLaunch() {
  const pending = useRef(new Map<number, () => void>())
  const [launching, setLaunching] = useState<number[]>([])

  useEffect(() => {
    const actions = pending.current
    return () => {
      actions.clear()
    }
  }, [])

  const startLaunch = (index: number, action: () => void, immediate: boolean) => {
    if (pending.current.has(index)) return
    if (immediate) {
      action()
      return
    }
    pending.current.set(index, action)
    setLaunching((current) => [...current, index])
  }

  const completeLaunch = (index: number) => {
    const action = pending.current.get(index)
    if (!action) return
    pending.current.delete(index)
    setLaunching((current) => current.filter((app) => app !== index))
    action()
  }

  const cancelLaunch = (index: number) => {
    if (!pending.current.delete(index)) return
    setLaunching((current) => current.filter((app) => app !== index))
  }

  return { launching, startLaunch, completeLaunch, cancelLaunch }
}
