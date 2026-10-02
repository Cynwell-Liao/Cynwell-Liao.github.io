import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TerminalWindowControls } from './TerminalWindowControls'

const renderControls = (expanded = false) => {
  const handlers = {
    onClose: vi.fn(),
    onMinimize: vi.fn(),
    onToggleExpanded: vi.fn(),
    onTile: vi.fn(),
  }
  return {
    ...render(<TerminalWindowControls expanded={expanded} {...handlers} />),
    ...handlers,
  }
}

const expandButton = () => screen.getByRole('button', { name: /full screen/i })
const openMenu = () => {
  fireEvent.keyDown(expandButton(), { key: 'ArrowDown' })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('TerminalWindowControls', () => {
  it('connects each traffic light to its window action', async () => {
    const user = userEvent.setup()
    const handlers = renderControls()

    await user.click(screen.getByRole('button', { name: 'Close terminal' }))
    await user.click(screen.getByRole('button', { name: 'Minimize terminal' }))
    await user.click(expandButton())

    expect(handlers.onClose).toHaveBeenCalledTimes(1)
    expect(handlers.onMinimize).toHaveBeenCalledTimes(1)
    expect(handlers.onToggleExpanded).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens after hovering green and lets the pointer enter the menu', () => {
    vi.useFakeTimers()
    renderControls()

    fireEvent.pointerEnter(expandButton())
    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1)
    })

    const menu = screen.getByRole('menu', { name: 'Window arrangement' })
    expect(expandButton()).toHaveAttribute('aria-expanded', 'true')
    fireEvent.pointerLeave(expandButton())
    fireEvent.pointerEnter(menu)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(menu).toBeInTheDocument()

    fireEvent.pointerLeave(menu)
    act(() => {
      vi.advanceTimersByTime(180)
    })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('cancels brief hovers and cleans up pending timers on unmount', () => {
    vi.useFakeTimers()
    const { unmount } = renderControls()

    fireEvent.pointerEnter(expandButton())
    fireEvent.pointerLeave(expandButton())
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    fireEvent.pointerEnter(expandButton())
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps a keyboard-focused menu open when the pointer leaves', () => {
    vi.useFakeTimers()
    renderControls()
    fireEvent.pointerEnter(expandButton())
    act(() => {
      vi.advanceTimersByTime(500)
    })
    openMenu()
    const menu = screen.getByRole('menu')
    const firstItem = screen.getAllByRole('menuitem')[0]
    expect(firstItem).toHaveFocus()

    fireEvent.pointerLeave(expandButton())
    fireEvent.pointerLeave(menu)
    act(() => {
      vi.advanceTimersByTime(180)
    })

    expect(menu).toBeInTheDocument()
    expect(firstItem).toHaveFocus()
    fireEvent.keyDown(firstItem, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(expandButton()).toHaveFocus()
  })

  it('dismisses a hover-opened menu on Escape without moving input focus', () => {
    vi.useFakeTimers()
    render(
      <>
        <input aria-label="Terminal command input" />
        <TerminalWindowControls
          expanded={false}
          onClose={vi.fn()}
          onMinimize={vi.fn()}
          onTile={vi.fn()}
          onToggleExpanded={vi.fn()}
        />
      </>
    )
    const input = screen.getByRole('textbox', { name: 'Terminal command input' })
    input.focus()
    fireEvent.pointerEnter(expandButton())
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(input).toHaveFocus()
    const closeTerminal = vi.fn()
    window.addEventListener('keydown', closeTerminal)

    expect(fireEvent.keyDown(input, { key: 'Escape' })).toBe(false)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(input).toHaveFocus()
    expect(closeTerminal).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(closeTerminal).toHaveBeenCalledTimes(1)
    window.removeEventListener('keydown', closeTerminal)
  })

  it('supports menu keyboard navigation and returns focus on Escape', () => {
    renderControls()
    const escaped = vi.fn()
    document.addEventListener('keydown', escaped)
    openMenu()
    const items = screen.getAllByRole('menuitem')
    expect(items[0]).toHaveFocus()

    fireEvent.keyDown(items[0], { key: 'ArrowDown' })
    expect(items[1]).toHaveFocus()
    fireEvent.keyDown(items[1], { key: 'End' })
    expect(items[2]).toHaveFocus()
    fireEvent.keyDown(items[2], { key: 'Home' })
    expect(items[0]).toHaveFocus()
    fireEvent.keyDown(items[0], { key: 'ArrowUp' })
    expect(items[2]).toHaveFocus()
    fireEvent.keyDown(items[2], { key: 'Escape' })

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(expandButton()).toHaveFocus()
    expect(escaped).not.toHaveBeenCalled()
    document.removeEventListener('keydown', escaped)
  })

  it.each(['left', 'right'] as const)(
    'tiles to the %s through the menu',
    async (side) => {
      const user = userEvent.setup()
      const { onTile } = renderControls()
      openMenu()

      await user.click(
        screen.getByRole('menuitem', {
          name: new RegExp(`Tile Window to ${side}`, 'i'),
        })
      )

      expect(onTile).toHaveBeenCalledWith(side)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    }
  )

  it('uses the full screen menu action and exposes the expanded state', async () => {
    const user = userEvent.setup()
    const { onToggleExpanded } = renderControls(true)
    expect(expandButton()).toHaveAccessibleName('Exit full screen')
    openMenu()

    await user.click(screen.getByRole('menuitem', { name: 'Exit Full Screen' }))

    expect(onToggleExpanded).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('dismisses on outside pointer activity or keyboard focus leaving the controls', () => {
    renderControls()
    openMenu()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    openMenu()
    fireEvent.blur(screen.getAllByRole('menuitem')[0], {
      relatedTarget: document.body,
    })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('keeps pointer and double click events away from the draggable titlebar', () => {
    renderControls()
    const onPointerDown = vi.fn()
    const onDoubleClick = vi.fn()
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('dblclick', onDoubleClick)

    fireEvent.pointerDown(expandButton())
    fireEvent.doubleClick(expandButton())

    expect(onPointerDown).not.toHaveBeenCalled()
    expect(onDoubleClick).not.toHaveBeenCalled()
    document.removeEventListener('pointerdown', onPointerDown)
    document.removeEventListener('dblclick', onDoubleClick)
  })
})
