import { useCallback, useEffect, useRef, useState } from 'react'

import { SECTION_ID } from '@shared/lib/navigation'

import type { NavLink } from './nav.types'

type ActiveHref = NavLink['href'] | null
interface Destination {
  href: ActiveHref
  id: string
}

const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
])

function hashDestination(links: readonly NavLink[]): Destination | null {
  const hash = window.location.hash
  const link = links.find(({ href }) => href === hash)
  if (link) return { href: link.href, id: link.href.slice(1) }
  return hash === `#${SECTION_ID.home}` ? { href: null, id: SECTION_ID.home } : null
}

function visibleSection(links: readonly NavLink[]): ActiveHref {
  // Keep the activation line below the fixed header and 96px anchor scroll margin,
  // including short landscape viewports where 30% would fall above the target.
  const activationLine = Math.max(128, window.innerHeight * 0.3)
  const atBottom =
    window.scrollY > 0 &&
    window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
  let active: ActiveHref = null

  for (const { href } of links) {
    const section = document.getElementById(href.slice(1))
    if (
      section &&
      (atBottom || section.getBoundingClientRect().top <= activationLine)
    ) {
      active = href
    }
  }
  return active
}

export function useActiveSection(links: readonly NavLink[]) {
  const [activeHref, setActiveHref] = useState<ActiveHref>(
    () => hashDestination(links)?.href ?? null
  )
  const pending = useRef<Destination | null>(null)
  const timeout = useRef<number | undefined>(undefined)

  const clearPending = useCallback(() => {
    pending.current = null
    window.clearTimeout(timeout.current)
    timeout.current = undefined
  }, [])

  const syncSection = useCallback(() => {
    const visible = visibleSection(links)
    const destination = pending.current
    if (destination && document.getElementById(destination.id)) {
      // Keep the clicked pill selected while smooth scrolling past other sections.
      if (visible !== destination.href) return
    }
    clearPending()
    setActiveHref(visible)
  }, [clearPending, links])

  const selectDestination = useCallback(
    (destination: Destination) => {
      clearPending()
      if (!document.getElementById(destination.id)) {
        syncSection()
        return
      }
      pending.current = destination
      setActiveHref(destination.href)
      // Fallback for browsers without scrollend and links whose scroll is cancelled.
      timeout.current = window.setTimeout(() => {
        clearPending()
        syncSection()
      }, 2000)
      syncSection()
    },
    [clearPending, syncSection]
  )

  const selectSection = useCallback(
    (href: NavLink['href']) => {
      selectDestination({ href, id: href.slice(1) })
    },
    [selectDestination]
  )

  useEffect(() => {
    let frame: number | null = null
    const onScroll = () => {
      frame ??= window.requestAnimationFrame(() => {
        frame = null
        syncSection()
      })
    }
    const onHashChange = () => {
      const destination = hashDestination(links)
      if (destination) selectDestination(destination)
      else {
        clearPending()
        syncSection()
      }
    }
    const releaseSelection = () => {
      clearPending()
      syncSection()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        event.defaultPrevented ||
        (target instanceof HTMLElement &&
          (target.isContentEditable || target.matches('input, textarea, select')))
      ) {
        return
      }
      if (SCROLL_KEYS.has(event.key)) releaseSelection()
    }

    frame = window.requestAnimationFrame(() => {
      frame = null
      onHashChange()
    })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('scrollend', releaseSelection)
    window.addEventListener('wheel', releaseSelection, { passive: true })
    window.addEventListener('touchstart', releaseSelection, { passive: true })
    window.addEventListener('keydown', onKeyDown)

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      clearPending()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('scrollend', releaseSelection)
      window.removeEventListener('wheel', releaseSelection)
      window.removeEventListener('touchstart', releaseSelection)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [clearPending, links, selectDestination, syncSection])

  return { activeHref, selectSection }
}
