import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { profile } from '@content'

import { Navbar } from './Navbar'

import type { NavLink } from '@features/navbar'

const links: NavLink[] = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
]

describe('Navbar', () => {
  it('renders the brand logo from the configured base path', () => {
    render(
      <Navbar
        brandName={profile.brandName}
        links={links}
        onOpenTerminal={() => {
          return undefined
        }}
        onToggleTheme={() => {
          return undefined
        }}
        theme="light"
      />
    )

    expect(screen.getByRole('img', { name: 'Logo' })).toHaveAttribute(
      'src',
      expect.stringContaining('favicon.ico')
    )
  })

  it('calls the theme toggle handler when the button is clicked', async () => {
    const onToggleTheme = vi.fn()

    render(
      <Navbar
        brandName={profile.brandName}
        links={links}
        onOpenTerminal={() => {
          return undefined
        }}
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
        brandName={profile.brandName}
        links={links}
        onOpenTerminal={() => {
          return undefined
        }}
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
        brandName={profile.brandName}
        links={links}
        onOpenTerminal={() => {
          return undefined
        }}
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

  it('opens the floating terminal from the navbar button', async () => {
    const onOpenTerminal = vi.fn()

    render(
      <Navbar
        brandName={profile.brandName}
        links={links}
        onOpenTerminal={onOpenTerminal}
        onToggleTheme={() => {
          return undefined
        }}
        theme="light"
      />
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Terminal' }))

    expect(onOpenTerminal).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByRole('link', { name: profile.githubLabel })
    ).not.toBeInTheDocument()
  })
})
