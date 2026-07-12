import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
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

function TerminalHarness() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true)
        }}
        type="button"
      >
        Open terminal
      </button>
      {isOpen ? (
        <TerminalWindow
          onClose={() => {
            setIsOpen(false)
          }}
          onToggleTheme={vi.fn()}
          profile={terminalTestProfile}
          projects={terminalTestProjects}
          theme="light"
        />
      ) : null}
    </>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TerminalWindow', () => {
  it('renders modeless initial content and focuses the command input', () => {
    renderTerminalWindow()

    const dialog = screen.getByRole('dialog', { name: 'Linux terminal' })
    const output = screen.getByRole('log', { name: 'Terminal output' })
    const input = getTerminalInput()

    expect(dialog).toHaveAttribute('data-theme', 'light')
    expect(dialog).not.toHaveAttribute('aria-modal')
    expect(
      screen.getByText(`${terminalTestProfile.githubUsername} — -zsh — 80x24`)
    ).toBeInTheDocument()
    expect(screen.getByText("Type 'help' to explore commands.")).toBeInTheDocument()
    expect(output).not.toContainElement(input)
    expect(input).toHaveFocus()
  })

  it('renders the dark terminal profile when the site is dark', () => {
    renderTerminalWindow({ theme: 'dark' })

    expect(screen.getByRole('dialog', { name: 'Linux terminal' })).toHaveAttribute(
      'data-theme',
      'dark'
    )
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

  it('restores focus to the opener after closing', async () => {
    const user = userEvent.setup()
    render(<TerminalHarness />)

    const opener = screen.getByRole('button', { name: 'Open terminal' })
    await user.click(opener)
    expect(getTerminalInput()).toHaveFocus()

    const closeButton = screen.getByRole('button', { name: 'Close terminal' })
    expect(closeButton).toHaveClass('h-6', 'w-6')
    expect(closeButton.firstElementChild).toHaveClass('h-3', 'w-3')
    await user.click(closeButton)

    expect(
      screen.queryByRole('dialog', { name: 'Linux terminal' })
    ).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('closes from the Escape key', async () => {
    const onClose = vi.fn()
    renderTerminalWindow({ onClose })

    const user = userEvent.setup()
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
