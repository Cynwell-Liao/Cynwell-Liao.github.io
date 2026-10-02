import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  terminalTestProfile,
  terminalTestProjects,
} from '../model/terminal.test-fixtures'

import { TerminalWindow } from './TerminalWindow'

const renderTerminalWindow = (overrides?: {
  onClose?: () => void
  onToggleTheme?: () => void
  theme?: 'light' | 'dark'
}) =>
  render(
    <TerminalWindow
      onClose={overrides?.onClose ?? vi.fn()}
      onToggleTheme={overrides?.onToggleTheme ?? vi.fn()}
      profile={terminalTestProfile}
      projects={terminalTestProjects}
      theme={overrides?.theme ?? 'light'}
    />
  )

const getTerminalInput = () =>
  screen.getByLabelText<HTMLInputElement>('Terminal command input')

const submitCommand = (command: string) => {
  fireEvent.input(getTerminalInput(), { target: { value: command } })

  const form = getTerminalInput().closest('form')

  if (!form) {
    throw new Error('Terminal input is missing its form')
  }

  fireEvent.submit(form)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TerminalWindow', () => {
  it('renders modeless initial content and focuses the command input', () => {
    renderTerminalWindow()

    const dialog = screen.getByRole('dialog', { name: 'Terminal' })
    const output = screen.getByRole('log', { name: 'Terminal output' })
    const input = getTerminalInput()

    expect(dialog).toHaveAttribute('data-theme', 'light')
    expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
    expect(dialog).not.toHaveAttribute('aria-modal')
    expect(screen.getByText(/ — -zsh — \d+×\d+$/u)).toBeInTheDocument()
    expect(screen.getByText("Type 'help' to explore commands.")).toBeInTheDocument()
    expect(output).not.toContainElement(input)
    expect(input.closest('.terminal-screen')).toContainElement(output)
    expect(input).not.toHaveAttribute('placeholder')
    expect(input).toHaveFocus()
  })

  it('renders the dark terminal profile when the site is dark', () => {
    renderTerminalWindow({ theme: 'dark' })

    expect(screen.getByRole('dialog', { name: 'Terminal' })).toHaveAttribute(
      'data-theme',
      'dark'
    )
  })

  it('deactivates when keyboard focus leaves the window and reactivates on return', async () => {
    const user = userEvent.setup()
    renderTerminalWindow()
    render(<button type="button">Next page control</button>)
    const dialog = screen.getByRole('dialog', { name: 'Terminal' })

    await user.tab()
    expect(screen.getByRole('button', { name: 'Resize terminal' })).toHaveFocus()
    expect(dialog).toHaveAttribute('data-active', 'true')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Next page control' })).toHaveFocus()
    expect(dialog).toHaveAttribute('data-active', 'false')

    await user.tab({ shift: true })
    await user.tab({ shift: true })
    expect(getTerminalInput()).toHaveFocus()
    expect(dialog).toHaveAttribute('data-active', 'true')
  })

  it('runs commands through form submission and records command history', async () => {
    renderTerminalWindow()

    submitCommand('help')

    const user = userEvent.setup()
    fireEvent.input(getTerminalInput(), { target: { value: 'history' } })
    getTerminalInput().focus()
    await user.keyboard('{Enter}')

    expect(screen.getByText('Available commands:')).toBeInTheDocument()
    expect(screen.getByText(/1\s+help/u)).toBeInTheDocument()
    expect(screen.getByText(/2\s+history/u)).toBeInTheDocument()
    expect(getTerminalInput()).toHaveValue('')
  })

  it('clears terminal output', () => {
    renderTerminalWindow()

    submitCommand('clear')

    expect(
      screen.queryByText("Type 'help' to explore commands.")
    ).not.toBeInTheDocument()
    expect(getTerminalInput()).toBeInTheDocument()
  })

  it('runs the theme toggle command', () => {
    const onToggleTheme = vi.fn()
    renderTerminalWindow({ onToggleTheme, theme: 'dark' })

    submitCommand('theme toggle')

    expect(onToggleTheme).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Theme toggled to light.')).toBeInTheDocument()
  })

  it('opens project links safely from the open command', async () => {
    const openMock = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderTerminalWindow()

    submitCommand('open 1')

    await waitFor(() => {
      expect(openMock).toHaveBeenCalledWith(
        terminalTestProjects[0].liveUrl,
        '_blank',
        'noopener,noreferrer'
      )
    })
    expect(
      screen.getByText(`Opening ${terminalTestProjects[0].title}...`)
    ).toBeInTheDocument()
  })

  it('requests dismissal from the close control', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderTerminalWindow({ onClose })

    const closeButton = screen.getByRole('button', { name: 'Close terminal' })
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('restores the current session and input draft after minimizing', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderTerminalWindow({ onClose })

    submitCommand('pwd')
    await user.type(getTerminalInput(), 'unfinished command')
    await user.click(screen.getByRole('button', { name: 'Minimize terminal' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    const restore = screen.getByRole('button', { name: 'Restore terminal' })
    expect(restore).toHaveFocus()
    await user.click(restore)

    expect(screen.getByRole('log')).toHaveTextContent(
      `${terminalTestProfile.heroTerminalPath} % pwd`
    )
    expect(getTerminalInput()).toHaveValue('unfinished command')
    expect(getTerminalInput()).toHaveFocus()
  })

  it.each([
    { start: 2, end: 2, direction: 'none', expected: 'abXcdef' },
    { start: 2, end: 4, direction: 'forward', expected: 'abXef' },
    { start: 2, end: 4, direction: 'backward', expected: 'abXef' },
  ] as const)(
    'preserves input selection $start–$end ($direction) across minimize and restore',
    async ({ start, end, direction, expected }) => {
      const user = userEvent.setup()
      renderTerminalWindow()
      const input = getTerminalInput()
      await user.type(input, 'abcdef')
      input.setSelectionRange(start, end, direction)
      fireEvent.select(input)

      await user.click(screen.getByRole('button', { name: 'Minimize terminal' }))
      await user.click(screen.getByRole('button', { name: 'Restore terminal' }))

      const restoredInput = getTerminalInput()
      expect(restoredInput).toHaveFocus()
      expect(restoredInput.selectionStart).toBe(start)
      expect(restoredInput.selectionEnd).toBe(end)
      expect(restoredInput.selectionDirection).toBe(direction)
      await user.keyboard('X')
      expect(restoredInput).toHaveValue(expected)
    }
  )

  it('preserves horizontal input scrolling across minimize and restore', async () => {
    const user = userEvent.setup()
    renderTerminalWindow()
    const input = getTerminalInput()
    fireEvent.input(input, { target: { value: 'long command '.repeat(20) } })
    input.setSelectionRange(120, 120)
    input.scrollLeft = 500
    fireEvent.select(input)
    fireEvent.scroll(input)

    await user.click(screen.getByRole('button', { name: 'Minimize terminal' }))
    await user.click(screen.getByRole('button', { name: 'Restore terminal' }))

    expect(getTerminalInput().selectionStart).toBe(120)
    expect(getTerminalInput().scrollLeft).toBe(500)
  })

  it('toggles full screen from the green control without losing the draft', async () => {
    const user = userEvent.setup()
    renderTerminalWindow()
    const dialog = screen.getByRole('dialog', { name: 'Terminal' })
    await user.type(getTerminalInput(), 'draft')

    await user.click(screen.getByRole('button', { name: 'Enter full screen' }))
    expect(dialog).toHaveAttribute('data-window-mode', 'fullscreen')
    expect(getTerminalInput()).toHaveValue('draft')

    await user.click(screen.getByRole('button', { name: 'Exit full screen' }))
    expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
  })

  it('zooms on title-bar double-click and returns to zoom after leaving full screen', async () => {
    const user = userEvent.setup()
    renderTerminalWindow()
    const dialog = screen.getByRole('dialog', { name: 'Terminal' })
    const titlebar = screen.getByTestId('terminal-titlebar')

    fireEvent.doubleClick(titlebar)
    expect(dialog).toHaveAttribute('data-window-mode', 'zoomed')
    await user.click(screen.getByRole('button', { name: 'Enter full screen' }))
    expect(dialog).toHaveAttribute('data-window-mode', 'fullscreen')
    fireEvent.doubleClick(titlebar)
    expect(dialog).toHaveAttribute('data-window-mode', 'fullscreen')
    await user.keyboard('{Escape}')
    expect(dialog).toHaveAttribute('data-window-mode', 'zoomed')
    fireEvent.doubleClick(titlebar)
    expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
  })

  it('restores the original window after Escape from zoomed mode', async () => {
    const user = userEvent.setup()
    renderTerminalWindow()
    const dialog = screen.getByRole('dialog', { name: 'Terminal' })

    fireEvent.doubleClick(screen.getByTestId('terminal-titlebar'))
    await user.keyboard('{Escape}')

    expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
  })

  it('tiles to either side from the green control menu without losing the draft', async () => {
    const user = userEvent.setup()
    renderTerminalWindow()
    const dialog = screen.getByRole('dialog', { name: 'Terminal' })
    await user.type(getTerminalInput(), 'draft')

    for (const [side, mode] of [
      ['Left', 'left'],
      ['Right', 'right'],
    ] as const) {
      const green = screen.getByRole('button', { name: /full screen/u })
      green.focus()
      await user.keyboard('{ArrowDown}')
      await user.click(
        screen.getByRole('menuitem', { name: `Tile Window to ${side} of Screen` })
      )

      expect(dialog).toHaveAttribute('data-window-mode', mode)
      expect(getTerminalInput()).toHaveValue('draft')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Enter full screen' }))
      expect(dialog).toHaveAttribute('data-window-mode', 'fullscreen')
      await user.click(screen.getByRole('button', { name: 'Exit full screen' }))
      expect(dialog).toHaveAttribute('data-window-mode', mode)
      await user.keyboard('{Escape}')
      expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
    }
  })

  it('navigates command history and restores the draft after the newest command', () => {
    renderTerminalWindow()
    submitCommand('pwd')
    submitCommand('help')
    const input = getTerminalInput()
    fireEvent.input(input, { target: { value: 'unfinished' } })

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveValue('help')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveValue('pwd')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveValue('pwd')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveValue('help')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveValue('unfinished')
  })

  it('cancels a draft with Control-C without running it or recording it in history', () => {
    renderTerminalWindow()
    submitCommand('pwd')
    const input = getTerminalInput()
    fireEvent.input(input, { target: { value: 'help' } })
    fireEvent.keyDown(input, { key: 'c', ctrlKey: true })

    expect(input).toHaveValue('')
    expect(screen.getByRole('log')).toHaveTextContent('help^C')
    expect(screen.queryByText('Available commands:')).not.toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveValue('pwd')
  })

  it.each([
    { shortcut: 'Control-L', key: 'l', ctrlKey: true },
    { shortcut: 'Command-K', key: 'k', metaKey: true },
  ])('clears the display with $shortcut and preserves the draft and history', (key) => {
    renderTerminalWindow()
    submitCommand('pwd')
    const input = getTerminalInput()
    fireEvent.input(input, { target: { value: 'draft' } })
    fireEvent.keyDown(input, key)

    expect(screen.getByRole('log')).toBeEmptyDOMElement()
    expect(input).toHaveValue('draft')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveValue('pwd')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveValue('draft')
  })

  it('clears the input with Control-U while retaining the transcript', () => {
    renderTerminalWindow()
    submitCommand('pwd')
    const input = getTerminalInput()
    fireEvent.input(input, { target: { value: 'draft' } })
    fireEvent.keyDown(input, { key: 'u', ctrlKey: true })

    expect(input).toHaveValue('')
    expect(screen.getByRole('log')).toHaveTextContent(
      `${terminalTestProfile.heroTerminalPath} % pwd`
    )
  })

  it('focuses the prompt when the terminal screen is clicked', async () => {
    const user = userEvent.setup()
    renderTerminalWindow()
    screen.getByRole('button', { name: 'Resize terminal' }).focus()
    const terminalScreen = getTerminalInput().closest('.terminal-screen')
    if (!terminalScreen) throw new Error('Terminal screen is unavailable')

    await user.click(terminalScreen)

    expect(getTerminalInput()).toHaveFocus()
  })
})
