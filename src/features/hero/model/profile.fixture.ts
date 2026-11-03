import type { HeroProfile } from './profile.types'

export const heroProfile: HeroProfile = {
  name: 'Ada Lovelace',
  title: 'Software Engineer',
  heroCertificationsHeading: 'Certifications',
  heroCertifications: [
    {
      credentialUrl: 'https://credentials.example.com/cloud',
      imageUrl: 'https://images.example.com/cloud.png',
      imageAlt: 'Cloud certification badge',
    },
  ],
}
