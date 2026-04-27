import rawProfile from '../data/profile.json'
import { profileSchema } from '../schemas/profile.schema'

import type { NavLink, ProfileData } from '@shared/types/portfolio.types'

interface RawProfileData {
  name: string
  brandName: string
  title: string
  tagline: string
  githubUsername: string
  githubUrl: string
  repositoryUrl: string
  linkedinUrl: string
  about: {
    headingLead: string
    headingAccent: string
    intro: string
    paragraphs: string[]
  }
  hero: {
    statusLabel: string
    terminalPath: string
    terminalDirectories: string[]
    terminalPrompt: string
    certificationsHeading: string
  }
  certifications: ProfileData['heroCertifications']
  navLinks: NavLink[]
  labels: {
    githubLabel: string
    linkedinLabel: string
    contributionsLoadingLabel: string
    contributionsSuffixLabel: string
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
}

export const parseProfile = (
  input: unknown
): { profile: ProfileData; navLinks: NavLink[] } => {
  const parseResult = profileSchema.safeParse(input)

  if (!parseResult.success) {
    const issueSummary = parseResult.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ')

    throw new Error(`Invalid content/data/profile.json: ${issueSummary}`)
  }

  const raw = parseResult.data as RawProfileData

  const profile: ProfileData = {
    name: raw.name,
    brandName: raw.brandName,
    title: raw.title,
    tagline: raw.tagline,
    githubUsername: raw.githubUsername,
    githubUrl: raw.githubUrl,
    repositoryUrl: raw.repositoryUrl,
    linkedinUrl: raw.linkedinUrl,
    ...raw.labels,
    about: raw.about.paragraphs,
    aboutHeadingLead: raw.about.headingLead,
    aboutHeadingAccent: raw.about.headingAccent,
    aboutIntro: raw.about.intro,
    heroStatusLabel: raw.hero.statusLabel,
    heroTerminalPath: raw.hero.terminalPath,
    heroTerminalDirectories: raw.hero.terminalDirectories,
    heroTerminalPrompt: raw.hero.terminalPrompt,
    heroCertificationsHeading: raw.hero.certificationsHeading,
    heroCertifications: raw.certifications,
  }

  const navLinks: NavLink[] = raw.navLinks

  return { profile, navLinks }
}

const parsed = parseProfile(rawProfile)

export const profile = parsed.profile
export const navLinks = parsed.navLinks
