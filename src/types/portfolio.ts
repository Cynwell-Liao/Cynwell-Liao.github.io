import type { IconType } from 'react-icons'

export type ThemeMode = 'light' | 'dark'

export interface NavLink {
  label: string
  href: `#${string}`
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


export interface ProfileData {
  name: string
  title: string
  tagline: string
  about: string[]
  githubUsername: string
  githubUrl: string
  resumePath: string
}
