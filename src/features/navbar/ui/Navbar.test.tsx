import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Navbar } from './Navbar'

import type { NavLink } from '@features/navbar'

const links: NavLink[] = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
]

describe('Navbar', () => {
  it('calls the theme toggle handler when the button is clicked', async () => {
    const onToggleTheme = vi.fn()

    render(
      <Navbar
        githubUrl="https://github.com/Cynwell-Liao"
        links={links}
        onToggleTheme={onToggleTheme}
        theme="light"
      />
    )

    const user = userEvent.setup()
    const button = screen.getByRole('button', { name: 'Switch to dark mode' })

    await user.click(button)

    expect(onToggleTheme).toHaveBeenCalledTimes(1)
  })

  it('shows the correct accessibility label for current theme', () => {
    const { rerender } = render(
      <Navbar
        githubUrl="https://github.com/Cynwell-Liao"
        links={links}
        onToggleTheme={() => {
          return undefined
        }}
        theme="light"
      />
    )

    expect(
      screen.getByRole('button', { name: 'Switch to dark mode' })
    ).toBeInTheDocument()

    rerender(
      <Navbar
        githubUrl="https://github.com/Cynwell-Liao"
        links={links}
        onToggleTheme={() => {
          return undefined
        }}
        theme="dark"
      />
    )

    expect(
      screen.getByRole('button', { name: 'Switch to light mode' })
    ).toBeInTheDocument()
  })
})
