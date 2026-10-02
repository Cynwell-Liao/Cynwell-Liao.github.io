import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const controlsRef = useRef<HTMLDivElement>(null)
  const expandRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const focusMenuOnOpen = useRef(false)

  const clearTimers = () => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
  }

  const dismissMenu = () => {
    clearTimers()
    setMenuOpen(false)
  }

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

  useEffect(
    () => () => {
      clearTimeout(openTimer.current)
      clearTimeout(closeTimer.current)
    },
    []
  )

  useEffect(() => {
    if (!menuOpen) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !controlsRef.current?.contains(event.target)
      ) {
        setMenuOpen(false)
      }
    }

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return

      event.preventDefault()
      event.stopPropagation()
      clearTimeout(openTimer.current)
      clearTimeout(closeTimer.current)
      if (menuRef.current?.contains(document.activeElement)) {
        expandRef.current?.focus()
      }
      setMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape, true)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape, true)
    }
  }, [menuOpen])

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
      }}
      onPointerLeave={scheduleClose}
      ref={controlsRef}
      role="group"
    >
      <button
        aria-label="Close terminal"
        className="terminal-window-control terminal-window-control--close"
        onClick={onClose}
        type="button"
      >
        <span className="terminal-window-control-dot">
          <svg
            aria-hidden="true"
            className="terminal-window-control__glyph"
            viewBox="0 0 12 12"
          >
            <path d="m3.7 3.7 4.6 4.6m0-4.6L3.7 8.3" />
          </svg>
        </span>
      </button>
      <button
        aria-label="Minimize terminal"
        className="terminal-window-control terminal-window-control--minimize"
        onClick={onMinimize}
        type="button"
      >
        <span className="terminal-window-control-dot">
          <svg
            aria-hidden="true"
            className="terminal-window-control__glyph"
            viewBox="0 0 12 12"
          >
            <path d="M3 6h6" />
          </svg>
        </span>
      </button>
      <button
        aria-controls={menuOpen ? menuId : undefined}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={expanded ? 'Exit full screen' : 'Enter full screen'}
        className="terminal-window-control terminal-window-control--expand"
        onClick={() => {
          dismissMenu()
          onToggleExpanded()
        }}
        onKeyDown={(event) => {
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
        onPointerEnter={scheduleOpen}
        onPointerLeave={scheduleClose}
        ref={expandRef}
        type="button"
      >
        <span className="terminal-window-control-dot">
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
        </span>
      </button>
      {menuOpen && (
        <div
          aria-label="Window arrangement"
          className="terminal-window-menu"
          id={menuId}
          onKeyDown={onMenuKeyDown}
          onPointerEnter={clearTimers}
          onPointerLeave={scheduleClose}
          ref={menuRef}
          role="menu"
          tabIndex={-1}
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
        </div>
      )}
    </div>
  )
}
