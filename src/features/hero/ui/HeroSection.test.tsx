import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { profile } from '@content'

import { formatLinkedInConnectionCount } from '../model/linkedinConnections'

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

  it('places the contribution chart below the hero title before certifications', async () => {
    const fetchMock = createFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    renderHeroSection()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    const title = screen.getByRole('heading', {
      level: 1,
      name: profile.title,
    })
    const contributionChart = screen.getByRole('img', {
      name: `${profile.name}'s Github chart`,
    })
    const certifications = screen.getByRole('region', {
      name: profile.heroCertificationsHeading,
    })

    expect(
      title.compareDocumentPosition(contributionChart) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      contributionChart.compareDocumentPosition(certifications) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('keeps the contribution heading outside the chart panel', async () => {
    const fetchMock = createFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    renderHeroSection()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    const heading = screen.getByText(profile.contributionsSuffixLabel).closest('h2')
    const contributionChart = screen.getByRole('img', {
      name: `${profile.name}'s Github chart`,
    })
    const linkedinLink = screen.getByRole('link', {
      name: profile.linkedinLabel,
    })
    const githubLink = screen.getByRole('link', {
      name: profile.githubLabel,
    })
    const linkedinConnectionsTotal = screen.getByText(
      formatLinkedInConnectionCount(profile.linkedinConnectionCount)
    )
    const linkedinConnectionsLabel = screen.getByText(profile.linkedinConnectionsLabel)
    const contributionTotal = screen.getByText('123')
    const contributionLabel = screen.getByText(profile.contributionsSuffixLabel)

    expect(heading).not.toBeNull()
    expect(heading?.closest('.glass-panel')).toBeNull()
    expect(linkedinLink.closest('h2')).toBe(heading)
    expect(githubLink.closest('h2')).toBe(heading)
    expect(linkedinLink).toHaveAttribute('href', profile.linkedinUrl)
    expect(linkedinLink).toHaveAttribute('title', profile.linkedinLabel)
    expect(linkedinLink).toHaveAccessibleName(profile.linkedinLabel)
    expect(linkedinLink).toHaveClass(
      'group',
      'social-icon-button',
      'social-icon-button--linkedin'
    )
    const linkedinBug = linkedinLink.querySelector('.linkedin-bug')
    expect(linkedinBug).not.toBeNull()
    expect(linkedinBug).toHaveAttribute('aria-hidden', 'true')
    expect(linkedinBug).toHaveAttribute('fill', 'currentColor')
    expect(linkedinBug).toHaveAttribute('viewBox', '0 0 26.182 26.182')
    expect(linkedinBug).toHaveAttribute('width', '32')
    expect(linkedinBug).toHaveAttribute('height', '32')
    expect(linkedinBug?.querySelector('path')).toHaveAttribute('fill-rule', 'evenodd')
    expect(linkedinConnectionsTotal).toHaveClass(
      'font-bold',
      'text-xl',
      'text-accent-600',
      'sm:text-2xl',
      'dark:text-accent-400'
    )
    expect(linkedinConnectionsTotal.parentElement).toHaveClass(
      'text-base',
      'sm:text-lg'
    )
    expect(contributionTotal).toHaveClass(
      'font-bold',
      'text-xl',
      'text-accent-600',
      'sm:text-2xl',
      'dark:text-accent-400'
    )
    expect(contributionLabel.parentElement).toHaveClass('text-base', 'sm:text-lg')
    expect(linkedinLink).not.toContainElement(linkedinConnectionsTotal)
    expect(linkedinLink).not.toContainElement(linkedinConnectionsLabel)
    expect(linkedinConnectionsTotal.closest('a')).toBeNull()
    expect(linkedinConnectionsLabel.closest('a')).toBeNull()
    expect(
      linkedinLink.compareDocumentPosition(linkedinConnectionsTotal) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(githubLink).toHaveAttribute('href', profile.githubUrl)
    expect(githubLink).toHaveAttribute('title', profile.githubLabel)
    expect(githubLink).toHaveAccessibleName(profile.githubLabel)
    expect(githubLink).toHaveClass(
      'group',
      'social-icon-button',
      'social-icon-button--github'
    )
    const githubMark = githubLink.querySelector('[data-component="Octicon"]')
    expect(githubMark).not.toBeNull()
    expect(githubMark).toHaveClass('octicon', 'octicon-mark-github')
    expect(githubMark).toHaveAttribute('aria-hidden', 'true')
    expect(githubMark).toHaveAttribute('fill', 'currentColor')
    expect(githubMark).toHaveAttribute('viewBox', '0 0 24 24')
    expect(githubMark).toHaveAttribute('width', '34')
    expect(githubMark).toHaveAttribute('height', '34')
    expect(screen.getAllByRole('link', { name: profile.linkedinLabel })).toHaveLength(1)
    expect(screen.getAllByRole('link', { name: profile.githubLabel })).toHaveLength(1)
    expect(
      linkedinLink.compareDocumentPosition(githubLink) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(githubLink).not.toContainElement(contributionLabel)
    expect(contributionLabel.closest('a')).toBeNull()
    expect(
      githubLink.compareDocumentPosition(contributionLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(contributionChart.closest('.glass-panel')).not.toBeNull()
  })

  it('lets the contribution panel and chart span the hero content width', async () => {
    const fetchMock = createFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    renderHeroSection()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    const contributionChart = screen.getByRole('img', {
      name: `${profile.name}'s Github chart`,
    })
    const contributionPanel = contributionChart.closest('.glass-panel')
    const contributionContainer = contributionPanel?.parentElement

    expect(contributionContainer).toHaveClass('w-full')
    expect(contributionContainer?.className).not.toContain('max-w-')
    expect(contributionPanel).toHaveClass('w-full')
    expect(contributionChart).toHaveClass('w-full', 'max-w-none')
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
