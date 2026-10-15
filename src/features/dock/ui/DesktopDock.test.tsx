import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { setMockReducedMotion } from '../../../test/setup'

import { DesktopDock } from './DesktopDock'

const props = {
  githubUrl: 'https://github.com/example',
  linkedinUrl: 'https://www.linkedin.com/in/example',
  terminalOpen: false,
  onOpenTerminal: vi.fn(),
}

describe('DesktopDock', () => {
  it('contains exactly the three requested apps and uses the supplied profile URLs', () => {
    render(<DesktopDock {...props} />)
    const dock = within(screen.getByRole('navigation', { name: 'Application Dock' }))
    expect(dock.getAllByRole('link')).toHaveLength(2)
    expect(dock.getAllByRole('button')).toHaveLength(1)
    expect(dock.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      props.githubUrl
    )
    expect(dock.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      props.linkedinUrl
    )
    for (const link of dock.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
    expect(dock.getByRole('button', { name: 'Terminal' })).toHaveAttribute(
      'aria-haspopup',
      'dialog'
    )
  })

  it('renders decorative inline icons for every launcher without image assets', () => {
    render(<DesktopDock {...props} />)
    const dock = screen.getByRole('navigation', { name: 'Application Dock' })
    const launchers = [
      within(dock).getByRole('link', { name: 'GitHub' }),
      within(dock).getByRole('link', { name: 'LinkedIn' }),
      within(dock).getByRole('button', { name: 'Terminal' }),
    ]

    for (const launcher of launchers) {
      const icons = launcher.querySelectorAll('svg')
      expect(icons).toHaveLength(1)
      expect(icons[0]).toHaveAttribute('aria-hidden', 'true')
      expect(icons[0]).toHaveAttribute('focusable', 'false')
    }
    expect(dock.querySelector('img')).toBeNull()
  })

  it('passes the actual Terminal launcher back for opening and focus restoration', async () => {
    const onOpenTerminal = vi.fn()
    const user = userEvent.setup()
    render(<DesktopDock {...props} onOpenTerminal={onOpenTerminal} />)
    const launcher = screen.getByRole('button', { name: 'Terminal' })
    await user.click(launcher)
    expect(onOpenTerminal).toHaveBeenCalledExactlyOnceWith(launcher)
  })

  it('reflects the Terminal session state and still activates an already running app', async () => {
    const onOpenTerminal = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <DesktopDock {...props} onOpenTerminal={onOpenTerminal} />
    )
    const launcher = screen.getByRole('button', { name: 'Terminal' })
    expect(launcher).toHaveAttribute('data-running', 'false')
    expect(launcher.querySelector('.desktop-dock__running')).toBeNull()
    rerender(<DesktopDock {...props} terminalOpen onOpenTerminal={onOpenTerminal} />)
    expect(launcher).toHaveAttribute('data-running', 'true')
    expect(launcher.querySelector('.desktop-dock__running')).toBeInTheDocument()
    await user.click(launcher)
    expect(onOpenTerminal).toHaveBeenCalledExactlyOnceWith(launcher)
    rerender(<DesktopDock {...props} onOpenTerminal={onOpenTerminal} />)
    expect(launcher.querySelector('.desktop-dock__running')).toBeNull()
  })

  it('supports native Dock arrow navigation, edge wrapping, and keyboard activation', async () => {
    const onOpenTerminal = vi.fn()
    const user = userEvent.setup()
    render(<DesktopDock {...props} onOpenTerminal={onOpenTerminal} />)
    const github = screen.getByRole('link', { name: 'GitHub' })
    const linkedin = screen.getByRole('link', { name: 'LinkedIn' })
    const terminal = screen.getByRole('button', { name: 'Terminal' })
    await user.tab()
    expect(github).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(linkedin).toHaveFocus()
    await user.keyboard('{End}')
    expect(terminal).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(github).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(terminal).toHaveFocus()
    await user.keyboard('{Home}')
    expect(github).toHaveFocus()
    await user.keyboard('{End}{Enter}')
    expect(onOpenTerminal).toHaveBeenCalledExactlyOnceWith(terminal)
  })

  it('preserves normal Tab navigation and does not trap focus', async () => {
    const user = userEvent.setup()
    render(
      <>
        <DesktopDock {...props} />
        <button type="button">After Dock</button>
      </>
    )
    await user.tab()
    await user.tab()
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Terminal' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'After Dock' })).toHaveFocus()
  })

  it('dismisses a focused label without triggering the window Escape handler', async () => {
    const onEscape = vi.fn()
    const user = userEvent.setup()
    window.addEventListener('keydown', onEscape)
    try {
      render(<DesktopDock {...props} />)
      await user.tab()
      onEscape.mockClear()
      await user.keyboard('{Escape}')
      expect(onEscape).not.toHaveBeenCalled()
      expect(screen.getByRole('link', { name: 'GitHub' })).toHaveFocus()
    } finally {
      window.removeEventListener('keydown', onEscape)
    }
  })

  it('shows a focused minimized-window tile after a separator that restores Terminal', async () => {
    const onRestoreTerminal = vi.fn()
    const user = userEvent.setup()
    const { container, rerender } = render(
      <DesktopDock {...props} terminalOpen onRestoreTerminal={onRestoreTerminal} />
    )
    expect(screen.queryByRole('button', { name: 'Restore terminal' })).toBeNull()
    expect(container.querySelector('.desktop-dock__separator')).toBeNull()

    rerender(
      <DesktopDock
        {...props}
        terminalMinimized
        terminalOpen
        onRestoreTerminal={onRestoreTerminal}
      />
    )
    const tile = screen.getByRole('button', { name: 'Restore terminal' })
    expect(tile).toHaveFocus()
    expect(container.querySelector('.desktop-dock__separator')).toBeInTheDocument()
    expect(tile.querySelector('.desktop-dock__thumbnail')).toBeInTheDocument()
    const badgeIcon = tile.querySelector('.desktop-dock__badge svg')
    expect(badgeIcon).toHaveAttribute('aria-hidden', 'true')
    expect(badgeIcon).toHaveAttribute('focusable', 'false')
    expect(tile.querySelector('img')).toBeNull()

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('button', { name: 'Terminal' })).toHaveFocus()
    await user.keyboard('{End}{Enter}')
    expect(onRestoreTerminal).toHaveBeenCalledTimes(1)
  })

  it('never shows a minimized tile for a Terminal that is not running', () => {
    render(<DesktopDock {...props} terminalMinimized />)
    expect(screen.queryByRole('button', { name: 'Restore terminal' })).toBeNull()
  })

  it('magnifies the hovered app and resets when the pointer leaves', () => {
    setMockReducedMotion(false)
    render(<DesktopDock {...props} />)
    const toolbar = screen.getByRole('toolbar', { name: 'Dock apps' })
    const github = screen.getByRole('link', { name: 'GitHub' })
    fireEvent.pointerMove(toolbar, { clientX: 0, pointerType: 'mouse' })
    fireEvent.pointerEnter(github, { pointerType: 'mouse' })
    fireEvent.pointerLeave(github)
    fireEvent.pointerLeave(toolbar)
    fireEvent.pointerMove(toolbar, { clientX: 0, pointerType: 'touch' })
    expect(github).toBeInTheDocument()
  })

  it('auto-hides when scrolled to the bottom of the document', () => {
    const { container } = render(<DesktopDock {...props} />)
    const position = container.querySelector('.desktop-dock-position')
    expect(position).toHaveAttribute('data-auto-hidden', 'false')

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 1000,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 600,
    })
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 380,
    })

    fireEvent.scroll(window)
    expect(position).toHaveAttribute('data-auto-hidden', 'true')

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 100,
    })
    fireEvent.scroll(window)
    expect(position).toHaveAttribute('data-auto-hidden', 'false')
  })
})
