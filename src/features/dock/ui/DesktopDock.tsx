import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import { DOCK_ICON_SIZE, getDockIconSize } from '../model/magnification'

import { DockIcon } from './DockIcon'
import { DockMinimizedWindow } from './DockMinimizedWindow'

import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'

import './DesktopDock.css'

interface DesktopDockProps {
  fullscreen?: boolean
  githubUrl: string
  linkedinUrl: string
  terminalOpen: boolean
  terminalMinimized?: boolean
  onOpenTerminal: (opener: HTMLButtonElement) => void
  onRestoreTerminal?: () => void
}

const apps = [
  { id: 'github', label: 'GitHub' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'terminal', label: 'Terminal' },
] as const

const MINIMIZED_INDEX = apps.length

export function DesktopDock({
  fullscreen = false,
  githubUrl,
  linkedinUrl,
  terminalOpen,
  terminalMinimized = false,
  onOpenTerminal,
  onRestoreTerminal,
}: DesktopDockProps) {
  const reducedMotion = useReducedMotion()
  const [sizes, setSizes] = useState<number[]>([])
  const [hovered, setHovered] = useState<number | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [launch, setLaunch] = useState({ index: -1, count: 0 })
  const minimizedRef = useRef<HTMLButtonElement>(null)
  const activeLabel = hovered ?? focused
  const showMinimized = terminalOpen && terminalMinimized

  // Like macOS, the minimized window lands in the Dock; keep keyboard focus
  // with it so the window can be restored without hunting for it.
  useEffect(() => {
    if (showMinimized) minimizedRef.current?.focus({ preventScroll: true })
  }, [showMinimized])

  const sizeAt = (index: number) =>
    reducedMotion ? DOCK_ICON_SIZE : (sizes[index] ?? DOCK_ICON_SIZE)

  const resetMagnification = () => {
    setHovered(null)
    setSizes([])
  }

  const magnify = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch' || reducedMotion) return
    const items = event.currentTarget.querySelectorAll<HTMLElement>('[data-dock-app]')
    setSizes(
      Array.from(items, (item) => {
        const bounds = item.getBoundingClientRect()
        return getDockIconSize(event.clientX - bounds.left - bounds.width / 2)
      })
    )
  }

  const moveFocus = (event: KeyboardEvent<HTMLElement>) => {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[data-dock-app]')
    )
    const current = items.indexOf(document.activeElement as HTMLElement)
    if (current < 0) return
    let next: number
    switch (event.key) {
      case 'ArrowRight':
        next = (current + 1) % items.length
        break
      case 'ArrowLeft':
        next = (current + items.length - 1) % items.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = items.length - 1
        break
      case 'Escape':
        if (activeLabel !== null) {
          event.preventDefault()
          event.stopPropagation()
        }
        setHovered(null)
        setFocused(null)
        return
      default:
        return
    }
    event.preventDefault()
    items[next]?.focus()
  }

  const interactionFor = (index: number, label: string, id: string) => ({
    className: 'desktop-dock__app',
    'data-dock-app': id,
    'aria-label': label,
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== 'touch') setHovered(index)
    },
    onPointerLeave: () => {
      setHovered(null)
    },
    onFocus: () => {
      setFocused(index)
    },
    onBlur: () => {
      setFocused(null)
    },
  })

  const tooltip = (index: number, label: string) => {
    const visible = activeLabel === index
    return (
      <m.span
        aria-hidden="true"
        className="desktop-dock__tooltip"
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 3 }}
        initial={false}
        transition={{ duration: reducedMotion ? 0 : 0.12 }}
      >
        {label}
      </m.span>
    )
  }

  const slot = (index: number, key: string, children: ReactNode) => (
    <m.div
      className="desktop-dock__slot"
      key={key}
      initial={false}
      animate={{ width: sizeAt(index), height: sizeAt(index) }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: 'spring', mass: 0.2, stiffness: 400, damping: 22 }
      }
    >
      {children}
    </m.div>
  )

  return (
    <div
      className="desktop-dock-position"
      data-auto-hidden={fullscreen && !revealed}
      onFocusCapture={() => {
        setRevealed(true)
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setRevealed(false)
      }}
      onPointerLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) setRevealed(false)
      }}
    >
      {fullscreen && (
        <div
          aria-hidden="true"
          className="desktop-dock__reveal"
          onPointerEnter={() => {
            setRevealed(true)
          }}
        />
      )}
      <m.nav
        aria-label="Application Dock"
        animate={{ y: fullscreen && !revealed ? 'calc(100% + 24px)' : 0 }}
        initial={false}
        transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          aria-label="Dock apps"
          className="desktop-dock"
          role="toolbar"
          onKeyDown={moveFocus}
          onPointerMove={magnify}
          onPointerLeave={resetMagnification}
          onPointerCancel={resetMagnification}
        >
          <div aria-hidden="true" className="desktop-dock__glass" />
          {apps.map((app, index) => {
            const running = app.id === 'terminal' && terminalOpen
            const launchApp = () => {
              // Running apps activate in place; only a cold launch bounces.
              if (!reducedMotion && !running) {
                setLaunch((previous) => ({ index, count: previous.count + 1 }))
              }
              setHovered(null)
              setFocused(null)
            }
            const content = (
              <>
                <m.span
                  aria-hidden="true"
                  className="desktop-dock__launch"
                  key={launch.index === index ? launch.count : 0}
                  animate={{
                    y:
                      !reducedMotion && launch.index === index
                        ? [0, -22, 0, -10, 0]
                        : 0,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.65,
                    times: [0, 0.3, 0.5, 0.72, 1],
                    ease: 'easeOut',
                  }}
                >
                  <DockIcon app={app.id} />
                </m.span>
                {tooltip(index, app.label)}
                {running && (
                  <span aria-hidden="true" className="desktop-dock__running" />
                )}
              </>
            )
            const interaction = interactionFor(index, app.label, app.id)
            return slot(
              index,
              app.id,
              app.id === 'terminal' ? (
                <m.button
                  {...interaction}
                  aria-haspopup="dialog"
                  data-running={running}
                  onClick={(event) => {
                    launchApp()
                    onOpenTerminal(event.currentTarget)
                  }}
                  type="button"
                  whileTap={{ filter: 'brightness(0.78)' }}
                >
                  {content}
                </m.button>
              ) : (
                <m.a
                  {...interaction}
                  href={app.id === 'github' ? githubUrl : linkedinUrl}
                  onClick={launchApp}
                  rel="noopener noreferrer"
                  target="_blank"
                  whileTap={{ filter: 'brightness(0.78)' }}
                >
                  {content}
                </m.a>
              )
            )
          })}
          <AnimatePresence initial={false}>
            {showMinimized && (
              <m.span
                animate={{ opacity: 1, width: 1, marginInline: 0 }}
                aria-hidden="true"
                className="desktop-dock__separator"
                exit={{ opacity: 0, width: 0, marginInline: -6 }}
                initial={{ opacity: 0, width: 0, marginInline: -6 }}
                key="separator"
                transition={{ duration: reducedMotion ? 0 : 0.25 }}
              />
            )}
            {showMinimized && (
              <m.div
                animate={{
                  opacity: 1,
                  width: sizeAt(MINIMIZED_INDEX),
                  marginInline: 0,
                }}
                className="desktop-dock__slot"
                exit={{ opacity: 0, width: 0, marginInline: -6 }}
                initial={{ opacity: 0, width: 0, marginInline: -6 }}
                key="minimized-terminal"
                style={{ height: sizeAt(MINIMIZED_INDEX) }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', mass: 0.2, stiffness: 400, damping: 22 }
                }
              >
                <button
                  {...interactionFor(
                    MINIMIZED_INDEX,
                    'Restore terminal',
                    'terminal-window'
                  )}
                  onClick={() => {
                    setHovered(null)
                    setFocused(null)
                    onRestoreTerminal?.()
                  }}
                  ref={minimizedRef}
                  type="button"
                >
                  <DockMinimizedWindow />
                  {tooltip(MINIMIZED_INDEX, 'Terminal')}
                </button>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </m.nav>
    </div>
  )
}
