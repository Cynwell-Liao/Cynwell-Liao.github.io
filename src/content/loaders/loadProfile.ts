import type { NavLink, ProfileData } from '@shared/types/portfolio.types'

import rawProfile from '../data/profile.json'
import { profileSchema } from '../schemas/profile.schema'

import { parseContent } from './parseContent'

import type { z } from 'zod'

type RawProfileData = z.infer<typeof profileSchema>

interface ParsedProfile {
  readonly profile: ProfileData
  readonly navLinks: readonly NavLink[]
}

const composeProfile = (raw: RawProfileData): ProfileData => ({
  name: raw.name,
  brandName: raw.brandName,
  title: raw.title,
  githubUsername: raw.githubUsername,
  githubUrl: raw.githubUrl,
  repositoryUrl: raw.repositoryUrl,
  linkedinUrl: raw.linkedinUrl,
  linkedinConnectionCount: raw.linkedinConnectionCount,
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
})

export const parseProfile = (input: unknown): ParsedProfile => {
  const raw = parseContent(profileSchema, input, 'content/data/profile.json')

  return { profile: composeProfile(raw), navLinks: raw.navLinks }
}

const parsed = parseProfile(rawProfile)

export const profile = parsed.profile
export const navLinks = parsed.navLinks
