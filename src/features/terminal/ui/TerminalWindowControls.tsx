import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import { useTerminalControlPress } from '../model/useTerminalControlPress'

import './TerminalWindowControls.css'

import type { KeyboardEvent } from 'react'

interface TerminalWindowControlsProps {
  expanded: boolean
  onClose: () => void
  onMinimize: () => void
  onToggleExpanded: () => void
  onTile: (side: 'left' | 'right') => void
}

export function TerminalWindowControls({
  expanded,
  onClose,
  onMinimize,
  onToggleExpanded,
  onTile,
}: TerminalWindowControlsProps) {
  const reducedMotion = useReducedMotion()
  const closePress = useTerminalControlPress(reducedMotion)
  const minimizePress = useTerminalControlPress(reducedMotion)
  const expandPress = useTerminalControlPress(reducedMotion)
  const pressTransition = reducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 650, damping: 35 }
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const controlsRef = useRef<HTMLDivElement>(null)
  const expandRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const focusMenuOnOpen = useRef(false)

  const clearTimers = useCallback(() => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
  }, [])

  const dismissMenu = useCallback(() => {
    clearTimers()
    focusMenuOnOpen.current = false
    setMenuOpen(false)
  }, [clearTimers])

  const scheduleOpen = () => {
    clearTimers()
    openTimer.current = setTimeout(() => {
      setMenuOpen(true)
    }, 500)
  }

  const scheduleClose = () => {
    clearTimers()
    closeTimer.current = setTimeout(() => {
      if (!menuRef.current?.contains(document.activeElement)) setMenuOpen(false)
    }, 180)
  }

  useEffect(() => {
    window.addEventListener('blur', dismissMenu)
    return () => {
      clearTimers()
      window.removeEventListener('blur', dismissMenu)
    }
  }, [clearTimers, dismissMenu])

  useEffect(() => {
    if (!menuOpen) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !controlsRef.current?.contains(event.target)
      ) {
        dismissMenu()
      }
    }

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return

      event.preventDefault()
      event.stopPropagation()
      if (menuRef.current?.contains(document.activeElement)) {
        expandRef.current?.focus()
      }
      dismissMenu()
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape, true)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape, true)
    }
  }, [menuOpen, dismissMenu])

  useLayoutEffect(() => {
    if (menuOpen && focusMenuOnOpen.current) {
      menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
      focusMenuOnOpen.current = false
    }
  }, [menuOpen])

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []
    )
    const currentIndex = items.findIndex((item) => item === document.activeElement)
    let nextIndex: number

    switch (event.key) {
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % items.length
        break
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + items.length) % items.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = items.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
    items[nextIndex]?.focus()
  }

  const runMenuAction = (action: () => void) => {
    dismissMenu()
    expandRef.current?.focus()
    action()
  }

  return (
    <div
      aria-label="Terminal window controls"
      className="terminal-window-controls"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) dismissMenu()
      }}
      onDoubleClick={(event) => {
        event.stopPropagation()
      }}
      onPointerDown={(event) => {
        event.stopPropagation()
        clearTimers()
      }}
      onPointerLeave={scheduleClose}
      ref={controlsRef}
      role="group"
    >
      <button
        {...closePress.handlers}
        aria-label="Close terminal"
        className="terminal-window-control terminal-window-control--close"
        data-hovered={closePress.hovered}
        data-pressed={closePress.pressed}
        onClick={onClose}
        type="button"
      >
        <motion.span
          animate={closePress.animation}
          className="terminal-window-control-dot"
          initial={false}
          transition={pressTransition}
        >
          <svg
            aria-hidden="true"
            className="terminal-window-control__glyph"
            viewBox="0 0 12 12"
          >
            <path d="m3.7 3.7 4.6 4.6m0-4.6L3.7 8.3" />
          </svg>
        </motion.span>
      </button>
      <button
        {...minimizePress.handlers}
        aria-label="Minimize terminal"
        className="terminal-window-control terminal-window-control--minimize"
        data-hovered={minimizePress.hovered}
        data-pressed={minimizePress.pressed}
        onClick={onMinimize}
        type="button"
      >
        <motion.span
          animate={minimizePress.animation}
          className="terminal-window-control-dot"
          initial={false}
          transition={pressTransition}
        >
          <svg
            aria-hidden="true"
            className="terminal-window-control__glyph"
            viewBox="0 0 12 12"
          >
            <path d="M3 6h6" />
          </svg>
        </motion.span>
      </button>
      <button
        {...expandPress.handlers}
        aria-controls={menuOpen ? menuId : undefined}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={expanded ? 'Exit full screen' : 'Enter full screen'}
        className="terminal-window-control terminal-window-control--expand"
        data-hovered={expandPress.hovered}
        data-pressed={expandPress.pressed}
        onClick={() => {
          dismissMenu()
          onToggleExpanded()
        }}
        onKeyDown={(event) => {
          expandPress.handlers.onKeyDown(event)
          if (event.key === ' ' || event.key === 'Enter') clearTimers()
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            event.stopPropagation()
            clearTimers()
            if (menuOpen) {
              menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
            } else {
              focusMenuOnOpen.current = true
              setMenuOpen(true)
            }
          }
        }}
        onPointerEnter={(event) => {
          expandPress.handlers.onPointerEnter(event)
          if (event.pointerType !== 'touch' && !event.buttons) scheduleOpen()
        }}
        onPointerLeave={() => {
          expandPress.handlers.onPointerLeave()
          scheduleClose()
        }}
        ref={expandRef}
        type="button"
      >
        <motion.span
          animate={expandPress.animation}
          className="terminal-window-control-dot"
          initial={false}
          transition={pressTransition}
        >
          <svg
            aria-hidden="true"
            className="terminal-window-control__glyph"
            viewBox="0 0 12 12"
          >
            <path
              className="terminal-window-expand-glyph"
              d={
                expanded
                  ? 'M6.5 2.5v3h3zM2.5 6.5h3v3z'
                  : 'M2.5 2.5h4l-4 4zM9.5 9.5h-4l4-4z'
              }
            />
          </svg>
        </motion.span>
      </button>
      {menuOpen && (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          aria-label="Window arrangement"
          className="terminal-window-menu"
          id={menuId}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.97 }}
          onKeyDown={onMenuKeyDown}
          onPointerEnter={clearTimers}
          onPointerLeave={scheduleClose}
          ref={menuRef}
          role="menu"
          tabIndex={-1}
          transition={{ duration: 0.14, ease: 'easeOut' }}
        >
          <button
            onClick={() => {
              runMenuAction(onToggleExpanded)
            }}
            role="menuitem"
            tabIndex={-1}
            type="button"
          >
            <span aria-hidden="true" className="terminal-window-menu-icon" />
            {expanded ? 'Exit Full Screen' : 'Enter Full Screen'}
          </button>
          <button
            onClick={() => {
              runMenuAction(() => {
                onTile('left')
              })
            }}
            role="menuitem"
            tabIndex={-1}
            type="button"
          >
            <span
              aria-hidden="true"
              className="terminal-window-menu-icon terminal-window-menu-icon--left"
            />
            Tile Window to Left of Screen
          </button>
          <button
            onClick={() => {
              runMenuAction(() => {
                onTile('right')
              })
            }}
            role="menuitem"
            tabIndex={-1}
            type="button"
          >
            <span
              aria-hidden="true"
              className="terminal-window-menu-icon terminal-window-menu-icon--right"
            />
            Tile Window to Right of Screen
          </button>
        </motion.div>
      )}
    </div>
  )
}
