import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { setMockReducedMotion } from '../../../test/setup'

import { TerminalWindowControls } from './TerminalWindowControls'

const renderControls = (expanded = false) => {
  const handlers = {
    onClose: vi.fn(),
    onMinimize: vi.fn(),
    onToggleExpanded: vi.fn(),
  }
  return {
    ...render(<TerminalWindowControls expanded={expanded} {...handlers} />),
    ...handlers,
  }
}

describe('TerminalWindowControls', () => {
  it.each([true, false])(
    'connects each traffic light to one direct action with reduced motion %s',
    async (reducedMotion) => {
      setMockReducedMotion(reducedMotion)
      const user = userEvent.setup()
      const handlers = renderControls()

      await user.click(screen.getByRole('button', { name: 'Close terminal' }))
      await user.click(screen.getByRole('button', { name: 'Minimize terminal' }))
      await user.click(screen.getByRole('button', { name: 'Enter full screen' }))

      expect(handlers.onClose).toHaveBeenCalledTimes(1)
      expect(handlers.onMinimize).toHaveBeenCalledTimes(1)
      expect(handlers.onToggleExpanded).toHaveBeenCalledTimes(1)
    }
  )

  it('never exposes a window-arrangement menu on hover or keyboard navigation', async () => {
    const user = userEvent.setup()
    renderControls()
    const expand = screen.getByRole('button', { name: 'Enter full screen' })

    await user.hover(expand)
    await user.keyboard('{ArrowDown}{ArrowUp}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(expand).not.toHaveAttribute('aria-haspopup')
  })

  it('exposes the full-screen state through the green button label', () => {
    renderControls(true)

    expect(screen.getByRole('button', { name: 'Exit full screen' })).toBeVisible()
  })

  it('keeps pointer and double-click events away from the draggable titlebar', () => {
    renderControls()
    const onPointerDown = vi.fn()
    const onDoubleClick = vi.fn()
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('dblclick', onDoubleClick)

    const expand = screen.getByRole('button', { name: 'Enter full screen' })
    fireEvent.pointerDown(expand)
    fireEvent.doubleClick(expand)

    expect(onPointerDown).not.toHaveBeenCalled()
    expect(onDoubleClick).not.toHaveBeenCalled()
    document.removeEventListener('pointerdown', onPointerDown)
    document.removeEventListener('dblclick', onDoubleClick)
  })
})
