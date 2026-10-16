import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { DockMenu } from './DockMenu'

const actions = [
  { label: 'Open', onSelect: vi.fn() },
  { label: 'Minimize', onSelect: vi.fn() },
  { label: 'Quit', onSelect: vi.fn(), separatorBefore: true },
]

function TabDismissalExample() {
  const [open, setOpen] = useState(true)
  const [opener, setOpener] = useState<HTMLButtonElement | null>(null)

  return (
    <>
      <button type="button">Before launcher</button>
      <button ref={setOpener} type="button">
        Launcher
      </button>
      {open && opener && (
        <DockMenu
          actions={actions}
          label="Terminal"
          onDismiss={() => {
            setOpen(false)
          }}
          opener={opener}
        />
      )}
      <button type="button">After launcher</button>
    </>
  )
}

describe('DockMenu', () => {
  it('labels the menu and focuses its first action when opened', () => {
    render(<DockMenu actions={actions} label="Terminal" onDismiss={vi.fn()} />)

    expect(screen.getByRole('menu', { name: 'Terminal actions' })).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')).toHaveLength(3)
    expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus()
    expect(screen.getByRole('separator')).toHaveClass('desktop-dock__menu-separator')
  })

  it('supports vertical arrow navigation, wrapping, Home, and End', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(<DockMenu actions={actions} label="Terminal" onDismiss={onDismiss} />)
    const open = screen.getByRole('menuitem', { name: 'Open' })
    const minimize = screen.getByRole('menuitem', { name: 'Minimize' })
    const quit = screen.getByRole('menuitem', { name: 'Quit' })

    await user.keyboard('{ArrowDown}')
    expect(minimize).toHaveFocus()
    await user.keyboard('{End}')
    expect(quit).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(open).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(quit).toHaveFocus()
    await user.keyboard('{Home}')
    expect(open).toHaveFocus()
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismisses with focus restoration on Escape without closing a window', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    const windowKeyDown = vi.fn()
    window.addEventListener('keydown', windowKeyDown)
    try {
      render(<DockMenu actions={actions} label="Terminal" onDismiss={onDismiss} />)
      await user.keyboard('{Escape}')

      expect(onDismiss).toHaveBeenCalledExactlyOnceWith(true)
      expect(windowKeyDown).not.toHaveBeenCalled()
    } finally {
      window.removeEventListener('keydown', windowKeyDown)
    }
  })

  it.each([false, true])(
    'allows normal Tab escape without requesting focus restoration (shift: %s)',
    (shiftKey) => {
      const onDismiss = vi.fn()
      render(<DockMenu actions={actions} label="Terminal" onDismiss={onDismiss} />)

      const defaultAllowed = fireEvent.keyDown(
        screen.getByRole('menuitem', { name: 'Open' }),
        { key: 'Tab', shiftKey }
      )

      expect(defaultAllowed).toBe(true)
      expect(onDismiss).toHaveBeenCalledExactlyOnceWith(false)
    }
  )

  it.each([
    { shift: false, destination: 'After launcher' },
    { shift: true, destination: 'Before launcher' },
  ])(
    'continues Tab navigation to $destination after dismissing',
    async ({ shift, destination }) => {
      const user = userEvent.setup()
      render(<TabDismissalExample />)

      expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus()
      await user.tab({ shift })

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: destination })).toHaveFocus()
    }
  )

  it.each([
    { left: -30, offset: 42 },
    { left: 220, offset: -72 },
  ])(
    'clamps a menu at $left to the viewport and tracks layout changes',
    ({ left: initialLeft, offset }) => {
      let left = initialLeft
      let notifyResize: (() => void) | undefined
      const observe = vi.fn()
      const disconnect = vi.fn()
      vi.stubGlobal(
        'ResizeObserver',
        class {
          observe = observe
          disconnect = disconnect
          constructor(callback: () => void) {
            notifyResize = callback
          }
        }
      )
      const viewport = vi
        .spyOn(document.documentElement, 'clientWidth', 'get')
        .mockReturnValue(320)
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
        function (this: HTMLElement) {
          const correction = Number.parseFloat(this.style.marginLeft) || 0
          return new DOMRect(left + correction, 0, 160, 80)
        }
      )
      const { unmount } = render(
        <div data-testid="toolbar">
          <div data-testid="slot">
            <DockMenu actions={actions} label="Terminal" onDismiss={vi.fn()} />
          </div>
        </div>
      )
      const menu = screen.getByRole('menu')
      expect(menu.style.marginLeft).toBe(`${String(offset)}px`)
      expect(observe).toHaveBeenCalledWith(menu)
      expect(observe).toHaveBeenCalledWith(screen.getByTestId('slot'))
      expect(observe).toHaveBeenCalledWith(screen.getByTestId('toolbar'))

      notifyResize?.()
      expect(menu.style.marginLeft).toBe(`${String(offset)}px`)
      left = 80
      notifyResize?.()
      expect(menu.style.marginLeft).toBe('0px')

      viewport.mockReturnValue(200)
      fireEvent.resize(window)
      expect(menu.style.marginLeft).toBe('-52px')

      unmount()
      expect(disconnect).toHaveBeenCalledTimes(1)
      viewport.mockReturnValue(320)
      fireEvent.resize(window)
      expect(menu.style.marginLeft).toBe('-52px')
    }
  )

  it('dismisses before executing a selected action', async () => {
    const user = userEvent.setup()
    const sequence: string[] = []
    render(
      <DockMenu
        actions={[
          {
            label: 'Open',
            onSelect: () => {
              sequence.push('select')
            },
          },
        ]}
        label="Terminal"
        onDismiss={(restoreFocus) => {
          sequence.push(`dismiss:${String(restoreFocus)}`)
        }}
      />
    )

    await user.keyboard('{Enter}')
    expect(sequence).toEqual(['dismiss:false', 'select'])
  })

  it('ignores pointer presses inside and dismisses once for an outside press and blur', () => {
    const onDismiss = vi.fn()
    render(
      <>
        <DockMenu actions={actions} label="Terminal" onDismiss={onDismiss} />
        <button type="button">Outside</button>
      </>
    )
    const open = screen.getByRole('menuitem', { name: 'Open' })
    fireEvent.pointerDown(open)
    expect(onDismiss).not.toHaveBeenCalled()

    const outside = screen.getByRole('button', { name: 'Outside' })
    fireEvent.pointerDown(outside)
    fireEvent.blur(open, { relatedTarget: outside })
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('dismisses when focus moves outside without a pointer press', () => {
    const onDismiss = vi.fn()
    render(<DockMenu actions={actions} label="Terminal" onDismiss={onDismiss} />)

    fireEvent.blur(screen.getByRole('menuitem', { name: 'Open' }), {
      relatedTarget: null,
    })
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('keeps focus on the current action across a parent render', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <DockMenu actions={actions} label="Terminal" onDismiss={vi.fn()} />
    )
    await user.keyboard('{ArrowDown}')

    rerender(<DockMenu actions={actions} label="Terminal" onDismiss={vi.fn()} />)
    expect(screen.getByRole('menuitem', { name: 'Minimize' })).toHaveFocus()
  })

  it('removes its outside pointer listener when unmounted', () => {
    const onDismiss = vi.fn()
    const { unmount } = render(
      <DockMenu actions={actions} label="Terminal" onDismiss={onDismiss} />
    )
    unmount()

    fireEvent.pointerDown(document.body)
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
