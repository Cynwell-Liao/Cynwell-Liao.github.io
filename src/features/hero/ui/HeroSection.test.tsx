import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { heroProfile as profile } from '../model/profile.fixture'

import { HeroSection } from './HeroSection'

const renderHero = () =>
  render(<HeroSection deployVersion="v9.9.9" profile={profile} />)

describe('HeroSection', () => {
  it('exposes the profile name as its heading with the role, version, and certifications', () => {
    renderHero()

    expect(screen.getByRole('region', { name: profile.name })).toHaveAttribute(
      'id',
      'home'
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(profile.name)
    expect(screen.getByText(profile.title)).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: profile.title })
    ).not.toBeInTheDocument()
    expect(screen.queryByText('SYSTEMS ONLINE')).not.toBeInTheDocument()
    expect(screen.getByText('v9.9.9')).toHaveClass(
      'font-semibold',
      'text-emerald-800',
      'dark:text-emerald-300'
    )
    expect(
      screen.getByRole('region', { name: profile.heroCertificationsHeading })
    ).toBeInTheDocument()
  })

  it('omits activity statistics and social icons without making API requests', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    renderHero()

    expect(
      screen.queryByRole('region', { name: 'Professional activity' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/connections|contributions|500\+/i)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /linkedin|github/i })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText('…')).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
