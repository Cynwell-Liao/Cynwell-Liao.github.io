import type { IconKey } from '@shared/lib/icons'
import type { SectionFragment } from '@shared/lib/navigation'

export interface CertificationItem {
  readonly credentialUrl: string
  readonly imageUrl: string
  readonly imageAlt: string
  readonly imageWidth?: number
  readonly imageHeight?: number
}

export interface ProfileData {
  readonly name: string
  readonly brandName: string
  readonly title: string
  readonly about: readonly string[]
  readonly githubUsername: string
  readonly githubUrl: string
  readonly repositoryUrl: string
  readonly githubLabel: string
  readonly linkedinUrl: string
  readonly linkedinConnectionCount: number
  readonly linkedinLabel: string
  readonly linkedinConnectionsLabel: string
  readonly heroStatusLabel: string
  readonly heroTerminalPath: string
  readonly heroTerminalDirectories: readonly string[]
  readonly heroTerminalPrompt: string
  readonly heroCertificationsHeading: string
  readonly heroCertifications: readonly CertificationItem[]
  readonly contributionsLoadingLabel: string
  readonly contributionsSuffixLabel: string
  readonly aboutHeadingLead: string
  readonly aboutHeadingAccent: string
  readonly aboutIntro: string
  readonly techStackSectionEyebrow: string
  readonly techStackSectionTitle: string
  readonly techStackSectionDescription: string
  readonly projectsSectionEyebrow: string
  readonly projectsSectionTitle: string
  readonly projectsSectionDescription: string
  readonly projectLiveLabel: string
  readonly projectSourceLabel: string
  readonly educationSectionEyebrow: string
  readonly educationSectionTitle: string
  readonly educationSectionDescription: string
  readonly footerAttribution: string
}

export interface NavLink {
  readonly label: string
  readonly href: SectionFragment
}

export interface EducationItem {
  readonly institution: string
  readonly location?: string
  readonly degree: string
  readonly duration: string
  readonly achievements: readonly string[]
  readonly icon?: IconKey
  readonly logoUrl?: string
  readonly color?: string
}

export interface SkillItem {
  readonly name: string
  readonly note: string
  readonly icon: IconKey
  readonly color?: string
}

export interface SkillCategory {
  readonly title: string
  readonly items: readonly SkillItem[]
}

export interface Project {
  readonly id: string
  readonly title: string
  readonly summary: string
  readonly highlights: readonly string[]
  readonly stack: readonly string[]
  readonly repoUrl?: string
  readonly liveUrl?: string
}
