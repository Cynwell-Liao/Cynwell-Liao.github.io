import { describe, expect, it } from 'vitest'

import { navLinks, parseProfile, profile } from './loadProfile'

describe('loadProfile', () => {
  it('returns a composed ProfileData with all required fields', () => {
    expect(profile.name).toBe('Cynwell Liao')
    expect(profile.brandName).toBe('Cynwell-Liao')
    expect(profile.title).toBe('AI Software Engineer')
    expect(profile.githubUsername).toBe('Cynwell-Liao')
    expect(profile.about.length).toBeGreaterThan(0)
    expect(profile.heroCertifications.length).toBeGreaterThan(0)
    expect(profile.heroTerminalPath).toBe('~/stack')
  })

  it('returns parsed navLinks', () => {
    expect(navLinks.length).toBeGreaterThan(0)
    expect(navLinks[0]).toEqual(
      expect.objectContaining({
        label: expect.any(String),
        href: expect.stringMatching(/^#/),
      })
    )
  })
})

describe('parseProfile', () => {
  it('throws a descriptive error for invalid profile input', () => {
    expect(() =>
      parseProfile({
        name: '',
        brandName: '',
        title: '',
        tagline: '',
        githubUsername: '',
        githubUrl: 'not-a-url',
        repositoryUrl: 'not-a-url',
        linkedinUrl: 'not-a-url',
        about: { headingLead: '', headingAccent: '', intro: '', paragraphs: [] },
        hero: {
          statusLabel: '',
          terminalPath: '',
          terminalDirectories: [],
          terminalPrompt: '',
          certificationsHeading: '',
        },
        certifications: [],
        navLinks: [],
        labels: {},
      })
    ).toThrowError(/Invalid content\/data\/profile\.json/)
  })
})
