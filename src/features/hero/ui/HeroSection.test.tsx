import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { profile } from '@content/profile'
import { loadProjects } from '@content/projects'

import { HeroSection } from './HeroSection'

import type { Project } from '@shared/types/portfolio.types'

const projects = loadProjects()

const renderHeroSection = (overrides?: {
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
  projects?: Project[]
}) =>
  render(
    <HeroSection
      onToggleTheme={overrides?.onToggleTheme ?? vi.fn()}
      profile={profile}
      projects={overrides?.projects ?? projects}
      theme={overrides?.theme ?? 'light'}
    />
  )

describe('HeroSection', () => {
  it('renders contribution total when API returns valid payload', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ totalContributions: 42 }),
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    renderHeroSection()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    expect(await screen.findByText('42')).toBeInTheDocument()
    expect(screen.getByText(profile.contributionsSuffixLabel)).toBeInTheDocument()
  })

  it('keeps loading state when API payload does not include contribution total', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    renderHeroSection()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    expect(screen.getByText(profile.contributionsLoadingLabel)).toBeInTheDocument()
  })

  it('handles request failure without crashing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi.fn(() => Promise.reject(new Error('network')))
    vi.stubGlobal('fetch', fetchMock)

    try {
      renderHeroSection()

      await waitFor(() => {
        expect(errorSpy).toHaveBeenCalled()
      })

      expect(screen.getByText(profile.contributionsLoadingLabel)).toBeInTheDocument()
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('renders terminal startup hint', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    renderHeroSection()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    expect(
      screen.getByLabelText<HTMLInputElement>('Terminal command input')
    ).toBeInTheDocument()
    expect(screen.getByText("Type 'help' to explore commands.")).toBeInTheDocument()
  })
})
