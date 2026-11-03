import type { ProfileData } from '@shared/types/portfolio.types'

export type HeroProfile = Readonly<
  Pick<ProfileData, 'title' | 'heroCertificationsHeading' | 'heroCertifications'>
>

export type { ProfileData }
