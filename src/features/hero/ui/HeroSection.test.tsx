import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { profile } from '@content/profile'

import { HeroSection } from './HeroSection'

describe('HeroSection', () => {
  it('renders contribution total when API returns valid payload', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ totalContributions: 42 }),
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<HeroSection profile={profile} />)

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

    render(<HeroSection profile={profile} />)

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
      render(<HeroSection profile={profile} />)

      await waitFor(() => {
        expect(errorSpy).toHaveBeenCalled()
      })

      expect(screen.getByText(profile.contributionsLoadingLabel)).toBeInTheDocument()
    } finally {
      errorSpy.mockRestore()
    }
  })
})
