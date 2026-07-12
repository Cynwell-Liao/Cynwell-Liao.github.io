import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createNavLink } from '../../../test/factories/portfolio'
import { setMockScrollY } from '../../../test/setup'

import { Navbar } from './Navbar'

const links = [
  createNavLink(),
  createNavLink({ href: '#projects', label: 'Projects' }),
] as const

const renderNavbar = (overrides: Partial<Parameters<typeof Navbar>[0]> = {}) =>
  render(
    <Navbar
      brandName="Example Engineer"
      links={links}
      onOpenTerminal={() => undefined}
      onToggleTheme={() => undefined}
      theme="light"
      {...overrides}
    />
  )

describe('Navbar', () => {
  it('renders a clearly named home link with a decorative brand image', () => {
    const { container } = renderNavbar()

    const homeLink = screen.getByRole('link', { name: 'Example Engineer home' })
    const logo = container.querySelector('img')

    expect(homeLink).toHaveAttribute('href', '#home')
    expect(within(homeLink).getByTestId('navbar-brand')).toHaveTextContent(
      'Example Engineer'
    )
    expect(logo).toHaveAttribute('alt', '')
    expect(logo).toHaveAttribute('src', expect.stringContaining('favicon.ico'))
  })

  it('renders every configured destination inside labelled primary navigation', () => {
    renderNavbar()

    const navigation = screen.getByRole('navigation', {
      name: 'Primary navigation',
    })

    expect(within(navigation).getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '#about'
    )
    expect(within(navigation).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'href',
      '#projects'
    )
  })

  it('calls the theme and terminal handlers from their named controls', async () => {
    const onOpenTerminal = vi.fn()
    const onToggleTheme = vi.fn()
    const user = userEvent.setup()
    renderNavbar({ onOpenTerminal, onToggleTheme })

    await user.click(screen.getByRole('button', { name: 'Terminal' }))
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    expect(onOpenTerminal).toHaveBeenCalledTimes(1)
    expect(onToggleTheme).toHaveBeenCalledTimes(1)
  })

  it('updates the theme control name when the current theme changes', () => {
    const { rerender } = renderNavbar()

    expect(
      screen.getByRole('button', { name: 'Switch to dark mode' })
    ).toBeInTheDocument()

    rerender(
      <Navbar
        brandName="Example Engineer"
        links={links}
        onOpenTerminal={() => undefined}
        onToggleTheme={() => undefined}
        theme="dark"
      />
    )

    expect(
      screen.getByRole('button', { name: 'Switch to light mode' })
    ).toBeInTheDocument()
  })

  it('initializes and reacts to the shared scroll position', () => {
    setMockScrollY(75)
    const { unmount } = renderNavbar()
    const getNavbarShell = () =>
      screen.getByRole('link', { name: 'Example Engineer home' }).parentElement

    expect(getNavbarShell()).toHaveClass('max-w-4xl')

    unmount()
    setMockScrollY(0)
    renderNavbar()
    expect(getNavbarShell()).toHaveClass('max-w-6xl')

    act(() => {
      setMockScrollY(100)
    })
    expect(getNavbarShell()).toHaveClass('max-w-4xl')
  })
})
