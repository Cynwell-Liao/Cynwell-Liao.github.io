import type { HeroProfile } from './profile.types'

export const heroProfile: HeroProfile = {
  title: 'Software Engineer',
  githubUsername: 'ada-lovelace',
  githubUrl: 'https://github.com/ada-lovelace',
  githubLabel: 'GitHub profile',
  linkedinUrl: 'https://www.linkedin.com/in/ada-lovelace',
  linkedinConnectionCount: 760,
  linkedinLabel: 'LinkedIn profile',
  linkedinConnectionsLabel: 'connections',
  heroStatusLabel: 'SYSTEMS ONLINE',
  heroCertificationsHeading: 'Certifications',
  heroCertifications: [
    {
      credentialUrl: 'https://credentials.example.com/cloud',
      imageUrl: 'https://images.example.com/cloud.png',
      imageAlt: 'Cloud certification badge',
    },
  ],
  contributionsLoadingLabel: 'Loading GitHub contributions',
  contributionsUnavailableLabel: 'GitHub contributions are unavailable',
  contributionsSuffixLabel: 'contributions',
}
