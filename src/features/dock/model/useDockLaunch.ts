import { useEffect, useRef, useState } from 'react'

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
