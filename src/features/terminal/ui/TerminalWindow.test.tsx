import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { loadProjects, profile } from '@content'

import { TerminalWindow } from './TerminalWindow'

const projects = loadProjects()

const renderTerminalWindow = (overrides?: {
  onClose?: () => void
  onToggleTheme?: () => void
  theme?: 'light' | 'dark'
}) =>
  render(
    <TerminalWindow
      onClose={overrides?.onClose ?? vi.fn()}
      onToggleTheme={overrides?.onToggleTheme ?? vi.fn()}
      profile={profile}
      projects={projects}
      theme={overrides?.theme ?? 'light'}
    />
  )

const getTerminalInput = () =>
  screen.getByLabelText<HTMLInputElement>('Terminal command input')

const submitCommand = (command: string) => {
  const input = getTerminalInput()
  const form = input.closest('form')

  if (!form) {
    throw new Error('Terminal input is missing its form')
  }

  fireEvent.input(input, { target: { value: command } })
  fireEvent.click(screen.getByRole('button', { name: 'Run terminal command' }))
}

describe('TerminalWindow', () => {
  it('renders initial terminal content and focuses the command input', () => {
    renderTerminalWindow()

    expect(screen.getByRole('dialog', { name: 'Linux terminal' })).toHaveAttribute(
      'data-theme',
      'light'
    )
    expect(screen.getByText('PORTFOLIO TERMINAL')).toBeInTheDocument()
    expect(screen.getByText("Type 'help' to explore commands.")).toBeInTheDocument()
    expect(getTerminalInput()).toHaveFocus()
  })

  it('renders the dark terminal profile when the site is dark', () => {
    renderTerminalWindow({ theme: 'dark' })

    expect(screen.getByRole('dialog', { name: 'Linux terminal' })).toHaveAttribute(
      'data-theme',
      'dark'
    )
  })

  it('runs commands and records command history', () => {
    renderTerminalWindow()

    submitCommand('help')
    submitCommand('history')

    expect(screen.getByText('Available commands:')).toBeInTheDocument()
    expect(screen.getByText(/1\s+help/u)).toBeInTheDocument()
    expect(screen.getByText(/2\s+history/u)).toBeInTheDocument()
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

  it('opens project links from the open command', async () => {
    const openMock = vi.fn()
    vi.stubGlobal('open', openMock)
    renderTerminalWindow()

    submitCommand('open 1')

    await waitFor(() => {
      expect(openMock).toHaveBeenCalledWith(
        projects[0].liveUrl,
        '_blank',
        'noopener,noreferrer'
      )
    })
    expect(screen.getByText(`Opening ${projects[0].title}...`)).toBeInTheDocument()
  })

  it('closes from the close button and Escape key', async () => {
    const onClose = vi.fn()
    renderTerminalWindow({ onClose })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Close terminal' }))
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
