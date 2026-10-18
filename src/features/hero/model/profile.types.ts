import type { ProfileData } from '@shared/types/portfolio.types'

export type HeroStatsProfile = Readonly<
  Pick<
    ProfileData,
    | 'githubUsername'
    | 'githubUrl'
    | 'githubLabel'
    | 'linkedinUrl'
    | 'linkedinConnectionCount'
    | 'linkedinLabel'
    | 'linkedinConnectionsLabel'
    | 'contributionsLoadingLabel'
    | 'contributionsUnavailableLabel'
    | 'contributionsSuffixLabel'
  >
>

export type HeroProfile = Readonly<
  Pick<
    ProfileData,
    | keyof HeroStatsProfile
    | 'title'
    | 'heroCertificationsHeading'
    | 'heroCertifications'
  >
>

export type { ProfileData }
