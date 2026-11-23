import { useEffect, useRef, useState } from 'react'

import { openExternalUrl } from '@shared/lib/browser/openExternalUrl'

import {
  DOCK_LAUNCH_BOUNCES,
  DOCK_LAUNCH_HOP_DURATION_SECONDS,
} from './dockLaunchAnimation'

const DOCK_LAUNCH_FALLBACK_MS =
  DOCK_LAUNCH_BOUNCES * DOCK_LAUNCH_HOP_DURATION_SECONDS * 1000 + 250

interface PendingLaunch {
  action: () => void
  fallback: ReturnType<typeof setTimeout>
}

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
  openExternalUrl(url, location)
}

/** Keep each launch pending until its icon has landed, without queuing repeat clicks. */
export function useDockLaunch() {
  const pending = useRef(new Map<number, PendingLaunch>())
  const [launching, setLaunching] = useState<number[]>([])

  useEffect(() => {
    const actions = pending.current
    return () => {
      for (const launch of actions.values()) clearTimeout(launch.fallback)
      actions.clear()
    }
  }, [])

  const startLaunch = (index: number, action: () => void, immediate: boolean) => {
    if (pending.current.has(index)) return
    if (immediate) {
      action()
      return
    }
    const fallback = setTimeout(() => {
      completeLaunch(index)
    }, DOCK_LAUNCH_FALLBACK_MS)
    pending.current.set(index, { action, fallback })
    setLaunching((current) => [...current, index])
  }

  const completeLaunch = (index: number) => {
    const launch = pending.current.get(index)
    if (!launch) return
    pending.current.delete(index)
    clearTimeout(launch.fallback)
    setLaunching((current) => current.filter((app) => app !== index))
    launch.action()
  }

  const cancelLaunch = (index: number) => {
    const launch = pending.current.get(index)
    if (!launch) return
    clearTimeout(launch.fallback)
    pending.current.delete(index)
    setLaunching((current) => current.filter((app) => app !== index))
  }

  return { launching, startLaunch, completeLaunch, cancelLaunch }
}
