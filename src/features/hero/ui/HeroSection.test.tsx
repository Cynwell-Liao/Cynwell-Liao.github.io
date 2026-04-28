import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { profile } from '@content'

import { HeroSection } from './HeroSection'

const createFetchMock = (options?: { totalContributions?: number }) =>
  vi.fn((input: RequestInfo | URL) => {
    void input

    return Promise.resolve({
      json: () =>
        Promise.resolve({ totalContributions: options?.totalContributions ?? 123 }),
    })
  })

const renderHeroSection = (overrides?: { deployVersion?: string }) =>
  render(
    <HeroSection
      deployVersion={overrides?.deployVersion ?? import.meta.env.VITE_APP_VERSION}
      profile={profile}
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

  it('renders the static deploy version beside the online status', async () => {
    const fetchMock = createFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    renderHeroSection({ deployVersion: 'v9.9.9' })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    expect(screen.getByText(profile.heroStatusLabel)).toBeInTheDocument()
    expect(screen.getByText('v9.9.9')).toBeInTheDocument()
  })

  it('does not request GitHub Releases for the deploy version', async () => {
    const fetchMock = createFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    renderHeroSection()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`${profile.githubUsername}.json`)
      )
    })

    const requestedUrls = fetchMock.mock.calls.map(([input]) =>
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url
    )

    expect(requestedUrls).not.toEqual(
      expect.arrayContaining([expect.stringContaining('api.github.com')])
    )
    expect(requestedUrls).not.toEqual(
      expect.arrayContaining([expect.stringContaining('/releases/latest')])
    )
  })
})
