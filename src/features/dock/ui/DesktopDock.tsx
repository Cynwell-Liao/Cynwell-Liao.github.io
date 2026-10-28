import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import { DOCK_GAP, DOCK_ICON_SIZE, getDockSizes } from '../model/magnification'
import { useDockLaunch } from '../model/useDockLaunch'

import { DockIcon } from './DockIcon'
import { DockMenu } from './DockMenu'
import { DockMinimizedWindow } from './DockMinimizedWindow'

import type { Variants } from 'framer-motion'
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react'

import './DesktopDock.css'

interface DesktopDockProps {
  fullscreen?: boolean
  githubUrl: string
  linkedinUrl: string
  terminalOpen: boolean
  terminalMinimized?: boolean
  onOpenTerminal: (opener: HTMLButtonElement) => void
  onRestoreTerminal?: () => void
  onQuitTerminal?: () => void
}

const apps = [
  { id: 'github', label: 'GitHub' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'terminal', label: 'Terminal' },
] as const

const MINIMIZED_INDEX = apps.length

// Native launch bouncing repeats until the app is ready. For web destinations,
// use three hops before opening the tab; this cadence is a visual approximation.
// Each rigid rise/fall decelerates toward the apex, then accelerates to the shelf.
const launchVariants = {
  idle: { y: 0, transition: { duration: 0 } },
  launch: {
    y: [0, -26, 0],
    transition: {
      duration: 0.6,
      repeat: 2,
      times: [0, 0.5, 1],
      ease: ['easeOut', 'easeIn'],
    },
  },
} satisfies Variants

