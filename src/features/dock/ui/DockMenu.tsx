import { Fragment, useCallback, useEffect, useLayoutEffect, useRef } from 'react'

import type { KeyboardEvent } from 'react'

interface DockMenuProps {
  label: string
  actions: {
    label: string
    onSelect: () => void
    separatorBefore?: boolean
  }[]
  opener?: HTMLElement | null
  onDismiss: (restoreFocus: boolean) => void
}

export function DockMenu({ label, actions, opener, onDismiss }: DockMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const dismissedRef = useRef(false)

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    let offset = 0
    const keepInViewport = () => {
      const bounds = menu.getBoundingClientRect()
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth
      // Recover the centered position before applying the previous correction.
      // This prevents resize notifications from accumulating the same offset.
      const left = bounds.left - offset
      const right = bounds.right - offset
      const nextOffset = Math.max(12 - left, Math.min(0, viewportWidth - 12 - right))
      if (nextOffset === offset) return
      offset = nextOffset
      menu.style.marginLeft = `${String(offset)}px`
    }

    keepInViewport()
    const observer = new ResizeObserver(keepInViewport)
    observer.observe(menu)
    if (menu.parentElement) {
      observer.observe(menu.parentElement)
      if (menu.parentElement.parentElement) {
        observer.observe(menu.parentElement.parentElement)
      }
    }
    window.addEventListener('resize', keepInViewport)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', keepInViewport)
    }
  }, [])

  const dismiss = useCallback(
    (restoreFocus: boolean) => {
      if (dismissedRef.current) return
      dismissedRef.current = true
      onDismiss(restoreFocus)
    },
    [onDismiss]
  )

  useEffect(() => {
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        dismiss(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [dismiss])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Menu shortcuts must not also operate the Dock or a running Terminal.
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.preventDefault()
      dismiss(true)
      return
    }
    if (event.key === 'Tab') {
      // Restore the sequential focus starting point before the menu unmounts;
      // the browser can then perform its normal forward or backward Tab step.
      opener?.focus({ preventScroll: true })
      dismiss(false)
      return
    }

    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
    )
    if (!items.length) return
    const current = items.findIndex((item) => item === document.activeElement)
    let next: number
    switch (event.key) {
      case 'ArrowDown':
        next = (current + 1) % items.length
        break
      case 'ArrowUp':
        next = (current + items.length - 1) % items.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = items.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    items[next]?.focus({ preventScroll: true })
  }

  return (
    <div
      aria-label={`${label} actions`}
      className="desktop-dock__menu"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) dismiss(false)
      }}
      onKeyDown={handleKeyDown}
      ref={menuRef}
      role="menu"
      tabIndex={-1}
    >
      {actions.map((action) => (
        <Fragment key={action.label}>
          {action.separatorBefore && (
            <div className="desktop-dock__menu-separator" role="separator" />
          )}
          <button
            className="desktop-dock__menu-item"
            onClick={() => {
              dismiss(false)
              action.onSelect()
            }}
            role="menuitem"
            tabIndex={-1}
            type="button"
          >
            {action.label}
          </button>
        </Fragment>
      ))}
    </div>
  )
}
