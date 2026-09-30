import { m, useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'

import type { ThemeMode } from '@shared/types/common'

import { useActiveSection } from '../model/useActiveSection'

import type { NavLink } from '../model/nav.types'

interface SectionNavigationProps {
  links: readonly NavLink[]
  theme: ThemeMode
}

export function SectionNavigation({ links, theme }: SectionNavigationProps) {
  const { activeHref, selectSection } = useActiveSection(links)
  const reduceMotion = useReducedMotion()
  const navigationRef = useRef<HTMLElement>(null)
  const [indicator, setIndicator] = useState<{ x: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const navigation = navigationRef.current
    if (!navigation) return

    const measure = () => {
      const activeLink = navigation.querySelector<HTMLAnchorElement>(
        '[aria-current="location"]'
      )
      if (!activeLink) {
        // Start fresh after home instead of animating from the last selected tab.
        setIndicator(null)
        return
      }
      if (activeLink.offsetWidth === 0) return

      const next = { x: activeLink.offsetLeft, width: activeLink.offsetWidth }
      setIndicator((current) =>
        current?.x === next.x && current.width === next.width ? current : next
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(navigation)
    // Font loading and responsive label sizes can change individual tab widths.
    navigation.querySelectorAll('a').forEach((link) => {
      observer.observe(link)
    })

    return () => {
      observer.disconnect()
    }
  }, [activeHref, links])

  const activeColor = theme === 'dark' ? 'var(--color-slate-900)' : 'var(--color-white)'
  const inactiveColor =
    theme === 'dark' ? 'var(--color-slate-200)' : 'var(--color-slate-700)'

  return (
    <nav
      aria-label="Primary navigation"
      className="relative isolate hidden items-center rounded-full bg-transparent p-1 md:flex"
      ref={navigationRef}
    >
      {indicator && (
        <m.span
          aria-hidden="true"
          className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-full bg-slate-900 transition-none dark:bg-slate-100"
          data-testid="navbar-indicator"
          initial={false}
          animate={
            reduceMotion ? undefined : { ...indicator, opacity: activeHref ? 1 : 0 }
          }
          style={
            reduceMotion
              ? {
                  width: indicator.width,
                  transform: `translateX(${String(indicator.x)}px)`,
                  opacity: activeHref ? 1 : 0,
                }
              : undefined
          }
          transition={{ duration: 0.32, ease: 'easeOut' }}
        />
      )}
      {links.map((link) => {
        const isActive = activeHref === link.href

        return (
          <m.a
            key={link.href}
            aria-current={isActive ? 'location' : undefined}
            className="relative z-10 inline-flex h-9 shrink-0 items-center justify-center rounded-full px-3 text-xs font-medium whitespace-nowrap transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 lg:px-4 lg:text-sm dark:focus-visible:ring-accent-400 dark:focus-visible:ring-offset-slate-900"
            href={link.href}
            initial={false}
            animate={
              reduceMotion
                ? undefined
                : {
                    color: isActive ? activeColor : inactiveColor,
                    opacity: isActive ? 1 : 0.8,
                  }
            }
            style={
              reduceMotion
                ? { color: isActive ? activeColor : inactiveColor }
                : undefined
            }
            whileHover={{ opacity: 1 }}
            whileFocus={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.16, ease: 'easeOut' }}
            onClick={(event) => {
              if (
                event.button === 0 &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                selectSection(link.href)
              }
            }}
          >
            {link.label}
          </m.a>
        )
      })}
    </nav>
  )
}
