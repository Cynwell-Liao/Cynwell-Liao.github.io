import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { loadProjects, profile } from '@content'
import packageJson from '../../../../package.json'

import { HeroSection } from './HeroSection'

import type { Project } from '@shared/types/portfolio.types'

const projects = loadProjects()

const createFetchMock = (options?: {
  deployVersion?: string
  totalContributions?: number
}) =>
  vi.fn((input: RequestInfo | URL) => {
    const requestUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url

    if (requestUrl.includes('version.json')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ version: options?.deployVersion ?? packageJson.version }),
      })
    }

    return Promise.resolve({
      json: () =>
        Promise.resolve({ totalContributions: options?.totalContributions ?? 123 }),
    })
  })

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
    const fetchMock = createFetchMock({ totalContributions: 42 })
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
    const fetchMock = createFetchMock()
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

  it('renders the deploy version beside the online status', async () => {
    const fetchMock = createFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    renderHeroSection()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    expect(screen.getByText(profile.heroStatusLabel)).toBeInTheDocument()
    expect(screen.getByText(`v${packageJson.version}`)).toBeInTheDocument()
  })

  it('updates the deploy version when a newer release is published', async () => {
    const fetchMock = createFetchMock({ deployVersion: 'v1.2.2' })
    vi.stubGlobal('fetch', fetchMock)

    renderHeroSection()

    await waitFor(() => {
      expect(screen.getByText('v1.2.2')).toBeInTheDocument()
    })
  })
})
