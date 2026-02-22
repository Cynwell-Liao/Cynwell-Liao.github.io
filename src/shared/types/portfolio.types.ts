import type { IconType } from 'react-icons'

export interface ProfileData {
  name: string
  title: string
  tagline: string
  about: string[]
  githubUsername: string
  githubUrl: string
  resumePath: string
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
