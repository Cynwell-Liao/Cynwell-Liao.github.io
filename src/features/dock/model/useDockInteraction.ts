import { useEffect, useState } from 'react'

import { DOCK_ICON_SIZE, getDockSizes } from './magnification'

import type { FocusEvent, KeyboardEvent, MouseEvent, PointerEvent } from 'react'

interface DockInteractionOptions {
  fullscreen: boolean
  reducedMotion: boolean
  showMinimized: boolean
}

/** Coordinate pointer, keyboard and menu interaction across all Dock items. */
export function useDockInteraction({
  fullscreen,
  reducedMotion,
  showMinimized,
}: DockInteractionOptions) {
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
  const activeLabel = menu === null ? (hovered ?? focused) : null

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

  const sizeAt = (index: number) =>
    reducedMotion ? DOCK_ICON_SIZE : (sizes[index] ?? DOCK_ICON_SIZE)

  const clearLabels = () => {
    setHovered(null)
    setFocused(null)
  }

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
      const currentItem = items[current]
      if (!currentItem) return
      event.preventDefault()
      event.stopPropagation()
      openMenu(current, currentItem)
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
        clearLabels()
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

  const interactionFor = (index: number) => ({
    'data-pressed': pressed?.index === index ? ('true' as const) : undefined,
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

  const reveal = () => {
    setRevealed(true)
  }

  return {
    activeLabel,
    clearLabels,
    dismissMenu,
    interactionFor,
    isHidden: fullscreen && !revealed && !focusWithin && menu === null,
    menu,
    reveal,
    sizeAt,
    positionInteraction: {
      onFocusCapture: () => {
        setFocusWithin(true)
      },
      onBlurCapture: (event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false)
      },
      onPointerLeave: () => {
        setRevealed(false)
      },
    },
    toolbarInteraction: {
      onKeyDown: moveFocus,
      onPointerMove: magnify,
      onPointerEnter: reveal,
      onPointerLeave: resetMagnification,
      onPointerCancel: resetMagnification,
    },
  }
}

export type DockItemInteraction = ReturnType<
  ReturnType<typeof useDockInteraction>['interactionFor']
>
