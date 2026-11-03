import type { ProfileData } from '@shared/types/portfolio.types'

export type HeroProfile = Readonly<
  Pick<
    ProfileData,
    'name' | 'title' | 'heroCertificationsHeading' | 'heroCertifications'
  >
>

export type { ProfileData }
