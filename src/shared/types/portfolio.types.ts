import type { IconType } from 'react-icons'

export interface CertificationItem {
  credentialUrl: string
  imageUrl: string
  imageAlt: string
  imageWidth?: number
  imageHeight?: number
}

export interface ProfileData {
  name: string
  brandName: string
  title: string
  tagline: string
  about: string[]
  githubUsername: string
  githubUrl: string
  repositoryUrl: string
  githubLabel: string
  linkedinUrl: string
  linkedinLabel: string
  heroStatusLabel: string
  heroTerminalPath: string
  heroTerminalDirectories: string[]
  heroTerminalPrompt: string
  heroCertificationsHeading: string
  heroCertifications: CertificationItem[]
  contributionsLoadingLabel: string
  contributionsSuffixLabel: string
  aboutHeadingLead: string
  aboutHeadingAccent: string
  aboutIntro: string
  techStackSectionEyebrow: string
  techStackSectionTitle: string
  techStackSectionDescription: string
  projectsSectionEyebrow: string
  projectsSectionTitle: string
  projectsSectionDescription: string
  projectLiveLabel: string
  projectSourceLabel: string
  educationSectionEyebrow: string
  educationSectionTitle: string
  educationSectionDescription: string
  footerAttribution: string
}

export interface SocialLink {
  label: string
  href: string
  icon?: IconType
}

export interface NavLink {
  label: string
  href: `#${string}`
}

export interface EducationItem {
  institution: string
  location?: string
  degree: string
  duration: string
  achievements: string[]
  icon?: IconType
  logoUrl?: string
  color?: string
}

export interface SkillItem {
  name: string
  note: string
  icon: IconType
  color?: string
}

export interface SkillCategory {
  title: string
  items: SkillItem[]
}

export interface Project {
  id: string
  title: string
  summary: string
  highlights: string[]
  stack: string[]
  repoUrl?: string
  liveUrl?: string
}
