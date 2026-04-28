import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { profile } from '@content'

import App from './App'

describe('App', () => {
  it('renders all primary portfolio sections', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ totalContributions: 321 }),
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    expect(document.getElementById('home')).toBeInTheDocument()
    expect(document.getElementById('about')).toBeInTheDocument()
    expect(document.getElementById('tech-stack')).toBeInTheDocument()
    expect(document.getElementById('projects')).toBeInTheDocument()
    expect(document.getElementById('education')).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`${profile.githubUsername}.json`)
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

    expect(screen.getByRole('dialog', { name: 'Linux terminal' })).toBeInTheDocument()
    expect(
      screen.getByLabelText<HTMLInputElement>('Terminal command input')
    ).toHaveFocus()
  })

  it('keeps the floating terminal profile in sync with the site theme', async () => {
    render(<App />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Terminal' }))

    expect(screen.getByRole('dialog', { name: 'Linux terminal' })).toHaveAttribute(
      'data-theme',
      'light'
    )

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Linux terminal' })).toHaveAttribute(
        'data-theme',
        'dark'
      )
    })
  })
})
