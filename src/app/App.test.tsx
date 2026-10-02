import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { navLinks, profile } from '@content'

import App from './App'

describe('App', () => {
  it('renders all primary portfolio sections', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ total: { lastYear: 321 } }),
        ok: true,
        status: 200,
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    expect(document.getElementById('home')).toBeInTheDocument()
    expect(document.getElementById('about')).toBeInTheDocument()
    expect(document.getElementById('tech-stack')).toBeInTheDocument()
    expect(document.getElementById('projects')).toBeInTheDocument()
    expect(document.getElementById('education')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content'
    )
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    for (const link of navLinks) {
      expect(document.querySelectorAll(link.href)).toHaveLength(1)
    }

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `https://github-contributions-api.jogruber.de/v4/${profile.githubUsername}?y=last`,
        expect.objectContaining({
          referrerPolicy: 'no-referrer',
          signal: expect.any(AbortSignal),
        })
      )
    })
  })

  it('restores dark theme from storage and toggles back to light', async () => {
    localStorage.setItem('portfolio-theme', 'dark')

    render(<App />)

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark')
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass('dark')
      expect(localStorage.getItem('portfolio-theme')).toBe('light')
    })
  })

  it('opens the floating terminal from the navbar', async () => {
    render(<App />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Terminal' }))

    expect(await screen.findByRole('dialog', { name: 'Terminal' })).toBeInTheDocument()
    expect(
      screen.getByLabelText<HTMLInputElement>('Terminal command input')
    ).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Terminal' })).toHaveFocus()
  })

  it('keeps the floating terminal profile in sync with the site theme', async () => {
    render(<App />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Terminal' }))

    expect(await screen.findByRole('dialog', { name: 'Terminal' })).toHaveAttribute(
      'data-theme',
      'light'
    )

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Terminal' })).toHaveAttribute(
        'data-theme',
        'dark'
      )
    })
  })

  it('restores the window from full screen before Escape closes the terminal', async () => {
    render(<App />)

    const user = userEvent.setup()
    const opener = screen.getByRole('button', { name: 'Terminal' })
    await user.click(opener)
    const dialog = await screen.findByRole('dialog', { name: 'Terminal' })
    await user.click(screen.getByRole('button', { name: 'Enter full screen' }))

    await user.keyboard('{Escape}')
    expect(dialog).toHaveAttribute('data-window-mode', 'windowed')
    expect(dialog).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
})
