import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setMockReducedMotion } from '../../../test/setup'

import { HeroSection } from './HeroSection'

import type { ProfileData } from '../model/profile.types'

const profile: ProfileData = {
  name: 'Ada Lovelace',
  brandName: 'ada.dev',
  title: 'Software Engineer',
  about: ['Builds reliable software.'],
  githubUsername: 'ada-lovelace',
  githubUrl: 'https://github.com/ada-lovelace',
  repositoryUrl: 'https://github.com/ada-lovelace/portfolio',
  githubLabel: 'GitHub profile',
  linkedinUrl: 'https://www.linkedin.com/in/ada-lovelace',
  linkedinConnectionCount: 760,
  linkedinLabel: 'LinkedIn profile',
  linkedinConnectionsLabel: 'connections',
  heroStatusLabel: 'SYSTEMS ONLINE',
  heroTerminalPath: '~/portfolio',
  heroTerminalDirectories: ['projects'],
  heroTerminalPrompt: '$',
  heroCertificationsHeading: 'Certifications',
  heroCertifications: [
    {
      credentialUrl: 'https://credentials.example.com/cloud',
      imageUrl: 'https://images.example.com/cloud.png',
      imageAlt: 'Cloud certification badge',
      imageWidth: 120,
      imageHeight: 120,
    },
  ],
  contributionsLoadingLabel: 'Loading GitHub contributions',
  contributionsUnavailableLabel: 'GitHub contributions are unavailable',
  contributionsSuffixLabel: 'contributions',
  aboutHeadingLead: 'About',
  aboutHeadingAccent: 'me',
  aboutIntro: 'Intro',
  techStackSectionEyebrow: 'Skills',
  techStackSectionTitle: 'Tech stack',
  techStackSectionDescription: 'Tools',
  projectsSectionEyebrow: 'Work',
  projectsSectionTitle: 'Projects',
  projectsSectionDescription: 'Selected work',
  projectLiveLabel: 'Live',
  projectSourceLabel: 'Source',
  educationSectionEyebrow: 'Learning',
  educationSectionTitle: 'Education',
  educationSectionDescription: 'Study',
  footerAttribution: 'Built by Ada',
}

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

  afterEach(() => {
    vi.useRealTimers()
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

  it.each([
    ['a rejected request', () => Promise.reject(new Error('offline'))],
    [
      'a non-success response',
      () =>
        Promise.resolve({
          json: () => Promise.resolve({ total: { lastYear: 25 } }),
          ok: false,
          status: 503,
        }),
    ],
    [
      'an invalid total',
      () => Promise.resolve(successfulResponse({ total: { lastYear: -1 } })),
    ],
    [
      'malformed JSON',
      () =>
        Promise.resolve({
          json: () => Promise.reject(new Error('invalid JSON')),
          ok: true,
          status: 200,
        }),
    ],
  ])('keeps LinkedIn available when GitHub has %s', async (_label, responseFactory) => {
    const fetchMock = vi.fn(responseFactory)
    vi.stubGlobal('fetch', fetchMock)

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

  it('marks a timed-out request unavailable and ignores a late response', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    let requestSignal: AbortSignal | undefined
    let resolveRequest:
      ((response: ReturnType<typeof successfulResponse>) => void) | undefined
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      requestSignal = init?.signal ?? undefined

      return new Promise<ReturnType<typeof successfulResponse>>((resolve) => {
        resolveRequest = resolve
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderHero()

    expect(requestSignal).toBeInstanceOf(AbortSignal)
    expect(requestSignal?.aborted).toBe(false)

    act(() => {
      vi.advanceTimersByTime(8000)
    })

    expect(requestSignal?.aborted).toBe(true)
    expect(screen.getByRole('status')).toHaveTextContent(
      profile.contributionsUnavailableLabel
    )
    expect(screen.getByText('—')).toBeInTheDocument()

    const completeRequest = resolveRequest
    if (!completeRequest) {
      throw new Error('Expected the contribution request to be pending')
    }

    await act(async () => {
      completeRequest(successfulResponse({ total: { lastYear: 999 } }))
      await Promise.resolve()
    })

    expect(screen.queryByText('999')).not.toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('aborts an outstanding contribution request when unmounted', async () => {
    let requestSignal: AbortSignal | undefined
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      requestSignal = init?.signal ?? undefined
      return new Promise<never>(() => undefined)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { unmount } = renderHero()
    await waitFor(() => {
      expect(requestSignal).toBeInstanceOf(AbortSignal)
    })

    unmount()

    expect(requestSignal?.aborted).toBe(true)
  })

  it('renders a labelled, dimensioned contribution figure with a fallback', () => {
    renderHero()

    const figure = screen.getByRole('figure', {
      name: `${profile.name}'s GitHub contribution activity`,
    })
    const chart = screen.getByRole('img', {
      name: `${profile.name}'s GitHub contribution chart`,
    })
    expect(figure).toContainElement(chart)
    expect(
      screen.getByRole('link', {
        name: `View ${profile.name}'s GitHub contribution chart`,
      })
    ).toHaveAttribute('href', profile.githubUrl)
    expect(chart).toHaveAttribute(
      'src',
      `https://ghchart.rshah.org/${profile.githubUsername}`
    )
    expect(chart).toHaveAttribute('width', '663')
    expect(chart).toHaveAttribute('height', '104')
    expect(chart).toHaveAttribute('fetchpriority', 'high')
    expect(chart).toHaveAttribute('decoding', 'async')
    expect(chart).toHaveAttribute('referrerpolicy', 'no-referrer')

    fireEvent.error(chart)

    expect(screen.queryByRole('img', { name: /contribution chart/i })).toBeNull()
    expect(
      screen.getByRole('link', { name: `View ${profile.githubLabel} activity` })
    ).toHaveAttribute('href', profile.githubUrl)
  })

  it('keeps one semantic certification set and a non-tabbable visual clone', () => {
    const { container } = renderHero()

    expect(
      screen.getByRole('region', { name: profile.heroCertificationsHeading })
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: profile.heroCertifications[0].imageAlt })
    ).toHaveLength(1)
    expect(
      screen.getByRole('img', { name: profile.heroCertifications[0].imageAlt })
    ).toHaveAttribute('loading', 'lazy')

    const clone = container.querySelector('[data-clone="true"]')
    expect(clone).toHaveAttribute('aria-hidden', 'true')
    expect(clone?.querySelector('a')).toHaveAttribute('tabindex', '-1')
  })

  it('shows a readable certification fallback when its remote image fails', () => {
    renderHero()

    fireEvent.error(
      screen.getByRole('img', { name: profile.heroCertifications[0].imageAlt })
    )

    expect(
      screen.getByRole('link', { name: profile.heroCertifications[0].imageAlt })
    ).toHaveTextContent(profile.heroCertifications[0].imageAlt)
  })

  it('never requests GitHub Releases for its displayed deploy version', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      void input
      return Promise.resolve(successfulResponse({ total: { lastYear: 42 } }))
    })
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