export function DesktopDock({
  fullscreen = false,
  githubUrl,
  linkedinUrl,
  terminalOpen,
  terminalMinimized = false,
  onOpenTerminal,
  onRestoreTerminal,
  onQuitTerminal,
}: DesktopDockProps) {
  const reducedMotion = useReducedMotion()
  const [sizes, setSizes] = useState<number[]>([])
  const [hovered, setHovered] = useState<number | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const [pressed, setPressed] = useState<{
    index: number
    opener: HTMLElement
  } | null>(null)
  const [longPressed, setLongPressed] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [menu, setMenu] = useState<{ index: number; opener: HTMLElement } | null>(null)
  const { launching, startLaunch, completeLaunch, cancelLaunch } = useDockLaunch()
  const minimizedRef = useRef<HTMLButtonElement>(null)
  const activeLabel = menu === null ? (hovered ?? focused) : null
  const showMinimized = terminalOpen && terminalMinimized

  useEffect(() => {
    if (!pressed) return
    const timer = setTimeout(() => {
      setPressed(null)
      setLongPressed(true)
      setMenu(pressed)
      setHovered(null)
      setSizes([])
    }, 500)
    return () => {
      clearTimeout(timer)
    }
  }, [pressed])

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
    if (event.pointerType === 'touch' || reducedMotion || menu !== null) return
    const bounds = event.currentTarget.getBoundingClientRect()
    setSizes(
      getDockSizes(
        event.clientX - bounds.left - bounds.width / 2,
        showMinimized,
        window.innerWidth - 48
      )
    )
  }

  const openMenu = (index: number, opener: HTMLElement) => {
    setPressed(null)
    setLongPressed(false)
    setMenu({ index, opener })
    resetMagnification()
  }

  const dismissMenu = (restoreFocus: boolean) => {
    setMenu(null)
    setFocusWithin(restoreFocus)
    setFocused(null)
    if (restoreFocus) menu?.opener.focus({ preventScroll: true })
  }

  const moveFocus = (event: KeyboardEvent<HTMLElement>) => {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[data-dock-app]')
    )
    const current = items.indexOf(document.activeElement as HTMLElement)
    if (current < 0) return
    if (
      event.key === 'ArrowUp' ||
      event.key === 'ContextMenu' ||
      (event.shiftKey && event.key === 'F10')
    ) {
      event.preventDefault()
      event.stopPropagation()
      openMenu(current, items[current])
      return
    }
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
        setSizes([])
        return
      default:
        return
    }
    event.preventDefault()
    items[next]?.focus()
  }

  const clearPressedAt = (index: number) => {
    setPressed((current) => (current?.index === index ? null : current))
  }

  const interactionFor = (index: number, label: string, id: string) => ({
    className: 'desktop-dock__app',
    'data-dock-app': id,
    'data-pressed': pressed?.index === index ? ('true' as const) : undefined,
    'aria-label': label,
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      openMenu(index, event.currentTarget)
    },
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      setLongPressed(false)
      if (event.button !== 0 || event.ctrlKey) return
      setPressed({ index, opener: event.currentTarget })
    },
    onPointerUp: () => {
      clearPressedAt(index)
    },
    onPointerCancel: () => {
      clearPressedAt(index)
    },
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      setPressed(null)
      if (longPressed) {
        setLongPressed(false)
        event.preventDefault()
        event.stopPropagation()
        return
      }
      if (event.ctrlKey && event.button === 0) {
        event.preventDefault()
        event.stopPropagation()
        openMenu(index, event.currentTarget)
      }
    },
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== 'touch') setHovered(index)
    },
    onPointerLeave: () => {
      clearPressedAt(index)
      setHovered(null)
    },
    onFocus: () => {
      setFocused(index)
    },
    onBlur: () => {
      clearPressedAt(index)
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
      {appMenu(index)}
    </m.div>
  )

  const isHidden = fullscreen && !revealed && !focusWithin && menu === null

  const appMenu = (index: number) => {
    if (menu?.index !== index) return null
    const app = index === MINIMIZED_INDEX ? null : apps[index]
    const isTerminal = app?.id === 'terminal'
    const activate = () => {
      if (index === MINIMIZED_INDEX) onRestoreTerminal?.()
      else menu.opener.click()
    }
    const actions = [
      { label: isTerminal && terminalOpen ? 'Show' : 'Open', onSelect: activate },
    ]
    if (isTerminal && terminalOpen && onQuitTerminal) {
      return (
        <DockMenu
          label={app.label}
          opener={menu.opener}
          actions={[
            ...actions,
            {
              label: 'Quit',
              separatorBefore: true,
              onSelect: () => {
                onQuitTerminal()
                menu.opener.focus({ preventScroll: true })
              },
            },
          ]}
          onDismiss={dismissMenu}
        />
      )
    }
    return (
      <DockMenu
        label={app?.label ?? 'Terminal'}
        opener={menu.opener}
        actions={actions}
        onDismiss={dismissMenu}
      />
    )
  }

  return (
    <div
      className="desktop-dock-position"
      data-auto-hidden={isHidden}
      onFocusCapture={() => {
        setFocusWithin(true)
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false)
      }}
      onPointerLeave={() => {
        setRevealed(false)
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
        animate={{ y: isHidden ? 'calc(100% + 24px)' : 0 }}
        initial={false}
        transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          aria-label="Dock apps"
          className="desktop-dock"
          role="toolbar"
          onKeyDown={moveFocus}
          onPointerMove={magnify}
          onPointerEnter={() => {
            setRevealed(true)
          }}
          onPointerLeave={resetMagnification}
          onPointerCancel={resetMagnification}
        >
          <div aria-hidden="true" className="desktop-dock__glass" />
          {apps.map((app, index) => {
            const running = app.id === 'terminal' && terminalOpen
            const isLaunching = launching.includes(index)
            const launchApp = (action: () => void) => {
              setHovered(null)
              setFocused(null)
              // Running apps activate in place; only a cold launch bounces.
              startLaunch(index, action, Boolean(reducedMotion) || running)
            }
            const content = (
              <>
                <m.span
                  aria-hidden="true"
                  className="desktop-dock__launch"
                  key={isLaunching ? 'launch' : 'idle'}
                  initial="idle"
                  animate={isLaunching ? 'launch' : 'idle'}
                  variants={launchVariants}
                  onAnimationComplete={(definition) => {
                    if (definition === 'launch') completeLaunch(index)
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
                <button
                  {...interaction}
                  aria-haspopup="dialog"
                  data-launching={isLaunching}
                  data-running={running}
                  onClick={(event) => {
                    const opener = event.currentTarget
                    launchApp(() => {
                      onOpenTerminal(opener)
                    })
                  }}
                  type="button"
                >
                  {content}
                </button>
              ) : (
                <a
                  {...interaction}
                  data-launching={isLaunching}
                  href={app.id === 'github' ? githubUrl : linkedinUrl}
                  onClick={(event) => {
                    // Preserve browser shortcuts (new background tab/window, download).
                    if (
                      event.defaultPrevented ||
                      event.button !== 0 ||
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey
                    )
                      return
                    // Reduced motion can use the anchor's native activation directly.
                    if (reducedMotion) return
                    event.preventDefault()
                    // One user activation can open one tab. A newer profile choice
                    // replaces the pending one instead of losing it to popup blocking.
                    cancelLaunch(index === 0 ? 1 : 0)
                    const url = event.currentTarget.href
                    launchApp(() => {
                      window.open(url, '_blank', 'noopener,noreferrer')
                    })
                  }}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {content}
                </a>
              )
            )
          })}
          <AnimatePresence initial={false}>
            {showMinimized && (
              <m.span
                animate={{ opacity: 1, width: 1, marginInline: 0 }}
                aria-hidden="true"
                className="desktop-dock__separator"
                exit={{ opacity: 0, width: 0, marginInline: -DOCK_GAP / 2 }}
                initial={{ opacity: 0, width: 0, marginInline: -DOCK_GAP / 2 }}
                key="separator"
                transition={{ duration: reducedMotion ? 0 : 0.25 }}
              />
            )}
            {showMinimized && (
              <m.div
                animate={{
                  opacity: 1,
                  width: sizeAt(MINIMIZED_INDEX),
                  height: sizeAt(MINIMIZED_INDEX),
                  marginInline: 0,
                }}
                className="desktop-dock__slot"
                exit={{ opacity: 0, width: 0, marginInline: -DOCK_GAP / 2 }}
                initial={{ opacity: 0, width: 0, marginInline: -DOCK_GAP / 2 }}
                key="minimized-terminal"
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
                {appMenu(MINIMIZED_INDEX)}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </m.nav>
    </div>
  )
}
