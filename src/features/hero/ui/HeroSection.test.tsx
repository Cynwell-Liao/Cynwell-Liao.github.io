import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
    expect(screen.getAllByText('0')).toHaveLength(2)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `https://github-contributions-api.deno.dev/${profile.githubUsername}.json`,
        expect.objectContaining({
          referrerPolicy: 'no-referrer',
          signal: expect.any(AbortSignal),
        })
      )
    })
  })

  it('reveals both counters only after a valid contribution response', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(successfulResponse({ totalContributions: 1234 }))
    )
    vi.stubGlobal('fetch', fetchMock)

    renderHero()

    expect(await screen.findByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('500+')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['a rejected request', () => Promise.reject(new Error('offline'))],
    [
      'a non-success response',
      () =>
        Promise.resolve({
          json: () => Promise.resolve({ totalContributions: 25 }),
          ok: false,
          status: 503,
        }),
    ],
    [
      'an invalid total',
      () => Promise.resolve(successfulResponse({ totalContributions: -1 })),
    ],
  ])('keeps both counters at zero for %s', async (_label, responseFactory) => {
    const fetchMock = vi.fn(responseFactory)
    vi.stubGlobal('fetch', fetchMock)

    renderHero()

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Professional activity' })
      ).toHaveAttribute('aria-busy', 'false')
    })
    expect(screen.getAllByText('0')).toHaveLength(2)
    expect(screen.queryByText('500+')).not.toBeInTheDocument()
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
      return Promise.resolve(successfulResponse({ totalContributions: 42 }))
    })
    vi.stubGlobal('fetch', fetchMock)

    renderHero()
    await screen.findByText('42')

    const requestedUrls = fetchMock.mock.calls.map(([input]) =>
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    )
    expect(requestedUrls).toEqual([
      `https://github-contributions-api.deno.dev/${profile.githubUsername}.json`,
    ])
    expect(requestedUrls.join(' ')).not.toContain('api.github.com')
    expect(requestedUrls.join(' ')).not.toContain('/releases/latest')
  })
})
