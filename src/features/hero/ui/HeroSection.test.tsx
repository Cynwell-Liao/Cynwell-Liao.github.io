import { act, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setMockReducedMotion } from '../../../test/setup'
import { heroProfile as profile } from '../model/profile.fixture'

import { HeroSection } from './HeroSection'

const successfulResponse = (payload: unknown) => ({
  json: () => Promise.resolve(payload),
  ok: true,
  status: 200,
})

const renderHero = () =>
  render(<HeroSection deployVersion="v9.9.9" profile={profile} />)

describe('HeroSection', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<never>(() => undefined))
    )
  })

  it('exposes its heading, status, social links, and loading semantics', async () => {
    const fetchMock = vi.fn(() => new Promise<never>(() => undefined))
    vi.stubGlobal('fetch', fetchMock)

    renderHero()

    expect(screen.getByRole('region', { name: profile.title })).toHaveAttribute(
      'id',
      'home'
    )
    expect(screen.getByText(profile.heroStatusLabel)).toBeInTheDocument()
    expect(screen.getByText('v9.9.9')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: profile.linkedinLabel })).toHaveAttribute(
      'href',
      profile.linkedinUrl
    )
    expect(screen.getByRole('link', { name: profile.githubLabel })).toHaveAttribute(
      'href',
      profile.githubUrl
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      profile.contributionsLoadingLabel
    )
    const activity = screen.getByRole('region', {
      name: 'Professional activity',
    })
    expect(activity).toHaveAttribute('aria-busy', 'true')
    expect(within(activity).getAllByText('…')).toHaveLength(2)
    expect(within(activity).queryByText('500+')).not.toBeInTheDocument()
    expect(within(activity).queryByText('0')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `https://github-contributions-api.jogruber.de/v4/${profile.githubUsername}?y=last`,
        expect.objectContaining({
          referrerPolicy: 'no-referrer',
          signal: expect.any(AbortSignal),
        })
      )
    })
  })

  it('starts both counters immediately and together after GitHub contributions load', async () => {
    setMockReducedMotion(false)
    let resolveRequest:
      ((response: ReturnType<typeof successfulResponse>) => void) | undefined
    const fetchMock = vi.fn(
      () =>
        new Promise<ReturnType<typeof successfulResponse>>((resolve) => {
          resolveRequest = resolve
        })
    )
    const requestAnimationFrameMock = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 1)
    vi.stubGlobal('fetch', fetchMock)

    renderHero()

    const activity = screen.getByRole('region', {
      name: 'Professional activity',
    })
    expect(within(activity).getAllByText('…')).toHaveLength(2)
    expect(requestAnimationFrameMock).not.toHaveBeenCalled()

    const completeRequest = resolveRequest
    if (!completeRequest) {
      throw new Error('Expected the contribution request to be pending')
    }

    await act(async () => {
      completeRequest(successfulResponse({ total: { lastYear: 1234 } }))
      await Promise.resolve()
    })

    expect(within(activity).getAllByText('0')).toHaveLength(2)
    expect(requestAnimationFrameMock).toHaveBeenCalledTimes(2)
  })

  it('reveals the contribution count after a valid response', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(successfulResponse({ total: { lastYear: 1234 } }))
    )
    vi.stubGlobal('fetch', fetchMock)

    renderHero()

    expect(await screen.findByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('500+')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('renders a genuine zero only after a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(successfulResponse({ total: { lastYear: 0 } })))
    )

    renderHero()

    expect(await screen.findByText('0')).toBeInTheDocument()
    expect(screen.getByText('500+')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('keeps LinkedIn available when GitHub contributions fail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline')))
    )

    renderHero()

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Professional activity' })
      ).toHaveAttribute('aria-busy', 'false')
    })
    expect(screen.getByText('500+')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      profile.contributionsUnavailableLabel
    )
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('omits the contribution chart and its fallback link', () => {
    renderHero()

    expect(screen.queryByRole('figure')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: /contribution chart/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', {
        name: /contribution chart/i,
      })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: `View ${profile.githubLabel} activity` })
    ).not.toBeInTheDocument()
  })

  it('never requests GitHub Releases for its displayed deploy version', async () => {
    const fetchMock = vi
      .fn<
        (input: RequestInfo | URL) => Promise<ReturnType<typeof successfulResponse>>
      >()
      .mockResolvedValue(successfulResponse({ total: { lastYear: 42 } }))
    vi.stubGlobal('fetch', fetchMock)

    renderHero()
    await screen.findByText('42')

    const requestedUrls = fetchMock.mock.calls.map(([input]) =>
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    )
    expect(requestedUrls).toEqual([
      `https://github-contributions-api.jogruber.de/v4/${profile.githubUsername}?y=last`,
    ])
    expect(requestedUrls.join(' ')).not.toContain('api.github.com')
    expect(requestedUrls.join(' ')).not.toContain('/releases/latest')
  })
})
