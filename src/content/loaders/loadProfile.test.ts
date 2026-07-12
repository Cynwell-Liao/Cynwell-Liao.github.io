import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import { navLinks, parseProfile, profile } from './loadProfile'
import { createValidRawProfile } from './testFixtures'

describe('profile content', () => {
  it('exports validated profile and navigation constants', () => {
    expect(profile.name.length).toBeGreaterThan(0)
    expect(navLinks.length).toBeGreaterThan(0)
  })

  it('maps an exact valid raw profile without copying the raw tagline', () => {
    expect(parseProfile(createValidRawProfile())).toEqual({
      profile: {
        name: 'Example Engineer',
        brandName: 'example-engineer',
        title: 'Software Engineer',
        about: ['I value clear contracts.', 'I test observable behavior.'],
        githubUsername: 'example-engineer',
        githubUrl: 'https://github.com/example-engineer',
        repositoryUrl: 'https://github.com/example-engineer/portfolio',
        githubLabel: 'GitHub',
        linkedinUrl: 'https://www.linkedin.com/in/example-engineer',
        linkedinConnectionCount: 250,
        linkedinLabel: 'LinkedIn',
        linkedinConnectionsLabel: 'connections',
        heroStatusLabel: 'SYSTEMS ONLINE',
        heroTerminalPath: '~/example',
        heroTerminalDirectories: ['projects', 'skills'],
        heroTerminalPrompt: '_',
        heroCertificationsHeading: 'Certifications',
        heroCertifications: [
          {
            credentialUrl: 'https://example.com/credential',
            imageUrl: 'https://example.com/badge.png',
            imageAlt: 'Example certification badge',
            imageWidth: 100,
            imageHeight: 100,
          },
        ],
        contributionsLoadingLabel: 'Loading contributions...',
        contributionsSuffixLabel: 'contributions this year',
        aboutHeadingLead: 'Engineering',
        aboutHeadingAccent: 'with intent.',
        aboutIntro: 'I build reliable products.',
        techStackSectionEyebrow: 'Tools',
        techStackSectionTitle: 'Technology stack',
        techStackSectionDescription: 'Tools used to build reliable systems.',
        projectsSectionEyebrow: 'Work',
        projectsSectionTitle: 'Projects',
        projectsSectionDescription: 'Selected example projects.',
        projectLiveLabel: 'View live',
        projectSourceLabel: 'View source',
        educationSectionEyebrow: 'Learning',
        educationSectionTitle: 'Education',
        educationSectionDescription: 'A history of continuous learning.',
        footerAttribution: 'Built for deterministic tests.',
      },
      navLinks: [
        { label: 'About', href: '#about' },
        { label: 'Projects', href: '#projects' },
      ],
    })
  })

  it.each([
    ['about paragraphs', 'about', 'paragraphs'],
    ['terminal directories', 'hero', 'terminalDirectories'],
    ['certifications', 'root', 'certifications'],
    ['navigation links', 'root', 'navLinks'],
  ])('rejects empty %s', (_description, parent, property) => {
    const input = createValidRawProfile()

    if (parent === 'about') {
      input.about.paragraphs = []
    } else if (parent === 'hero') {
      input.hero.terminalDirectories = []
    } else if (property === 'certifications') {
      input.certifications = []
    } else {
      input.navLinks = []
    }

    expect(() => parseProfile(input)).toThrow(/Invalid content\/data\/profile\.json/)
  })

  it('rejects unsafe profile and certification URLs', () => {
    const profileWithUnsafeUrl = createValidRawProfile()
    const profileWithUnsafeCredential = createValidRawProfile()
    profileWithUnsafeUrl.githubUrl = 'http://github.com/example-engineer'
    profileWithUnsafeCredential.certifications[0].credentialUrl = 'javascript:alert(1)'

    expect(() => parseProfile(profileWithUnsafeUrl)).toThrow(
      /Must use the HTTPS protocol/
    )
    expect(() => parseProfile(profileWithUnsafeCredential)).toThrow(
      /certifications\.0\.credentialUrl/
    )
  })

  it('rejects invalid dimensions and unknown navigation fragments', () => {
    const profileWithBadDimension = createValidRawProfile()
    const profileWithUnknownTarget = createValidRawProfile()
    profileWithBadDimension.certifications[0].imageWidth = 0
    profileWithUnknownTarget.navLinks[0].href = '#unknown'

    expect(() => parseProfile(profileWithBadDimension)).toThrow(
      /certifications\.0\.imageWidth/
    )
    expect(() => parseProfile(profileWithUnknownTarget)).toThrow(
      /Must reference a known portfolio section/
    )
  })

  it('rejects duplicate navigation targets case-insensitively', () => {
    const input = createValidRawProfile()
    input.navLinks = [
      { label: 'About', href: '#about' },
      { label: 'About again', href: '#about' },
    ]

    expect(() => parseProfile(input)).toThrow(
      /Navigation targets must be unique \(case-insensitive\)/
    )
  })

  it('rejects unknown properties at both root and nested object paths', () => {
    const raw = createValidRawProfile()
    const rootInput = { ...raw, unexpected: true }
    const nestedInput = {
      ...raw,
      about: { ...raw.about, unexpected: true },
    }

    expect(() => parseProfile(rootInput)).toThrow(/Unrecognized key/)
    expect(() => parseProfile(nestedInput)).toThrow(/about: Unrecognized key/)
  })

  it('reports nested and root error paths and preserves the Zod error', () => {
    const nestedInput = createValidRawProfile()
    nestedInput.labels.contributionsLoadingLabel = '   '
    let nestedError: Error | undefined
    let rootError: Error | undefined

    try {
      parseProfile(nestedInput)
    } catch (error) {
      nestedError = error as Error
    }

    try {
      parseProfile(null)
    } catch (error) {
      rootError = error as Error
    }

    expect(nestedError?.message).toContain('labels.contributionsLoadingLabel')
    expect(nestedError?.cause).toBeInstanceOf(ZodError)
    expect(rootError?.message).toContain('<root>')
    expect(rootError?.cause).toBeInstanceOf(ZodError)
  })
})
