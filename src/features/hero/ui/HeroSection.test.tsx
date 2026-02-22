import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HeroSection } from './HeroSection'

import type { ProfileData } from '../model/profile.types'

const profile: ProfileData = {
  name: 'Cynwell Liao',
  title: 'Software Engineer',
  tagline: 'Building production systems.',
  about: [],
  githubUsername: 'Cynwell-Liao',
  githubUrl: 'https://github.com/Cynwell-Liao',
  resumePath: '/resume.pdf',
}

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
    expect(screen.getByText('contributions in the last year')).toBeInTheDocument()
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

    expect(screen.getByText('Loading contributions...')).toBeInTheDocument()
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

      expect(screen.getByText('Loading contributions...')).toBeInTheDocument()
    } finally {
      errorSpy.mockRestore()
    }
  })
})
